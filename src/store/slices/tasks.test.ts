import { describe, it, expect, beforeEach } from 'vitest'
import { createStore } from '@nanoslices/core'

import { tasks } from './tasks.ts'

describe('the task slice', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('should expose a map of tasks', () => {
    const Store = createStore({ tasks })

    expect(Store.get((store) => store.tasks.tasks)).toEqual({})
  })

  it('should compute a flat list of tasks', () => {
    const Store = createStore({ tasks })

    expect(Store.get((store) => store.tasks.flat)).toEqual([])
  })

  it('should expose an action to add a task', () => {
    const Store = createStore({ tasks })

    expect(Store.get((store) => store.tasks.flat)).toEqual([])

    Store.act((store) => store.tasks.addTask('Addition test'))

    expect(Store.get((store) => store.tasks.flat)).toContainEqual(expect.objectContaining({
      id: expect.any(Number),
      name: 'Addition test',
      done: false,
    }))
  })

  it('should compute an empty property telling if the list is empty', () => {
    const Store = createStore({ tasks })

    expect(Store.get((store) => store.tasks.empty)).toBe(true)

    Store.act((store) => store.tasks.addTask('Empty test'))

    expect(Store.get((store) => store.tasks.empty)).toBe(false)
  })

  it('should expose an action to toggle a task status', () => {
    const Store = createStore({ tasks })

    Store.act((store) => store.tasks.addTask('Toggle test'))

    const taskId = Store.get((store) => store.tasks.flat)[0].id
    expect(Store.get((store) => store.tasks.flat)[0].done).toBe(false)

    Store.act((store) => store.tasks.toggleTask(taskId))

    expect(Store.get((store) => store.tasks.flat)[0].done).toBe(true)

    Store.act((store) => store.tasks.toggleTask(taskId))

    expect(Store.get((store) => store.tasks.flat)[0].done).toBe(false)
  })

  it('should expose an action to rename a task', () => {
    const Store = createStore({ tasks })

    Store.act((store) => store.tasks.addTask('Rename test'))

    const taskId = Store.get((store) => store.tasks.flat)[0].id
    expect(Store.get((store) => store.tasks.flat)[0].name).toBe('Rename test')

    Store.act((store) => store.tasks.renameTask(taskId, 'New name'))

    expect(Store.get((store) => store.tasks.flat)[0].name).toBe('New name')
  })

  it('should expose an action to delete a task', () => {
    const Store = createStore({ tasks })

    Store.act((store) => store.tasks.addTask('Delete test'))

    expect(Store.get((store) => store.tasks.flat)[0]).toBeDefined()
    const taskId = Store.get((store) => store.tasks.flat)[0].id

    Store.act((store) => store.tasks.deleteTask(taskId))

    expect(Store.get((store) => store.tasks.flat)[0]).toBeUndefined()
  })
})
