import { Store, WritableStore } from 'nanostores'
import {
  Slice,
  SliceExtension,
  StoreSnapshot,
  UnwrapSlices,
} from '@nanoslices/types'

const isGettable = (atom: Store | SliceExtension): atom is Store => {
  return 'get' in atom
}

export const takeSnapshot: <Slices extends Record<string, Slice> | Slice>(
  model: UnwrapSlices<Slices>,
) => StoreSnapshot<Slices> = <Slices extends Record<string, Slice> | Slice>(
  model: UnwrapSlices<Slices>,
) => {
  const state: Record<string, any> = {}

  Object.keys(model).forEach((key) => {
    const atom = model[key]

    if (typeof atom === 'function' || !atom) {
      return
    }

    if (isGettable(atom)) {
      const value = atom.get()

      if (Array.isArray(value)) {
        state[key] = [...value]
      } else if (typeof value === 'object') {
        state[key] = {...value}
      } else {
        state[key] = value
      }
    } else if (typeof model[key] === 'object') {
      state[key] = takeSnapshot(atom as any)
    }
  })

  return state as StoreSnapshot<Slices>
}

const isWritable = (atom: Store | SliceExtension): atom is WritableStore => {
  return 'get' in atom && 'set' in atom
}

export const restoreSnapshot = (
  model: SliceExtension,
  state: Record<string, unknown>,
) => {
  const restoreAtom = (atom: Store | SliceExtension, state: unknown) => {
    if (isWritable(atom)) {
      atom.set(state)
    } else if (state && typeof state === 'object') {
      Object.keys(state).forEach((key) => {
        restoreAtom(
          atom[key as keyof typeof atom],
          state[key as keyof typeof state],
        )
      })
    }
  }

  restoreAtom(model, state)
}
