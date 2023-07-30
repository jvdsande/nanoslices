import { Store, StoreValue } from 'nanostores'

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Store ? StoreValue<T[P]> : DeepPartial<T[P]>
} extends infer U
  ? { [key in keyof U]: U[key] }
  : never

type NonNeverKeys<Obj extends {}> = {
  [key in keyof Obj]: Obj[key] extends never ? never : key
}[keyof Obj]

export type FilterNever<Obj extends {}> = {
  [key in NonNeverKeys<Obj>]: Obj[key]
}
