import { atom, computed, ReadableAtom, Store, StoreValue } from 'nanostores'
import { lazyComputed } from './utils/lazy-computed'
import { takeSnapshot, restoreSnapshot } from './snapshot'
import {
  ACTION,
  NESTED,
  INITIALIZE,
  SLICE,
  ActionPayload,
  ExtensionOptions,
  NanoSlicesOptions,
  Slice,
  SliceExtension,
  UnwrapSlices,
  UnwrapSlicesActions,
  UnwrapSlicesState,
  WritableStoreSnapshot,
  NanoSlices,
} from '@nanoslices/types'
import { createSlice } from './slice'

export { createSlice } from './slice'
export * from './utils/helpers'

function spyOnAction(options: {
  actionType: string
  action: (...args: any[]) => any
  actionStack: ActionPayload[][]
  reportAction: (action: ActionPayload) => void
}) {
  return (...params: any[]) => {
    const report =
      options.actionStack[0]?.push.bind(options.actionStack[0]) ??
      options.reportAction
    const localStack: any[] = []
    options.actionStack.unshift(localStack)

    const ret = options.action(...params)

    report({
      type: options.actionType,
      payload: params,
    })
    const wasThunk = options.actionStack[0].length
    localStack.forEach((a: any) => {
      report(a)
    })
    options.actionStack.shift()

    if (ret && typeof ret === 'object' && 'then' in ret && 'catch' in ret) {
      Promise.resolve(ret)
        .then((success) => {
          options.reportAction({
            type: options.actionType + '(success)',
            payload: params,
            success,
          })
        })
        .catch((fail) => {
          options.reportAction({
            type: options.actionType + '(fail)',
            payload: params,
            fail,
          })
        })
    } else if (wasThunk) {
      report({
        type: options.actionType + '(success)',
        payload: params,
      })
    }

    return ret
  }
}

function loadSliceState({
  slice,
  store,
  options,
  path,
}: {
  slice: Slice<any>
  store: Record<string, SliceExtension>
  options: {
    context: Store
    actionStack: ActionPayload[][]
    registerInitialize: (initialize: () => void) => void
    registerAction: (
      actionType: string,
      action: (...params: any) => any,
    ) => void
    reportAction: (action: ActionPayload) => void
  }
  path: string[]
}) {
  const definition = slice[SLICE]()

  return definition.reduce((current, extension) => {
    if (!(typeof extension === 'function')) {
      return current
    }

    const ext = extension({
      define: {
        action: (action) => ({
          [ACTION]: action,
        }),
        nested: (nested) => ({
          [NESTED]:
            typeof nested === 'function' ? nested(createSlice()) : nested,
        }),
        computed: lazyComputed,
      },
      slice: current,
      store,
      context: options.context,
    })

    const activate = (slice: any, subpath: string[] = []) => {
      Object.keys(slice).forEach((key) => {
        if (!slice[key] || typeof slice[key] !== 'object') {
          return
        }

        if (INITIALIZE in slice[key]) {
          const init = slice[key][INITIALIZE]
          delete slice[key]
          options.registerInitialize(() =>
            init({ slice: current, store, context: options.context.get() }),
          )
          return
        }

        if (ACTION in slice[key]) {
          const action = slice[key][ACTION]
          const actionType = ['@action', ...path, ...subpath, key].join('.')
          slice[key] = spyOnAction({
            action,
            actionType,
            actionStack: options.actionStack,
            reportAction: options.reportAction,
          })
          options.registerAction(actionType, slice[key])
          return
        }

        if (NESTED in slice[key]) {
          slice[key] = loadSliceState({
            slice: slice[key][NESTED],
            store,
            options: options,
            path: [...path, ...subpath, key],
          })
        }

        activate(slice[key], [...subpath, key])
      })
    }
    activate(ext)

    return { ...current, ...(ext as Record<string, Store>) }
  }, {})
}

const extensions: (<Slices extends Record<string, Slice<any>>, Context>(
  store: UnwrapSlices<Slices>,
  storeOptions: NanoSlicesOptions<Slices, Context>,
  extensionOptions: ExtensionOptions<Slices, Context>,
) => any)[] = []
export const registerExtension = (extension: (typeof extensions)[number]) => {
  if (!extensions.includes(extension)) {
    extensions.push(extension)
  }
}

export function createStore<
  Slices extends Record<string, Slice> | Slice,
  Context,
>(
  slices: Slices,
  options?: NanoSlicesOptions<Slices, Context>,
): NanoSlices<Slices, Context> {
  let store = {} as UnwrapSlices<Slices>
  const initialize: (() => void)[] = []
  const destroy: (() => void)[] = []
  const contextAtom = atom(options?.context ?? ({} as Context))
  const contextComputed = computed(contextAtom, (c) => c)
  const actionStack: ActionPayload[][] = []
  const actions = new Map<string, (...params: any[]) => any>()
  let listeners: ((action: ActionPayload) => void)[] = []

  if (SLICE in slices) {
    store = loadSliceState({
      slice: slices as Slice,
      store,
      options: {
        context: contextComputed,
        registerInitialize: (init) => initialize.push(init),
        registerAction: (actionType, action) => {
          actions.set(actionType, action)
        },
        reportAction: (action) =>
          listeners.forEach((listener) => listener(action)),
        actionStack,
      },
      path: [],
    }) as UnwrapSlices<Slices>
  } else {
    Object.keys(slices).forEach((key) => {
      store[key] = loadSliceState({
        slice: slices[key as keyof typeof slices] as Slice,
        store,
        options: {
          context: contextComputed,
          registerInitialize: (init) => initialize.push(init),
          registerAction: (actionType, action) => {
            actions.set(actionType, action)
          },
          reportAction: (action) =>
            listeners.forEach((listener) => listener(action)),
          actionStack,
        },
        path: [key],
      })
    })
  }

  if (options?.snapshot) {
    restoreSnapshot(store, options?.snapshot)
  }
  const initialSnapshot = takeSnapshot(store)
  const extensionOptions: ExtensionOptions<Slices, Context> = {
    initialState: initialSnapshot,
    subscribeToActions: (listener, withActions) => {
      withActions?.(actions)
      listeners.push(listener)
      return () => {
        listeners = listeners.filter((l) => l !== listener)
      }
    },
    restoreSnapshot: (snapshot) => restoreSnapshot(store, snapshot),
    takeSnapshot: () => takeSnapshot(store),
    replaceContext: (context) => contextAtom.set(context),
    onDestroy: (onDestroy: () => void) => {
      destroy.push(onDestroy)
    },
  }

  const extended: Record<string, any> = {}
  extensions?.forEach((extension) => {
    const ext = extension(store, { ...options }, extensionOptions as any)
    Object.keys(ext).forEach((key) => {
      extended[key] = ext[key]
    })
  })

  const ret: NanoSlices<Slices, Context> = {
    get: ((mapper, listen) => {
      const res = mapper(store as unknown as UnwrapSlicesState<Slices>)

      if (Array.isArray(res)) {
        return res.map((a) => (listen ? computed(a, (v) => v) : a.get()))
      }

      return listen ? computed(res, (v) => v) : res
    }) as <S extends Store, B extends boolean = false>(
      mapper: (store: UnwrapSlicesState<Slices>) => S,
      listen?: B,
    ) => B extends true ? ReadableAtom<StoreValue<S>> : StoreValue<S>,
    act: ((mapper) =>
      mapper(
        store as unknown as UnwrapSlicesActions<Slices> extends infer U
          ? { [key in keyof U]: U[key] }
          : never,
      )) as <T>(
      mapper: (
        store: UnwrapSlicesActions<Slices> extends infer U
          ? { [key in keyof U]: U[key] }
          : never,
      ) => T,
    ) => T,
    initialize: () => {
      initialize.forEach((init) => init())
      return ret
    },
    destroy: () => {
      destroy.forEach((des) => des())
    },
    snapshot: () => takeSnapshot(store),
    reset: (snapshot?: WritableStoreSnapshot<Slices>) => {
      restoreSnapshot(store, snapshot ?? initialSnapshot)
    },
    replaceContext: (context: Context) => {
      contextAtom.set(context)
    },
    ...extended,
  }

  return ret
}
