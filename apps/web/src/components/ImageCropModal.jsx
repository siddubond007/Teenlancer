import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { ZoomIn, ZoomOut, Check, X, Loader2, Crop } from 'lucide-react';

export default function ImageCropModal({ 
  imageSrc, 
  aspect = 1, 
  cropShape = 'round', 
  title = 'Crop Image', 
  onCropComplete, 
  onClose 
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const onCropChange = (crop) => setCrop(crop);
  const onZoomChange = (zoom) => setZoom(zoom);

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setProcessing(true);

    try {
      const image = new Image();
      image.src = imageSrc;
      image.crossOrigin = 'anonymous';

      await new Promise((resolve) => {
        image.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.92);
      await onCropComplete(croppedBase64);
    } catch (err) {
      console.error('Error cropping image:', err);
      alert('Failed to crop image.');
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] items-center justify-center overflow-hidden overscroll-contain bg-slate-950/90 p-2 backdrop-blur-2xl sm:p-4">
      <div className="neon-border-box mx-auto flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden p-3 shadow-2xl relative space-y-4 sm:max-h-[calc(100dvh-2rem)] sm:p-8 sm:space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800 sm:items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">{title}</h3>
              <p className="text-xs text-slate-400">Drag to reposition • Use slider to zoom</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative mx-auto aspect-[16/9] w-full max-h-[46vh] overflow-hidden rounded-2xl border-2 border-slate-800 bg-slate-950 sm:aspect-auto sm:h-96 sm:max-h-none">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={cropShape}
            objectFit="cover"
            showGrid={true}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteHandler}
          />
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-3 px-1 sm:space-x-4 sm:px-2">
          <ZoomOut className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:justify-end sm:space-x-3 sm:gap-0 sm:pt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 w-full px-5 py-2.5 bg-slate-900 border border-slate-700 hover:border-white text-slate-300 hover:text-white text-xs font-black rounded-xl transition sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={processing}
            onClick={createCroppedImage}
            className="min-h-11 w-full justify-center px-6 py-2.5 neon-airflow-btn text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xl flex items-center space-x-2 sm:w-auto"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>{processing ? 'Uploading...' : 'Crop & Save Photo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
