import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Crop, Upload, X, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * Reusable image upload component with:
 *  - Live preview of selected image
 *  - Interactive crop (drag to pan, scroll to zoom) via Canvas
 *
 * Props:
 *  onFile(file: File)       – called with the cropped File object
 *  accept         (string)  – MIME types, default 'image/*'
 *  aspectRatio    (number)  – crop aspect ratio, e.g. 1 for square, 16/9, null for free
 *  label          (string)  – upload button label
 *  previewUrl     (string)  – existing image URL to show before any file is chosen
 *  disabled       (boolean)
 *  className      (string)  – extra wrapper classes
 *  previewClass   (string)  – extra preview container classes
 *  children                 – slot rendered inside the drop zone button (overrides label)
 */
export function ImageUploadCrop({
    onFile,
    accept = 'image/*',
    aspectRatio = null,
    label = 'Upload Image',
    previewUrl = '',
    disabled = false,
    className = '',
    previewClass = '',
    children,
}) {
    const [localPreview, setLocalPreview] = useState('');
    const [cropOpen, setCropOpen] = useState(false);
    const [rawDataUrl, setRawDataUrl] = useState('');
    const inputRef = useRef(null);

    // Sync external previewUrl into local state only when we have no local pick yet
    useEffect(() => {
        if (!localPreview && previewUrl) {
            setLocalPreview(previewUrl);
        }
    }, [previewUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        const reader = new FileReader();
        reader.onload = (ev) => {
            setRawDataUrl(ev.target.result);
            setCropOpen(true);
        };
        reader.readAsDataURL(file);
    };

    const handleCropDone = useCallback((croppedDataUrl) => {
        setLocalPreview(croppedDataUrl);
        setCropOpen(false);

        // Convert data-url → File
        fetch(croppedDataUrl)
            .then((r) => r.blob())
            .then((blob) => {
                const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
                onFile(file);
            });
    }, [onFile]);

    const handleCropCancel = () => {
        setCropOpen(false);
        setRawDataUrl('');
    };

    const displaySrc = localPreview || previewUrl;

    return (
        <>
            <div className={`flex flex-col gap-3 ${className}`}>
                {/* Live Preview */}
                {displaySrc && (
                    <div
                        className={`relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-gray-50 shadow-sm transition-all duration-300 ${previewClass}`}
                        style={{ minHeight: '120px' }}
                    >
                        <img
                            src={displaySrc}
                            alt="Preview"
                            className="h-full w-full object-contain"
                        />
                        {/* Re-crop button */}
                        {localPreview && !disabled && (
                            <button
                                type="button"
                                onClick={() => { setRawDataUrl(localPreview); setCropOpen(true); }}
                                title="Re-crop image"
                                className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-primary-dark shadow-md backdrop-blur-sm transition-all hover:bg-primary hover:text-white"
                            >
                                <Crop size={13} />
                                Crop
                            </button>
                        )}
                    </div>
                )}

                {/* Drop-zone / Upload button */}
                <label
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-3.5 text-sm font-semibold transition-all ${
                        disabled
                            ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300'
                            : displaySrc
                                ? 'border-primary/40 bg-primary-light/30 text-primary-dark hover:border-primary hover:bg-primary-light/60'
                                : 'border-gray-300 bg-white text-gray-500 hover:border-primary hover:bg-primary-light/40 hover:text-primary-dark'
                    }`}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept={accept}
                        disabled={disabled}
                        onChange={handleFileChange}
                        className="sr-only"
                    />
                    {children ?? (
                        <>
                            <Upload size={16} />
                            {displaySrc ? 'Change Image' : label}
                        </>
                    )}
                </label>
            </div>

            {/* Crop Modal */}
            {cropOpen && rawDataUrl && (
                <CropModal
                    src={rawDataUrl}
                    aspectRatio={aspectRatio}
                    onDone={handleCropDone}
                    onCancel={handleCropCancel}
                />
            )}
        </>
    );
}

/* ─────────────────────────── Crop Modal ─────────────────────────── */

function CropModal({ src, aspectRatio, onDone, onCancel }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Image natural dimensions
    const imgRef = useRef(null);
    const [imgLoaded, setImgLoaded] = useState(false);

    // Crop box state (percentage of container)
    const [cropBox, setCropBox] = useState({ x: 10, y: 10, w: 80, h: 80 });

    // Pan state for the crop handle drag
    const dragState = useRef(null); // { handle, startX, startY, startBox }

    const containerSize = { w: 560, h: 420 };

    // Load image and compute initial crop box
    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            imgRef.current = img;
            setImgLoaded(true);

            // Set initial crop box respecting aspect ratio
            if (aspectRatio) {
                const containerAspect = containerSize.w / containerSize.h;
                let w = 80;
                let h = (w * containerSize.w) / (aspectRatio * containerSize.h);
                if (h > 80) { h = 80; w = (h * aspectRatio * containerSize.h) / containerSize.w; }
                const x = (100 - w) / 2;
                const y = (100 - h) / 2;
                setCropBox({ x, y, w, h });
            } else {
                setCropBox({ x: 10, y: 10, w: 80, h: 80 });
            }
        };
        img.src = src;
    }, [src, aspectRatio]); // eslint-disable-line react-hooks/exhaustive-deps

    // Draw canvas whenever cropBox / img changes
    useEffect(() => {
        if (!imgLoaded || !canvasRef.current || !imgRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const { w: CW, h: CH } = containerSize;
        canvas.width = CW;
        canvas.height = CH;

        const img = imgRef.current;
        // Fit image inside container
        const scale = Math.min(CW / img.naturalWidth, CH / img.naturalHeight);
        const iw = img.naturalWidth * scale;
        const ih = img.naturalHeight * scale;
        const ix = (CW - iw) / 2;
        const iy = (CH - ih) / 2;

        // Draw image
        ctx.clearRect(0, 0, CW, CH);
        ctx.drawImage(img, ix, iy, iw, ih);

        // Overlay
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, CW, CH);

        // Clear crop area
        const bx = (cropBox.x / 100) * CW;
        const by = (cropBox.y / 100) * CH;
        const bw = (cropBox.w / 100) * CW;
        const bh = (cropBox.h / 100) * CH;
        ctx.clearRect(bx, by, bw, bh);
        ctx.drawImage(img, ix, iy, iw, ih); // redraw inside crop
        ctx.clearRect(bx, by, bw, bh);
        ctx.drawImage(img, ix, iy, iw, ih);

        // Crop border
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);

        // Rule-of-thirds grid
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
            ctx.beginPath(); ctx.moveTo(bx + (bw / 3) * i, by); ctx.lineTo(bx + (bw / 3) * i, by + bh); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(bx, by + (bh / 3) * i); ctx.lineTo(bx + bw, by + (bh / 3) * i); ctx.stroke();
        }

        // Corner handles
        const hSize = 10;
        ctx.fillStyle = '#fff';
        [[bx, by], [bx + bw - hSize, by], [bx, by + bh - hSize], [bx + bw - hSize, by + bh - hSize]].forEach(([hx, hy]) => {
            ctx.fillRect(hx, hy, hSize, hSize);
        });
    }, [imgLoaded, cropBox]); // eslint-disable-line react-hooks/exhaustive-deps

    // Pointer events on canvas
    const getHandle = useCallback((px, py) => {
        const { w: CW, h: CH } = containerSize;
        const bx = (cropBox.x / 100) * CW;
        const by = (cropBox.y / 100) * CH;
        const bw = (cropBox.w / 100) * CW;
        const bh = (cropBox.h / 100) * CH;
        const threshold = 16;

        const near = (a, b) => Math.abs(a - b) < threshold;
        if (near(px, bx) && near(py, by)) return 'nw';
        if (near(px, bx + bw) && near(py, by)) return 'ne';
        if (near(px, bx) && near(py, by + bh)) return 'sw';
        if (near(px, bx + bw) && near(py, by + bh)) return 'se';
        if (px > bx && px < bx + bw && py > by && py < by + bh) return 'move';
        return null;
    }, [cropBox]);

    const onPointerDown = useCallback((e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = containerSize.w / rect.width;
        const scaleY = containerSize.h / rect.height;
        const px = (e.clientX - rect.left) * scaleX;
        const py = (e.clientY - rect.top) * scaleY;
        const handle = getHandle(px, py);
        if (!handle) return;

        dragState.current = { handle, startX: px, startY: py, startBox: { ...cropBox } };
        e.currentTarget.setPointerCapture(e.pointerId);
    }, [cropBox, getHandle]);

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    const onPointerMove = useCallback((e) => {
        if (!dragState.current) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = containerSize.w / rect.width;
        const scaleY = containerSize.h / rect.height;
        const px = (e.clientX - rect.left) * scaleX;
        const py = (e.clientY - rect.top) * scaleY;

        const { handle, startX, startY, startBox } = dragState.current;
        const dx = ((px - startX) / containerSize.w) * 100;
        const dy = ((py - startY) / containerSize.h) * 100;

        setCropBox((prev) => {
            let { x, y, w, h } = startBox;
            const minSize = 10;

            if (handle === 'move') {
                x = clamp(x + dx, 0, 100 - w);
                y = clamp(y + dy, 0, 100 - h);
            } else {
                if (handle === 'nw') {
                    const nx = clamp(x + dx, 0, x + w - minSize);
                    const ny = clamp(y + dy, 0, y + h - minSize);
                    w += x - nx; h += y - ny; x = nx; y = ny;
                } else if (handle === 'ne') {
                    const ny = clamp(y + dy, 0, y + h - minSize);
                    w = clamp(w + dx, minSize, 100 - x);
                    h += y - ny; y = ny;
                } else if (handle === 'sw') {
                    const nx = clamp(x + dx, 0, x + w - minSize);
                    w += x - nx; x = nx;
                    h = clamp(h + dy, minSize, 100 - y);
                } else if (handle === 'se') {
                    w = clamp(w + dx, minSize, 100 - x);
                    h = clamp(h + dy, minSize, 100 - y);
                }

                if (aspectRatio) {
                    const containerAspect = containerSize.w / containerSize.h;
                    const targetH = (w / aspectRatio) * containerAspect;
                    h = clamp(targetH, minSize, 100 - y);
                    if (handle === 'nw' || handle === 'sw') {
                        // keep bottom/top fixed when adjusting from left
                    }
                }
            }

            return { x, y, w: clamp(w, minSize, 100 - x), h: clamp(h, minSize, 100 - y) };
        });
    }, [aspectRatio]);

    const onPointerUp = useCallback(() => {
        dragState.current = null;
    }, []);

    const handleApply = useCallback(() => {
        if (!imgRef.current) return;
        const img = imgRef.current;
        const { w: CW, h: CH } = containerSize;

        const scale = Math.min(CW / img.naturalWidth, CH / img.naturalHeight);
        const iw = img.naturalWidth * scale;
        const ih = img.naturalHeight * scale;
        const ix = (CW - iw) / 2;
        const iy = (CH - ih) / 2;

        const bx = (cropBox.x / 100) * CW;
        const by = (cropBox.y / 100) * CH;
        const bw = (cropBox.w / 100) * CW;
        const bh = (cropBox.h / 100) * CH;

        // Map crop box back to image natural coords
        const srcX = Math.max(0, (bx - ix) / scale);
        const srcY = Math.max(0, (by - iy) / scale);
        const srcW = Math.min(img.naturalWidth - srcX, bw / scale);
        const srcH = Math.min(img.naturalHeight - srcY, bh / scale);

        const out = document.createElement('canvas');
        out.width = Math.round(srcW);
        out.height = Math.round(srcH);
        const ctx = out.getContext('2d');
        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, out.width, out.height);

        onDone(out.toDataURL('image/jpeg', 0.92));
    }, [cropBox, onDone]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <div>
                        <h3 className="font-display text-lg font-extrabold text-primary-dark">Crop Image</h3>
                        <p className="mt-0.5 text-xs text-gray-400">Drag corners or the selection to adjust. Click Apply when done.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600"
                    >
                        <X size={17} />
                    </button>
                </div>

                {/* Canvas */}
                <div className="relative bg-gray-900" style={{ height: '420px' }}>
                    {!imgLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
                        </div>
                    )}
                    <canvas
                        ref={canvasRef}
                        className="h-full w-full touch-none"
                        style={{ cursor: 'crosshair', display: imgLoaded ? 'block' : 'none' }}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                    />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
                    <p className="text-xs text-gray-400">
                        {aspectRatio ? `Fixed ratio ${aspectRatio === 1 ? '1:1' : aspectRatio.toFixed(2)}` : 'Free crop'}
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleApply}
                            disabled={!imgLoaded}
                            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white transition-all hover:bg-primary-dark disabled:opacity-50"
                        >
                            <Check size={15} />
                            Apply Crop
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
