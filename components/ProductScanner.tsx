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
import { editProductImage } from '../services/geminiService';

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

  // Using 'any' for MediaSettingsRange as it might not be in standard TS lib yet for all envs
  const [zoomSupport, setZoomSupport] = useState<{min: number, max: number, step: number} | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Exposure state
  const [exposureSupport, setExposureSupport] = useState<{min: number, max: number, step: number} | null>(null);
  const [exposureValue, setExposureValue] = useState(0);

  // Flash/Torch state
  const [flashSupport, setFlashSupport] = useState<boolean>(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isAutoFlash, setIsAutoFlash] = useState(false);
  
  // Focus state
  const [showFocusReticle, setShowFocusReticle] = useState(false);
  const [reticlePosition, setReticlePosition] = useState<{x: number, y: number}>({x: 50, y: 50});
  const [isFocusing, setIsFocusing] = useState(false);
  const [supportsContinuousFocus, setSupportsContinuousFocus] = useState(false);

  // Capture feedback
  const [shutterEffect, setShutterEffect] = useState(false);
  const [captureKey, setCaptureKey] = useState(0); // Key to force animation re-render

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
  
  // Video recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  // Pinch zoom refs
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);

  // Update refs when state changes
  useEffect(() => {
      scanModeRef.current = scanMode;
      isRecordingRef.current = isRecording;
  }, [scanMode, isRecording]);

  const stopScan = useCallback(() => {
    // Stop recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
            mediaRecorderRef.current.stop();
        } catch (e) {
            console.warn("Error stopping recorder during stopScan:", e);
        }
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
    setSupportsContinuousFocus(false);
    supportsContinuousFocusRef.current = false;
    pinchStartDistanceRef.current = null;
    isProcessingCodeRef.current = false;
    isCapturingRef.current = false;
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
      // Throttle auto-focus (when no point provided) to prevent constant seeking
      // Allow manual focus (point provided) more frequently
      const throttleTime = point ? 500 : 2000;
      
      if (now - lastFocusTimeRef.current < throttleTime) return; 
      lastFocusTimeRef.current = now;

      if (!streamRef.current) return;
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (!videoTrack) return;

      // Update reticle position
      if (point) {
          setReticlePosition(point);
          setShowFocusReticle(true);
          setTimeout(() => setShowFocusReticle(false), 1500);
      }

      // Visual feedback
      setIsFocusing(true); // Apply blur to indicate focusing action

      // Reset blur and reticle
      setTimeout(() => {
        setIsFocusing(false); // Remove blur to indicate focus achieved
      }, 800); 

      try {
        const capabilities = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as any;

        if (capabilities.focusMode && Array.isArray(capabilities.focusMode)) {
            // If 'auto' (single-shot) or 'single-shot' is available, trigger it.
            if (capabilities.focusMode.includes('auto') || capabilities.focusMode.includes('single-shot')) {
               const mode = capabilities.focusMode.includes('auto') ? 'auto' : 'single-shot';
               await videoTrack.applyConstraints({ advanced: [{ focusMode: mode }] } as any);
            } 
            // If continuous is supported, we ensure it is set to continuous if no point specified,
            // or if we are "resetting" focus after a manual adjustment.
            else if (capabilities.focusMode.includes('continuous') && !point) {
                await videoTrack.applyConstraints({ advanced: [{ focusMode: 'continuous' }] } as any);
            }
            
            // If we triggered a single shot focus, try to return to continuous after a delay if supported
            if ((capabilities.focusMode.includes('auto') || capabilities.focusMode.includes('single-shot')) && capabilities.focusMode.includes('continuous')) {
                 setTimeout(async () => {
                   if (streamRef.current?.active && !isCapturingRef.current) {
                       try {
                        await videoTrack.applyConstraints({ advanced: [{ focusMode: 'continuous' }] } as any);
                       } catch(e) {
                           console.warn("Failed to revert to continuous focus", e);
                       }
                   }
               }, 1200);
            }
        }
      } catch (e) {
          console.warn("Focus trigger failed", e);
      }
  }, []);

  const captureImage = useCallback(async () => {
    if (!videoRef.current) return;

    isCapturingRef.current = true;

    // If recording is active, we want to prioritize the snapshot and cancel the video save.
    if (isRecording && mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = null; 
        if (mediaRecorderRef.current.state !== 'inactive') {
            try {
                mediaRecorderRef.current.stop();
            } catch (e) {
                console.warn("Error stopping recording for snapshot:", e);
            }
        }
        setIsRecording(false);
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
    }

    // Pre-capture focus logic for sharper images
    try {
        if (!supportsContinuousFocusRef.current) {
            await triggerFocus();
            // Wait for focus to settle (visual blur effect duration is ~1s, but mechanism is faster)
            await new Promise(resolve => setTimeout(resolve, 600));
        } else {
            // Tiny delay to ensure hand is steady after tap
            await new Promise(resolve => setTimeout(resolve, 150));
        }
    } catch (e) {
        console.warn("Pre-capture focus failed", e);
    }

    // Trigger shutter effect
    setCaptureKey(prev => prev + 1);
    setShutterEffect(true);
    setTimeout(() => setShutterEffect(false), 200);

    const file = await captureFrame();
    isCapturingRef.current = false;

    if (file) {
        stopScan();
        setFeedback('Image captured!');
        setImageMediaType('image');
        setProductImage(file); 
    } else {
        setScanError("Failed to capture image.");
    }
  }, [setProductImage, isRecording, captureFrame, stopScan, triggerFocus]);

  const stopRecording = useCallback(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          try {
            mediaRecorderRef.current.stop();
          } catch (e) {
              console.warn("Error stopping recording:", e);
          }
      }
      // Always reset state
      setIsRecording(false);
      if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
      }
  }, [isRecording]);

  const startRecording = useCallback(() => {
      if (!streamRef.current) {
          setScanError("Camera stream is not ready.");
          return;
      }
      
      setScanError(null); // Clear previous errors
      recordedChunksRef.current = [];
      
      // Robust MIME type selection
      let mimeType = '';
      const candidates = [
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
          'video/mp4'
      ];

      for (const type of candidates) {
          if (MediaRecorder.isTypeSupported(type)) {
              mimeType = type;
              break;
          }
      }

      if (!mimeType) {
           // Fallback: trust browser default or generic types
           if (MediaRecorder.isTypeSupported('video/mp4')) mimeType = 'video/mp4';
           else if (MediaRecorder.isTypeSupported('video/webm')) mimeType = 'video/webm';
      }

      if (!mimeType) {
          setScanError("Video recording is not supported by this browser. Please try uploading a video.");
          return;
      }

      try {
          // Use a restricted bitrate to ensure the resulting file is small enough for API inline data (approx 2.5Mbps)
          const options: MediaRecorderOptions = { 
              mimeType,
              bitsPerSecond: 2500000 
          };
          
          const recorder = new MediaRecorder(streamRef.current, options);
          
          recorder.onerror = (event: any) => {
              console.error("MediaRecorder error:", event.error);
              setScanError(`Recording stopped: ${event.error?.message || 'Unknown error'}`);
              // Clean up safely
              if (recorder.state !== 'inactive') {
                  try { recorder.stop(); } catch(e) {}
              }
              setIsRecording(false);
              if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
              }
          };

          recorder.ondataavailable = (event) => {
              if (event.data && event.data.size > 0) {
                  recordedChunksRef.current.push(event.data);
              }
          };

          recorder.onstop = () => {
              // Ensure the callback is valid (might be nullified by captureImage)
              if (!mediaRecorderRef.current || mediaRecorderRef.current !== recorder) return;

              const blob = new Blob(recordedChunksRef.current, { type: mimeType });
              if (blob.size === 0) return;

              const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
              const file = new File([blob], `product-video.${ext}`, { type: mimeType });
              stopScan();
              setFeedback('Video captured!');
              setImageMediaType('video');
              setProductImage(file);
          };

          recorder.start();
          mediaRecorderRef.current = recorder;
          setIsRecording(true);
          setRecordingTime(0);
          
          recordingTimerRef.current = window.setInterval(() => {
              setRecordingTime(prev => prev + 1);
          }, 1000);

      } catch (e: any) {
          console.error("Failed to start recording", e);
          let msg = "Video recording failed to start.";
          if (e.name === 'NotSupportedError') {
              msg = "The selected video format is not supported by your device.";
          } else if (e.name === 'SecurityError') {
              msg = "Permission to record was denied by the browser.";
          } else if (e.name === 'InvalidStateError') {
              msg = "Camera is not in a valid state to record.";
          } else if (e.message) {
              msg = `Recording error: ${e.message}`;
          }
          setScanError(msg);
          setIsRecording(false);
      }
  }, [setProductImage, stopScan]);

  const toggleRecording = () => {
      if (isRecording) {
          stopRecording();
      } else {
          startRecording();
      }
  };

  // Auto-stop recording after duration limit
  useEffect(() => {
      if (isRecording && recordingTime >= MAX_RECORDING_DURATION) {
          stopRecording();
      }
  }, [recordingTime, isRecording, stopRecording]);

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const processQrCode = useCallback(async (url: string) => {
    // Only process codes in photo mode, and prevent duplicate processing
    if (scanModeRef.current === 'video' || isRecordingRef.current || isProcessingCodeRef.current || isCapturingRef.current) return;

    isProcessingCodeRef.current = true;
    setFeedback('Code detected...');
    
    try {
        // 1. Check if it is a URL
        if (url.startsWith('http')) {
            setFeedback('Link detected. Verifying content...');
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}.`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.startsWith('image/')) {
                throw new Error('Link is not a direct image.');
            }

            const blob = await response.blob();
            const fileName = url.substring(url.lastIndexOf('/') + 1) || 'product-from-qr.jpg';
            const imageFile = new File([blob], fileName, { type: blob.type });

            stopScan(); // Safe to stop now
            setImageMediaType('image');
            setProductImage(imageFile);
            setFeedback('Success! Image loaded from link.');
            setTimeout(() => setFeedback(null), 2500);
        } else {
            // 2. It's a barcode number (EAN/UPC) or text
            if (onBarcodeDetected) {
                onBarcodeDetected(url);
            }
            
            let onlineFile: File | null = null;

            // Attempt to fetch image from OpenFoodFacts/OpenBeautyFacts if it's a number
            if (/^\d+$/.test(url)) {
                setFeedback('Barcode detected. Searching product databases...');
                try {
                    const apis = [
                        `https://world.openfoodfacts.org/api/v0/product/${url}.json`,
                        `https://world.openbeautyfacts.org/api/v0/product/${url}.json`
                    ];

                    for (const api of apis) {
                        try {
                            const res = await fetch(api);
                            if (res.ok) {
                                const data = await res.json();
                                if (data.status === 1 && data.product && data.product.image_url) {
                                    const imgRes = await fetch(data.product.image_url);
                                    if (imgRes.ok) {
                                        const blob = await imgRes.blob();
                                        onlineFile = new File([blob], `product-${url}.jpg`, { type: blob.type });
                                        break; // Found it, stop searching
                                    }
                                }
                            }
                        } catch (e) {
                            // Continue to next API
                        }
                    }
                } catch (err) {
                    console.warn("Online lookup failed", err);
                }
            }
            
            // Check if we found an online image
            if (onlineFile) {
                stopScan();
                setImageMediaType('image');
                setProductImage(onlineFile);
                setFeedback('Product matched online!');
                setTimeout(() => setFeedback(null), 3000);
            } else {
                // Fallback: Capture frame
                if (/^\d+$/.test(url)) {
                    setFeedback('Online image not found. Capturing camera view...');
                } else {
                    setFeedback('Processing scan...');
                }
                
                const file = await captureFrame();
                stopScan(); // Now safe to stop

                if (file) {
                    setImageMediaType('image');
                    setProductImage(file);
                    setFeedback('Scan complete! Ready to analyze.');
                    setTimeout(() => setFeedback(null), 3000);
                } else {
                    setScanError('Barcode detected, but failed to capture image.');
                }
            }
        }
    } catch (error) {
        console.log("Code processing fallback:", error);
        setFeedback('Processing fallback. Capturing camera view...');
        
        // Fallback: If URL fetch fails or it's just text, capture the frame
        if (onBarcodeDetected) onBarcodeDetected(url);
        
        const file = await captureFrame();
        stopScan();

        if (file) {
             setImageMediaType('image');
             setProductImage(file);
             setFeedback('Captured! Ready to analyze.');
        } else {
             setScanError('Could not capture product image.');
             setProductImage(null);
        }
    }
  }, [setProductImage, stopScan, onBarcodeDetected, captureFrame]);

  const scanFrame = useCallback(async () => {
    if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const now = Date.now();
    
    // Proactive Auto-Refocus:
    // If in photo mode (not video recording), and we haven't focused recently (e.g. 4s),
    // trigger a focus to ensure the image remains sharp.
    // CRITICAL: Only do this if the hardware DOES NOT support continuous focus AND we aren't currently capturing.
    // If it does support continuous focus, we let the hardware handle it to avoid "breathing".
    if (scanModeRef.current === 'photo' && 
        !isRecordingRef.current && 
        !isCapturingRef.current &&
        !supportsContinuousFocusRef.current && 
        (now - lastFocusTimeRef.current > 4000)) {
         triggerFocus();
    }

    if (barcodeDetectorRef.current && !isCapturingRef.current) {
      try {
        const barcodes = await barcodeDetectorRef.current.detect(videoRef.current);
        if (barcodes.length > 0 && barcodes[0].rawValue) {
          processQrCode(barcodes[0].rawValue);
          return;
        }
      } catch (e) {
        // Silently fail on detection errors per frame
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [processQrCode, triggerFocus]);
  
  const applyZoom = useCallback(async (newZoom: number) => {
      if (!streamRef.current) return;
      try {
          const videoTrack = streamRef.current.getVideoTracks()[0];
          if (videoTrack) {
               await videoTrack.applyConstraints({ advanced: [{ zoom: newZoom }] } as any);
          }
      } catch (error) {
          console.warn("Failed to apply zoom:", error);
      }
  }, []);
  
  const applyExposure = useCallback(async (newExposure: number) => {
      if (!streamRef.current) return;
      try {
          const videoTrack = streamRef.current.getVideoTracks()[0];
          if (videoTrack) {
               await videoTrack.applyConstraints({ advanced: [{ exposureCompensation: newExposure }] } as any);
          }
      } catch (error) {
          console.warn("Failed to apply exposure:", error);
      }
  }, []);

  const toggleFlash = useCallback(async (forceState?: boolean) => {
      if (!streamRef.current) return;
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (!videoTrack) return;
      
      try {
          const newState = forceState !== undefined ? forceState : !isFlashOn;
          // If manually toggling, disable auto flash
          if (forceState === undefined) {
              setIsAutoFlash(false);
          }
          
          await videoTrack.applyConstraints({ advanced: [{ torch: newState }] } as any);
          setIsFlashOn(newState);
          isFlashOnRef.current = newState;
      } catch (error) {
          console.warn("Failed to toggle flash:", error);
      }
  }, [isFlashOn]);

  const toggleAutoFlash = () => {
      const newAutoState = !isAutoFlash;
      setIsAutoFlash(newAutoState);
      // If turning auto-flash off, ensure torch is off
      if (!newAutoState && isFlashOn) {
          toggleFlash(false);
      }
  };

  // Tap to focus functionality
  const handleTapToFocus = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isCapturingRef.current) return; // Ignore taps during capture

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    triggerFocus({x, y});
  }, [triggerFocus]);

  // Pinch to Zoom functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && zoomSupport) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      pinchStartDistanceRef.current = distance;
      pinchStartZoomRef.current = zoomLevel;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && zoomSupport && pinchStartDistanceRef.current !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      
      const range = zoomSupport.max - zoomSupport.min;
      const distChange = distance - pinchStartDistanceRef.current;
      
      // Sensitivity calculation
      const sensitivity = 0.005 * (range || 1); 
      let newZoom = pinchStartZoomRef.current + (distChange * sensitivity);
      
      newZoom = Math.max(zoomSupport.min, Math.min(newZoom, zoomSupport.max));
      
      setZoomLevel(newZoom);
      applyZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    pinchStartDistanceRef.current = null;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const newZoom = parseFloat(e.target.value);
     setZoomLevel(newZoom);
     applyZoom(newZoom);
  };
  
  const handleExposureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVal = parseFloat(e.target.value);
      setExposureValue(newVal);
      applyExposure(newVal);
  };

  const handleZoomIn = () => {
      if (!zoomSupport) return;
      const step = zoomSupport.step || 0.1;
      const newZoom = Math.min(zoomLevel + step, zoomSupport.max);
      setZoomLevel(newZoom);
      applyZoom(newZoom);
  };

  const handleZoomOut = () => {
      if (!zoomSupport) return;
      const step = zoomSupport.step || 0.1;
      const newZoom = Math.max(zoomLevel - step, zoomSupport.min);
      setZoomLevel(newZoom);
      applyZoom(newZoom);
  };

  // AI Image Editing Handlers
  const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editPrompt.trim() || !productImage) return;

      setIsGeneratingEdit(true);
      try {
          const result = await editProductImage(productImage, editPrompt);
          setEditedImagePreview(result);
      } catch (err) {
          console.error(err);
          setFeedback("Failed to edit image.");
          setTimeout(() => setFeedback(null), 3000);
      } finally {
          setIsGeneratingEdit(false);
      }
  };

  const handleApplyEdit = () => {
      if (editedImagePreview) {
          const file = dataURLtoFile(editedImagePreview, "edited-image.png");
          setProductImage(file);
          setImagePreview(editedImagePreview); // Explicitly set preview to avoid flicker
          setIsEditingMode(false);
          setEditedImagePreview(null);
          setEditPrompt('');
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

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScanError("Camera is not supported by your browser.");
      return;
    }

    setFeedback(null);
    setIsScanning(true);
    setIsFlashOn(false); 
    isFlashOnRef.current = false;
    setIsAutoFlash(false);

    try {
      // Initialize BarcodeDetector with product code formats if supported
      if ('BarcodeDetector' in window && !barcodeDetectorRef.current) {
         try {
            const formats = ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e'];
            if (typeof (window as any).BarcodeDetector.getSupportedFormats === 'function') {
                const supported = await (window as any).BarcodeDetector.getSupportedFormats();
                const validFormats = formats.filter(f => supported.includes(f));
                if (validFormats.length > 0) {
                    barcodeDetectorRef.current = new (window as any).BarcodeDetector({ formats: validFormats });
                }
            } else {
                barcodeDetectorRef.current = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
            }
         } catch (e) {
             console.log("BarcodeDetector not supported or failed to init", e);
         }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
          } 
      });
      streamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as any;

        if (capabilities.zoom) {
            setZoomSupport(capabilities.zoom);
            setZoomLevel(capabilities.zoom.min);
        } else {
            setZoomSupport(null);
        }
        
        if (capabilities.exposureCompensation) {
            setExposureSupport(capabilities.exposureCompensation);
            setExposureValue(0); // Usually defaults to 0
        } else {
            setExposureSupport(null);
        }
        
        if (capabilities.torch) {
            setFlashSupport(true);
        } else {
            setFlashSupport(false);
        }

        const applyConstraintSafe = async (constraint: any) => {
            try {
                await videoTrack.applyConstraints({ advanced: [constraint] });
            } catch (error) {
                console.warn("Failed to apply constraint:", constraint, error);
            }
        };

        // Detect Focus Capabilities
        if (capabilities.focusMode && Array.isArray(capabilities.focusMode)) {
            const hasContinuous = capabilities.focusMode.includes('continuous');
            setSupportsContinuousFocus(hasContinuous);
            supportsContinuousFocusRef.current = hasContinuous;

            if (hasContinuous) {
                await applyConstraintSafe({ focusMode: 'continuous' });
            } else if (capabilities.focusMode.includes('auto')) {
                await applyConstraintSafe({ focusMode: 'auto' });
            }
        } else {
            setSupportsContinuousFocus(false);
            supportsContinuousFocusRef.current = false;
        }

        if (capabilities.exposureMode && Array.isArray(capabilities.exposureMode) && capabilities.exposureMode.includes('continuous')) {
             await applyConstraintSafe({ exposureMode: 'continuous' });
        }

        if (capabilities.whiteBalanceMode && Array.isArray(capabilities.whiteBalanceMode) && capabilities.whiteBalanceMode.includes('continuous')) {
            await applyConstraintSafe({ whiteBalanceMode: 'continuous' });
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(err => {
              console.error("Video play failed:", err);
              setScanError("Could not start camera view.");
              stopScan();
            });
            animationFrameRef.current = requestAnimationFrame(scanFrame);
          }
        };
        videoRef.current.onerror = () => {
            setScanError("An error occurred with the camera stream.");
            stopScan();
        }
      }
    } catch (error) {
      console.error("Camera access error:", error);
      if (error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError")) {
        setScanError("Camera permission denied. Please allow camera access in your browser settings.");
      } else {
        setScanError("Could not access camera. Is it being used by another app?");
      }
      setIsScanning(false);
    }
  }, [isScanning, scanFrame, stopScan]);

  // Scene Monitor (Auto-Flash & Auto-Focus)
  useEffect(() => {
    if (!isScanning || !videoRef.current) return;

    let lastBrightness = -1;

    const intervalId = setInterval(() => {
        if (!videoRef.current || videoRef.current.paused) return;

        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(videoRef.current, 0, 0, 64, 64);
        const imageData = ctx.getImageData(0, 0, 64, 64);
        const data = imageData.data;
        let totalBrightness = 0;

        for (let i = 0; i < data.length; i += 4) {
            totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }

        const avgBrightness = totalBrightness / (data.length / 4);

        // Auto-Flash Logic
        if (isAutoFlash) {
            if (!isFlashOnRef.current && avgBrightness < 50) {
                 toggleFlash(true);
            } else if (isFlashOnRef.current && avgBrightness > 180) {
                 toggleFlash(false);
            }
        }
        
        // Auto-Focus Logic (Trigger on significant scene/brightness change)
        // We ONLY trigger manual autofocus on lighting changes if the device DOES NOT support continuous focus.
        // If continuous focus is supported, we let the hardware handle it to avoid fighting the driver.
        if (!supportsContinuousFocusRef.current && !isCapturingRef.current && lastBrightness !== -1 && Math.abs(avgBrightness - lastBrightness) > 8) {
             triggerFocus();
        }
        lastBrightness = avgBrightness;

    }, 500); // Faster check interval for responsiveness

    return () => clearInterval(intervalId);
  }, [isScanning, isAutoFlash, toggleFlash, triggerFocus]);


  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setScanError(null);
    const file = event.target.files?.[0];
    if (file) {
        if (file.type.startsWith('image/')) {
            setImageMediaType('image');
            setProductImage(file);
        } else if (file.type.startsWith('video/')) {
            setImageMediaType('video');
            setProductImage(file);
        } else {
            setScanError("Please select a valid image or video file.");
            setProductImage(null);
        }
    }
  }, [setProductImage]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  useEffect(() => {
    return () => {
      stopScan();
    };
  }, [stopScan]);

  useEffect(() => {
    if (productImage) {
      stopScan();
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(productImage);
    } else {
      setImagePreview(null);
      // Reset edit state when image is cleared
      setIsEditingMode(false);
      setEditedImagePreview(null);
      setEditPrompt('');
    }
  }, [productImage, stopScan]);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-brand-gray-dark dark:text-white flex items-center">
            {scanMode === 'photo' ? <CameraIcon className="h-6 w-6 mr-2 text-brand-green" /> : <VideoCameraIcon className="h-6 w-6 mr-2 text-brand-green" />}
            {productImage ? (imageMediaType === 'video' ? 'Review Video' : (isEditingMode ? 'Edit Image' : 'Review Image')) : (scanMode === 'photo' ? 'Scan Product' : 'Record Video')}
        </h2>
        <div className="flex space-x-2">
           {!productImage && isScanning && !isRecording && (
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button 
                    onClick={() => setScanMode('photo')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${scanMode === 'photo' ? 'bg-white dark:bg-gray-600 text-brand-green shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                  >
                      Photo
                  </button>
                  <button 
                    onClick={() => setScanMode('video')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${scanMode === 'video' ? 'bg-white dark:bg-gray-600 text-brand-green shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                  >
                      Video
                  </button>
              </div>
           )}
        </div>
      </div>

      <div className="relative aspect-[4/3] w-full max-w-xl mx-auto bg-black rounded-xl overflow-hidden shadow-inner group">
        {!isScanning && !productImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
             <QrCodeIcon className="h-20 w-20 text-gray-600 dark:text-gray-400 mb-4" />
             <button
              onClick={startScan}
              className="px-6 py-3 bg-brand-green text-white font-bold rounded-full shadow-lg hover:bg-brand-green-dark transition-all transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-brand-green/30"
            >
              Start Camera
            </button>
             <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Or upload from your device below</p>
          </div>
        )}

        {isScanning && (
          <div 
            className="relative h-full w-full cursor-pointer touch-none" 
            onClick={handleTapToFocus}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <video
              ref={videoRef}
              className={`h-full w-full object-cover transition-all duration-300 ${isFocusing ? 'blur-[1px]' : ''}`}
              muted
              playsInline
            />
            
            {/* Scanning Overlay */}
            <div className="absolute inset-0 border-[30px] border-black/40 dark:border-black/60 pointer-events-none">
                <div className="absolute inset-0 border-2 border-white/30"></div>
                
                {/* Focus Reticle */}
                {showFocusReticle && (
                    <div 
                        className="absolute w-16 h-16 border-2 border-yellow-400 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-ping-once transition-opacity duration-200"
                        style={{ top: `${reticlePosition.y}%`, left: `${reticlePosition.x}%` }}
                    >
                       {isFocusing && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-yellow-400 uppercase tracking-widest bg-black/50 px-2 rounded">Focusing</div>}
                    </div>
                )}
            </div>
             
            {/* Flash Toggle Button */}
            {flashSupport && (
                <button 
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent focus tap
                        toggleFlash();
                    }}
                    className={`absolute top-4 left-4 p-2 rounded-full backdrop-blur-md transition-all duration-200 z-20 ${
                        isFlashOn 
                        ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50' 
                        : 'bg-black/40 text-white border border-white/10 hover:bg-black/60'
                    }`}
                    aria-label={isFlashOn ? "Turn Flash Off" : "Turn Flash On"}
                >
                    {isFlashOn ? <BoltIcon className="h-6 w-6" /> : <BoltSlashIcon className="h-6 w-6" />}
                </button>
            )}

            {/* Zoom Indicator Overlay */}
            {zoomSupport && (
                 <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black/60 text-white text-xs font-bold rounded-full backdrop-blur-sm pointer-events-none transition-opacity duration-200 z-20">
                     {zoomLevel.toFixed(1)}x
                 </div>
            )}
            
            {/* AF Status Indicator */}
            {isScanning && (
                <div className="absolute top-4 right-4 px-2 py-1 bg-black/40 rounded text-xs text-white font-mono backdrop-blur-md border border-white/10 pointer-events-none select-none z-20 flex items-center gap-1">
                    {supportsContinuousFocus ? 'AF-C' : 'AF-S'}
                </div>
            )}
            
            {scanMode === 'photo' && (
                 <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-scan-line pointer-events-none"></div>
            )}

            {isRecording && (
                <div className="absolute top-4 right-16 flex items-center space-x-2 bg-red-600/80 text-white px-3 py-1 rounded-full backdrop-blur-md animate-pulse z-20">
                    <div className="h-2 w-2 bg-white rounded-full"></div>
                    <span className="text-xs font-bold font-mono">{formatTime(recordingTime)}</span>
                </div>
            )}
            
            {/* Shutter Flash Effect */}
            {shutterEffect && (
                <div key={captureKey} className="absolute inset-0 bg-white animate-flash pointer-events-none z-50"></div>
            )}
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
                onClick={() => {
                    setProductImage(null); 
                    startScan();
                }}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all z-20"
                title="Retake"
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

        {/* Status Toasts */}
        <div className="absolute bottom-8 left-0 w-full flex justify-center pointer-events-none z-30">
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

      {/* Controls Area */}
      <div className="mt-4 space-y-4 min-h-[60px] max-w-xl mx-auto">
         {/* Zoom Slider */}
         {isScanning && zoomSupport && (
             <div className="flex items-center space-x-3 px-2 relative pt-4">
                 <button onClick={handleZoomOut} className="p-1.5 text-gray-500 hover:text-brand-green transition-colors">
                     <MagnifyingGlassMinusIcon className="h-5 w-5" />
                 </button>
                 <div className="flex-grow relative h-8 flex items-center">
                     <input 
                        type="range" 
                        min={zoomSupport.min} 
                        max={zoomSupport.max} 
                        step={zoomSupport.step || 0.1}
                        value={zoomLevel}
                        onChange={handleSliderChange}
                        className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-green"
                     />
                 </div>
                  <button onClick={handleZoomIn} className="p-1.5 text-gray-500 hover:text-brand-green transition-colors">
                     <MagnifyingGlassPlusIcon className="h-5 w-5" />
                  </button>
             </div>
         )}

         {/* Exposure Slider */}
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
                        onChange={handleExposureChange}
                        className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-green"
                     />
                 </div>
                 <div className="text-xs w-8 text-right font-mono text-gray-500 dark:text-gray-400">
                    {exposureValue > 0 ? '+' : ''}{exposureValue.toFixed(1)}
                 </div>
             </div>
         )}
        
         {/* Image Editing Controls */}
         {productImage && imageMediaType === 'image' && isEditingMode && (
             <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-xl animate-fade-in">
                {!editedImagePreview ? (
                    <form onSubmit={handleEditSubmit} className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">AI Edit Prompt</label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                placeholder="e.g., Add a retro filter, remove background"
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
                        <button 
                            type="button"
                            onClick={() => setIsEditingMode(false)}
                            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-1 self-start"
                        >
                            Cancel
                        </button>
                    </form>
                ) : (
                    <div className="flex justify-between items-center">
                         <p className="text-sm text-gray-700 dark:text-gray-200">Use this image?</p>
                         <div className="flex gap-2">
                            <button 
                                onClick={() => setEditedImagePreview(null)}
                                className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50"
                            >
                                Undo
                            </button>
                            <button 
                                onClick={handleApplyEdit}
                                className="px-3 py-1.5 text-sm font-bold text-white bg-brand-green rounded-lg hover:bg-brand-green-dark"
                            >
                                Apply
                            </button>
                         </div>
                    </div>
                )}
             </div>
         )}

         {/* Analyze Button - Only visible when image captured */}
         {productImage && (
             <div className="space-y-3">
                <button
                    onClick={onAnalyze}
                    disabled={isLoading || isGeneratingEdit}
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center transition-all transform active:scale-95 ${
                        isLoading || isGeneratingEdit
                        ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500' 
                        : 'bg-brand-green text-white hover:bg-brand-green-dark hover:-translate-y-1'
                    }`}
                >
                    {isLoading ? (
                        <>
                            <Spinner className="w-6 h-6 mr-3 text-current" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="w-6 h-6 mr-2" />
                            Analyze Product
                        </>
                    )}
                </button>

                {imageMediaType === 'image' && !isEditingMode && (
                    <button
                        onClick={() => setIsEditingMode(true)}
                        className="w-full py-2 text-sm font-semibold text-brand-green dark:text-brand-green-light hover:bg-brand-green/10 dark:hover:bg-brand-green/20 rounded-lg transition-colors"
                    >
                        ✨ AI Magic Edit
                    </button>
                )}
            </div>
         )}

         {/* Manual Capture / Upload options when not scanning or reviewing */}
         {!isScanning && !productImage && (
             <div className="text-center">
                 <button 
                    onClick={handleUploadClick}
                    className="text-sm text-brand-gray dark:text-gray-400 hover:text-brand-green underline underline-offset-4"
                 >
                    Upload a photo or video instead
                 </button>
             </div>
         )}
         
         {/* Manual Shutter Button for Photo Mode */}
         {isScanning && scanMode === 'photo' && !isRecording && (
             <div className="flex justify-center pt-4 relative group">
                 <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-40">
                    <div className="bg-black/80 text-white text-xs font-medium px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-lg whitespace-nowrap">
                        Capture Photo
                    </div>
                    <div className="w-2 h-2 bg-black/80 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                 </div>
                 <button 
                    onClick={captureImage}
                    className="h-20 w-20 bg-white dark:bg-gray-700 rounded-full border-[6px] border-gray-200 dark:border-gray-600 flex items-center justify-center shadow-2xl hover:shadow-brand-green/30 hover:border-brand-green dark:hover:border-brand-green transition-all duration-300 transform active:scale-95"
                    aria-label="Take Photo"
                 >
                     <div className="h-14 w-14 bg-brand-green rounded-full border-2 border-white dark:border-gray-700 shadow-inner group-hover:scale-90 transition-transform duration-300"></div>
                 </button>
             </div>
         )}

         {/* Video Recording Controls */}
         {isScanning && scanMode === 'video' && (
            <div className="flex justify-center pt-2">
                <button 
                   onClick={toggleRecording}
                   className={`h-16 w-16 rounded-full border-4 flex items-center justify-center shadow-lg active:scale-90 transition-transform ${
                       isRecording ? 'border-red-200 bg-white' : 'border-gray-200 dark:border-gray-600 bg-white'
                   }`}
                   aria-label={isRecording ? "Stop Recording" : "Start Recording"}
                >
                    <div className={`transition-all duration-300 ${
                        isRecording ? 'h-6 w-6 bg-red-600 rounded-sm' : 'h-12 w-12 bg-red-500 rounded-full'
                    }`}></div>
                </button>
            </div>
         )}

         {/* Search by Name */}
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
                             placeholder="e.g., CeraVe Cleanser, Organic Apple" 
                             value={searchQuery}
                             onChange={(e) => setSearchQuery(e.target.value)}
                             className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-green focus:outline-none transition-all"
                        />
                     </div>
                     <button 
                         type="submit"
                         disabled={!searchQuery.trim() || isLoading}
                         className="px-4 py-2 bg-brand-green/10 text-brand-green dark:text-brand-green-light font-bold rounded-xl hover:bg-brand-green hover:text-white transition-all disabled:opacity-50 text-sm"
                     >
                         Search
                     </button>
                 </form>
             </div>
         )}
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,video/*"
        className="hidden"
      />
    </div>
  );
};