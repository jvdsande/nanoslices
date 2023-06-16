import {
  Actions,
  CleanupAtoms,
  Computed,
  SliceBuilder,
  State,
  STATE,
  ACTIONS,
  COMPUTED,
  INITIALIZE,
} from './types'
import { prepareActionSpy } from './spy'

const createSliceHelpers = <
  S extends State,
  C extends Computed = never,
  A extends Actions = never,
  Ct = unknown,
>(
  slice: SliceBuilder<S, C, A, Ct>,
  helpers: (typeof COMPUTED | typeof ACTIONS)[],
): SliceBuilder<S, C, A, Ct> => {
  const next = {
    ...slice,
    initialize: (
      cb: (
        slice: S,
        options: { context?: unknown; slices?: unknown },
      ) => Promise<void>,
    ) => {
      // @ts-expect-error - hidden internal field
      slice[INITIALIZE] = cb
      return slice
    },
  } as unknown as SliceBuilder<S, C, A, Ct>

  if (helpers.includes(ACTIONS)) {
    // @ts-expect-error - adding helpers when required
    next.context = () => next
    // @ts-expect-error - adding helpers when required
    next.slices = () => next
  }

  helpers.forEach((helper) => {
    // @ts-expect-error - adding helpers when required
    next[helper.description] = (
      cb: (slice: S, options: { context?: unknown; slices?: unknown }) => C | A,
    ) =>
      createSliceHelpers(
        {
          ...slice,
          [helper]: [
            ...((slice as any)[helper] ?? []),
            (_slice: S, options: { context: unknown; slices: unknown }) =>
              cb(_slice, options),
          ],
        } as SliceBuilder<S, C, A, Ct>,
        helper === COMPUTED
          ? [COMPUTED, ACTIONS]
          : helper === ACTIONS
          ? [ACTIONS]
          : [],
      )
  })

  return next
}

export const createSlice = <
  S extends State,
  C extends Computed = never,
  A extends Actions = never,
  Context = unknown,
>(
  state: () => CleanupAtoms<S>,
): SliceBuilder<CleanupAtoms<S>, C, A, Context> => {
  const next = prepareActionSpy({
    [STATE]: [state],
  }) as unknown as SliceBuilder<CleanupAtoms<S>, C, A, Context>

  return createSliceHelpers(next, [ACTIONS, COMPUTED])
}
