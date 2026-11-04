// ══════════════════════════════════════════════════════════════════════════════
// src/lib/coverTransform.ts
// SINGLE SOURCE OF TRUTH FOR ALL VIEWPORT & LANDMARK GEOMETRY
// ══════════════════════════════════════════════════════════════════════════════
// Reconciles camera hardware stream dimensions with CSS `object-fit: cover` containers.
// Maps normalized (u, v) ∈ [0, 1] to CSS px and Canvas buffer px via a single affine matrix.
//
// Math:
//   s  = max(Wc / Wv, Hc / Hv)
//   ox = (Wc - Wv * s) / 2
//   oy = (Hc - Hv * s) / 2
//   Unmirrored: x =  u * (Wv * s) + ox
//   Mirrored:   x = -u * (Wv * s) + (Wc - ox)
//   y             =  v * (Hv * s) + oy
// ══════════════════════════════════════════════════════════════════════════════

export interface CoverTransformInput {
  videoWidth: number;
  videoHeight: number;
  containerWidth: number;
  containerHeight: number;
  isMirrored?: boolean;
  dpr?: number;
}

export interface AffineMatrix2D {
  a: number;   // scale X (negative if mirrored)
  b: number;   // shear Y (0 for standard cover)
  c: number;   // shear X (0 for standard cover)
  d: number;   // scale Y
  tx: number;  // translation X
  ty: number;  // translation Y
}

export interface VisibleNormalizedRoi {
  uMin: number;
  vMin: number;
  uMax: number;
  vMax: number;
  width: number;
  height: number;
}

export class CoverTransform {
  readonly videoWidth: number;
  readonly videoHeight: number;
  readonly containerWidth: number;
  readonly containerHeight: number;
  readonly isMirrored: boolean;
  readonly dpr: number;

  readonly scale: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly renderedWidth: number;
  readonly renderedHeight: number;

  // Affine matrix: x = a*u + tx, y = d*v + ty
  readonly matrix: AffineMatrix2D;

  constructor(input: CoverTransformInput) {
    this.videoWidth = Math.max(1, input.videoWidth || 640);
    this.videoHeight = Math.max(1, input.videoHeight || 480);
    this.containerWidth = Math.max(1, input.containerWidth || 360);
    this.containerHeight = Math.max(1, input.containerHeight || 640);
    this.isMirrored = Boolean(input.isMirrored);
    this.dpr = Math.max(1, input.dpr || 1);

    const s = Math.max(
      this.containerWidth / this.videoWidth,
      this.containerHeight / this.videoHeight
    );
    this.scale = s;
    this.renderedWidth = this.videoWidth * s;
    this.renderedHeight = this.videoHeight * s;

    const ox = (this.containerWidth - this.renderedWidth) / 2;
    const oy = (this.containerHeight - this.renderedHeight) / 2;
    this.offsetX = ox;
    this.offsetY = oy;

    if (this.isMirrored) {
      this.matrix = {
        a: -this.renderedWidth,
        b: 0,
        c: 0,
        d: this.renderedHeight,
        tx: this.containerWidth - ox,
        ty: oy,
      };
    } else {
      this.matrix = {
        a: this.renderedWidth,
        b: 0,
        c: 0,
        d: this.renderedHeight,
        tx: ox,
        ty: oy,
      };
    }
  }

  /**
   * Maps normalized (u, v) ∈ [0, 1] directly to CSS container pixels (x, y).
   */
  transformPoint(u: number, v: number): { x: number; y: number } {
    return {
      x: this.matrix.a * u + this.matrix.tx,
      y: this.matrix.d * v + this.matrix.ty,
    };
  }

  /**
   * Maps normalized (u, v) directly to high-DPI canvas buffer pixels.
   */
  transformPointToCanvas(u: number, v: number): { x: number; y: number } {
    const pt = this.transformPoint(u, v);
    return {
      x: pt.x * this.dpr,
      y: pt.y * this.dpr,
    };
  }

  /**
   * Transforms a normalized scalar distance (e.g. bitemporal spread) to CSS pixels.
   */
  transformDistance(distNorm: number): number {
    return distNorm * this.renderedWidth;
  }

  /**
   * Inverts container CSS pixels back to normalized camera stream (u, v).
   */
  inverseTransformPoint(x: number, y: number): { u: number; v: number } {
    const u = (x - this.matrix.tx) / this.matrix.a;
    const v = (y - this.matrix.ty) / this.matrix.d;
    return {
      u: Math.max(0, Math.min(1, u)),
      v: Math.max(0, Math.min(1, v)),
    };
  }

  /**
   * Computes the normalized (u, v) sub-rectangle of the camera frame that is
   * currently visible inside the container (crops out letterboxed overflow).
   */
  getVisibleRoi(): VisibleNormalizedRoi {
    const topLeft = this.inverseTransformPoint(0, 0);
    const bottomRight = this.inverseTransformPoint(
      this.containerWidth,
      this.containerHeight
    );

    const uMin = Math.min(topLeft.u, bottomRight.u);
    const uMax = Math.max(topLeft.u, bottomRight.u);
    const vMin = Math.min(topLeft.v, bottomRight.v);
    const vMax = Math.max(topLeft.v, bottomRight.v);

    return {
      uMin,
      vMin,
      uMax,
      vMax,
      width: uMax - uMin,
      height: vMax - vMin,
    };
  }

  /**
   * Applies this transform directly to a 2D canvas context.
   */
  applyToCanvasContext(ctx: CanvasRenderingContext2D, useDpr = false): void {
    const m = this.matrix;
    const factor = useDpr ? this.dpr : 1;
    ctx.setTransform(
      m.a * factor,
      0,
      0,
      m.d * factor,
      m.tx * factor,
      m.ty * factor
    );
  }

  /**
   * CSS matrix() string for DOM element style transforms.
   */
  toCssMatrix(): string {
    const m = this.matrix;
    return `matrix(${m.a}, 0, 0, ${m.d}, ${m.tx}, ${m.ty})`;
  }
}

/**
 * Factory helper for memoized or one-off calculations.
 */
export function createCoverTransform(input: CoverTransformInput): CoverTransform {
  return new CoverTransform(input);
}

