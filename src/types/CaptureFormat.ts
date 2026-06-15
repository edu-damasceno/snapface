export interface CaptureFormat {
  id: string;
  label: string;
  aspectRatio: [number, number];
  outputResolution: [number, number];
  faceDeviation: number;
}

export const DEFAULT_FORMAT: CaptureFormat = {
  id: '3:4',
  label: '3x4 Documento',
  aspectRatio: [3, 4],
  outputResolution: [1440, 1920],
  faceDeviation: 85,
};
