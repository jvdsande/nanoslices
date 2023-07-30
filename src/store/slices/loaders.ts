import { createSlice } from '@nanoslices/core'
import { resourceLoader } from '@nanoslices/resource-loader'
import { Context } from '../context.ts'

export const loaders = createSlice({
  context: Context,
})
  .nested(() => ({
    single: resourceLoader.single({
      async fetch(context) {
        return context.get().service.getNumber()
      },
      pollingInterval: 5000,
    }),
    mutation: resourceLoader.mutation({
      async mutate(context) {
        return context.get().service.getString()
      },
    }),
  }))
  .nested(({ slice }) => ({
    mapped: resourceLoader.mapped({
      async fetch(id, context, params: { param: number }) {
        return context.get().service.getNumber(id, params.param)
      },
      pollingInterval: 5000,
      transform: {
        dependencies: [slice.single.read()],
        resolver(resource, single) {
          return {
            ...resource,
            single: single?.data?.value,
            double: resource?.value ? resource.value * 2 : 0,
          }
        },
      },
    }),
  }))
