import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { createWorker } from 'tesseract.js';

const OCRContext = createContext(null);

export function OCRProvider({ children }) {
  const [ocrState, setOcrState] = useState('idle'); // 'idle' | 'initializing' | 'ready'
  const workerRef = useRef(null);
  const initializingRef = useRef(false);

  /**
   * Initializes the Tesseract worker instance and pre-downloads the WebAssembly core
   * and English language models if not already initialized.
   */
  const initializeOCR = useCallback(async () => {
    // If worker is already initialized or currently initializing, skip
    if (workerRef.current || initializingRef.current) {
      return;
    }

    initializingRef.current = true;
    setOcrState('initializing');

    try {
      // createWorker('eng') downloads WASM core and the English language model
      const worker = await createWorker('eng');
      workerRef.current = worker;
      setOcrState('ready');
    } catch (error) {
      setOcrState('idle');
      initializingRef.current = false;
    }
  }, []);

  /**
   * Performs OCR recognition on the provided image source (canvas, file, blob, URL).
   */
  const recognizeImage = useCallback(async (imageSource) => {
    if (!workerRef.current) {
      // Auto-initialize if not ready
      await initializeOCR();
      
      // Wait for initialization to complete
      let attempts = 0;
      while (!workerRef.current && attempts < 100) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }
    }

    if (!workerRef.current) {
      throw new Error('OCR engine was not initialized properly.');
    }

    const result = await workerRef.current.recognize(imageSource);
    return result;
  }, [initializeOCR]);

  // Cleanup worker instance on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  return (
    <OCRContext.Provider value={{ ocrState, initializeOCR, recognizeImage }}>
      {children}
    </OCRContext.Provider>
  );
}

export function useOCR() {
  const context = useContext(OCRContext);
  if (!context) {
    throw new Error('useOCR must be used within an OCRProvider');
  }
  return context;
}
export default OCRContext;
