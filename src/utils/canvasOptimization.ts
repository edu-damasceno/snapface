/**
 * Canvas Performance Optimization
 *
 * Monkey patch to HTMLCanvasElement.prototype.getContext
 * to automatically add { willReadFrequently: true } for all 2D canvas contexts.
 *
 * IMPORTANT: This must be imported BEFORE any library that creates canvas contexts
 * (e.g., MediaPipe, etc.)
 */

const originalGetContext = HTMLCanvasElement.prototype.getContext as (
  contextId: string,
  options?: unknown
) => RenderingContext | null;

(HTMLCanvasElement.prototype as unknown as {
  getContext: (contextId: string, options?: unknown) => RenderingContext | null;
}).getContext = function(
  this: HTMLCanvasElement,
  contextType: string,
  contextAttributes?: unknown
): RenderingContext | null {
  if (contextType === '2d') {
    const optimizedAttributes = {
      willReadFrequently: true,
      ...(contextAttributes as CanvasRenderingContext2DSettings || {})
    };
    return originalGetContext.call(this, contextType, optimizedAttributes);
  }

  return originalGetContext.call(this, contextType, contextAttributes);
};

if (import.meta.env.DEV) {
  console.log('[Canvas Optimization] willReadFrequently patch applied globally');
}

export {};
