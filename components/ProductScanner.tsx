
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { Spinner } from './Spinner';
import { QrCodeIcon } from './icons/QrCodeIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { CameraIcon } from './icons/CameraIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { MagnifyingGlassPlusIcon } from './icons/MagnifyingGlassPlusIcon';
import { MagnifyingGlassMinusIcon } from './icons/MagnifyingGlassMinusIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { BoltIcon } from './icons/BoltIcon';
import { BoltSlashIcon } from './icons/BoltSlashIcon';
import { SunIcon } from './icons/SunIcon';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { UploadIcon } from './icons/UploadIcon';
import { editProductImage } from '../services/geminiService';
import { useAccessibility } from '../contexts/AccessibilityContext';

interface ProductScannerProps {
  productImage: File | null;
  setProductImage: (file: File | null) => void;
  onAnalyze: () => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
  onBarcodeDetected?: (code: string) => void;
}

const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
};

export const ProductScanner: React.FC<ProductScannerProps> = ({ productImage, setProductImage, onAnalyze, onSearch, isLoading, onBarcodeDetected }) => {
  const { playClick, playSuccess, playError, announce } = useAccessibility();
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMediaType, setImageMediaType] = useState<'image' | 'video'>('image');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mode state
  const [scanMode, setScanMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const MAX_RECORDING_DURATION = 10;

  // Image Edit State
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isGeneratingEdit, setIsGeneratingEdit] = useState(false);
  const [editedImagePreview, setEditedImagePreview] = useState<string | null>(null);

  const [zoomSupport, setZoomSupport] = useState<{min: number, max: number, step: number} | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const [exposureSupport, setExposureSupport] = useState<{min: number, max: number, step: number} | null>(null);
  const [exposureValue, setExposureValue] = useState(0);

  const [flashSupport, setFlashSupport] = useState<boolean>(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isAutoFlash, setIsAutoFlash] = useState(false);
  
  const [showFocusReticle, setShowFocusReticle] = useState(false);
  const [reticlePosition, setReticlePosition] = useState<{x: number, y: number}>({x: 50, y: 50});
  const [isFocusing, setIsFocusing] = useState(false);
  const [focusStatus, setFocusStatus] = useState<'idle' | 'focusing' | 'success'>('idle');
  const [supportsContinuousFocus, setSupportsContinuousFocus] = useState(false);

  const [shutterEffect, setShutterEffect] = useState(false);
  const [captureKey, setCaptureKey] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const barcodeDetectorRef = useRef<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFlashOnRef = useRef(false);
  const lastFocusTimeRef = useRef(0);
  const scanModeRef = useRef(scanMode);
  const isRecordingRef = useRef(isRecording);
  const isProcessingCodeRef = useRef(false);
  const supportsContinuousFocusRef = useRef(false);
  const isCapturingRef = useRef(false);
  
  const consecutiveDetectionsRef = useRef(0);
  const lastDetectedCodeRef = useRef<string | null>(null);
  const detectionStartTimeRef = useRef<number>(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);

  useEffect(() => {
      scanModeRef.current = scanMode;
      isRecordingRef.current = isRecording;
  }, [scanMode, isRecording]);

  const stopScan = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = null;
      videoRef.current.onerror = null;
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setIsRecording(false);
    setRecordingTime(0);
    setZoomSupport(null);
    setZoomLevel(1);
    setExposureSupport(null);
    setExposureValue(0);
    setFlashSupport(false);
    setIsFlashOn(false);
    isFlashOnRef.current = false;
    setIsAutoFlash(false);
    setShowFocusReticle(false);
    setIsFocusing(false);
    setFocusStatus('idle');
    setSupportsContinuousFocus(false);
    supportsContinuousFocusRef.current = false;
    pinchStartDistanceRef.current = null;
    isProcessingCodeRef.current = false;
    isCapturingRef.current = false;
    
    consecutiveDetectionsRef.current = 0;
    lastDetectedCodeRef.current = null;
    detectionStartTimeRef.current = 0;
  }, []);

  const captureFrame = useCallback(async (): Promise<File | null> => {
      if (!videoRef.current) return null;
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return new Promise((resolve) => {
          canvas.toBlob((blob) => {
              if (blob) {
                  resolve(new File([blob], "scanned-product.jpg", { type: "image/jpeg" }));
              } else {
                  resolve(null);
              }
          }, 'image/jpeg', 0.95);
      });
  }, []);

  const triggerFocus = useCallback(async (point?: {x: number, y: number}) => {
      const now = Date.now();
      const throttleTime = point ? 500 : 2000;
      if (now - lastFocusTimeRef.current < throttleTime) return; 
      lastFocusTimeRef.current = now;

      if (!streamRef.current) return;
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (!videoTrack) return;

      if (point) {
          setReticlePosition(point);
          setShowFocusReticle(true);
      }

      setIsFocusing(true);
      setFocusStatus('focusing');

      setTimeout(() => {
        setIsFocusing(false);
        setFocusStatus('success');
      }, 800); 

      setTimeout(() => {
        if(point) setShowFocusReticle(false);
        setFocusStatus('idle');
      }, 2000);

      try {
        const capabilities = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as any;

        if (capabilities.focusMode && Array.isArray(capabilities.focusMode)) {
            if (capabilities.focusMode.includes('auto') || capabilities.focusMode.includes('single-shot')) {
               const mode = capabilities.focusMode.includes('auto') ? 'auto' : 'single-shot';
               await videoTrack.applyConstraints({ advanced: [{ focusMode: mode }] } as any);
            } else if (capabilities.focusMode.includes('continuous') && !point) {
                await videoTrack.applyConstraints({ advanced: [{ focusMode: 'continuous' }] } as any);
            }
            if ((capabilities.focusMode.includes('auto') || capabilities.focusMode.includes('single-shot')) && capabilities.focusMode.includes('continuous')) {
                 setTimeout(async () => {
                   if (streamRef.current?.active && !isCapturingRef.current) {
                       try {
                        await videoTrack.applyConstraints({ advanced: [{ focusMode: 'continuous' }] } as any);
                       } catch(e) {}
                   }
               }, 1200);
            }
        }
      } catch (e) {}
  }, []);

  const captureImage = useCallback(async () => {
    if (!videoRef.current) return;
    playClick();

    isCapturingRef.current = true;
    if (isRecording && mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = null; 
        try { mediaRecorderRef.current.stop(); } catch (e) {}
        setIsRecording(false);
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
    }

    try {
        if (!supportsContinuousFocusRef.current) {
            await triggerFocus();
            await new Promise(resolve => setTimeout(resolve, 600));
        } else {
            await new Promise(resolve => setTimeout(resolve, 150));
        }
    } catch (e) {}

    setCaptureKey(prev => prev + 1);
    setShutterEffect(true);
    setTimeout(() => setShutterEffect(false), 200);

    const file = await captureFrame();
    isCapturingRef.current = false;

    if (file) {
        playSuccess(); // Audio feedback for capture
        stopScan();
        setFeedback('Image captured!');
        announce('Image captured successfully');
        setImageMediaType('image');
        setProductImage(file); 
    } else {
        playError();
        setScanError("Failed to capture image.");
        announce('Failed to capture image');
    }
  }, [setProductImage, isRecording, captureFrame, stopScan, triggerFocus, playClick, playSuccess, playError, announce]);

  const stopRecording = useCallback(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      setIsRecording(false);
      if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
      }
      playClick();
      announce("Recording stopped");
  }, [playClick, announce]);

  const startRecording = useCallback(() => {
      if (!streamRef.current) {
          setScanError("Camera stream is not ready.");
          playError();
          return;
      }
      
      setScanError(null); 
      recordedChunksRef.current = [];
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) mimeType = 'video/webm;codecs=vp9';
      else if (MediaRecorder.isTypeSupported('video/mp4')) mimeType = 'video/mp4';
      else if (MediaRecorder.isTypeSupported('video/webm')) mimeType = 'video/webm';

      if (!mimeType) {
          setScanError("Video recording is not supported by this browser.");
          playError();
          return;
      }

      try {
          const options: MediaRecorderOptions = { mimeType, bitsPerSecond: 2500000 };
          const recorder = new MediaRecorder(streamRef.current, options);
          
          recorder.onerror = (event: any) => {
              setScanError(`Recording stopped: ${event.error?.message || 'Unknown error'}`);
              playError();
              if (recorder.state !== 'inactive') try { recorder.stop(); } catch(e) {}
              setIsRecording(false);
          };

          recorder.ondataavailable = (event) => {
              if (event.data && event.data.size > 0) recordedChunksRef.current.push(event.data);
          };

          recorder.onstop = () => {
              if (!mediaRecorderRef.current || mediaRecorderRef.current !== recorder) return;
              const blob = new Blob(recordedChunksRef.current, { type: mimeType });
              if (blob.size === 0) return;
              const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
              const file = new File([blob], `product-video.${ext}`, { type: mimeType });
              stopScan();
              setFeedback('Video captured!');
              playSuccess();
              announce("Video captured successfully");
              setImageMediaType('video');
              setProductImage(file);
          };

          recorder.start();
          mediaRecorderRef.current = recorder;
          setIsRecording(true);
          setRecordingTime(0);
          playSuccess(); // Start tone
          announce("Recording started");
          
          recordingTimerRef.current = window.setInterval(() => {
              setRecordingTime(prev => prev + 1);
          }, 1000);

      } catch (e: any) {
          setScanError("Video recording failed to start.");
          playError();
          setIsRecording(false);
      }
  }, [setProductImage, stopScan, playError, playSuccess, announce]);

  const toggleRecording = () => {
      if (isRecording) stopRecording();
      else startRecording();
  };

  useEffect(() => {
      if (isRecording && recordingTime >= MAX_RECORDING_DURATION) stopRecording();
  }, [recordingTime, isRecording, stopRecording]);

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const processQrCode = useCallback(async (url: string) => {
    if (scanModeRef.current === 'video' || isRecordingRef.current || isProcessingCodeRef.current || isCapturingRef.current) return;

    isProcessingCodeRef.current = true;
    setFeedback('Code detected...');
    playSuccess();
    announce("Barcode detected");
    
    try {
        if (url.startsWith('http')) {
            const response = await fetch(url);
            if (!response.ok) throw new Error();
            const blob = await response.blob();
            if (!blob.type.startsWith('image/')) throw new Error();
            const file = new File([blob], 'product-qr.jpg', { type: blob.type });
            stopScan();
            setImageMediaType('image');
            setProductImage(file);
        } else {
            if (onBarcodeDetected) onBarcodeDetected(url);
            let onlineFile: File | null = null;
            if (/^\d+$/.test(url)) {
                try {
                    const apis = [`https://world.openfoodfacts.org/api/v0/product/${url}.json`];
                    for (const api of apis) {
                        const res = await fetch(api);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.product?.image_url) {
                                const imgRes = await fetch(data.product.image_url);
                                if (imgRes.ok) {
                                    const blob = await imgRes.blob();
                                    onlineFile = new File([blob], `product-${url}.jpg`, { type: blob.type });
                                    break;
                                }
                            }
                        }
                    }
                } catch (err) {}
            }
            if (onlineFile) {
                stopScan();
                setImageMediaType('image');
                setProductImage(onlineFile);
                setFeedback('Product matched!');
            } else {
                const file = await captureFrame();
                stopScan();
                if (file) {
                    setImageMediaType('image');
                    setProductImage(file);
                } else {
                    setScanError('Failed to capture image.');
                }
            }
        }
    } catch (error) {
        if (onBarcodeDetected) onBarcodeDetected(url);
        const file = await captureFrame();
        stopScan();
        if (file) {
             setImageMediaType('image');
             setProductImage(file);
        }
    }
  }, [setProductImage, stopScan, onBarcodeDetected, captureFrame, playSuccess, announce]);

  const scanFrame = useCallback(async () => {
    if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    const now = Date.now();
    if (scanModeRef.current === 'photo' && !isRecordingRef.current && !isCapturingRef.current && !supportsContinuousFocusRef.current && (now - lastFocusTimeRef.current > 4000)) {
         triggerFocus();
    }

    if (barcodeDetectorRef.current && !isCapturingRef.current && !isProcessingCodeRef.current) {
      try {
        const barcodes = await barcodeDetectorRef.current.detect(videoRef.current);
        if (barcodes.length > 0) {
            const videoWidth = videoRef.current.videoWidth;
            const videoHeight = videoRef.current.videoHeight;
            
            // Refined centralization check: 30% - 70% bounds (middle 40%)
            // This prevents accidental scanning of products on the very edge of the frame
            const centralBarcode = barcodes.find((barcode: any) => {
                 const bb = barcode.boundingBox;
                 if (!bb) return true; // Fallback
                 const cx = bb.x + bb.width / 2;
                 const cy = bb.y + bb.height / 2;
                 return (cx > videoWidth * 0.30 && cx < videoWidth * 0.70 && cy > videoHeight * 0.30 && cy < videoHeight * 0.70);
            });

            if (centralBarcode?.rawValue) {
                const code = centralBarcode.rawValue;
                
                // Debounce logic
                if (lastDetectedCodeRef.current === code) {
                    consecutiveDetectionsRef.current += 1;
                } else {
                    lastDetectedCodeRef.current = code;
                    consecutiveDetectionsRef.current = 1;
                    detectionStartTimeRef.current = now;
                }

                // Stability Thresholds: 
                // 1. Must be detected in 5 consecutive frames
                // 2. Must be stable for at least 300ms
                if (consecutiveDetectionsRef.current >= 5 && (now - detectionStartTimeRef.current) >= 300) { 
                     consecutiveDetectionsRef.current = 0;
                     detectionStartTimeRef.current = 0;
                     lastDetectedCodeRef.current = null;
                     
                     // Use requestAnimationFrame to break out of current loop before processing
                     requestAnimationFrame(() => processQrCode(code));
                     return; 
                }
            } else {
                 // Barcode found but not central, or changed
                 consecutiveDetectionsRef.current = 0;
                 detectionStartTimeRef.current = 0;
                 lastDetectedCodeRef.current = null;
            }
        } else {
            // No barcodes detected
            consecutiveDetectionsRef.current = 0;
            detectionStartTimeRef.current = 0;
            lastDetectedCodeRef.current = null;
        }
      } catch (e) {
          // Detection error, ignore frame
      }
    }
    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [processQrCode, triggerFocus]);
  
  const applyZoom = useCallback(async (newZoom: number) => {
      if (!streamRef.current) return;
      try {
          const videoTrack = streamRef.current.getVideoTracks()[0];
          if (videoTrack) await videoTrack.applyConstraints({ advanced: [{ zoom: newZoom }] } as any);
      } catch (error) {}
  }, []);
  
  const applyExposure = useCallback(async (newExposure: number) => {
      if (!streamRef.current) return;
      try {
          const videoTrack = streamRef.current.getVideoTracks()[0];
          if (videoTrack) await videoTrack.applyConstraints({ advanced: [{ exposureCompensation: newExposure }] } as any);
      } catch (error) {}
  }, []);

  const toggleFlash = useCallback(async (forceState?: boolean) => {
      if (!streamRef.current) return;
      playClick();
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (!videoTrack) return;
      try {
          const newState = forceState !== undefined ? forceState : !isFlashOn;
          if (forceState === undefined) setIsAutoFlash(false);
          await videoTrack.applyConstraints({ advanced: [{ torch: newState }] } as any);
          setIsFlashOn(newState);
          isFlashOnRef.current = newState;
          announce(newState ? "Flash enabled" : "Flash disabled");
      } catch (error) {}
  }, [isFlashOn, playClick, announce]);

  const handleTapToFocus = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isCapturingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    triggerFocus({x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100});
  }, [triggerFocus]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && zoomSupport) {
      pinchStartDistanceRef.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      pinchStartZoomRef.current = zoomLevel;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && zoomSupport && pinchStartDistanceRef.current !== null) {
      const distance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const sensitivity = 0.005 * ((zoomSupport.max - zoomSupport.min) || 1); 
      let newZoom = Math.max(zoomSupport.min, Math.min(pinchStartZoomRef.current + ((distance - pinchStartDistanceRef.current) * sensitivity), zoomSupport.max));
      setZoomLevel(newZoom);
      applyZoom(newZoom);
    }
  };

  const handleTouchEnd = () => { pinchStartDistanceRef.current = null; };

  const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editPrompt.trim() || !productImage) return;
      playClick();
      setIsGeneratingEdit(true);
      announce("Generating image edit");
      try {
          const result = await editProductImage(productImage, editPrompt);
          setEditedImagePreview(result);
          playSuccess();
          announce("Image edit generated");
      } catch (err) {
          setFeedback("Failed to edit image.");
          playError();
      } finally {
          setIsGeneratingEdit(false);
      }
  };

  const handleApplyEdit = () => {
      if (editedImagePreview) {
          playClick();
          const file = dataURLtoFile(editedImagePreview, "edited-image.png");
          setProductImage(file);
          setImagePreview(editedImagePreview);
          setIsEditingMode(false);
          setEditedImagePreview(null);
          setEditPrompt('');
          announce("Edit applied");
      }
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(searchQuery.trim()) {
          onSearch(searchQuery);
          setSearchQuery('');
      }
  }

  const startScan = useCallback(async () => {
    if (isScanning || streamRef.current) return;
    setScanError(null);
    playClick();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScanError("Camera is not supported.");
      return;
    }

    setFeedback(null);
    setIsScanning(true);
    setIsFlashOn(false); 
    isFlashOnRef.current = false;
    setIsAutoFlash(false);
    announce("Camera started");

    try {
      if ('BarcodeDetector' in window && !barcodeDetectorRef.current) {
         try {
            barcodeDetectorRef.current = new (window as any).BarcodeDetector({ formats: ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e'] });
         } catch (e) {
             barcodeDetectorRef.current = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
         }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      streamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as any;
        if (capabilities.zoom) { setZoomSupport(capabilities.zoom); setZoomLevel(capabilities.zoom.min); } else { setZoomSupport(null); }
        if (capabilities.exposureCompensation) { setExposureSupport(capabilities.exposureCompensation); setExposureValue(0); } else { setExposureSupport(null); }
        setFlashSupport(!!capabilities.torch);

        if (capabilities.focusMode && Array.isArray(capabilities.focusMode)) {
            const hasContinuous = capabilities.focusMode.includes('continuous');
            setSupportsContinuousFocus(hasContinuous);
            supportsContinuousFocusRef.current = hasContinuous;
            if (hasContinuous) await videoTrack.applyConstraints({ advanced: [{ focusMode: 'continuous' }] } as any);
            else if (capabilities.focusMode.includes('auto')) await videoTrack.applyConstraints({ advanced: [{ focusMode: 'auto' }] } as any);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(() => {
              setScanError("Could not start camera view.");
              stopScan();
            });
            animationFrameRef.current = requestAnimationFrame(scanFrame);
          }
        };
      }
    } catch (error) {
      setScanError("Could not access camera.");
      setIsScanning(false);
      playError();
    }
  }, [isScanning, scanFrame, stopScan, playClick, playError, announce]);

  useEffect(() => {
    if (!isScanning || !videoRef.current) return;
    let lastBrightness = -1;
    const intervalId = setInterval(() => {
        if (!videoRef.current || videoRef.current.paused) return;
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0, 64, 64);
        const data = ctx.getImageData(0, 0, 64, 64).data;
        let totalBrightness = 0;
        for (let i = 0; i < data.length; i += 4) totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
        const avgBrightness = totalBrightness / (data.length / 4);
        
        if (isAutoFlash) {
            if (!isFlashOnRef.current && avgBrightness < 50) toggleFlash(true);
            else if (isFlashOnRef.current && avgBrightness > 180) toggleFlash(false);
        }
        if (!supportsContinuousFocusRef.current && !isCapturingRef.current && lastBrightness !== -1 && Math.abs(avgBrightness - lastBrightness) > 8) triggerFocus();
        lastBrightness = avgBrightness;
    }, 500);
    return () => clearInterval(intervalId);
  }, [isScanning, isAutoFlash, toggleFlash, triggerFocus]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setScanError(null);
    const file = event.target.files?.[0];
    if (file) {
        if (file.type.startsWith('image/')) { setImageMediaType('image'); setProductImage(file); }
        else if (file.type.startsWith('video/')) { setImageMediaType('video'); setProductImage(file); }
        else { setScanError("Please select a valid image or video."); setProductImage(null); }
    }
  }, [setProductImage]);

  useEffect(() => {
    if (productImage) {
      stopScan();
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(productImage);
    } else {
      setImagePreview(null);
      setIsEditingMode(false);
      setEditedImagePreview(null);
      setEditPrompt('');
    }
  }, [productImage, stopScan]);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg transition-colors duration-200" role="region" aria-label="Product Scanner">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-brand-gray-dark dark:text-white flex items-center">
            {scanMode === 'photo' ? <CameraIcon className="h-6 w-6 mr-2 text-brand-green" /> : <VideoCameraIcon className="h-6 w-6 mr-2 text-brand-green" />}
            {productImage ? (imageMediaType === 'video' ? 'Review Video' : (isEditingMode ? 'Edit Image' : 'Review Image')) : (scanMode === 'photo' ? 'Scan Product' : 'Record Video')}
        </h2>
        <div className="flex space-x-2">
           {!productImage && isScanning && !isRecording && (
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1" role="group" aria-label="Camera Mode">
                  <button 
                    onClick={() => { setScanMode('photo'); playClick(); }}
                    aria-pressed={scanMode === 'photo'}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${scanMode === 'photo' ? 'bg-white dark:bg-gray-600 text-brand-green shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                      Photo
                  </button>
                  <button 
                    onClick={() => { setScanMode('video'); playClick(); }}
                    aria-pressed={scanMode === 'video'}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${scanMode === 'video' ? 'bg-white dark:bg-gray-600 text-brand-green shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                      Video
                  </button>
              </div>
           )}
        </div>
      </div>

      <div className="relative aspect-[4/3] w-full max-w-xl mx-auto bg-black rounded-xl overflow-hidden shadow-inner group">
        {!isScanning && !productImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gray-50 dark:bg-gray-900">
             <QrCodeIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-6" />
             <div className="flex flex-col w-full max-w-xs gap-3 px-6">
                <button
                    onClick={startScan}
                    className="flex items-center justify-center w-full px-6 py-3.5 bg-brand-green text-white font-bold rounded-xl shadow-lg hover:bg-brand-green-dark transition-all transform hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-4 focus:ring-brand-green/30"
                    aria-label="Start Camera"
                >
                    <CameraIcon className="w-5 h-5 mr-2.5" />
                    Start Camera
                </button>
                <button
                    onClick={() => { fileInputRef.current?.click(); playClick(); }}
                    className="flex items-center justify-center w-full px-6 py-3.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-white font-bold rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-all transform hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-600"
                    aria-label="Upload Image"
                >
                    <UploadIcon className="w-5 h-5 mr-2.5 text-brand-green" />
                    Upload Image
                </button>
             </div>
          </div>
        )}

        {isScanning && (
          <div 
            className="relative h-full w-full cursor-pointer touch-none" 
            onClick={handleTapToFocus}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            role="application"
            aria-label="Camera Viewfinder"
          >
            <video ref={videoRef} className={`h-full w-full object-cover transition-all duration-300 ${isFocusing ? 'blur-[1px]' : ''}`} muted playsInline />
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[40%] rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] border-2 border-brand-green/50">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brand-green -mt-[2px] -ml-[2px]"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brand-green -mt-[2px] -mr-[2px]"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brand-green -mb-[2px] -ml-[2px]"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brand-green -mb-[2px] -mr-[2px]"></div>
                </div>
                {showFocusReticle && (
                    <div 
                        className={`absolute w-16 h-16 border-2 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 transform ${
                            focusStatus === 'focusing' ? 'border-yellow-400 scale-110 opacity-90' : focusStatus === 'success' ? 'border-green-400 scale-100 opacity-100' : 'border-gray-400 opacity-0'
                        }`}
                        style={{ top: `${reticlePosition.y}%`, left: `${reticlePosition.x}%` }}
                    />
                )}
            </div>
             
            {flashSupport && (
                <button 
                    onClick={(e) => { e.stopPropagation(); toggleFlash(); }}
                    className={`absolute top-4 left-4 p-2 rounded-full backdrop-blur-md transition-all duration-200 z-20 focus:outline-none focus:ring-2 focus:ring-white ${isFlashOn ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50' : 'bg-black/40 text-white border border-white/10'}`}
                    aria-label={isFlashOn ? "Turn Flash Off" : "Turn Flash On"}
                    aria-pressed={isFlashOn}
                >
                    {isFlashOn ? <BoltIcon className="h-6 w-6" /> : <BoltSlashIcon className="h-6 w-6" />}
                </button>
            )}

            {isRecording && (
                <div className="absolute top-4 right-16 flex items-center space-x-2 bg-red-600/80 text-white px-3 py-1 rounded-full backdrop-blur-md animate-pulse z-20" role="timer">
                    <div className="h-2 w-2 bg-white rounded-full"></div>
                    <span className="text-xs font-bold font-mono">{formatTime(recordingTime)}</span>
                </div>
            )}
            
            {shutterEffect && <div key={captureKey} className="absolute inset-0 bg-white animate-flash pointer-events-none z-50"></div>}
          </div>
        )}

        {productImage && (
          <div className="relative h-full w-full bg-black flex items-center justify-center">
            {imageMediaType === 'video' ? (
               <video controls className="max-h-full max-w-full" src={imagePreview || ''} />
            ) : (
               <img src={editedImagePreview || imagePreview || ''} alt="Scanned Product" className="max-h-full max-w-full object-contain" />
            )}
            
            <button 
                onClick={() => { setProductImage(null); startScan(); playClick(); }}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all z-20 focus:outline-none focus:ring-2 focus:ring-white"
                title="Retake"
                aria-label="Retake photo"
            >
                <XMarkIcon className="h-5 w-5" />
            </button>
            
            {isGeneratingEdit && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
                    <Spinner className="text-white w-12 h-12" />
                </div>
            )}
          </div>
        )}

        <div className="absolute bottom-8 left-0 w-full flex justify-center pointer-events-none z-30" aria-live="polite">
           {feedback && (
            <div className="bg-brand-green/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg flex items-center animate-slide-up">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              <span className="font-medium text-sm">{feedback}</span>
            </div>
          )}
          {scanError && !feedback && (
            <div className="bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg flex items-center animate-slide-up max-w-[90%]">
               <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
               <span className="font-medium text-sm truncate">{scanError}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-4 min-h-[60px] max-w-xl mx-auto">
         {isScanning && zoomSupport && (
             <div className="flex items-center space-x-3 px-2 relative pt-4">
                 <button onClick={() => { setZoomLevel(Math.max(zoomLevel - 0.1, zoomSupport.min)); playClick(); }} className="p-1.5 text-gray-500 hover:text-brand-green transition-colors" aria-label="Zoom Out">
                     <MagnifyingGlassMinusIcon className="h-5 w-5" />
                 </button>
                 <div className="flex-grow relative h-8 flex items-center">
                     <input 
                        type="range" 
                        min={zoomSupport.min} 
                        max={zoomSupport.max} 
                        step={zoomSupport.step || 0.1}
                        value={zoomLevel}
                        onChange={(e) => { setZoomLevel(parseFloat(e.target.value)); applyZoom(parseFloat(e.target.value)); }}
                        className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-green"
                        aria-label="Zoom Level"
                     />
                 </div>
                  <button onClick={() => { setZoomLevel(Math.min(zoomLevel + 0.1, zoomSupport.max)); playClick(); }} className="p-1.5 text-gray-500 hover:text-brand-green transition-colors" aria-label="Zoom In">
                     <MagnifyingGlassPlusIcon className="h-5 w-5" />
                  </button>
             </div>
         )}

         {isScanning && exposureSupport && (
             <div className="flex items-center space-x-3 px-2">
                 <div className="p-1.5 text-gray-500">
                     <SunIcon className="h-5 w-5" />
                 </div>
                 <div className="flex-grow relative h-8 flex items-center">
                     <input 
                        type="range" 
                        min={exposureSupport.min} 
                        max={exposureSupport.max} 
                        step={exposureSupport.step}
                        value={exposureValue}
                        onChange={(e) => { setExposureValue(parseFloat(e.target.value)); applyExposure(parseFloat(e.target.value)); }}
                        className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-green"
                        aria-label="Exposure Level"
                     />
                 </div>
             </div>
         )}
        
         {productImage && imageMediaType === 'image' && isEditingMode && (
             <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-xl animate-fade-in">
                {!editedImagePreview ? (
                    <form onSubmit={handleEditSubmit} className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">AI Edit Prompt</label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                placeholder="e.g., Add a retro filter"
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                className="flex-grow px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-green focus:outline-none"
                            />
                            <button 
                                type="submit"
                                disabled={isGeneratingEdit || !editPrompt.trim()}
                                className="px-4 py-2 bg-brand-green text-white rounded-lg text-sm font-bold hover:bg-brand-green-dark disabled:opacity-50 transition-colors"
                            >
                                Generate
                            </button>
                        </div>
                        <button type="button" onClick={() => { setIsEditingMode(false); playClick(); }} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-1 self-start">Cancel</button>
                    </form>
                ) : (
                    <div className="flex justify-between items-center">
                         <p className="text-sm text-gray-700 dark:text-gray-200">Use this image?</p>
                         <div className="flex gap-2">
                            <button onClick={() => { setEditedImagePreview(null); playClick(); }} className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">Undo</button>
                            <button onClick={handleApplyEdit} className="px-3 py-1.5 text-sm font-bold text-white bg-brand-green rounded-lg hover:bg-brand-green-dark">Apply</button>
                         </div>
                    </div>
                )}
             </div>
         )}

         {productImage && (
             <div className="space-y-3">
                <button
                    onClick={onAnalyze}
                    disabled={isLoading || isGeneratingEdit}
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center transition-all transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-brand-green/30 ${
                        isLoading || isGeneratingEdit
                        ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500' 
                        : 'bg-brand-green text-white hover:bg-brand-green-dark hover:-translate-y-1'
                    }`}
                >
                    {isLoading ? <><Spinner className="w-6 h-6 mr-3 text-current" />Analyzing...</> : <><SparklesIcon className="w-6 h-6 mr-2" />Analyze Product</>}
                </button>
                {imageMediaType === 'image' && !isEditingMode && (
                    <button onClick={() => { setIsEditingMode(true); playClick(); }} className="w-full py-2 text-sm font-semibold text-brand-green dark:text-brand-green-light hover:bg-brand-green/10 dark:hover:bg-brand-green/20 rounded-lg transition-colors">
                        ✨ AI Magic Edit
                    </button>
                )}
            </div>
         )}
         
         {isScanning && scanMode === 'photo' && !isRecording && (
             <div className="flex justify-center pt-4 relative group">
                 <button 
                    onClick={captureImage}
                    className="h-20 w-20 bg-white dark:bg-gray-700 rounded-full border-[6px] border-gray-200 dark:border-gray-600 flex items-center justify-center shadow-2xl hover:shadow-brand-green/30 hover:border-brand-green dark:hover:border-brand-green transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-brand-green"
                    aria-label="Capture Photo"
                 >
                     <div className="h-14 w-14 bg-brand-green rounded-full border-2 border-white dark:border-gray-700 shadow-inner group-hover:scale-90 transition-transform duration-300"></div>
                 </button>
             </div>
         )}

         {isScanning && scanMode === 'video' && (
            <div className="flex justify-center pt-2">
                <button 
                   onClick={toggleRecording}
                   className={`h-16 w-16 rounded-full border-4 flex items-center justify-center shadow-lg active:scale-90 transition-transform focus:outline-none focus:ring-4 focus:ring-red-500 ${isRecording ? 'border-red-200 bg-white' : 'border-gray-200 dark:border-gray-600 bg-white'}`}
                   aria-label={isRecording ? "Stop Recording" : "Start Recording"}
                >
                    <div className={`transition-all duration-300 ${isRecording ? 'h-6 w-6 bg-red-600 rounded-sm' : 'h-12 w-12 bg-red-500 rounded-full'}`}></div>
                </button>
            </div>
         )}

         {!isScanning && !productImage && (
             <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-4">
                 <p className="text-center text-xs font-semibold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-wider">Or search by name</p>
                 <form onSubmit={handleSearchSubmit} className="flex gap-2">
                     <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                             type="text" 
                             placeholder="e.g., CeraVe Cleanser" 
                             value={searchQuery}
                             onChange={(e) => setSearchQuery(e.target.value)}
                             className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-green focus:outline-none transition-all"
                             aria-label="Search product by name"
                        />
                     </div>
                     <button 
                         type="submit"
                         disabled={!searchQuery.trim() || isLoading}
                         className="px-4 py-2 bg-brand-green/10 text-brand-green dark:text-brand-green-light font-bold rounded-xl hover:bg-brand-green hover:text-white transition-all disabled:opacity-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                     >
                         Search
                     </button>
                 </form>
             </div>
         )}
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*" className="hidden" aria-hidden="true" />
    </div>
  );
};
