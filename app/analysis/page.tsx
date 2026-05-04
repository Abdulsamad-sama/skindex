"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";

export default function AnalysisPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const cameraRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceDetectionRef = useRef<any>(null);
  const hasCapturedRef = useRef(false);

  const stableCounter = useRef(0);

  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  //  INIT CAMERA + MEDIAPIPE (LAZY)
  const init = async () => {
    if (!videoRef.current) return;

    try {
      const { FaceDetection } = await import("@mediapipe/face_detection");
      const { Camera } = await import("@mediapipe/camera_utils");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      const faceDetection = new FaceDetection({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
      });

      faceDetection.setOptions({
        model: "short",
        minDetectionConfidence: 0.6,
      });

      faceDetection.onResults((results: any) => {
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
        const faceCenterX = box.xCenter;
        const faceCenterY = box.yCenter;

        // ✅ Size: ~60–80% of frame (approx)
        const sizeValid = faceWidth > 0.4 && faceWidth < 0.8;

        // ✅ Centered
        const centered =
          Math.abs(faceCenterX - 0.5) < 0.15 &&
          Math.abs(faceCenterY - 0.5) < 0.2;

        const valid = sizeValid && centered;

        if (valid) {
          stableCounter.current += 1;

          if (
            stableCounter.current > 15 &&
            !loading &&
            !hasCapturedRef.current
          ) {
            hasCapturedRef.current = true; // 🔥 lock forever (until reset)
            setIsLocked(true);
            capturePhoto();
          }
        } else {
          stableCounter.current = 0;
          setIsLocked(false);
        }

        // 🎨 Draw bounding box
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
        onFrame: async () => {
          if (videoRef.current) {
            await faceDetection.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 800,
      });

      camera.start();

      cameraRef.current = camera;
      faceDetectionRef.current = faceDetection;

      setReady(true);
    } catch (err) {
      console.error(err);
      setError("Failed to initialize camera");
    }
  };

  // 🔴 STOP CAMERA
  const stopCamera = () => {
    cameraRef.current?.stop();
    cameraRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) videoRef.current.srcObject = null;
  };

  // 🟢 RESTART
  const restartCamera = async () => {
    if (!cameraRef.current) {
      await init();
    }
  };

  // 📸 CAPTURE + SEND
  const capturePhoto = async () => {
    if (!videoRef.current || loading) return;

    setLoading(true);
    stopCamera();
    setError(null);

    const video = videoRef.current;
    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      try {
        const formData = new FormData();
        formData.append("file", blob, "face.jpg");

        const res = await fetch(
          "https://skin-analysis-production.up.railway.app/api/skin/analyze",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await res.json();

        if (!res.ok) throw new Error(data?.message || "Upload failed");

        setResult(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, "image/jpeg", 0.95);
  };

  // 📂 Upload fallback
  const handleUpload = async (file: File) => {
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      "https://skin-analysis-production.up.railway.app/api/skin/analyze",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  useEffect(() => {
    init();

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        stopCamera();
      } else {
        restartCamera();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      stopCamera();
    };
  }, []);
  const resetCamera = () => {
    hasCapturedRef.current = false;
    stableCounter.current = 0;
    setIsLocked(false);
    setResult(null);
    init(); // restart camera
  };

  return (
    <main className="grow pt-24 pb-12 px-6 flex items-center justify-center">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-lg items-center">

        {/* LEFT SIDE (UNCHANGED) */}
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

          <div className="relative w-full aspect-4/2 bg-black rounded-[2rem] overflow-hidden">

            {/* VIDEO */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* DETECTION OVERLAY */}
            <canvas
              ref={overlayCanvasRef}
              className="absolute inset-0 w-full h-full"
            />

            {/* OVAL GUIDE */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`guide-oval w-64 h-80 ${isLocked ? "border-green-400" : ""
                  }`}
              />
            </div>

            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                Initializing camera...
              </div>
            )}
          </div>

          {/* CONTROLS */}
          <div className="mt-lg flex flex-col gap-md">

            <Button
              disabled
              className="w-full py-lg  text-white"
            >
              {loading ? "Analyzing..." : "Auto Capturing..."}
            </Button>

            {<Button
              onClick={resetCamera}
            >
              Retake
            </Button>}

            <Input
              type="file"
              accept="image/png, image/jpeg"
              onChange={(e) => {
                if (e.target.files?.[0]) handleUpload(e.target.files[0]);
              }}
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {result && (
              <pre className="text-xs bg-black text-white p-4 rounded-lg overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}









// "use client";

// import { useEffect, useRef, useState } from "react";

// export default function AnalysisPage() {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);

//   const [stream, setStream] = useState<MediaStream | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState<any>(null);
//   const [error, setError] = useState<string | null>(null);

//   //  Start camera
//   useEffect(() => {
//     const startCamera = async () => {
//       try {
//         const mediaStream = await navigator.mediaDevices.getUserMedia({
//           video: {
//             facingMode: "user",
//           },
//         });

//         if (videoRef.current) {
//           videoRef.current.srcObject = mediaStream;
//         }

//         setStream(mediaStream);
//       } catch (err) {
//         console.error(err);
//         setError("Camera access denied");
//       }
//     };

//     startCamera();

//     return () => {
//       stream?.getTracks().forEach((track) => track.stop());
//     };
//   }, []);

//   // 📸 Capture image
//   const capturePhoto = async () => {
//     if (!videoRef.current || !canvasRef.current) return;

//     setLoading(true);
//     setError(null);

//     const video = videoRef.current;
//     const canvas = canvasRef.current;

//     // Set canvas size to video resolution
//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;

//     const ctx = canvas.getContext("2d");
//     if (!ctx) return;

//     // Draw frame
//     ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

//     // Convert to blob
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

//         const data = await res.json();

//         if (!res.ok) {
//           throw new Error(data?.message || "Upload failed");
//         }

//         setResult(data);
//       } catch (err: any) {
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     }, "image/jpeg", 0.9);
//   };



//   // 📂 Upload from gallery
//   const handleUpload = async (file: File) => {
//     setLoading(true);
//     setError(null);

//     try {
//       const formData = new FormData();
//       formData.append("file", file);

//       const res = await fetch(
//         "https://skin-analysis-production.up.railway.app/api/skin/analyze",
//         {
//           method: "POST",
//           body: formData,
//         }
//       );

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data?.message || "Upload failed");
//       }

//       setResult(data);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <main className="grow pt-24 pb-12 px-6 flex items-center justify-center">
//       <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-lg items-center">

//         {/* LEFT SIDE (unchanged) */}
//         <div className="lg:col-span-5 space-y-lg">
//           <div className="space-y-sm">
//             <span className="font-label-caps text-primary uppercase">Precision Scan</span>
//             <h1 className="font-h1 text-display text-on-background">Analyze your skin in seconds.</h1>
//             <p className="font-body-lg text-on-surface-variant">Our AI-driven technology requires a clear, well-lit image to provide accurate clinical insights for your unique skin tone.</p>
//           </div>
//           <div className="space-y-md">
//             <div className="flex items-start gap-md group">
//               <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-110">
//                 <span className="material-symbols-outlined" data-icon="light_mode">light_mode</span>
//               </div>
//               <div>
//                 <h3 className="font-h3 text-on-surface">Natural Lighting</h3>
//                 <p className="text-sm text-on-surface-variant">Face a window for even, soft light. Avoid harsh shadows or overhead lamps.</p>
//               </div>
//             </div>
//             <div className="flex items-start gap-md group">
//               <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-110">
//                 <span className="material-symbols-outlined" data-icon="face">face</span>
//               </div>
//               <div>
//                 <h3 className="font-h3 text-on-surface">Neutral Expression</h3>
//                 <p className="text-sm text-on-surface-variant">Relax your facial muscles. Remove glasses or hair that obscures your skin.</p>
//               </div>
//             </div>
//             <div className="flex items-start gap-md group">
//               <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-110">
//                 <span className="material-symbols-outlined" data-icon="center_focus_strong">center_focus_strong</span>
//               </div>
//               <div>
//                 <h3 className="font-h3 text-on-surface">Stay Centered</h3>
//                 <p className="text-sm text-on-surface-variant">Align your face with the guide for optimal surface area analysis.</p>
//               </div>
//             </div>
//           </div>
//           <div className="pt-base border-t border-surface-container-highest flex items-center gap-base">
//             <span className="material-symbols-outlined text-primary" data-icon="verified_user">verified_user</span>
//             <p className="text-xs font-medium text-on-surface-variant">HIPAA-compliant processing. Your data stays private and secure.</p>
//           </div>
//         </div>

//         {/* RIGHT SIDE */}
//         <div className="lg:col-span-7 flex flex-col items-center">

//           {/* 🎥 CAMERA VIEW */}
//           <div className="relative w-full aspect-3/2 bg-black rounded-[2rem] overflow-hidden">
//             <video
//               ref={videoRef}
//               autoPlay
//               playsInline
//               muted
//               className="absolute inset-0 w-full h-full object-cover"
//             />

//             {/* Hidden canvas */}
//             <canvas ref={canvasRef} className="hidden" />

//             {/* Overlay */}
//             <div className="absolute inset-0 flex flex-col justify-between p-6">
//               <p className="text-white text-center text-sm">
//                 Align your face within the guide
//               </p>
//             </div>
//           </div>

//           {/* CONTROLS */}
//           <div className="mt-lg w-full flex flex-col gap-md">

//             <button
//               onClick={capturePhoto}
//               disabled={loading}
//               className="w-full bg-primary text-white py-lg rounded-2xl"
//             >
//               {loading ? "Analyzing..." : "Capture Photo"}
//             </button>

//             <input
//               type="file"
//               accept="image/png, image/jpeg"
//               onChange={(e) => {
//                 if (e.target.files?.[0]) {
//                   handleUpload(e.target.files[0]);
//                 }
//               }}
//             />

//             {/* RESULT */}
//             {result && (
//               <pre className="text-xs bg-black text-white p-4 rounded-lg overflow-auto">
//                 {JSON.stringify(result, null, 2)}
//               </pre>
//             )}

//             {/* ERROR */}
//             {error && (
//               <p className="text-red-500 text-sm">{error}</p>
//             )}
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }

