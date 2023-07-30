import { StoreValue, WritableStore } from 'nanostores'

const set = <A extends WritableStore>(value: StoreValue<A>, atom: A): void =>
  atom.set(value)

export const update =
  <
    A extends WritableStore,
    Fn extends (value: StoreValue<A>, atom: A) => any = (
      value: StoreValue<A>,
      atom: A,
    ) => void,
  >(
    atom: A,
    next: Fn = set as Fn,
  ): ((value: StoreValue<A>) => ReturnType<Fn>) =>
    (value: StoreValue<A>) =>
      next(value, atom)
