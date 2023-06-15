import type {} from '@redux-devtools/extension'
import { Store, WritableStore } from 'nanostores'
import { Action, Actions, Slices } from './types'

export const DEVTOOL = Symbol()

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
  }

  return connection
}

export const subscribeDevTools = (
  connection: ReturnType<typeof createDevTools>,
) => {
  return (slice: Record<string, unknown>) => {
    // @ts-expect-error - development hidden field
    slice[DEVTOOL].subscribe((action) => {
      connection.send(action)
    })
    // @ts-expect-error - development hidden field
    connection.listen(slice[DEVTOOL].__actions)
  }
}

export const subscribeToActions = (
  slice: Record<string, unknown>,
  path: string[],
  onSlice: (slice: Record<string, unknown>) => void,
) => {
  if (typeof slice === 'function' || !slice) {
    return
  }

  // @ts-expect-error - development hidden field
  if (slice[DEVTOOL]) {
    onSlice(slice)
  }

  if (!('get' in slice) && !('subscribe' in slice)) {
    Object.keys(slice).forEach((k) =>
      subscribeToActions(
        slice[k] as Record<string, unknown>,
        [...path, k],
        onSlice,
      ),
    )
  }
}

export const snapshotModel = (model: Slices) => {
  const state = {}

  Object.keys(model).forEach((key) => {
    if (typeof model[key] === 'function' || !model[key]) {
      return
    }
    if ('get' in model[key]) {
      // @ts-expect-error - read state
      state[key] = model[key].get()
    } else if (typeof model[key] === 'object') {
      // @ts-expect-error - read state
      state[key] = snapshotModel(model[key])
    }
  })

  return state
}

export const restoreSnapshot = (
  model: Slices,
  state: Record<string, unknown>,
) => {
  const restoreAtom = (atom: Store | Slices, state: unknown) => {
    if ('get' in atom && 'set' in atom) {
      (atom as WritableStore).set(state)
    } else if (state && typeof state === 'object') {
      Object.keys(state).forEach((key) => {
        restoreAtom(
          atom[key as keyof typeof atom],
          state[key as keyof typeof state] as Record<string, unknown>,
        )
      })
    }
  }

  restoreAtom(model, state)
}

export const installActionsSpies = (
  slice: Actions,
  path: string[],
  model: Slices,
) => {
  // @ts-expect-error - development hidden field
  const devtools = model[DEVTOOL]
  Object.keys(slice).forEach((_key) => {
    const key = _key as keyof typeof slice
    if (typeof slice[key] === 'function') {
      const impl = slice[key] as Action
      slice[key] = (...args: Parameters<typeof impl>) => {
        // @ts-expect-error - development hidden field
        devtools.__push({
          type: ['@action', ...path, _key].join('.'),
          payload: args,
        })

        const ret = impl(...args)

        if (ret && 'then' in ret && 'catch' in ret) {
          Promise.resolve(ret)
            .then((success) => {
              // @ts-expect-error - development hidden field
              devtools.__push({
                type: ['@action', ...path, _key + '(success)'].join('.'),
                payload: args,
                success,
              })
            })
            .catch((fail) => {
              // @ts-expect-error - development hidden field
              devtools.__push({
                type: ['@action', ...path, _key + '(fail)'].join('.'),
                payload: args,
                fail,
              })
            })
        }

        return ret
      }
      // @ts-expect-error - development hidden field
      devtools.__actions[['@action', ...path, _key].join('.')] = slice[key]
    } else {
      installActionsSpies(slice[key] as Actions, [...path, _key], model)
    }
  })

  return slice
}

export const prepareSpyHelpers = (model: any) => {
  const devtools = {
    __actions: {},
    __push(_: { type: string; payload: unknown }) {
      // Does nothing by default
    },
    subscribe(onAction: (a: { type: string; payload: unknown }) => void) {
      devtools.__push = onAction
    },
  }

  model[DEVTOOL] = devtools

  return model
}
