import { useState, useCallback } from 'react';
import { useOCR } from '../providers/OCRContext';
import { parseReceiptText } from '../lib/ocrParser';

export function useReceiptOCR() {
  const { ocrState, recognizeImage } = useOCR();
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrError, setOcrError] = useState(null);

  /**
   * Helper to load a File object into an Image element.
   */
  const loadImage = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      
      img.src = url;
    });
  }, []);

  /**
   * Pre-processes an image on an off-screen canvas (rescaling, grayscale, binarization)
   * to prepare it for optimal OCR recognition.
   * 
   * @param {HTMLImageElement} img The loaded image element.
   * @returns {HTMLCanvasElement} The off-screen canvas with pre-processed pixels.
   */
  const preprocessImage = useCallback((img) => {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;
    
    // Rescale the image to a maximum dimension of 1000px, maintaining aspect ratio
    const maxDim = 1000;
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2d context for off-screen canvas.');
    }
    
    // Draw optimized image onto canvas
    ctx.drawImage(img, 0, 0, width, height);
    
    // Apply grayscale and binarization (high-contrast) filters
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Grayscale conversion using luminance formula
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Binarization: Threshold at 128 to generate clean high-contrast black & white image
      const binaryVal = gray >= 128 ? 255 : 0;
      
      data[i] = binaryVal;     // R
      data[i + 1] = binaryVal; // G
      data[i + 2] = binaryVal; // B
    }
    
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }, []);

  /**
   * Processes a receipt file, runs OCR, and parses GCash/Maya transaction details.
   * 
   * @param {File} file The selected receipt image file.
   * @returns {Promise<Object>} The parser result: { extractedAmount, extractedRefNo, rawText, processedImageSrc }
   */
  const processAndScanReceipt = useCallback(async (file) => {
    setIsProcessing(true);
    setOcrError(null);
    
    try {
      // 1. Load image
      const img = await loadImage(file);
      
      // 2. Pre-process image on off-screen canvas
      const canvas = preprocessImage(img);
      
      // Get the processed image dataURL for UI preview or debug if needed
      const processedImageSrc = canvas.toDataURL('image/png');
      
      // 3. Recognize text using Tesseract worker
      const ocrResult = await recognizeImage(canvas);
      const rawText = ocrResult?.data?.text || '';
      
      // 4. Parse text using our Philippine e-wallet regex utility
      const parsedData = parseReceiptText(rawText);
      
      setIsProcessing(false);
      return {
        ...parsedData,
        processedImageSrc
      };
    } catch (error) {
      setOcrError(error.message || 'Failed to process receipt.');
      setIsProcessing(false);
      throw error;
    }
  }, [loadImage, preprocessImage, recognizeImage]);

  return {
    ocrState,
    isProcessing,
    ocrError,
    processAndScanReceipt
  };
}
