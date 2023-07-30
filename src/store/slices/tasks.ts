import { persistentAtom, persistentMap } from '@nanostores/persistent'
import { createSlice } from '@nanoslices/core'

const asJson = {
  listen: false,
  encode(value: unknown) {
    return JSON.stringify(value)
  },
  decode(value: string) {
    try {
      return JSON.parse(value)
    } catch (err) {
      return value
    }
  },
}

export const tasks = createSlice()
  .state(() => ({
    keys: persistentAtom<string[]>('keys', [], asJson),
    tasks: persistentMap<{ [key: string]: { name: string; done: boolean } }>(
      'tasks.',
      {},
      asJson,
    ),
  }))
  .computed(({ slice, computed }) => ({
    empty: computed(
      () => [slice.keys],
      (keys) => !keys.length,
    ),
    flat: computed(
      () => [slice.tasks],
      (tasks) => Object.values(tasks),
    ),
  }))
  .actions(({ slice }) => ({
    addTask: (name: string) => {
      const key = Date.now().toFixed()

      slice.tasks.setKey(key, { name, done: false })
      slice.keys.set([...slice.keys.get(), key])
    },
    toggleTask: (taskId: string) => {
      slice.tasks.setKey(taskId, {
        ...slice.tasks.get()[taskId],
        done: !slice.tasks.get()[taskId].done,
      })
    },
    renameTask: (taskId: string, name: string) => {
      slice.tasks.setKey(taskId, {
        ...slice.tasks.get()[taskId],
        name,
      })
    },
    deleteTask: (taskId: string) => {
      const { [taskId]: _, ...tasks } = slice.tasks.get()
      slice.tasks.set(tasks)
      slice.keys.set(slice.keys.get().filter((key) => key !== taskId))
    },
  }))
