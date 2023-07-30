import { createStore } from '@nanoslices/core'
import '@nanoslices/react'
import '@nanoslices/devtools'

import { tasks } from './slices/tasks'
import { newTask } from './slices/new-task'
import { statistics } from './slices/statistics'
import { loaders } from './slices/loaders.ts'

import { Context } from './context.ts'

export const Store = createStore(
  {
    tasks,
    newTask,
    statistics,
    loaders,
  },
  {
    devtools: true,
    name: 'Store',
    context: Context,
  }
).initialize()
