import type {} from '@redux-devtools/extension'
import { Slices } from './types'

import { ACTION_SPY } from './spy'
import { restoreSnapshot, snapshotModel } from './snapshot'

export const createDevTools = (name: string | undefined, model: Slices) => {
  const reset = snapshotModel(model)
  const redDev = window.__REDUX_DEVTOOLS_EXTENSION__?.connect({
    name: name ?? 'Nanoslices',
  })
  redDev?.init(reset)

  const connection = {
    send: (action: { type: string; payload?: unknown }) => {
      redDev?.send(action, snapshotModel(model))
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
            redDev?.init(snapshotModel(model))
          }

          if (opts.type === 'DISPATCH' && opts.payload.type === 'RESET') {
            restoreSnapshot(model, reset)
            redDev?.init(reset)
          }

          if (opts.type === 'DISPATCH' && opts.payload.type === 'ROLLBACK') {
            const reset: Record<string, unknown> = JSON.parse(opts.state)
            restoreSnapshot(model, reset)
            redDev?.init(reset)
          }

          if (
            opts.type === 'DISPATCH' &&
            opts.payload.type === 'JUMP_TO_ACTION'
          ) {
            const jumped: Record<string, unknown> = JSON.parse(opts.state)
            restoreSnapshot(model, jumped)
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
    subscribe: (slice: Record<string, unknown>) => {
      // @ts-expect-error - development hidden field
      slice[ACTION_SPY].subscribe((action) => {
        connection.send(action)
      })
      // @ts-expect-error - development hidden field
      connection.listen(slice[ACTION_SPY].__actions)
    }
  }

  return connection
}
