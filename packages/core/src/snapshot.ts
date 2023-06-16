import {Slices} from "./types";
import {Store, WritableStore} from "nanostores";

export const snapshotModel = (model: Slices) => {
  const state = {}

  Object.keys(model).forEach((key) => {
    if (typeof model[key] === 'function' || !model[key]) {
      return
    }
    if ('get' in model[key]) {
      // @ts-expect-error - read state
      state[key] = model[key].get()
    } else if (typeof model[key] === 'object') {
      // @ts-expect-error - read state
      state[key] = snapshotModel(model[key])
    }
  })

  return state
}

export const restoreSnapshot = (
  model: Slices,
  state: Record<string, unknown>,
) => {
  const restoreAtom = (atom: Store | Slices, state: unknown) => {
    if ('get' in atom && 'set' in atom) {
      (atom as WritableStore).set(state)
    } else if (state && typeof state === 'object') {
      Object.keys(state).forEach((key) => {
        restoreAtom(
          atom[key as keyof typeof atom],
          state[key as keyof typeof state] as Record<string, unknown>,
        )
      })
    }
  }

  restoreAtom(model, state)
}
