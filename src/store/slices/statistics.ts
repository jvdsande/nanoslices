import { createSlice } from '@nanoslices/core'

import { tasks } from './tasks'

export const statistics = createSlice({ store: { tasks }})
  .computed(({ store, computed }) => ({
    total: computed(() => [store.tasks.flat], (flat) => flat.length),
    done: computed(
      () => [store.tasks.flat],
      (flat) => flat.filter((task) => task.done).length,
    ),
  }))
  .computed(({ slice, computed }) => ({
    progress: computed(
      () => [slice.total, slice.done],
      (total, done) => Math.round(done * 100) / (total || 1),
    ),
  }))
