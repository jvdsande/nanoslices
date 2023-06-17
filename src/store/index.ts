import { createStore } from '@nanoslices/core'
import '@nanoslices/react'
import '@nanoslices/devtools'

import { tasks } from './slices/tasks'
import { newTask } from './slices/new-task'
import { statistics } from './slices/statistics'

export const Store = createStore(
  { tasks, newTask, statistics },
  { devtools: true, name: 'Store' },
)
