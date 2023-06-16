import { useStore } from '@nanostores/react'
import { Store, StoreValue } from 'nanostores'
import {
  createStore as createRawStore,
  MicroStore,
  Slices, StoreMapper,
} from '@nanoslices/core'
import { MicroStoreOptions } from '@nanoslices/core/dist/types'

export * from '@nanoslices/core'

const createUseStoreAtom = <M extends Slices>(model: M) => {
  return <A extends Store>(mapper: (model: M) => A): StoreValue<A> =>
    useStore(mapper(model))
}

type UseMicroStore<M extends Slices> = <A extends Store>(
  mapper: (
    model: StoreMapper<M> extends infer U
      ? { [key in keyof U]: U[key] }
      : never,
  ) => A,
) => StoreValue<A>

export const withReact = <M extends Slices, C, S extends MicroStore<M, C>>(
  createStore: (model: M, options?: MicroStoreOptions<M, C>) => S,
): (model: M, options?: MicroStoreOptions<M, C>) => S & {
  use: UseMicroStore<M>
} => {
  return (model, options) => createStore(model, {
    ...options,
    extensions: [
      ...(options?.extensions ?? []),
      (store) => ({
        use: createUseStoreAtom(store),
      }),
    ],
  }) as S & {
    use: UseMicroStore<M>
  }
}

export const createStore = withReact(createRawStore)
