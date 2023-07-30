/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo } from 'react'
import { useStore, UseStoreOptions } from '@nanostores/react'
import { computed, ReadableAtom, Store, StoreValue } from 'nanostores'
import { createSlice, createStore, registerExtension } from '@nanoslices/core'
import {
  NanoSlices,
  NanoSlicesOptions,
  Slice,
  UnwrapSlices,
  UnwrapSlicesState,
} from '@nanoslices/types'

export * from '@nanoslices/core'

type UseNanoSlices<M extends Record<string, Slice> | Slice> = {
  <A extends Store[]>(
    mapper: (
      model: UnwrapSlicesState<M> extends infer U
        ? { [key in keyof U]: U[key] }
        : never,
    ) => [...A],
  ): { [Index in keyof A]: StoreValue<A[Index]> }
  <A extends Store>(
    mapper: (
      model: UnwrapSlicesState<M> extends infer U
        ? { [key in keyof U]: U[key] }
        : never,
    ) => A,
    options?: UseStoreOptions<A>,
  ): StoreValue<A>
}

declare module '@nanoslices/types' {
  interface NanoSlices<Slices extends Record<string, Slice> | Slice> {
    use: UseNanoSlices<Slices>
  }
}

const createUseStoreAtom = <M extends UnwrapSlices<any>>(model: M) => {
  return <A extends Store>(
    mapper: (model: M) => A,
    options: UseStoreOptions<A>,
  ): StoreValue<A> => {
    const store = useMemo(() => {
      const stores = mapper(model)
      if (Array.isArray(stores)) {
        return computed(stores, (...values) => values) as ReadableAtom<
          StoreValue<A>
        >
      }
      return stores
    }, [])

    return useStore(store, options)
  }
}

registerExtension((store) => ({
  use: createUseStoreAtom(store),
}))

export function useLocalStore<Local extends Slice, Context>(
  create: (slice: Slice<never, Context, never>) => Local,
  options?: NanoSlicesOptions<Local, Context>,
): NanoSlices<Local, Context> {
  const store = useMemo(
    () =>
      createStore(create(createSlice()), {
        ...options,
        // @ts-expect-error - devtools extension support
        name:
          // @ts-expect-error - devtools extension support
          options?.devtools && options?.name
            ? // @ts-expect-error - devtools extension support
              options.name + '-' + Date.now()
            : // @ts-expect-error - devtools extension support
              options?.name,
      }),
    [],
  )
  useEffect(() => {
    return store.destroy
  }, [store])
  return store
}
