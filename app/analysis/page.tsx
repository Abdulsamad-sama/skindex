"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


import { Upload, Image as ImageIcon, Loader2, Check } from "lucide-react";

// ─── API Response Types ──────────────────────────────────────────────────────

export type SkinAnalysisResult = Record<string, unknown>;

type RoutineItem = { name: string; amazon_url: string; reason: string };

type RoutineData = {
  overall_score: number;
  skincare_routine: RoutineItem[];
  outfit_suggestions: RoutineItem[];
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function AnalysisPage(): React.JSX.Element {
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisFailed, setAnalysisFailed] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ── Drag & Drop Handlers ──────────────────────────────────────────────────

  const onDragOver = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      void handleUpload(file);
    } else if (file) {
      setError("Please upload an image file (PNG or JPEG)");
    }
  }, []);

  // ── Upload fallback ────────────────────────────────────────────────────────

  const handleUpload = useCallback(async (file: File): Promise<void> => {
    setLoading(true);
    setError(null);
    setAnalysisFailed(false);

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      // Validate file size (cap at 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }

      // Persist the file as a data URL for the weather/routine API
      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (): void => {
          if (typeof reader.result === "string") {
            sessionStorage.setItem("capturedImageDataUrl", reader.result);
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });

      const formData = new FormData();
      formData.append("file", file);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      try {
        console.log("Uploading to API...", {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        });
        const res = await fetch(
          "https://skin-analysis-production.up.railway.app/api/skin/analyze",
          { method: "POST", body: formData, signal: controller.signal }
        );

        clearTimeout(timeoutId);

        console.log(`API response: ${res.status} ${res.statusText}`);

        let data: SkinAnalysisResult = {};
        const responseText = await res.text();

        try {
          data = JSON.parse(responseText) as SkinAnalysisResult;
        } catch {
          // Response wasn't valid JSON — store raw response for debugging
          data = { error: `Invalid response: ${responseText.substring(0, 200)}` };
        }

        console.log("API response data:", data);

        if (!res.ok) {
          const apiError = (data?.message as string | undefined) ?? (data?.error as string | undefined);
          const statusMsg = res.status === 500
            ? "Server error — the API backend may be down or having issues"
            : `HTTP ${res.status}`;
          throw new Error(apiError || statusMsg);
        }

        sessionStorage.setItem("skinAnalysisResult", JSON.stringify(data));

        // Fetch routine data with geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos: GeolocationPosition): Promise<void> => {
              const lat = pos.coords.latitude;
              const lon = pos.coords.longitude;
              try {
                const blobRes = await fetch("data:image/jpeg;base64,/9j/4AAQSkZJRg==", { signal: AbortSignal.timeout(5000) }).catch(() => null);
                const dataUrl = sessionStorage.getItem("capturedImageDataUrl");
                if (!dataUrl) {
                  router.push("/dashboard");
                  return;
                }

                const blobFromUrl = await fetch(dataUrl);
                const blob = await blobFromUrl.blob();
                const imageFile = new File([blob], "face.jpg", { type: "image/jpeg" });

                const routineFormData = new FormData();
                routineFormData.append("file", imageFile);

                const routineController = new AbortController();
                const routineTimeoutId = setTimeout(() => routineController.abort(), 30000);

                try {
                  const routineRes = await fetch(
                    `https://skin-analysis-production.up.railway.app/api/routine/daily?lat=${lat}&lon=${lon}`,
                    { method: "POST", body: routineFormData, signal: routineController.signal }
                  );

                  clearTimeout(routineTimeoutId);

                  if (routineRes.ok) {
                    const routineData = (await routineRes.json()) as RoutineData;
                    sessionStorage.setItem("skinRoutineData", JSON.stringify(routineData));
                  }
                } catch (routineErr: unknown) {
                  clearTimeout(routineTimeoutId);
                  console.warn("Routine fetch failed:", routineErr);
                } finally {
                  router.push("/dashboard");
                }
              } catch (routineErr: unknown) {
                console.warn("Routine processing failed:", routineErr);
                router.push("/dashboard");
              }
            },
            (): void => {
              // Geolocation error - redirect anyway
              router.push("/dashboard");
            },
            { timeout: 8000 }
          );
        } else {
          router.push("/dashboard");
        }
      } catch (fetchErr: unknown) {
        clearTimeout(timeoutId);
        if (fetchErr instanceof TypeError && fetchErr.message === "Failed to fetch") {
          throw new Error("Network error — check your internet connection or try again");
        }
        throw fetchErr;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Upload error:", message, err);
      setError(message);
      setAnalysisFailed(true);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleReset = useCallback((): void => {
    setError(null);
    setAnalysisFailed(false);
    setLoading(false);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative w-full aspect-3/4 md:aspect-4/2 rounded-[2rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-md overflow-hidden ${isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-slate-200 dark:border-slate-800 bg-surface-container hover:border-primary/50"
              }`}
          >
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-contain opacity-40"
                />
                <div className="relative z-10 flex flex-col items-center text-center p-lg">
                  {loading ? (
                    <>
                      <Loader2 className="w-12 h-12 text-primary animate-spin mb-md" />
                      <p className="font-h3 text-on-background">Analyzing your skin...</p>
                    </>
                  ) : (
                    <>
                      <Check className="w-12 h-12 text-primary mb-md" />
                      <p className="font-h3 text-on-background">Image Selected</p>
                      <p className="text-sm text-on-surface-variant">Click or drag to replace.</p>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center p-lg">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-md">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-h2 text-h2 mb-xs">Upload your photo</h3>
                <p className="text-on-surface-variant">
                  Drag and drop your image here, or click to browse.
                </p>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/50 mt-lg font-black">
                  PNG, JPG up to 5MB
                </p>
              </div>
            )}

            {/* Error Overlay */}
            {error && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-lg text-center z-20">
                <div>
                  <p className="text-red-400 font-bold mb-md">
                    {analysisFailed ? "❌ Analysis Failed" : "⚠️ Upload Issue"}
                  </p>
                  <p className="text-sm text-white/90 mb-lg leading-relaxed">{error}</p>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    variant="outline"
                    className="border-white/20 hover:bg-white/10"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-lg w-full">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg"
              onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
              }}
              className="hidden"
            />
            {loading && (
              <div className="mt-md w-full bg-surface-container rounded-full h-1 overflow-hidden">
                <div className="bg-primary h-full animate-progress" style={{ width: "100%" }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </main >
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



