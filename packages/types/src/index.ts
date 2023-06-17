import { Store, ReadableAtom, StoreValue } from 'nanostores'

export const INITIALIZE = Symbol('initialize')
export const STATE = Symbol('state')
export const COMPUTED = Symbol('computed')
export const ACTIONS = Symbol('actions')

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Store ? StoreValue<T[P]> : DeepPartial<T[P]>
} extends infer U
  ? { [key in keyof U]: U[key] }
  : never

export type CleanupAtoms<S extends StateEntry> = S extends Store
  ? S extends infer U & StateEntry
    ? U
    : S
  : {
      [key in keyof S]: S[key] extends StateEntry
        ? CleanupAtoms<S[key]>
        : S[key]
    }

type StateEntry =
  | Store
  | {
      [key: string]: StateEntry
    }
export type State = {
  [key: string]: StateEntry
}
export type Action = (...args: any[]) => any
type ActionsEntry =
  | Action
  | {
      [key: string]: ActionsEntry
    }
export type Actions = {
  [key: string]: ActionsEntry
}
type ComputedEntry =
  | ReadableAtom
  | {
      [key: string]: ComputedEntry
    }
export type Computed = {
  [key: string]: ComputedEntry
}
type SlicesEntry =
  | StoreSlice<any, any, any, any>
  | {
      [key: string]: SlicesEntry
    }
export type Slices = {
  [key: string]: SlicesEntry
}

export type StoreMapper<C extends Slices> = (
  C extends StoreSlice<any, any, any, any>
    ? ReturnType<C[typeof STATE]> &
        Maybe<ReturnType<NonNullable<C[typeof COMPUTED]>>>
    : {
        [key in keyof C]: StoreMapper<C[key]>
      }
) extends infer U
  ? { [key in keyof U]: U[key] }
  : never
export type StoreValueMapper<C extends State> = (
  C extends Store
    ? StoreValue<C>
    : {
        [key in keyof C]: C[key] extends State
          ? StoreValueMapper<C[key]>
          : C[key]
      }
) extends infer U
  ? { [key in keyof U]: U[key] }
  : never
export type StoreSnapshot<C extends Slices> = StoreValueMapper<StoreMapper<C>> extends infer U
  ? { [key in keyof U]: U[key] }
  : never

export type ActionMapper<C extends Slices> = (
  C extends StoreSlice<any, any, any, any>
    ? Maybe<ReturnType<NonNullable<C[typeof ACTIONS]>>>
    : {
        [key in keyof C]: ActionMapper<C[key]>
      }
) extends infer U
  ? { [key in keyof U]: U[key] }
  : never

export type ModelMapper<C extends Slices> = (
  C extends StoreSlice<any, any, any, any>
    ? ReturnType<C[typeof STATE]> &
        Maybe<ReturnType<NonNullable<C[typeof COMPUTED]>>> &
        Maybe<ReturnType<NonNullable<C[typeof ACTIONS]>>>
    : {
        [key in keyof C]: ModelMapper<C[key]>
      }
) extends infer U
  ? { [key in keyof U]: U[key] }
  : never

export type StoreSlice<
  S extends State,
  C extends Computed = never,
  A extends Actions = never,
  T extends Actions = never,
> = {
  [STATE]: () => S
  [COMPUTED]?: (slice: S, context?: unknown, slices?: unknown) => C
  [ACTIONS]?: (slice: S & Maybe<C>, context?: unknown, slices?: unknown) => A
  [INITIALIZE]?: (
    slice: S & Maybe<C> & Maybe<A> & Maybe<T>,
    context?: unknown,
    slices?: unknown,
  ) => void
} extends infer U
  ? { [key in keyof U]: U[key] }
  : never

type Maybe<T> = [T] extends [never] ? unknown : T

export type SliceBuilder<
  S extends State,
  C extends Computed = never,
  A extends Actions = never,
  Ct = unknown,
  M extends Slices = never,
> = StoreSlice<S, C, A> &
  ([C | A] extends [never]
    ? {
        initialize: (
          init: (
            slice: S,
            opts: { context: Ct; slices: ModelMapper<M> },
          ) => void | Promise<void>,
        ) => StoreSlice<S, C, A>
        slices: <_M extends Slices>(slices: _M) => SliceBuilder<S, C, A, Ct, _M>
        context: <_Ct>() => SliceBuilder<S, C, A, _Ct, M>
        computed: <_C extends Computed>(
          extension: (
            slice: S,
            opts: { context: Ct; slices: ModelMapper<M> },
          ) => _C,
        ) => SliceBuilder<S, _C, A, Ct, M>
        actions: <_A extends Actions>(
          extension: (
            slice: S,
            opts: { context: Ct; slices: ModelMapper<M> },
          ) => _A,
        ) => SliceBuilder<S, C, _A, Ct, M>
      }
    : [C] extends [never]
    ? // In this branch, only "action" has been defined
      {
        initialize: (
          init: (slice: S & A, context: Ct) => void | Promise<void>,
        ) => StoreSlice<S, C, A>
        actions: <_A extends Actions>(
          extension: (
            slice: S & A,
            opts: { context: Ct; slices: ModelMapper<M> },
          ) => _A,
        ) => SliceBuilder<S, C, _A & A, Ct, M>
      }
    : // In this branch, computed has been defined
    [A] extends [never]
    ? // In this branch, only computed has been defined
      {
        initialize: (
          init: (
            slice: S & C,
            opts: { context: Ct; slices: ModelMapper<M> },
          ) => void | Promise<void>,
        ) => StoreSlice<S, C, A>
        computed: <_C extends Computed>(
          extension: (
            slice: S & C,
            opts: { context: Ct; slices: ModelMapper<M> },
          ) => _C,
        ) => SliceBuilder<S, _C & C, A, Ct, M>
        actions: <_A extends Actions>(
          extension: (
            slice: S & C,
            opts: { context: Ct; slices: ModelMapper<M> },
          ) => _A,
        ) => SliceBuilder<S, C, _A, Ct, M>
      }
    : // In this branch, both have been defined
      {
        initialize: (
          init: (
            slice: S & C & A,
            opts: { context: Ct; slices: ModelMapper<M> },
          ) => void | Promise<void>,
        ) => StoreSlice<S, C, A>
        computed: <_C extends Computed>(
          extension: (
            slice: S & C & A,
            opts: { context: Ct; slices: ModelMapper<M> },
          ) => _C,
        ) => SliceBuilder<S, _C & C, A, Ct, M>
        actions: <_A extends Actions>(
          extension: (
            slice: S & C & A,
            opts: { context: Ct; slices: ModelMapper<M> },
          ) => _A,
        ) => SliceBuilder<S, C, _A & A, Ct, M>
      })

export interface NanoSlices<M extends Slices, C = unknown> {
  act: <T>(
    mapper: (
      model: ActionMapper<M> extends infer U
        ? { [key in keyof U]: U[key] }
        : never,
    ) => T,
  ) => T
  get: <A extends Store>(
    mapper: (
      model: StoreMapper<M> extends infer U
        ? { [key in keyof U]: U[key] }
        : never,
    ) => A,
  ) => StoreValue<A>
  initialize: () => NanoSlices<M, C>
  reset: (snapshot?: DeepPartial<StoreSnapshot<M>>) => void
  snapshot: () => StoreSnapshot<M> extends infer U
    ? { [key in keyof U]: U[key] }
    : never
  setContext: <Partial>(
    context: Partial extends true ? DeepPartial<C> : C,
  ) => void
}

export type ExtensionOptions<M extends Slices, C> = {
  initialState: StoreSnapshot<M>
  replaceContext: (context: C) => void
  takeSnapshot: () => StoreSnapshot<M>,
  restoreSnapshot: (snapshot: DeepPartial<StoreSnapshot<M>>) => void,
  subscribeToActions: (
    onSlice: (actionSpy: {
      subscribe: (
        subscription: (action: { type: string; payload?: any }) => void,
      ) => () => void
    }) => void,
  ) => void
}

export interface NanoSlicesOptions<C = unknown> {
  context?: C
}
