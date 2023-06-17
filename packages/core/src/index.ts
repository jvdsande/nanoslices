import { Store, StoreValue } from 'nanostores'
import {
  STATE,
  ACTIONS,
  COMPUTED,
  INITIALIZE,
  ActionMapper,
  DeepPartial,
  NanoSlices,
  NanoSlicesOptions,
  Slices,
  StoreMapper,
  StoreSlice,
  ExtensionOptions,
  StoreSnapshot,
} from '@nanoslices/types'
import { crawlObject } from './helpers'
import { takeSnapshot, restoreSnapshot } from './snapshot'
import { spyOnActions, subscribeToActions, ACTION_SPY } from './spy'

export type { NanoSlices, NanoSlicesOptions } from '@nanoslices/types'
export * from './utils'
export * from './slice'

const createGetStoreAction = <M extends Slices>(model: ActionMapper<M>) => {
  return <T>(mapper: (model: ActionMapper<M>) => T): T => mapper(model)
}
const createGetStoreAtom = <M extends Slices>(model: M) => {
  return <A extends Store>(mapper: (model: M) => A): StoreValue<A> =>
    mapper(model).get()
}

const loadSliceActionSpy = (model: Slices, slices: Slices) => {
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

const extensions: (<M extends Slices, C>(
  store: M,
  storeOptions: NanoSlicesOptions<C>,
  extensionOptions: ExtensionOptions<M, C>,
) => any)[] = []
export const registerExtension = (extension: (typeof extensions)[number]) => {
  if (!extensions.includes(extension)) {
    extensions.push(extension)
  }
}

export const createStore = <M extends Slices, C>(
  model: M,
  options?: NanoSlicesOptions<C>,
): NanoSlices<M, C> => {
  const optionsCopy = { ...options }
  const asStore = {} as StoreSlice<any>
  const asSlice = model as unknown as StoreSlice<any>

  loadSliceActionSpy(asSlice, asStore)
  loadSlicePart(asSlice, asStore, {
    context: optionsCopy?.context,
    symbol: STATE,
  })
  const reloadSlices = () => {
    loadSlicePart(asSlice, asStore, {
      context: optionsCopy?.context,
      symbol: COMPUTED,
    })
    loadSlicePart(asSlice, asStore, {
      context: optionsCopy?.context,
      symbol: ACTIONS,
    })
  }
  reloadSlices()

  const initialState = takeSnapshot(asStore)
  const replaceContext = (context?: C) => {
    if (context) {
      optionsCopy.context = context
    }
    reloadSlices()
  }

  const extensionOptions = {
    initialState: initialState as ExtensionOptions<M, C>['initialState'],
    subscribeToActions: (onSlice: Parameters<typeof subscribeToActions>[1]) =>
      subscribeToActions(asStore, onSlice),
    restoreSnapshot: (snapshot: Parameters<typeof restoreSnapshot>[1]) =>
      restoreSnapshot(asStore, snapshot),
    takeSnapshot: (() => takeSnapshot(asStore)) as ExtensionOptions<
      M,
      C
    >['takeSnapshot'],
    replaceContext,
  }

  const extended: Record<string, any> = {}
  extensions?.forEach((extension) => {
    const ext = extension(
      asStore as unknown as M,
      optionsCopy,
      extensionOptions,
    )
    Object.keys(ext).forEach((key) => {
      extended[key] = ext[key]
    })
  })

  const store = {
    act: createGetStoreAction(asStore as unknown as ActionMapper<M>),
    get: createGetStoreAtom(asStore as unknown as StoreMapper<M>),
    initialize: () => {
      initialize(asSlice, asStore, { context: optionsCopy?.context })
      return store
    },
    snapshot: () => takeSnapshot(asStore),
    reset(
      snapshot?: DeepPartial<
        StoreSnapshot<M> extends infer U ? { [key in keyof U]: U[key] } : never
      >,
    ) {
      restoreSnapshot(asStore, snapshot ?? initialState)
    },
    setContext: replaceContext,
    ...extended,
  } as unknown as NanoSlices<M>

  return store
}
