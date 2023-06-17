import { Store, StoreValue } from 'nanostores'
import { createDevTools } from './devtools'
import { crawlObject } from './helpers'
import { snapshotModel, restoreSnapshot } from './snapshot'
import { ACTION_SPY, spyOnActions, subscribeToActions } from './spy'
import {
  STATE,
  ACTIONS,
  COMPUTED,
  INITIALIZE,
  ActionMapper,
  DeepPartial,
  MicroStore,
  MicroStoreOptions,
  Slices,
  StoreMapper,
  StoreSlice,
  StoreValueMapper,
} from './types'

export type { Slices, StoreMapper, MicroStore, MicroStoreOptions } from './types'
export * from './utils'
export * from './slice'

const createGetStoreAction = <M extends Slices>(model: ActionMapper<M>) => {
  return <T>(mapper: (model: ActionMapper<M>) => T): T => mapper(model)
}
const createGetStoreAtom = <M extends Slices>(model: M) => {
  return <A extends Store>(mapper: (model: M) => A): StoreValue<A> =>
    mapper(model).get()
}

const loadSliceDevtools = (model: Slices, slices: Slices) => {
  crawlObject(
    model,
    slices,
    (slice) => ACTION_SPY in slice,
    (modelSlice, slicesSlice) => {
      // @ts-expect-error - hidden internal field
      slicesSlice[ACTION_SPY] = modelSlice[ACTION_SPY]()
    },
  )
}

const loadSlicePart = (
  model: Slices,
  slices: Slices,
  options: {
    symbol: typeof STATE | typeof COMPUTED | typeof ACTIONS
    context: unknown
  },
) => {
  crawlObject(
    model,
    slices,
    (modelSlice) => options.symbol in modelSlice,
    (modelSlice, slice, path) => {
      // @ts-expect-error - hidden internal field
      modelSlice[options.symbol].forEach((apply) => {
        const part =
          ACTIONS === options.symbol
            ? spyOnActions(
                apply(slice, { context: options.context, slices }),
                path,
                slice,
              )
            : apply(slice, { context: options.context, slices })
        Object.keys(part).forEach((key) => {
          slice[key] = part[key]
        })
      })
    },
  )
}

const initialize = (
  model: Slices,
  slices: Slices,
  options: {
    context: unknown
  },
) => {
  crawlObject(
    model,
    slices,
    (modelSlice) => INITIALIZE in modelSlice,
    (modelSlice, slices) => {
      (modelSlice as StoreSlice<any>)[INITIALIZE]?.(slices, {
        context: options.context,
        slices,
      })
    },
  )
}

export const createStore = <M extends Slices, C>(
  model: M,
  options?: MicroStoreOptions<M, C>,
): MicroStore<M, C> => {
  const internal = { ...options } as {
    name?: string
    devtools?: boolean
    context?: C
  }
  const asStore = {} as StoreSlice<any>
  const asSlice = model as unknown as StoreSlice<any>

  loadSliceDevtools(asSlice, asStore)
  loadSlicePart(asSlice, asStore, { context: internal?.context, symbol: STATE })
  const load = () => {
    loadSlicePart(asSlice, asStore, {
      context: internal?.context,
      symbol: COMPUTED,
    })
    loadSlicePart(asSlice, asStore, {
      context: internal?.context,
      symbol: ACTIONS,
    })
  }
  load()
  const initialState = snapshotModel(asStore)

  let connection: ReturnType<typeof createDevTools>
  if (options?.devtools) {
    const connection = createDevTools(options?.name, asStore)
    subscribeToActions(asStore, [], connection.subscribe)
  }

  const spy: MicroStore<M, C>['spy'] = (options) => {
    const history: { type: string }[] = []
    const subscriptions: (() => void)[] = []
    subscribeToActions(asStore, [], (slice) => {
      // @ts-expect-error - development hidden field
      subscriptions.push(slice[ACTION_SPY].subscribe((action) => {
        history.push(action)
      }))
    })

    const context = (context: DeepPartial<C>) => {
      internal.context = context as C
      load()
    }
    const snapshot = (
      state?: DeepPartial<
        StoreValueMapper<StoreMapper<M>> extends infer U
          ? { [key in keyof U]: U[key] }
          : never
      >,
    ) => {
      restoreSnapshot(asStore, state ?? options?.snapshot ?? initialState)
      context(options?.context ?? (internal.context as DeepPartial<C>))
    }
    const clear = () => {
      history.length = 0
    }
    const reset = () => {
      snapshot()
      clear()
    }

    const restore = () => {
      options = {}
      reset()
      subscriptions.forEach((subscribe) => subscribe())

      spyMethods.clear = () => null
      spyMethods.snapshot = () => null
      spyMethods.context = () => null
      spyMethods.reset = () => null
    }

    const spyMethods = {
      history,
      clear,
      snapshot,
      context,
      reset,
      restore,
    }

    options?.reset?.(() => {
      reset()
    })
    options?.restore?.(() => {
      restore()
    })

    reset()

    return spyMethods
  }

  const extensions: Record<string, any> = {}
  options?.extensions?.forEach((extension) => {
    const ext = extension(asStore as unknown as M)
    Object.keys(ext).forEach((key) => {
      extensions[key] = ext[key]
    })
  })

  const store = {
    ...extensions,
    act: createGetStoreAction(asStore as unknown as ActionMapper<M>),
    get: createGetStoreAtom(asStore as unknown as StoreMapper<M>),
    initialize: () => {
      initialize(asSlice, asStore, { context: internal?.context })
      return store
    },
    snapshot: () => snapshotModel(asStore),
    reset(
      snapshot?: DeepPartial<
        StoreValueMapper<StoreMapper<M>> extends infer U
          ? { [key in keyof U]: U[key] }
          : never
      >,
    ) {
      restoreSnapshot(asStore, snapshot ?? initialState)
      connection?.snapshot(snapshot ?? initialState)
    },
    setContext(context: C) {
      internal.context = context
      load()
    },
    spy,
  } as unknown as MicroStore<M>

  return store
}
