/**
 * The three looks the viewer can switch between.
 *
 * Deliberately free of any three.js import: the viewport shell, its switcher
 * and the plate fallback all read this, and a device that cannot run WebGL
 * must never be made to download a renderer to find that out.
 */
export type RenderStyle = 'matte' | 'photoreal' | 'blueprint'

export const RENDER_STYLES: Array<{ id: RenderStyle; label: string; hint: string }> = [
  { id: 'matte', label: 'Matte', hint: 'Editorial, in the house palette' },
  { id: 'photoreal', label: 'Photoreal', hint: 'Woven cloth and real light' },
  { id: 'blueprint', label: 'Blueprint', hint: 'Dimensioned technical view' },
]
