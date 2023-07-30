import { ReadableAtom, Store, StoreValue } from 'nanostores'
import { FilterNever } from './utils'

export const ACTION = Symbol()
export const NESTED = Symbol()
export const INITIALIZE = Symbol()
export const SLICE = Symbol('slice')

export type SliceState =
  | Store
  | ((...params: any[]) => Store)
  | {
      [key: string]: SliceState
    }
export type SliceExtension = {
  [key: string]:
    | Store
    | ((...params: any[]) => Store)
    | SliceNested
    | SliceAction
    | SliceInitialize
    | SliceExtension
}

export type Cleanup<S extends SliceState> = {
  [key in keyof S]: S[key] extends infer U & SliceExtension[string] ? U : S[key]
}

type StoreValues<Stores extends Store[]> = {
  [Index in keyof Stores]: StoreValue<Stores[Index]>
}

export type UnwrapState<State extends SliceExtension> = FilterNever<{
  [key in keyof State]: State[key] extends SliceNested<infer D>
    ? D extends Slice<infer S>
      ? UnwrapState<S>
      : never
    : State[key] extends SliceAction<any>
    ? never
    : State[key]
}> extends infer U
  ? { [key in keyof U]: U[key] }
  : never
export type UnwrapActions<State extends SliceExtension> = FilterNever<{
  [key in keyof State]: State[key] extends SliceNested<infer D>
    ? D extends Slice<infer S>
      ? UnwrapActions<S>
      : never
    : State[key] extends SliceAction<infer A>
    ? A
    : never
}> extends infer U
  ? { [key in keyof U]: U[key] }
  : never
export type Unwrap<State extends SliceExtension> = {
  [key in keyof State]: State[key] extends SliceNested<infer D>
    ? D extends Slice<infer S>
      ? Unwrap<S>
      : never
    : State[key] extends SliceAction<infer A>
    ? A
    : State[key]
} extends infer U
  ? { [key in keyof U]: U[key] }
  : never
export type UnwrapSlices<Slices extends Record<string, Slice> | Slice> =
  Slices extends Slice<infer S>
    ? Unwrap<S>
    : {
        [key in keyof Slices]: Slices[key] extends Slice<infer S>
          ? Unwrap<S>
          : never
      }
export type UnwrapSlicesState<Slices extends Record<string, Slice> | Slice> =
  Slices extends Slice<infer S>
    ? UnwrapState<S>
    : {
        [key in keyof Slices]: Slices[key] extends Slice<infer S>
          ? UnwrapState<S>
          : never
      }
export type UnwrapSlicesActions<Slices extends Record<string, Slice> | Slice> =
  Slices extends Slice<infer S>
    ? UnwrapActions<S>
    : {
        [key in keyof Slices]: Slices[key] extends Slice<infer S>
          ? UnwrapActions<S>
          : never
      }

export type SliceAction<
  Func extends (...params: any[]) => any = (...params: any[]) => any,
> = { [ACTION]: Func }
export type SliceNested<State extends Slice = Slice> = {
  [NESTED]: State
}
type SliceInitialize = {
  [INITIALIZE](params: { slice: any; slices: any; context: any }): void
}

export type SliceHelpers<
  State extends SliceExtension | Cleanup<any>,
  Context,
  Slices extends Record<string, Slice>,
> = {
  define: {
    computed<Deps extends Store[], Value>(
      listen: () => [...Deps],
      get: (...deps: StoreValues<Deps>) => Value,
    ): ReadableAtom<Value>
    action<Func extends (...params: any[]) => any>(
      action: Func,
    ): SliceAction<Func>
    nested<Nested extends Slice<any, Context>>(
      slice: Nested | ((slice: Slice<any, Context>) => Nested),
    ): SliceNested<Nested>
  }
  slice: [State] extends [never] ? {} : Unwrap<State>
  store: [Slices] extends [never] ? {} : UnwrapSlices<Slices>
  context: [Context] extends [never] ? ReadableAtom<{}> : ReadableAtom<Context>
}
export type Slice<
  State extends SliceExtension | Cleanup<any> = any,
  Context = any,
  Slices extends Record<string, Slice> = any,
> = {
  define<Extension extends SliceExtension>(
    fields: (
      options: SliceHelpers<State, Context, Slices>,
    ) => Cleanup<Extension>,
  ): Slice<
    ([State] extends [never] ? {} : State) &
      ([string] extends [keyof Extension]
        ? {}
        : Cleanup<Extension>) extends infer U
      ? { [key in keyof U]: U[key] }
      : never,
    Context,
    Slices
  >
  state<States extends Record<string, SliceState>>(
    state: (
      options: Omit<SliceHelpers<State, Context, Slices>, 'define'>,
    ) => States,
  ): Slice<
    ([State] extends [never] ? {} : State) &
      Cleanup<{ [key in keyof States]: States[key] }> extends infer U
      ? { [key in keyof U]: U[key] }
      : never,
    Context,
    Slices
  >
  actions<Actions extends Record<string, (...params: any[]) => any>>(
    actions: (
      options: Omit<SliceHelpers<State, Context, Slices>, 'define'>,
    ) => Actions,
  ): Slice<
    ([State] extends [never] ? {} : State) &
      Cleanup<{
        [key in keyof Actions]: SliceAction<Actions[key]>
      }> extends infer U
      ? { [key in keyof U]: U[key] }
      : never,
    Context,
    Slices
  >
  computed<Computed extends Record<string, ReadableAtom>>(
    computed: (
      options: Omit<SliceHelpers<State, Context, Slices>, 'define'> & {
        computed: SliceHelpers<State, Context, Slices>['define']['computed']
      },
    ) => Computed,
  ): Slice<
    ([State] extends [never] ? {} : State) & Cleanup<Computed> extends infer U
      ? { [key in keyof U]: U[key] }
      : never,
    Context,
    Slices
  >
  nested<
    Nested extends Record<
      string,
      | Slice<any, Context>
      | ((slice: Slice<{}, Context>) => Slice<any, Context>)
    >,
  >(
    slice: (
      options: Omit<SliceHelpers<State, Context, Slices>, 'define'>,
    ) => Nested | ((slice: Slice<any, Context>) => Nested),
  ): Slice<
    ([State] extends [never] ? {} : State) &
      Cleanup<{
        [key in keyof Nested]: SliceNested<
          Nested[key] extends Slice<any, Context>
            ? Nested[key]
            : Nested[key] extends (
                slice: Slice<any, Context>,
              ) => Slice<any, Context>
            ? ReturnType<Nested[key]>
            : never
        >
      }> extends infer U
      ? { [key in keyof U]: U[key] }
      : never,
    Context,
    Slices
  >
  initialize(
    init: (params: {
      slice: [State] extends [never] ? {} : Unwrap<State>
      slices: [Slices] extends [never] ? {} : UnwrapSlices<Slices>
      context: [Context] extends [never]
        ? ReadableAtom<{}>
        : ReadableAtom<Context>
    }) => void,
  ): Slice<State, Context, Slices>
  [SLICE](): ((helpers: SliceHelpers<any, any, any>) => SliceExtension)[]
}
