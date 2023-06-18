import { describe, it, expect } from 'vitest'
import { createStore } from '@nanoslices/core'

import { tasks } from './tasks.ts'
import { newTask } from './new-task.ts'

describe('the newTask slice', () => {
  it('should allow reading and setting a string value', () => {
    const Store = createStore({ newTask })

    expect(Store.get((store) => store.newTask.value)).toBe('')

    Store.act((store) => store.newTask.setValue('hello world'))

    expect(Store.get((store) => store.newTask.value)).toBe('hello world')
  })

  it('should compute a valid property set to true if a value is set', () => {
    const Store = createStore({ newTask })

    expect(Store.get((store) => store.newTask.valid)).toBe(false)

    Store.act((store) => store.newTask.setValue('hello world'))

    expect(Store.get((store) => store.newTask.valid)).toBe(true)
  })

  it('should expose a submit action that resets the value and calls the addTask action of the tasks slice', () => {
    const Store = createStore({ newTask, tasks })

    expect(Store.get((store) => store.tasks.empty)).toBe(true)

    Store.act((store) => store.newTask.setValue('hello world'))

    expect(Store.get((store) => store.newTask.value)).toBe('hello world')
    expect(Store.get((store) => store.tasks.empty)).toBe(true)

    Store.act((store) => store.newTask.submit())

    expect(Store.get((store) => store.newTask.value)).toBe('')
    expect(Store.get((store) => store.tasks.empty)).toBe(false)
    expect(Store.get((store) => store.tasks.flat)[0].name).toBe('hello world')
  })
})
