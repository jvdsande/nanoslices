import { registerExtension } from '@nanoslices/core'

import { createDevTools } from './devtools'

declare module '@nanoslices/types' {
  interface NanoSlicesOptions {
    devtools?: boolean
    name?: string
  }
}

export * from '@nanoslices/core'

registerExtension((_, options, extensionOptions) => {
  let connection: ReturnType<typeof createDevTools>

  if (options?.devtools) {
    connection = createDevTools(
      options?.name ?? 'Nanoslices',
      extensionOptions.takeSnapshot,
      extensionOptions.restoreSnapshot,
    )
    extensionOptions.subscribeToActions(connection.send, connection.listen)
    extensionOptions.onDestroy(() => {
      connection.destroy()
    })
  }

  return {
    reset(snapshot?: typeof options.snapshot) {
      extensionOptions.restoreSnapshot(
        snapshot ?? extensionOptions.initialState,
      )
      connection?.snapshot(snapshot ?? extensionOptions.initialState)
    },
  }
})
