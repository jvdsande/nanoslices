import {
  DeepPartial,
  Slices,
  StoreSnapshot,
} from '@nanoslices/types'
import { registerExtension } from '@nanoslices/core'

type Spy<M extends Slices, C> = (options: {
  reset?: (cb: () => void) => void
  restore?: (cb: () => void) => void
  context?: DeepPartial<C>
  snapshot?: DeepPartial<
    StoreSnapshot<M> extends infer U
      ? { [key in keyof U]: U[key] }
      : never
  >
}) => {
  context: (context: DeepPartial<C>) => void
  snapshot: (
    snapshot: DeepPartial<
      StoreSnapshot<M> extends infer U
        ? { [key in keyof U]: U[key] }
        : never
    >,
  ) => void
  clear: () => void
  reset: () => void
  restore: () => void
  history: { type: string; payload?: Record<string, any> }[]
}

declare module '@nanoslices/types' {
  interface NanoSlicesOptions<C> {
    spyEnabled?: boolean
  }

  interface NanoSlices<M extends Slices, C> {
    spy: Spy<M, C>
  }
}

export * from '@nanoslices/core'

registerExtension((store, options, extensionOptions) => {
  type M = typeof store
  type C = any

  const enabled = options?.spyEnabled ?? true

  return {
    spy: (spyOptions: Parameters<Spy<M, C>>[0]) => {
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
      const subscriptions: (() => void)[] = []
      extensionOptions.subscribeToActions((actionSpy) => {
        subscriptions.push(
          actionSpy.subscribe((action) => {
            history.push(action)
          }),
        )
      })

      const context = (context: DeepPartial<C>) => {
        extensionOptions.replaceContext(context as C)
      }
      const snapshot = (
        state?: DeepPartial<
          StoreSnapshot<M>
        >,
      ) => {
        extensionOptions.restoreSnapshot(
          (state ?? spyOptions?.snapshot ?? extensionOptions.initialState) as DeepPartial<
            StoreSnapshot<M>
          >
        )
      }
      const clear = () => {
        history.length = 0
      }
      const reset = () => {
        snapshot()
        clear()
        context(spyOptions?.context as DeepPartial<C>)
      }

      const restore = () => {
        options = {}
        reset()
        subscriptions.forEach((subscribe) => subscribe())

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
