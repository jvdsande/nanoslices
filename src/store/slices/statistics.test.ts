import { expect } from 'vitest'
import { createStore } from '@nanoslices/core'
import '@nanoslices/spy'

import { tasks } from './tasks.ts'
import { statistics } from './statistics.ts'

describe('the statistic slice', () => {
  const Store = createStore({ tasks, statistics })
  const StoreSpy = Store.spy({
    reset: beforeEach,
    snapshot: {
      tasks: {
        keys: ['1', '2'],
        tasks: {
          '1': { name: 'Task 1', done: true },
          '2': { name: 'Task 2', done: false },
        }
      }
    }
  })

  it('should compute the total number of tasks', () => {
    expect(Store.get((store) => store.statistics.total)).toBe(2)
  })

  it('should compute the number of completed tasks', () => {
    expect(Store.get((store) => store.statistics.done)).toBe(1)

    StoreSpy.snapshot({
      tasks: {
        keys: ['1', '2'],
        tasks: {
          '1': { name: 'Task 1', done: true },
          '2': { name: 'Task 2', done: true },
        }
      }
    })

    expect(Store.get((store) => store.statistics.done)).toBe(2)
  })

  it('should compute the current progress', () => {
    expect(Store.get((store) => store.statistics.progress)).toEqual(50)

    StoreSpy.snapshot({
      tasks: {
        keys: ['1', '2', '3', '4'],
        tasks: {
          '1': { name: 'Task 1', done: true },
          '2': { name: 'Task 2', done: false },
          '3': { name: 'Task 3', done: false },
          '4': { name: 'Task 4', done: false },
        }
      }
    })

    expect(Store.get((store) => store.statistics.progress)).toEqual(25)

    StoreSpy.snapshot({
      tasks: {
        tasks: {}
      }
    })

    expect(Store.get((store) => store.statistics.progress)).toEqual(0)
  })
})
