import type {} from '@redux-devtools/extension'

export const createDevTools = <Snapshot>(
  name: string,
  takeSnapshot: () => Snapshot,
  restoreSnapshot: (snapshot: Snapshot) => void,
) => {
  const reset = takeSnapshot()
  const redDev = window.__REDUX_DEVTOOLS_EXTENSION__?.connect({
    name,
  })
  redDev?.init(reset)

  const connection = {
    send: (action: { type: string; payload?: unknown }) => {
      redDev?.send(action, takeSnapshot())
    },
    listen: (actions: { [key: string]: (...args: unknown[]) => unknown }) => {
      // @ts-expect-error - wrong typing on redux devtools
      redDev?.subscribe(
        (
          opts:
            | { type: 'ACTION'; payload: string }
            | {
                type: 'DISPATCH'
                payload: {
                  type: 'COMMIT' | 'RESET' | 'ROLLBACK' | 'JUMP_TO_ACTION'
                }
                state: string
              },
        ) => {
          if (opts.type === 'ACTION') {
            // eslint-disable-next-line no-eval
            const payload: { type: string; payload: unknown[] } = eval(
              `(${opts.payload})`,
            )

            if (actions[payload.type]) {
              actions[payload.type](...payload.payload)
            }
          }

          if (opts.type === 'DISPATCH' && opts.payload.type === 'COMMIT') {
            redDev?.init(takeSnapshot())
          }

          if (opts.type === 'DISPATCH' && opts.payload.type === 'RESET') {
            restoreSnapshot(reset)
            redDev?.init(reset)
          }

          if (opts.type === 'DISPATCH' && opts.payload.type === 'ROLLBACK') {
            const rollback: Snapshot = JSON.parse(opts.state)
            restoreSnapshot(rollback)
            redDev?.init(rollback)
          }

          if (
            opts.type === 'DISPATCH' &&
            opts.payload.type === 'JUMP_TO_ACTION'
          ) {
            const jumped: Snapshot = JSON.parse(opts.state)
            restoreSnapshot(jumped)
          }
        },
      )
    },
    snapshot: (state: Record<string, unknown>) => {
      connection.send({
        type: '@@SNAPSHOT',
        payload: state,
      })
    },
    subscribe: (actionSpy: {
      subscribe: (
        subscription: (action: { type: string; payload?: any }) => void,
      ) => () => void
    }) => {
      actionSpy.subscribe((action) => {
        connection.send(action)
      })
      connection.listen((actionSpy as any).__actions)
    },
  }

  return connection
}
