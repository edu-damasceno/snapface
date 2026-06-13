import { useState, useCallback } from 'react';
import { CAPTURE_FORMATS, DEFAULT_FORMAT } from '../types/CaptureFormat';
import type { CaptureFormat } from '../types/CaptureFormat';

export const useCaptureFormat = () => {
  const [currentFormat, setCurrentFormat] = useState<CaptureFormat>(DEFAULT_FORMAT);

  const selectFormat = useCallback((formatId: string) => {
    const format = CAPTURE_FORMATS.find(f => f.id === formatId);
    if (format) setCurrentFormat(format);
  }, []);

  return { currentFormat, selectFormat, formats: CAPTURE_FORMATS };
};
