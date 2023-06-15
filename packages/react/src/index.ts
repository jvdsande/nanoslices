import { useStore } from '@nanostores/react'
import { Store, StoreValue } from 'nanostores'
import {
  createStore as createRawStore,
  MicroStore,
  Slices,
  StoreMapper,
} from '@nanoslices/core'
export * from '@nanoslices/core'

const createUseStoreAtom = <M extends Slices>(model: M) => {
  return <A extends Store>(mapper: (model: M) => A): StoreValue<A> =>
    useStore(mapper(model))
}

export interface ReactMicroStore<M extends Slices, C> extends MicroStore<M, C> {
  initialize: () => ReactMicroStore<M, C>
  use: <A extends Store>(
    mapper: (
      model: StoreMapper<M> extends infer U
        ? { [key in keyof U]: U[key] }
        : never,
    ) => A,
  ) => StoreValue<A>
}

export const createStore = <M extends Slices, C>(
  model: M,
  options?: {
    name?: string
    devtools?: boolean
    context?: C
  },
): ReactMicroStore<M, C> => {
  const microStore = createRawStore(model, options) as ReactMicroStore<M, C>
  microStore.use = createUseStoreAtom(model) as unknown as <A extends Store>(
    mapper: (
      model: StoreMapper<M> extends infer U
        ? { [key in keyof U]: U[key] }
        : never,
    ) => A,
  ) => StoreValue<A>

  return microStore
}
