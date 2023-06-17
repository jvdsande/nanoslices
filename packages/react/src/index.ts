import { useStore } from '@nanostores/react'
import { Store, StoreValue } from 'nanostores'
import { registerExtension } from '@nanoslices/core'
import { Slices, StoreMapper } from '@nanoslices/types'

export * from '@nanoslices/core'

type UseNanoSlices<M extends Slices> = <A extends Store>(
  mapper: (
    model: StoreMapper<M> extends infer U
      ? { [key in keyof U]: U[key] }
      : never,
  ) => A,
) => StoreValue<A>

declare module '@nanoslices/types' {
  interface NanoSlices<M extends Slices, C> {
    use: UseNanoSlices<M>
  }
}

const createUseStoreAtom = <M extends Slices>(model: M) => {
  return <A extends Store>(mapper: (model: M) => A): StoreValue<A> =>
    useStore(mapper(model))
}

registerExtension((store) => ({
  use: createUseStoreAtom(store),
}))
