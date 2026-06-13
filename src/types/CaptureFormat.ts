export interface CaptureFormat {
  id: string;
  label: string;
  icon: string;
  aspectRatio: [number, number]; // [width, height]
  outputResolution: [number, number];
  validationStrictness: 'relaxed' | 'strict';
  faceDeviation: number; // px tolerance for position
  guideShape: 'oval' | 'rectangle';
}

export const CAPTURE_FORMATS: CaptureFormat[] = [
  {
    id: 'free',
    label: 'Livre',
    icon: '📷',
    aspectRatio: [0, 0], // Full frame
    outputResolution: [0, 0], // Native resolution
    validationStrictness: 'relaxed',
    faceDeviation: 120,
    guideShape: 'oval',
  },
  {
    id: '1:1',
    label: '1:1 Quadrado',
    icon: '⬜',
    aspectRatio: [1, 1],
    outputResolution: [1080, 1080],
    validationStrictness: 'relaxed',
    faceDeviation: 120,
    guideShape: 'oval',
  },
  {
    id: '3:4',
    label: '3x4 Documento',
    icon: '🪪',
    aspectRatio: [3, 4],
    outputResolution: [1440, 1920],
    validationStrictness: 'strict',
    faceDeviation: 85,
    guideShape: 'rectangle',
  },
  {
    id: '4:5',
    label: '4:5 Retrato',
    icon: '🖼️',
    aspectRatio: [4, 5],
    outputResolution: [1080, 1350],
    validationStrictness: 'relaxed',
    faceDeviation: 120,
    guideShape: 'oval',
  },
  {
    id: '5:7',
    label: '5:7 Clássico',
    icon: '🎞️',
    aspectRatio: [5, 7],
    outputResolution: [1080, 1512],
    validationStrictness: 'relaxed',
    faceDeviation: 120,
    guideShape: 'oval',
  },
  {
    id: '9:16',
    label: '9:16 Stories',
    icon: '📱',
    aspectRatio: [9, 16],
    outputResolution: [1080, 1920],
    validationStrictness: 'relaxed',
    faceDeviation: 120,
    guideShape: 'oval',
  },
];

export const DEFAULT_FORMAT = CAPTURE_FORMATS[0];
