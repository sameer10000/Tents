import type { LengthUnit, TentSpec } from '../../data/tent-config'
import { buildBell } from './bell'
import { buildMedieval } from './medieval'
import { buildSafari } from './safari'
import type { TentModel } from './shared'

export type { DimensionLine, PartRole, PartSurface, TentModel, TentPart } from './shared'

/**
 * Turns a specification into a model.
 *
 * Pure and synchronous — the viewport rebuilds on every control change and
 * throws the previous model away, so nothing here may hold state between
 * calls. `unit` only reaches the measured callouts.
 */
export function buildTent(spec: TentSpec, unit: LengthUnit = 'm'): TentModel {
  switch (spec.family) {
    case 'bell':
      return buildBell(spec, unit)
    case 'medieval':
      return buildMedieval(spec, unit)
    case 'safari':
      return buildSafari(spec, unit)
  }
}

/** Releases the GPU buffers behind a model. Call before dropping one. */
export function disposeModel(model: TentModel): void {
  for (const part of model.parts) part.geometry.dispose()
}
