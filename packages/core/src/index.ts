import { Store, StoreValue } from 'nanostores'
import {
  createDevTools,
  installActionsSpies,
  prepareSpyHelpers,
  restoreSnapshot,
  snapshotModel,
  subscribeDevTools,
  subscribeToActions,
  DEVTOOL,
} from './devtools'

import {
  ActionMapper,
  Actions,
  ACTIONS,
  CleanupAtoms,
  Computed,
  COMPUTED,
  DeepPartial,
  INITIALIZE,
  MicroStore,
  SliceBuilder,
  Slices,
  State,
  STATE,
  StoreMapper,
  StoreSlice,
  StoreValueMapper,
} from './types'

export type { Slices, StoreMapper, MicroStore } from './types'
export * from './utils'

const createGetStoreAction = <M extends Slices>(model: ActionMapper<M>) => {
  return <T>(mapper: (model: ActionMapper<M>) => T): T => mapper(model)
}
const createGetStoreAtom = <M extends Slices>(model: M) => {
  return <A extends Store>(mapper: (model: M) => A): StoreValue<A> =>
    mapper(model).get()
}

const loadSlicePart = (
  model: Slices,
  slice: StoreSlice<any, any, any, any>,
  path: string[],
  context: unknown,
  symbol: typeof STATE | typeof COMPUTED | typeof ACTIONS,
) => {
  if (!slice) {
    return
  }
  if (slice[symbol]) {
    // @ts-expect-error - hidden internal field
    slice[symbol].forEach((apply) => {
      const part = [STATE, COMPUTED].includes(symbol)
        ? apply(slice, { context, slices: model })
        : installActionsSpies(
            apply(slice, { context, slices: model }),
            path,
            slice,
          )
      Object.keys(part).forEach((key) => {
        // @ts-expect-error - expand base slice
        slice[key] = part[key]
      })
    })
  } else if (typeof slice === 'object') {
    Object.keys(slice).forEach((key) => {
      loadSlicePart(
        model,
        (slice as Slices)[key] as StoreSlice<any>,
        [...path, key],
        context,
        symbol,
      )
    })
  }
}

const initialize = (
  model: Slices,
  slice: StoreSlice<any, any, any, any>,
  context: unknown,
) => {
  if (!slice) {
    return
  }
  if (slice[INITIALIZE]) {
    const init = slice[INITIALIZE]
    delete slice[INITIALIZE]
    init(slice, { context, slices: model })
  } else if (typeof slice === 'object') {
    Object.keys(slice).forEach((key) => {
      initialize(model, (slice as Slices)[key] as StoreSlice<any>, context)
    })
  }
}

export const createStore = <M extends Slices, C>(
  model: M,
  options?: {
    name?: string
    devtools?: boolean
    context?: C
  },
): MicroStore<M, C> => {
  const internal = { ...options }
  const asSlice = model as unknown as StoreSlice<any>

  const load = () => {
    loadSlicePart(model, asSlice, [], internal?.context, STATE)
    loadSlicePart(model, asSlice, [], internal?.context, COMPUTED)
    loadSlicePart(model, asSlice, [], internal?.context, ACTIONS)
  }
  load()
  const initialState = snapshotModel(model)

  let connection: ReturnType<typeof createDevTools>
  if (options?.devtools) {
    connection = createDevTools(options?.name, model)
    subscribeToActions(asSlice, [], subscribeDevTools(connection))
  }

  const spy = () => {
    spy.history = []
    subscribeToActions(asSlice, [], (slice) => {
      // @ts-expect-error - development hidden field
      slice[DEVTOOL].subscribe((action) => {
        spy.history.push(action)
      })
    })
  }
  spy.history = [] as { type: string }[]
  spy.clear = () => {
    spy.history = []
  }
  spy.stop = () => {
    if (connection) {
      subscribeToActions(asSlice, [], subscribeDevTools(connection))
    } else {
      subscribeToActions(asSlice, [], (slice) => {
        // @ts-expect-error - development hidden field
        slice[DEVTOOL].subscribe(() => {
          // Do nothing
        })
      })
    }
  }

  const store = {
    act: createGetStoreAction(model as unknown as ActionMapper<M>),
    get: createGetStoreAtom(model as unknown as StoreMapper<M>),
    initialize: () => {
      initialize(model, asSlice, internal?.context)
      return store
    },
    snapshot: () => snapshotModel(model),
    reset() {
      restoreSnapshot(model, initialState)
      connection?.snapshot(initialState)
    },
    setContext(context: C) {
      internal.context = context
      load()
    },
    setSnapshot(state: DeepPartial<StoreValueMapper<StoreMapper<M>>>) {
      restoreSnapshot(model, state)
      connection?.snapshot(state)
    },
    spy,
  }

  return store as unknown as MicroStore<M>
}

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
  state: CleanupAtoms<S>,
): SliceBuilder<CleanupAtoms<S>, C, A, Context> => {
  const next = prepareSpyHelpers({
    [STATE]: [() => state],
  }) as unknown as SliceBuilder<CleanupAtoms<S>, C, A, Context>

  return createSliceHelpers(next, [ACTIONS, COMPUTED])
}
