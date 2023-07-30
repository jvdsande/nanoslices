import { Slice, WritableStoreSnapshot } from '@nanoslices/types'
import { registerExtension } from '@nanoslices/core'

type Spy<Slices extends Record<string, Slice> | Slice, Context> = (options: {
  reset?: (cb: () => void) => void
  restore?: (cb: () => void) => void
  context?: Context
  snapshot?: WritableStoreSnapshot<Slices>
}) => {
  context: (context: Context) => void
  snapshot: (snapshot: WritableStoreSnapshot<Slices>) => void
  clear: () => void
  reset: () => void
  restore: () => void
  history: { type: string; payload?: Record<string, any> }[]
}

declare module '@nanoslices/types' {
  interface NanoSlicesOptions {
    spyEnabled?: boolean
  }

  interface NanoSlices<Slices extends Record<string, Slice> | Slice, Context> {
    spy: Spy<Slices, Context>
  }
}

export * from '@nanoslices/core'

registerExtension((_, options, extensionOptions) => {
  type Slices = Record<string, Slice>
  type Context = any

  const enabled = options?.spyEnabled ?? true

  return {
    spy: (spyOptions: Parameters<Spy<Slices, Context>>[0]) => {
      if (!enabled) {
        console.error('Cannot spy on this store')
        return {
          history: [],
          clear: () => null,
          snapshot: () => null,
          context: () => null,
          reset: () => null,
          restore: () => null,
        }
      }

      const history: { type: string }[] = []
      const unsubscribe = extensionOptions.subscribeToActions((action) => {
        history.push(action)
      })

      const context = (context: Context) => {
        extensionOptions.replaceContext(context as Context)
      }
      const snapshot = (state?: WritableStoreSnapshot<Slices>) => {
        extensionOptions.restoreSnapshot(
          (state ??
            spyOptions?.snapshot ??
            extensionOptions.initialState) as any,
        )
      }
      const clear = () => {
        history.length = 0
      }
      const reset = () => {
        snapshot()
        clear()
        context(spyOptions?.context as Context)
      }

      const restore = () => {
        options = {}
        reset()
        unsubscribe()

        spyMethods.clear = () => null
        spyMethods.snapshot = () => null
        spyMethods.context = () => null
        spyMethods.reset = () => null
      }

      const spyMethods = {
        history,
        clear,
        snapshot,
        context,
        reset,
        restore,
      }

      spyOptions?.reset?.(() => {
        reset()
      })
      spyOptions?.restore?.(() => {
        restore()
      })

      reset()

      return spyMethods
    },
  }
})
