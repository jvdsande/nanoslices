import { createStore } from '@nanoslices/react'

import { tasks } from './slices/tasks'
import { newTask } from './slices/new-task'
import { statistics } from './slices/statistics'

export const Store = createStore(
  { tasks, nested: { newTask }, statistics },
  { devtools: true },
)