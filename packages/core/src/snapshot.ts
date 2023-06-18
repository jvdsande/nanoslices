import { State } from '@nanoslices/types'
import { Store, WritableStore } from 'nanostores'

const isGettable = (atom: Store | State): atom is Store => {
  return 'get' in atom
}

export const takeSnapshot = (model: State) => {
  const state: Record<string, any> = {}

  Object.keys(model).forEach((key) => {
    const atom = model[key]

    if (typeof atom === 'function' || !atom) {
      return
    }

    if (isGettable(atom)) {
      state[key] = atom.get()
    } else if (typeof model[key] === 'object') {
      state[key] = takeSnapshot(atom)
    }
  })

  return state
}

const isWritable = (atom: Store | State): atom is WritableStore => {
  return 'get' in atom && 'set' in atom
}

export const restoreSnapshot = (
  model: State,
  state: Record<string, unknown>,
) => {
  const restoreAtom = (atom: Store | State, state: unknown) => {
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
