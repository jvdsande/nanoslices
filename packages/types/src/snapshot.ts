import { Store, StoreValue, WritableStore } from 'nanostores'

import { DeepPartial } from './utils'
import { Slice, SliceState, UnwrapSlicesState } from './slice'

export type StoreValueMapper<Slices extends SliceState> = (
  Slices extends Store<infer U>
    ? U
    : Slices extends (...args: any) => Store
      ? never
      : {
        [key in keyof Slices]: Slices[key] extends SliceState
          ? StoreValueMapper<Slices[key]>
          : never
      }
  ) extends infer U
  ? { [key in keyof U]: U[key] }
  : never
export type StoreSnapshot<Slices extends Record<string, Slice> | Slice> = StoreValueMapper<
  UnwrapSlicesState<Slices>
> extends infer U
  ? { [key in keyof U]: U[key] }
  : never
export type WritableStoreValueMapper<Slices extends SliceState> = (
  Slices extends WritableStore
    ? StoreValue<Slices>
    : Slices extends (...args: any) => WritableStore
      ? never
      : Slices extends Record<string, SliceState> ? {
        [key in keyof Slices]: Slices[key] extends SliceState
          ? WritableStoreValueMapper<Slices[key]>
          : never
      } : never
  ) extends infer U
  ? { [key in keyof U]: U[key] }
  : never
export type WritableStoreSnapshot<Slices extends Record<string, Slice> | Slice> =
  DeepPartial<WritableStoreValueMapper<UnwrapSlicesState<Slices>> extends infer U
    ? { [key in keyof U]: U[key] }
    : never>

