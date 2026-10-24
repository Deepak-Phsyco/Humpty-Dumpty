import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Flashlight, 
  RotateCw, 
  Pause, 
  Play, 
  Search, 
  AlertCircle, 
  Sparkles, 
  ArrowLeft,
  RefreshCw,
  Sliders,
  CheckCircle2,
  CameraOff,
  Bot
} from 'lucide-react';
import { cameraService } from '../lib/camera';
import { detectionPipeline, DetectionResult } from '../lib/detection';
import { recordScan, getEquipmentById } from '../lib/db';
import { Equipment, DetectionPrediction } from '../types/equipment';
import { AROverlay } from '../components/AROverlay';
import { LowConfidencePicker } from '../components/LowConfidencePicker';
import { TRANSLATIONS } from '../lib/translations';

interface ScanScreenProps {
  onBack: () => void;
  onOpenManualSearch: () => void;
  lang: 'en' | 'hi';
  acknowledgedSafetyIds: Set<string>;
  onAcknowledgeSafety: (equipmentId: string) => void;
  demoEquipmentToSimulate?: Equipment | null;
  onClearDemoSimulation?: () => void;
  onOpenChatbot?: (equipment?: Equipment | null) => void;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({
  onBack,
  onOpenManualSearch,
  lang,
  acknowledgedSafetyIds,
  onAcknowledgeSafety,
  demoEquipmentToSimulate,
  onClearDemoSimulation,
  onOpenChatbot,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Camera & Stream State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [frozenFrameUrl, setFrozenFrameUrl] = useState<string | null>(null);

  // AI Model Loading State
  const [modelLoading, setModelLoading] = useState(true);
  const [modelProgress, setModelProgress] = useState(20);

  // Active Detections & Overlay State
  const [currentPrediction, setCurrentPrediction] = useState<DetectionPrediction | null>(null);
  const [currentEquipment, setCurrentEquipment] = useState<Equipment | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lowConfidenceCandidates, setLowConfidenceCandidates] = useState<Array<{ equipment: Equipment; confidence: number }>>([]);

  const t = TRANSLATIONS[lang];

  // 1. Initialize Vision Model and Camera Feed
  useEffect(() => {
    let isMounted = true;

    async function init() {
      setModelLoading(true);
      // Load TF.js model with simulated/real progress feedback
      const progressTimer = setInterval(() => {
        setModelProgress(prev => (prev < 90 ? prev + 15 : prev));
      }, 300);

      const success = await detectionPipeline.loadModel((prog) => {
        if (isMounted) setModelProgress(prog);
      });

      clearInterval(progressTimer);
      if (isMounted) {
        setModelProgress(100);
        setModelLoading(false);
      }

      // If demo mode simulation was passed in directly:
      if (demoEquipmentToSimulate && isMounted) {
        triggerDemoSimulation(demoEquipmentToSimulate);
        return;
      }

      // Start camera feed
      if (videoRef.current && isMounted) {
        const camRes = await cameraService.startCamera(videoRef.current, 'environment');
        if (isMounted) {
          if (camRes.success) {
            setIsCameraActive(true);
            setTorchSupported(camRes.torchSupported);
            setCameraError(null);
          } else {
            setCameraError(camRes.error || t.cameraAccessDenied);
          }
        }
      }
    }

    init();

    return () => {
      isMounted = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      cameraService.stopCamera();
    };
  }, []);

  // Handle Demo Mode Simulation if requested
  useEffect(() => {
    if (demoEquipmentToSimulate) {
      triggerDemoSimulation(demoEquipmentToSimulate);
    }
  }, [demoEquipmentToSimulate]);

  const triggerDemoSimulation = (equipment: Equipment) => {
    const width = containerRef.current?.clientWidth || 360;
    const height = containerRef.current?.clientHeight || 560;
    const demo = detectionPipeline.createDemoDetection(equipment.id, width, height);

    setCurrentPrediction(demo.prediction);
    setCurrentEquipment(demo.equipment);
    setIsLocked(true);
    setLowConfidenceCandidates([]);
    recordScan(demo.equipment, demo.prediction.confidence);
  };

  // 2. Real-time Detection Loop (Throttled 5-10 times/sec via requestAnimationFrame)
  const runDetectionLoop = useCallback(() => {
    if (!videoRef.current || isFrozen || !isCameraActive || isLocked) {
      animFrameIdRef.current = requestAnimationFrame(runDetectionLoop);
      return;
    }

    const video = videoRef.current;
    if (video.readyState >= 2) {
      const now = performance.now();
      detectionPipeline.detectFrame(video, now).then(async (result: DetectionResult) => {
        if (result.topPrediction) {
          // Bounding box coordinate translation to container dimensions
          const container = containerRef.current;
          let scaleX = 1;
          let scaleY = 1;

          if (container && video.videoWidth && video.videoHeight) {
            scaleX = container.clientWidth / video.videoWidth;
            scaleY = container.clientHeight / video.videoHeight;
          }

          const scaledPrediction: DetectionPrediction = {
            ...result.topPrediction,
            bbox: {
              x: result.topPrediction.bbox.x * scaleX,
              y: result.topPrediction.bbox.y * scaleY,
              width: result.topPrediction.bbox.width * scaleX,
              height: result.topPrediction.bbox.height * scaleY,
            }
          };

          setCurrentPrediction(scaledPrediction);

          if (result.isLowConfidence) {
            setLowConfidenceCandidates(result.candidateMatches);
            setIsLocked(false);
          } else {
            setLowConfidenceCandidates([]);
            if (result.locked) {
              const eq = await getEquipmentById(result.topPrediction.equipmentId);
              if (eq) {
                setCurrentEquipment(eq);
                setIsLocked(true);
                recordScan(eq, result.topPrediction.confidence);
              }
            }
          }
        } else {
          // No detections found in this slice
          if (!isLocked) {
            setCurrentPrediction(null);
            setLowConfidenceCandidates([]);
          }
        }
      });
    }

    animFrameIdRef.current = requestAnimationFrame(runDetectionLoop);
  }, [isFrozen, isCameraActive, isLocked]);

  useEffect(() => {
    animFrameIdRef.current = requestAnimationFrame(runDetectionLoop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [runDetectionLoop]);

  // Camera Controls
  const handleToggleFreeze = () => {
    if (!videoRef.current) return;
    if (isFrozen) {
      setIsFrozen(false);
      setFrozenFrameUrl(null);
    } else {
      const snapshot = cameraService.captureFreezeFrame(videoRef.current);
      if (snapshot) {
        setFrozenFrameUrl(snapshot);
        setIsFrozen(true);
      }
    }
  };

  const handleToggleTorch = async () => {
    const newState = await cameraService.toggleTorch();
    setTorchOn(newState);
  };

  const handleSwitchCamera = async () => {
    if (!videoRef.current) return;
    const res = await cameraService.switchCamera(videoRef.current);
    if (res.success) {
      setTorchSupported(res.torchSupported);
    }
  };

  const handleManualCandidateSelect = (equipment: Equipment) => {
    const width = containerRef.current?.clientWidth || 360;
    const height = containerRef.current?.clientHeight || 560;
    const demo = detectionPipeline.createDemoDetection(equipment.id, width, height);

    setCurrentPrediction(demo.prediction);
    setCurrentEquipment(equipment);
    setIsLocked(true);
    setLowConfidenceCandidates([]);
    recordScan(equipment, 0.88);
  };

  const handleResetScan = () => {
    detectionPipeline.resetLock();
    setCurrentPrediction(null);
    setCurrentEquipment(null);
    setIsLocked(false);
    setLowConfidenceCandidates([]);
    if (onClearDemoSimulation) onClearDemoSimulation();
  };

  return (
    <div ref={containerRef} className="relative w-full h-[calc(100vh-65px)] bg-black overflow-hidden flex flex-col justify-between select-none">
      {/* Background Live Video Feed */}
      {!frozenFrameUrl ? (
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      ) : (
        <img
          src={frozenFrameUrl}
          alt="Frozen Frame"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      )}

      {/* Subtle Viewfinder HUD Grid & Scanning Line (When Searching) */}
      {!isLocked && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {/* Animated Scanning Laser Line */}
          <div className="absolute inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent shadow-[0_0_15px_#22bb80] animate-scan" />

          {/* Guide Reticle in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-56 h-56 sm:w-72 sm:h-72 border border-white/20 rounded-3xl relative">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-brand-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-brand-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-brand-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-brand-400 rounded-br-lg" />
            </div>
          </div>
        </div>
      )}

      {/* Model Loading Skeleton Overlay */}
      {modelLoading && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="relative w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center mb-4">
            <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">{t.modelLoading}</h3>
          <div className="w-48 bg-white/10 h-2 rounded-full overflow-hidden mb-2">
            <div 
              className="bg-brand-500 h-full transition-all duration-300"
              style={{ width: `${modelProgress}%` }}
            />
          </div>
          <span className="text-xs font-mono text-brand-300">{modelProgress}%</span>
        </div>
      )}

      {/* Camera Error State (Graceful Fallback) */}
      {cameraError && (
        <div className="absolute inset-0 z-30 bg-elevate-dark/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-4 text-red-400">
            <CameraOff className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Camera Unavailable</h3>
          <p className="text-xs text-gray-400 max-w-sm mb-6 leading-relaxed">
            {cameraError}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button
              onClick={onOpenManualSearch}
              className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-elevate-dark font-bold text-xs uppercase tracking-wider transition-all"
            >
              Browse Library Manually
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors"
            >
              Retry Camera
            </button>
          </div>
        </div>
      )}

      {/* Top Floating Scan Controls Bar */}
      <div className="relative z-30 p-3 flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-colors"
          title="Back to home"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Status Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-semibold">
          <div className={`w-2 h-2 rounded-full ${isLocked ? 'bg-brand-400 animate-pulse' : 'bg-amber-400'}`} />
          <span>{isLocked ? 'Instrument Locked' : 'Scanning Lab Objects...'}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Ask AI Guide Button */}
          {onOpenChatbot && (
            <button
              onClick={() => onOpenChatbot(currentEquipment)}
              className="p-2.5 rounded-xl bg-gradient-to-r from-brand-600/40 to-emerald-500/40 backdrop-blur-md border border-brand-500/40 text-brand-300 hover:text-white transition-all shadow-sm"
              title="Ask LabLens AI Guide (DeepSeek Harness)"
            >
              <Bot className="w-4 h-4" />
            </button>
          )}

          {/* Manual Search Fallback Button */}
          <button
            onClick={onOpenManualSearch}
            className="p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-colors"
            title={t.manualSearch}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AR Live Overlay */}
      <AROverlay
        prediction={currentPrediction}
        equipment={currentEquipment}
        isLocked={isLocked}
        onCloseGuide={handleResetScan}
        lang={lang}
        onAcknowledgeSafety={onAcknowledgeSafety}
        acknowledgedSafetyIds={acknowledgedSafetyIds}
        onOpenChatbot={onOpenChatbot ? (eq) => onOpenChatbot(eq) : undefined}
      />

      {/* Low Confidence Top 3 Candidates Picker (<60% confidence) */}
      {lowConfidenceCandidates.length > 0 && !isLocked && (
        <LowConfidencePicker
          candidates={lowConfidenceCandidates}
          onSelectCandidate={handleManualCandidateSelect}
          lang={lang}
        />
      )}

      {/* Bottom Camera Toolbar (Freeze, Torch, Switch Camera, Reset) */}
      <div className="relative z-30 p-4 pb-6 flex items-center justify-center gap-3">
        {/* Torch Toggle */}
        {torchSupported && (
          <button
            onClick={handleToggleTorch}
            className={`p-3.5 rounded-2xl border backdrop-blur-md transition-all ${
              torchOn
                ? 'bg-amber-500 text-elevate-dark border-amber-400 shadow-lg shadow-amber-500/30'
                : 'bg-black/60 text-white border-white/15 hover:bg-white/10'
            }`}
            title={t.toggleTorch}
          >
            <Flashlight className="w-5 h-5" />
          </button>
        )}

        {/* Freeze Frame Button */}
        <button
          onClick={handleToggleFreeze}
          className={`min-h-[48px] px-5 py-3 rounded-2xl border backdrop-blur-md flex items-center gap-2 text-xs font-bold transition-all ${
            isFrozen
              ? 'bg-brand-500 text-elevate-dark border-brand-400 shadow-lg shadow-brand-500/30'
              : 'bg-black/60 text-white border-white/15 hover:bg-white/10'
          }`}
          title="Freeze live feed to inspect closely"
        >
          {isFrozen ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          <span>{isFrozen ? t.resumeCamera : t.freezeFrame}</span>
        </button>

        {/* Switch Front/Rear Camera */}
        <button
          onClick={handleSwitchCamera}
          className="p-3.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 text-white hover:bg-white/10 transition-colors"
          title={t.switchCamera}
        >
          <RotateCw className="w-5 h-5" />
        </button>

        {/* Re-Scan / Reset Lock */}
        {isLocked && (
          <button
            onClick={handleResetScan}
            className="p-3.5 rounded-2xl bg-brand-500/20 backdrop-blur-md border border-brand-500/40 text-brand-300 hover:bg-brand-500/30 transition-colors"
            title="Scan next instrument"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
