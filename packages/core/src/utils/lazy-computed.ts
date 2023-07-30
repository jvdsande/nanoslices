import { atom, onMount, ReadableAtom, Store, StoreValue } from 'nanostores'

type StoreValues<Stores extends Store[]> = {
  [Index in keyof Stores]: StoreValue<Stores[Index]>
}

export function lazyComputed<Value, OriginStores extends Store[]>(
  fnStores: () => [...OriginStores],
  cb: (...values: StoreValues<OriginStores>) => Value
): ReadableAtom<Value> {
  let diamondArgs: StoreValues<OriginStores>
  let stores: OriginStores
  const run = () => {
    const args = stores.map(store => store?.get()) as StoreValues<OriginStores>
    if (
      diamondArgs === undefined ||
      args.some((arg, i) => arg !== diamondArgs[i])
    ) {
      diamondArgs = args
      derived.set(cb(...args))
    }
  }
  const derived = atom(undefined as Value)

  onMount(derived, () => {
    stores = fnStores()
    // @ts-expect-error - nanostores internal field l
    derived.l = Math.max(...stores.map(s => s?.l ?? 0)) + 1
    // @ts-expect-error - nanostores internal field l
    const unbinds = stores.map(store => store?.listen(run, derived.l))
    run()
    return () => {
      for (const unbind of unbinds) unbind?.()
    }
  })

  return derived
}
