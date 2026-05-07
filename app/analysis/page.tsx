"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Upload, Loader2, Check } from "lucide-react";
import Image from "next/image";

//------------ Camera response Types----------------------------
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
  close: () => Promise<void>;
};

type CameraInstance = {
  start: () => void;
  stop: () => void;
};

// -------------- API Response Types--------------------------
export type SkinAnalysisResult = Record<string, unknown>;

type RoutineItem = { name: string; amazon_url: string; reason: string };

type RoutineData = {
  overall_score: number;
  skincare_routine: RoutineItem[];
  outfit_suggestions: RoutineItem[];
};

// ---------------Component----------------------------

export default function AnalysisPage(): React.JSX.Element {
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<CameraInstance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceDetectionRef = useRef<FaceDetectionInstance | null>(null);
  const faceDetectionModuleRef = useRef<typeof import("@mediapipe/face_detection") | null>(null);
  const cameraModuleRef = useRef<typeof import("@mediapipe/camera_utils") | null>(null);
  const hasCapturedRef = useRef(false);
  const stableCounter = useRef(0);
  const isStoppingRef = useRef<boolean>(false);


  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [analysisFailed, setAnalysisFailed] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<number>(0);

  const LOADING_STEPS = [
    "Initializing neural scan...",
    "Analyzing facial topology...",
    "Detecting surface imperfections...",
    "Evaluating hydration & texture...",
    "Generating precision routine..."
  ];

  useEffect(() => {
    if (!loading) {
      void Promise.resolve().then(() => setLoadingStep(0));
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [loading, LOADING_STEPS.length]);

  const initInProgressRef = useRef<boolean>(false);




  // ── Success Handler ────────────────────────────────────────────────────────

  const handleAnalysisSuccess = useCallback(async (data: SkinAnalysisResult, imageDataUrl: string): Promise<void> => {
    sessionStorage.setItem("skinAnalysisResult", JSON.stringify(data));
    sessionStorage.setItem("capturedImageDataUrl", imageDataUrl);

    // Optional: Pre-fetch routine data if geolocation is available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude: lat, longitude: lon } = pos.coords;
            const blobRes = await fetch(imageDataUrl);
            const blob = await blobRes.blob();
            const file = new File([blob], "face.jpg", { type: "image/jpeg" });

            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(
              `https://skin-analysis-production.up.railway.app/api/routine/daily?lat=${lat}&lon=${lon}`,
              { method: "POST", body: formData }
            );

            if (res.ok) {
              const routineData = await res.json() as RoutineData
              sessionStorage.setItem("skinRoutineData", JSON.stringify(routineData));
            }
          } catch (err) {
            console.warn("Routine pre-fetch failed:", err);
          } finally {
            router.push("/dashboard");
          }
        },
        () => router.push("/dashboard"),
        { timeout: 5000 }
      );
    } else {
      router.push("/dashboard");
    }
  }, [router]);

  //  ----------------STOP CAMERA------------------------------------
  const stopCamera = useCallback((): void => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    try {
      cameraRef.current?.stop();
    } catch { }

    cameraRef.current = null;

    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    } catch { }

    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // 🚫 DO NOT call faceDetection.close()
    faceDetectionRef.current = null;

    setReady(false);

    // ✅ keep it locked for the rest of the tick
    setTimeout(() => {
      isStoppingRef.current = false;
    }, 0);
  }, []);

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof DOMException && err.name === "AbortError") {
      return "Request timed out. Please try again.";
    }

    if (err instanceof TypeError && err.message === "Failed to fetch") {
      return "Network error. Check your internet connection.";
    }

    return err instanceof Error ? err.message : "Something went wrong.";
  };

  //  ------------------INIT CAMERA + MEDIAPIPE (LAZY)------------------------
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || loading) return;

    setLoading(true);
    setCameraError(null);
    setAnalysisFailed(false);

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setLoading(false);
      setCameraError("Failed to get canvas context");
      setAnalysisFailed(true);
      stopCamera();
      return;
    }
    ctx.drawImage(video, 0, 0);
    stopCamera();

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

    canvas.toBlob(async (blob: Blob | null): Promise<void> => {
      if (!blob) {
        setLoading(false);
        setCameraError("Failed to process image");
        setAnalysisFailed(true);
        stopCamera();
        return;
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      let data: SkinAnalysisResult = {}
      let responseText: string = "";
      try {
        const formData = new FormData();
        formData.append("file", blob, "face.jpg");

        const res = await fetch(
          "https://skin-analysis-production.up.railway.app/api/skin/analyze",
          { method: "POST", body: formData, signal: controller.signal }
        );

        responseText = await res.text();
        console.log(responseText)
        data = JSON.parse(responseText);
        if (!res.ok) throw new Error((responseText as unknown as { message: string })?.message || "Analysis failed");

        setPreviewUrl(dataUrl);
        stopCamera();
        await handleAnalysisSuccess(data, dataUrl);

      } catch (err: unknown) {
        console.error("Analysis error:", err);
        console.error("Response text:", responseText);
        setCameraError(getErrorMessage(err));
        setAnalysisFailed(true);
        setIsLocked(false);
        stopCamera();
        hasCapturedRef.current = false;
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    }, "image/jpeg", 0.95);
  }, [loading, stopCamera, handleAnalysisSuccess]);


  // ---------Initialize camera + MediaPipe------------

  const init = useCallback(async (): Promise<void> => {
    if (!videoRef.current || initInProgressRef.current || loading) return;

    // 🚨 Prevent auto restart loop after failure or success
    if (analysisFailed || hasCapturedRef.current) return;

    initInProgressRef.current = true;

    try {
      stopCamera();

      faceDetectionRef.current = null;
      cameraRef.current = null;

      // ✅ Lazy load once
      if (!faceDetectionModuleRef.current) {
        faceDetectionModuleRef.current = await import("@mediapipe/face_detection");
      }
      if (!cameraModuleRef.current) {
        cameraModuleRef.current = await import("@mediapipe/camera_utils");
      }

      const FaceDetection = faceDetectionModuleRef.current.FaceDetection;
      const Camera = cameraModuleRef.current.Camera;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      if (!videoRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      const faceDetection = new FaceDetection({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
      }) as FaceDetectionInstance;

      faceDetection.setOptions({ model: "short", minDetectionConfidence: 0.6 });

      faceDetection.onResults((results: FaceDetectionResult) => {
        if (!overlayCanvasRef.current || !videoRef.current) return;

        const canvas = overlayCanvasRef.current;
        const video = videoRef.current;

        const detection = results.detections?.[0];
        if (!detection) {
          stableCounter.current = 0;
          setIsLocked(false);

          const ctx = canvas.getContext("2d");
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

          return;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const box = detection.boundingBox;
        const faceWidth = box.width;
        const isPositionValid = faceWidth > 0.4 && faceWidth < 0.8 &&
          Math.abs(box.xCenter - 0.5) < 0.15 &&
          Math.abs(box.yCenter - 0.5) < 0.2;

        if (isPositionValid) {
          stableCounter.current += 1;

          if (stableCounter.current > 15 && !loading && !hasCapturedRef.current) {
            setIsLocked(true);

            hasCapturedRef.current = true;
            capturePhoto();
          }
        } else {
          stableCounter.current = 0;
          setIsLocked(false);
        }
        const isStable = stableCounter.current > 15;
        ctx.strokeStyle = isStable ? "#4ade80" : "#f87171";
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
      setCameraError(null);

    } catch (err) {
      console.error(err);
      setCameraError("Failed to initialize camera. Please check permissions.");
    } finally {
      initInProgressRef.current = false;
    }
  }, [analysisFailed, stopCamera, capturePhoto, loading]);


  // ── Upload fallback ────────────────────────────────────────────────────────
  const handleUpload = useCallback(async (file: File): Promise<void> => {
    stopCamera();
    setLoading(true);
    setUploadError(null);
    setAnalysisFailed(false);

    if (!navigator.onLine) {
      setUploadError("You're offline. Check your internet connection.");
      setAnalysisFailed(true);
      setLoading(false);
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject(new Error("Failed to read image file"));
          }
        };

        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(file);
      });

      const formData = new FormData();
      formData.append("file", file);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const res = await fetch(
          "https://skin-analysis-production.up.railway.app/api/skin/analyze",
          {
            method: "POST",
            body: formData,
            signal: controller.signal,
          }
        );

        // ---------------- READ RESPONSE ----------------
        const contentType = res.headers.get("content-type") || "";
        const rawResponse = await res.text();

        console.log("Status:", res.status);
        console.log("Content-Type:", contentType);
        console.log("Raw Response:", rawResponse);

        // ---------------- EMPTY RESPONSE ----------------
        if (!rawResponse || rawResponse.trim() === "") {
          throw new Error("Server returned an empty response");
        }

        // ---------------- INVALID RESPONSE TYPE ----------------
        if (!contentType.includes("application/json")) {
          throw new Error(
            `Expected JSON response but received: ${contentType}`
          );
        }

        // ---------------- PARSE JSON SAFELY ----------------
        let data: SkinAnalysisResult;

        try {
          data = JSON.parse(rawResponse) as SkinAnalysisResult;
        } catch (parseError) {
          console.error("JSON Parse Error:", parseError);

          throw new Error(
            `Invalid JSON response from server:\n${rawResponse.slice(0, 300)}`
          );
        }

        // ---------------- HANDLE API ERRORS ----------------
        if (!res.ok) {
          const errorMessage =
            typeof data?.message === "string"
              ? data.message
              : `Analysis failed (${res.status})`;

          throw new Error(errorMessage);
        }

        // ---------------- SUCCESS ----------------
        console.log("Analysis Success:", data);

        await handleAnalysisSuccess(data, dataUrl);

      } finally {
        clearTimeout(timeoutId);
      }

    } catch (err: unknown) {
      console.error("UPLOAD ANALYSIS ERROR:", err);

      setUploadError(getErrorMessage(err));
      setAnalysisFailed(true);

    } finally {
      setLoading(false);
    }
  }, [stopCamera, handleAnalysisSuccess, previewUrl]);

  // ── Drag & Drop Handlers ──────────────────────────────────────────────────

  const onDragOver = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();

    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isDragging]);

  const onDragLeave = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();

    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];

    if (file && file.type.startsWith("image/")) {
      void handleUpload(file);
    } else if (file) {
      setUploadError("Please upload an image file (PNG or JPEG)");
    }
  }, [handleUpload]);

  //-------------- handle Reset for upload mode---------------------------------------------------
  const handleReset = useCallback((): void => {
    setUploadError(null);
    setAnalysisFailed(false);
    setLoading(false);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    void init(); // Restart camera on reset
  }, [init]);


  //-------------- reset Camera----------------------------------------------
  const handleRetake = useCallback((): void => {
    hasCapturedRef.current = false;
    stableCounter.current = 0;
    setIsLocked(false);
    setCameraError(null);
    setAnalysisFailed(false);

    if (!cameraRef.current || !streamRef.current) {
      void init();
    }
  }, [init]);

  // --------------- RESTART----------------------------
  const restartCamera = useCallback(async () => {
    if (!cameraRef.current) {
      await init();
    }
  }, [init]);

  // ------- Lifecycle-------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    const initializeCamera = async (): Promise<void> => {
      if (isMounted) {
        await init();
      }
    };

    void initializeCamera();

    const handleVisibility = (): void => {
      if (document.visibilityState === "hidden") {
        stopCamera();
      } else {
        restartCamera();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibility);
      stopCamera();
    };
  }, [init, stopCamera, restartCamera]);


  //----------------cleanup------------------------------
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const showCameraOverlay = !cameraError && !analysisFailed;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="grow pt-24 pb-12 px-6 flex flex-col gap-3 items-center justify-center">
      {/* hero */}
      <div className="pt-6 pb-12 space-y-lg text-center">
        <span className="font-label-caps text-primary uppercase">
          Precision Scan
        </span>
        <h1 className="font-h1 text-display text-on-background">
          Analyze your skin in seconds.
        </h1>
        <p className="font-body-lg text-on-surface-variant">
          Our AI-driven technology requires a clear, well-lit image to provide
          accurate clinical insights.
        </p>
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-lg items-stretch">
        {/* LEFT SIDE: Camera */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative w-full aspect-3/4 md:aspect-4/2 bg-black rounded-[2rem] overflow-hidden">
            {showCameraOverlay && (
              <>
                {loading && previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Capture Preview"
                    fill
                    unoptimized
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute inset-0 w-full h-full"
                />
                {/* Scan animation during analysis */}
                {loading && (
                  <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
                    <div className="scan-line opacity-60" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`guide-oval w-64 h-80 border-2 transition-colors duration-500 rounded-full ${isLocked ? "border-primary shadow-[0_0_30px_rgba(0,194,184,0.4)]" : "border-white/30"}`} />
                  {isLocked && !loading && (
                    <div className="absolute top-1/2 -translate-y-1/2 w-72 h-0.5 scanning-line animate-pulse" />
                  )}
                </div>
              </>
            )}

            {(loading || !ready || cameraError) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm text-white z-20">
                {cameraError && analysisFailed ? (
                  <div className="text-center p-6">
                    <p className="text-red-400 font-bold mb-2 text-lg">Capture Failed</p>
                    <p className="text-sm text-white/70 mb-8">{cameraError}</p>
                    <Button
                      onClick={handleRetake}
                      className="w-full py-6 rounded-2xl"
                      variant="destructive"
                    >
                      Retake Photo
                    </Button>
                  </div>
                ) : loading ? (
                  <div className="flex flex-col items-center gap-6 p-6 text-center">
                    <div className="relative">
                      <Loader2 className="w-16 h-16 text-primary animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-primary/20 rounded-full animate-ping" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xl font-black mb-2 tracking-tight">
                        {LOADING_STEPS[loadingStep]}
                      </p>
                      <p className="text-sm text-white/50 uppercase tracking-widest font-bold">
                        Analysis in progress
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-primary/50 animate-spin" />
                    <p className="text-sm font-bold text-white/30 uppercase tracking-widest">
                      Initializing Camera...
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 bg-black/20 px-4 py-1 rounded-full backdrop-blur-md">
                {isLocked ? "Ready to analyze" : "Position face in guide"}
              </p>
            </div>
          </div>
        </div>
        {/* RIGHT SIDE */}
        <div className="lg:col-span-5 flex flex-col">
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative w-full grow rounded-[2rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-md overflow-hidden ${isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-slate-200 dark:border-slate-800 bg-surface-container hover:border-primary/50"
              }`}
          >
            {previewUrl ? (
              <>
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  unoptimized
                  className="object-contain opacity-40"
                />
                <div className="relative z-10 flex flex-col items-center text-center p-lg">
                  {loading ? (
                    <div className="flex flex-col items-center">
                      <div className="relative w-16 h-16 mb-md">
                        <Loader2 className="absolute inset-0 w-full h-full text-primary animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 bg-primary/20 rounded-full animate-ping" />
                        </div>
                      </div>
                      <p className="font-h3 text-on-background animate-pulse">
                        {LOADING_STEPS[loadingStep]}
                      </p>
                    </div>
                  ) : (
                    <>
                      <Check className="w-12 h-12 text-primary mb-md" />
                      <p className="font-h3 text-on-background">
                        Image Selected
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        Click or drag to replace.
                      </p>
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
            {uploadError && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-lg text-center z-20">
                <div>
                  <p className="text-red-400 font-bold mb-md text-xs uppercase tracking-widest">
                    {analysisFailed ? "❌ Analysis Failed" : "⚠️ Upload Issue"}
                  </p>
                  <p className="text-sm text-white/90 mb-lg leading-relaxed max-w-xs">
                    {uploadError}
                  </p>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    variant="outline"
                    className="border-white/20 hover:bg-white/10 rounded-full px-8"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-lg w-full">
            <Input
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
              <div className="mt-md w-full space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  <span>Analysis Progress</span>
                  <span>{Math.round(((loadingStep + 1) / LOADING_STEPS.length) * 100)}%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-500 ease-out"
                    style={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
