import { ReadableAtom, Store, StoreValue } from 'nanostores'
import { StoreSnapshot, WritableStoreSnapshot } from './snapshot'
import { Slice, UnwrapSlicesActions, UnwrapSlicesState } from './slice'

export interface ActionPayload {
  type: string
  payload: any[]
  success?: any
  fail?: any
}

export interface NanoSlicesOptions<
  Slices extends Record<string, Slice> | Slice = {},
  Context = never,
> {
  context?: Context
  snapshot?: WritableStoreSnapshot<Slices>
}

export interface ExtensionOptions<
  Slices extends Record<string, Slice> | Slice,
  Context,
> {
  initialState: StoreSnapshot<Slices>
  replaceContext: (context: Context) => void
  takeSnapshot: () => StoreSnapshot<Slices>
  restoreSnapshot: (snapshot: WritableStoreSnapshot<Slices>) => void
  subscribeToActions: (
    onAction: (action: ActionPayload) => void,
    withActions?: (actions: Map<string, (...args: any[]) => any>) => void,
  ) => () => void
  onDestroy(onDestroy: () => void): void
}

export interface NanoSlices<
  Slices extends Record<string, Slice> | Slice,
  Context = never,
> {
  get<S extends Store[], B extends boolean = false>(
    mapper: (store: UnwrapSlicesState<Slices>) => [...S],
    listen?: B,
  ): B extends true
    ? { [Index in keyof S]: ReadableAtom<StoreValue<S[Index]>> }
    : { [Index in keyof S]: StoreValue<S[Index]> }
  get<S extends Store, B extends boolean = false>(
    mapper: (store: UnwrapSlicesState<Slices>) => S,
    listen?: B,
  ): B extends true ? ReadableAtom<StoreValue<S>> : StoreValue<S>
  act<T extends any[]>(
    mapper: (
      store: UnwrapSlicesActions<Slices> extends infer U
        ? { [key in keyof U]: U[key] }
        : never,
    ) => [...T],
  ): T
  act<T>(
    mapper: (
      store: UnwrapSlicesActions<Slices> extends infer U
        ? { [key in keyof U]: U[key] }
        : never,
    ) => T,
  ): T
  initialize(): this
  destroy(): void
  snapshot(): StoreSnapshot<Slices>
  reset(snapshot?: WritableStoreSnapshot<Slices>): void
  replaceContext(context: Context): void
}
