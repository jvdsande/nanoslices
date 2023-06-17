import { registerExtension } from '@nanoslices/core'
import { StoreSnapshot } from '@nanoslices/types'

import { createDevTools } from './devtools'

declare module '@nanoslices/types' {
  interface NanoSlicesOptions<C> {
    devtools?: boolean
    name?: string
  }
}

export * from '@nanoslices/core'

registerExtension((store, options, extensionOptions) => {
  let connection: ReturnType<typeof createDevTools>

  if (options?.devtools) {
    connection = createDevTools(
      options?.name ?? 'Nanoslices',
      extensionOptions.takeSnapshot,
      extensionOptions.restoreSnapshot,
    )
    extensionOptions.subscribeToActions(connection.subscribe)
  }

  return {
    reset(snapshot?: StoreSnapshot<typeof store>) {
      extensionOptions.restoreSnapshot(
        snapshot ?? extensionOptions.initialState,
      )
      connection?.snapshot(snapshot ?? extensionOptions.initialState)
    },
  }
})
