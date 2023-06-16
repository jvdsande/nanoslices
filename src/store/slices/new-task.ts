import { atom, computed } from 'nanostores'
import { createSlice, update } from '@nanoslices/core'

import { tasks } from './tasks'

export const newTask = createSlice(() => ({
  value: atom(''),
}))
  .slices({ tasks })
  .computed((slice) => ({
    valid: computed(slice.value, (value) => !!value),
  }))
  .actions((slice) => ({
    setValue: update(slice.value),
  }))
  .actions((slice, { slices }) => ({
    submit: () => {
      if (slice.valid.get()) {
        slices.tasks.addTask(slice.value.get())
        slice.setValue('')
      }
    },
  }))
