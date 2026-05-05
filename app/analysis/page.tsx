"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── MediaPipe Types ──────────────────────────────────────────────────────────

type FaceDetectionBoundingBox = {
  xCenter: number;
  yCenter: number;
  width: number;
  height: number;
};

type FaceDetectionResult = {
  detections?: Array<{
    boundingBox: FaceDetectionBoundingBox;
  }>;
};

type FaceDetectionInstance = {
  setOptions: (options: {
    model: string;
    minDetectionConfidence: number;
  }) => void;
  onResults: (callback: (results: FaceDetectionResult) => void) => void;
  send: (options: { image: HTMLVideoElement }) => Promise<void>;
};

type CameraInstance = {
  start: () => void;
  stop: () => void;
};

// ─── API Response Type ───────────────────────────────────────────────────────

export type SkinAnalysisResult = Record<string, unknown>;

// ─── Component ───────────────────────────────────────────────────────────────

export default function AnalysisPage(): React.JSX.Element {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<CameraInstance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceDetectionRef = useRef<FaceDetectionInstance | null>(null);
  const hasCapturedRef = useRef<boolean>(false);
  const stableCounter = useRef<number>(0);
  const isStoppingRef = useRef<boolean>(false);
  const initInProgressRef = useRef<boolean>(false);

  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisFailed, setAnalysisFailed] = useState<boolean>(false);

  // ── Stop camera ────────────────────────────────────────────────────────────

  const stopCamera = useCallback((): void => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    try {
      cameraRef.current?.stop();
      cameraRef.current = null;
    } catch {
      // Camera stop may throw if already stopped — safe to ignore
    }

    try {
      streamRef.current?.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
      });
      streamRef.current = null;
    } catch {
      // Stream cleanup may throw — safe to ignore
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    faceDetectionRef.current = null;
    setReady(false);
    isStoppingRef.current = false;
  }, []);

  // ── Capture & analyze ──────────────────────────────────────────────────────

  const captureAndAnalyze = useCallback(async (): Promise<void> => {
    if (!videoRef.current || loading) return;

    setLoading(true);
    setError(null);
    setAnalysisFailed(false);

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setLoading(false);
      setError("Failed to get canvas context");
      setAnalysisFailed(true);
      return;
    }
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob: Blob | null): Promise<void> => {
      if (!blob) {
        setLoading(false);
        setError("Failed to capture image");
        setAnalysisFailed(true);
        return;
      }

      try {
        const formData = new FormData();
        formData.append("file", blob, "face.jpg");

        const res = await fetch(
          "https://skin-analysis-production.up.railway.app/api/skin/analyze",
          { method: "POST", body: formData }
        );

        const data = (await res.json()) as SkinAnalysisResult;

        if (!res.ok) {
          throw new Error((data?.message as string | undefined) ?? "Upload failed");
        }

        // Success — store result and navigate
        sessionStorage.setItem("skinAnalysisResult", JSON.stringify(data));
        stopCamera();
        router.push("/dashboard");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setAnalysisFailed(true);
        stopCamera();
      } finally {
        setLoading(false);
      }
    }, "image/jpeg", 0.95);
  }, [loading, stopCamera, router]);

  // ── Initialize camera + MediaPipe ──────────────────────────────────────────

  const initCamera = useCallback(async (): Promise<void> => {
    if (!videoRef.current || initInProgressRef.current) return;

    // Don't initialize if we're in a failed state waiting for retake
    if (analysisFailed) return;

    initInProgressRef.current = true;

    try {
      // Clean up any existing resources first
      stopCamera();

      const { FaceDetection } = await import("@mediapipe/face_detection");
      const { Camera } = await import("@mediapipe/camera_utils");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        initInProgressRef.current = false;
        return;
      }

      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      const faceDetection = new FaceDetection({
        locateFile: (file: string): string =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
      }) as FaceDetectionInstance;

      faceDetection.setOptions({ model: "short", minDetectionConfidence: 0.6 });

      faceDetection.onResults((results: FaceDetectionResult): void => {
        if (!overlayCanvasRef.current || !videoRef.current) return;

        const canvas = overlayCanvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const detection = results.detections?.[0];

        if (!detection) {
          stableCounter.current = 0;
          setIsLocked(false);
          return;
        }

        const box = detection.boundingBox;
        const faceWidth = box.width;
        const sizeValid = faceWidth > 0.4 && faceWidth < 0.8;
        const centered =
          Math.abs(box.xCenter - 0.5) < 0.15 &&
          Math.abs(box.yCenter - 0.5) < 0.2;
        const valid = sizeValid && centered;

        if (valid) {
          stableCounter.current += 1;
          if (stableCounter.current > 15 && !loading && !hasCapturedRef.current) {
            hasCapturedRef.current = true;
            setIsLocked(true);
            void captureAndAnalyze();
          }
        } else {
          stableCounter.current = 0;
          setIsLocked(false);
        }

        ctx.strokeStyle = valid ? "lime" : "red";
        ctx.lineWidth = 3;
        ctx.strokeRect(
          box.xCenter * canvas.width - (faceWidth * canvas.width) / 2,
          box.yCenter * canvas.height - (box.height * canvas.height) / 2,
          faceWidth * canvas.width,
          box.height * canvas.height
        );
      });

      const camera = new Camera(videoRef.current, {
        onFrame: async (): Promise<void> => {
          if (videoRef.current && faceDetectionRef.current) {
            await faceDetectionRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 800,
      }) as CameraInstance;

      camera.start();
      cameraRef.current = camera;
      faceDetectionRef.current = faceDetection;
      setReady(true);
    } catch (err: unknown) {
      console.error("Camera initialization failed:", err);
      setError("Failed to initialize camera. Please check permissions.");
    } finally {
      initInProgressRef.current = false;
    }
  }, [analysisFailed, stopCamera, loading, captureAndAnalyze]);

  // ── Upload fallback ────────────────────────────────────────────────────────

  const handleUpload = useCallback(async (file: File): Promise<void> => {
    setLoading(true);
    setError(null);
    setAnalysisFailed(false);

    try {
      // Stop camera if running
      stopCamera();

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        "https://skin-analysis-production.up.railway.app/api/skin/analyze",
        { method: "POST", body: formData }
      );

      const data = (await res.json()) as SkinAnalysisResult;

      if (!res.ok) {
        throw new Error((data?.message as string | undefined) ?? "Upload failed");
      }

      sessionStorage.setItem("skinAnalysisResult", JSON.stringify(data));
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setAnalysisFailed(true);
    } finally {
      setLoading(false);
    }
  }, [stopCamera, router]);

  // ── Reset (retake) ─────────────────────────────────────────────────────────

  const handleRetake = useCallback((): void => {
    hasCapturedRef.current = false;
    stableCounter.current = 0;
    setIsLocked(false);
    setError(null);
    setAnalysisFailed(false);
    setLoading(false);
    void initCamera();
  }, [initCamera]);

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  useEffect((): (() => void) => {
    void initCamera();

    const handleVisibility = (): void => {
      if (document.visibilityState === "hidden") {
        // Page/tab hidden — stop camera to save resources
        stopCamera();
      } else {
        // Page visible again — restart only if not in failed state
        if (!analysisFailed && !initInProgressRef.current && !cameraRef.current) {
          void initCamera();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return (): void => {
      document.removeEventListener("visibilitychange", handleVisibility);
      // Always stop camera on unmount
      stopCamera();
    };
  }, [initCamera, stopCamera, analysisFailed]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="grow pt-24 pb-12 px-6 flex items-center justify-center">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-lg items-center">

        {/* LEFT SIDE */}
        <div className="lg:col-span-5 space-y-lg">
          <span className="font-label-caps text-primary uppercase">Precision Scan</span>
          <h1 className="font-h1 text-display text-on-background">
            Analyze your skin in seconds.
          </h1>
          <p className="font-body-lg text-on-surface-variant">
            Our AI-driven technology requires a clear, well-lit image to provide accurate clinical insights.
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative w-full aspect-3/4 md:aspect-4/2 bg-black rounded-[2rem] overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              disabled={loading}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas
              ref={overlayCanvasRef}
              className="absolute inset-0 w-full h-full"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`guide-oval w-64 h-80 border-2 border-white/30 rounded-full ${isLocked ? "border-green-400" : ""}`} />
            </div>
            {!ready && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                <p className="text-lg font-medium">Initializing camera...</p>
              </div>
            )}
            {error && analysisFailed && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
                <div className="text-center max-w-xs">
                  <p className="text-red-400 font-bold mb-2">Capture Failed</p>
                  <p className="text-sm text-white/70">{error}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-lg flex flex-col gap-md ">
            {/* Only show retake button when capture/analysis failed */}
            {analysisFailed ? (
              <Button
                onClick={handleRetake}
                className="w-full py-lg"
                variant="default"
              >
                Retake Photo
              </Button>
            ) : (
              <Button disabled className="py-lg text-white">
                {loading ? "Analyzing…" : "Auto Capturing…"}
              </Button>
            )}

            <Input
              type="file"
              accept="image/png, image/jpeg"
              onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
              }}
              disabled={loading}
              className="cursor-pointer"
            />

            {error && !analysisFailed && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}












// "use client";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { useCallback, useEffect, useRef, useState } from "react";

// type FaceDetectionBoundingBox = {
//   xCenter: number;
//   yCenter: number;
//   width: number;
//   height: number;
// };

// type FaceDetectionResult = {
//   detections?: Array<{
//     boundingBox: FaceDetectionBoundingBox;
//   }>;
// };

// type FaceDetectionInstance = {
//   setOptions: (options: {
//     model: string;
//     minDetectionConfidence: number;
//   }) => void;
//   onResults: (callback: (results: FaceDetectionResult) => void) => void;
//   send: (options: { image: HTMLVideoElement }) => Promise<void>;
// };

// type CameraInstance = {
//   start: () => void;
//   stop: () => void;
// };

// export default function AnalysisPage() {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

//   const cameraRef = useRef<CameraInstance | null>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const faceDetectionRef = useRef<FaceDetectionInstance | null>(null);
//   const hasCapturedRef = useRef(false);

//   const stableCounter = useRef(0);

//   const [isLocked, setIsLocked] = useState<boolean>(false);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [ready, setReady] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const [result, setResult] = useState<string>("");


//   // STOP CAMERA
//   const stopCamera = useCallback(() => {
//     cameraRef.current?.stop();
//     cameraRef.current = null;

//     streamRef.current?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
//     streamRef.current = null;

//     if (videoRef.current) videoRef.current.srcObject = null;
//   }, []);

//   //  INIT CAMERA + MEDIAPIPE (LAZY)
//   const capturePhoto = useCallback(async () => {
//     if (!videoRef.current || loading) return;

//     setLoading(true);

//     setError(null);

//     const video = videoRef.current;
//     const canvas = document.createElement("canvas");

//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;

//     const ctx = canvas.getContext("2d");
//     if (!ctx) {
//       setLoading(false);
//       setError("Failed to get canvas context");
//       return;
//     }
//     ctx.drawImage(video, 0, 0);

//     canvas.toBlob(async (blob) => {
//       if (!blob) return;

//       try {
//         const formData = new FormData();
//         formData.append("file", blob, "face.jpg");

//         const res = await fetch(
//           "https://skin-analysis-production.up.railway.app/api/skin/analyze",
//           {
//             method: "POST",
//             body: formData,
//           }
//         );

//         const data = (await res.json()) as Record<string, unknown>;

//         if (!res.ok) throw new Error((data?.message as string) || "Upload failed");

//         setResult(JSON.stringify(data));
//       } catch (err: unknown) {
//         setError(err instanceof Error ? err.message : String(err));
//       } finally {
//         setLoading(false);
//       }
//     }, "image/jpeg", 0.95);
//     stopCamera();
//   }, [loading, stopCamera]);

//   const init = useCallback(async () => {
//     if (!videoRef.current) return;

//     try {
//       const { FaceDetection } = await import("@mediapipe/face_detection");
//       const { Camera } = await import("@mediapipe/camera_utils");

//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { facingMode: "user" },
//       });

//       videoRef.current.srcObject = stream;
//       streamRef.current = stream;

//       const faceDetection = new FaceDetection({
//         locateFile: (file: string) =>
//           `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
//       }) as FaceDetectionInstance;

//       faceDetection.setOptions({
//         model: "short",
//         minDetectionConfidence: 0.6,
//       });

//       faceDetection.onResults((results: FaceDetectionResult) => {
//         if (!overlayCanvasRef.current || !videoRef.current) return;

//         const canvas = overlayCanvasRef.current;
//         const ctx = canvas.getContext("2d");
//         if (!ctx) return;

//         canvas.width = videoRef.current.videoWidth;
//         canvas.height = videoRef.current.videoHeight;

//         ctx.clearRect(0, 0, canvas.width, canvas.height);

//         const detection = results.detections?.[0];

//         if (!detection) {
//           stableCounter.current = 0;
//           setIsLocked(false);
//           return;
//         }

//         const box = detection.boundingBox;

//         const faceWidth = box.width;
//         const faceCenterX = box.xCenter;
//         const faceCenterY = box.yCenter;

//         // Size: ~60–80% of frame (approx)
//         const sizeValid = faceWidth > 0.4 && faceWidth < 0.8;

//         // Centered
//         const centered =
//           Math.abs(faceCenterX - 0.5) < 0.15 &&
//           Math.abs(faceCenterY - 0.5) < 0.2;

//         const valid = sizeValid && centered;

//         if (valid) {
//           stableCounter.current += 1;

//           if (
//             stableCounter.current > 15 &&
//             !loading &&
//             !hasCapturedRef.current
//           ) {
//             hasCapturedRef.current = true; // 🔥 lock forever (until reset)
//             setIsLocked(true);
//             capturePhoto();
//           }
//         } else {
//           stableCounter.current = 0;
//           setIsLocked(false);
//         }

//         // Draw bounding box
//         ctx.strokeStyle = valid ? "lime" : "red";
//         ctx.lineWidth = 3;

//         ctx.strokeRect(
//           box.xCenter * canvas.width - (faceWidth * canvas.width) / 2,
//           box.yCenter * canvas.height - (box.height * canvas.height) / 2,
//           faceWidth * canvas.width,
//           box.height * canvas.height
//         );
//       });

//       const camera = new Camera(videoRef.current, {
//         onFrame: async () => {
//           if (videoRef.current) {
//             await faceDetection.send({ image: videoRef.current });
//           }
//         },
//         width: 640,
//         height: 800,
//       }) as CameraInstance;

//       camera.start();

//       cameraRef.current = camera;
//       faceDetectionRef.current = faceDetection;

//       setReady(true);
//     } catch (err) {
//       console.error(err);
//       setError("Failed to initialize camera");
//     }
//   }, [loading, capturePhoto]);

//   //  RESTART
//   const restartCamera = useCallback(async () => {
//     if (!cameraRef.current) {
//       await init();
//     }
//   }, [init]);

//   //  Upload fallback
//   const handleUpload = async (file: File): Promise<void> => {
//     setLoading(true);

//     const formData = new FormData();
//     formData.append("file", file);

//     const res = await fetch(
//       "https://skin-analysis-production.up.railway.app/api/skin/analyze",
//       {
//         method: "POST",
//         body: formData,
//       }
//     );

//     const data = (await res.json()) as Record<string, unknown>;
//     setResult(JSON.stringify(data));
//     setLoading(false);
//   };

//   useEffect(() => {
//     let isMounted = true;

//     const initializeCamera = async (): Promise<void> => {
//       if (isMounted) {
//         await init();
//       }
//     };

//     void initializeCamera();

//     const handleVisibility = (): void => {
//       if (document.visibilityState === "hidden") {
//         stopCamera();
//       } else {
//         void restartCamera();
//       }
//     };

//     document.addEventListener("visibilitychange", handleVisibility);

//     return () => {
//       isMounted = false;
//       document.removeEventListener("visibilitychange", handleVisibility);
//       stopCamera();
//     };
//   }, [init, restartCamera, stopCamera]);

//   const resetCamera = useCallback(() => {
//     hasCapturedRef.current = false;
//     stableCounter.current = 0;
//     setIsLocked(false);
//     setResult("");
//     init(); // restart camera
//   }, [init]);

//   return (
//     <main className="grow pt-24 pb-12 px-6 flex items-center justify-center">
//       <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-lg items-center">

//         {/* LEFT SIDE */}
//         <div className="lg:col-span-5 space-y-lg">
//           <span className="font-label-caps text-primary uppercase">Precision Scan</span>
//           <h1 className="font-h1 text-display text-on-background">
//             Analyze your skin in seconds.
//           </h1>
//           <p className="font-body-lg text-on-surface-variant">
//             Our AI-driven technology requires a clear, well-lit image to provide accurate clinical insights.
//           </p>
//         </div>

//         {/* RIGHT SIDE */}
//         <div className="lg:col-span-7 flex flex-col items-center">

//           <div className="relative w-full aspect-4/2 bg-black rounded-[2rem] overflow-hidden">

//             {/* VIDEO */}
//             <video
//               ref={videoRef}
//               autoPlay
//               playsInline
//               muted
//               className="absolute inset-0 w-full h-full object-cover"
//             />

//             {/* DETECTION OVERLAY */}
//             <canvas
//               ref={overlayCanvasRef}
//               className="absolute inset-0 w-full h-full"
//             />

//             {/* OVAL GUIDE */}
//             <div className="absolute inset-0 flex items-center justify-center">
//               <div
//                 className={`guide-oval w-64 h-80 ${isLocked ? "border-green-400" : ""
//                   }`}
//               />
//             </div>

//             {!ready && (
//               <div className="absolute inset-0 flex items-center justify-center text-white">
//                 Initializing camera...
//               </div>
//             )}
//           </div>

//           {/* CONTROLS */}
//           <div className="mt-lg flex flex-col gap-md">

//             <Button
//               disabled
//               className="w-full py-lg  text-white"
//             >
//               {loading ? "Analyzing..." : "Auto Capturing..."}
//             </Button>

//             {<Button
//               onClick={resetCamera}
//             >
//               Retake
//             </Button>}

//             <Input
//               type="file"
//               accept="image/png, image/jpeg"
//               onChange={(e) => {
//                 if (e.target.files?.[0]) handleUpload(e.target.files[0]);
//               }}
//             />

//             {error && <p className="text-red-500 text-sm">{error}</p>}

//             {result && (
//               <pre className="text-xs bg-black text-white p-4 rounded-lg overflow-auto">
//                 {JSON.stringify(result, null, 2)}
//               </pre>
//             )}
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }



