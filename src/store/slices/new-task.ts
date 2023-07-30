import { atom } from 'nanostores'
import { createSlice, update } from '@nanoslices/core'

import { tasks } from './tasks'

export const newTask = createSlice({
  store: { tasks },
})
  .state(() => ({
    value: atom('')
  }))
  .computed(({ slice, computed }) => ({
    valid: computed(() => [slice.value], (value) => !!value),
  }))
  .actions(({ slice }) => ({
    setValue: update(slice.value)
  }))
  .actions(({ slice, store }) => ({
    submit: () => {
      if (slice.valid.get()) {
        store.tasks.addTask(slice.value.get())
        slice.setValue('')
      }
    }
  }))
  .initialize(() => console.log('initialize1'))
  .initialize(() => console.log('initialize2'))
  .initialize(() => console.log('initialize3'))
