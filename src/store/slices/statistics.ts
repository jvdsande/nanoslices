import { computed } from 'nanostores'
import { createSlice } from '@nanoslices/core'

import { tasks } from './tasks'

export const statistics = createSlice({})
  .slices({ tasks })
  .computed((_, { slices }) => ({
    total: computed(slices.tasks.flat, (flat) => flat.length),
    done: computed(
      slices.tasks.flat,
      (flat) => flat.filter((task) => task.done).length,
    ),
  }))
  .computed((slice) => ({
    progress: computed(
      [slice.total, slice.done],
      (total, done) => Math.round(done * 100) / (total || 1),
    ),
  }))
  .initialize()
