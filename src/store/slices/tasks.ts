import { computed } from 'nanostores'
import { persistentMap } from '@nanostores/persistent'
import { createSlice } from '@nanoslices/core'

export const tasks = createSlice(() => ({
  tasks: persistentMap<{
    [key: number]: {
      name: string
      done: boolean
    }
  }>(
    'tasks',
    {},
    {
      encode(value) {
        return JSON.stringify(value)
      },
      decode(value) {
        try {
          return JSON.parse(value)
        } catch (err) {
          return value
        }
      },
    },
  ),
}))
  .computed((slice) => ({
    flat: computed([slice.tasks], (tasks) =>
      Object.entries(tasks)
        .map(([id, task]) => ({ ...task, id: +id }))
        .sort((a, b) => a.id - b.id),
    ),
  }))
  .computed((slice) => ({
    empty: computed([slice.flat], (flat) => !flat.length),
  }))
  .actions((slice) => ({
    addTask: (name: string) =>
      slice.tasks.setKey(Date.now(), { name, done: false }),
    toggleTask: (taskId: number) => {
      const task = slice.tasks.get()[taskId]
      slice.tasks.setKey(taskId, { ...task, done: !task.done })
    },
    renameTask: (taskId: number, name: string) => {
      const task = slice.tasks.get()[taskId]
      slice.tasks.setKey(taskId, { ...task, name })
    },
    deleteTask: (taskId: number) => {
      const { [taskId]: task, ...tasks } = slice.tasks.get()
      slice.tasks.set(tasks)
    },
  }))
