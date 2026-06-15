export interface CaptureFormat {
  id: string;
  label: string;
  icon: string;
  aspectRatio: [number, number];
  outputResolution: [number, number];
  faceDeviation: number;
}

export const CAPTURE_FORMATS: CaptureFormat[] = [
  {
    id: '3:4',
    label: '3x4 Documento',
    icon: '🪪',
    aspectRatio: [3, 4],
    outputResolution: [1440, 1920],
    faceDeviation: 85,
  },
];

export const DEFAULT_FORMAT: CaptureFormat = CAPTURE_FORMATS[0];
