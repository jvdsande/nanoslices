import { Action, Actions, Slices } from './types'

export const ACTION_SPY = Symbol('actionSpy')

type ActionSpy = {
  __actions: Record<string, (...args: any[]) => any>
  __push(_: { type: string; payload: unknown, success?: unknown, fail?: unknown }): void
  subscribe(onAction: (a: { type: string; payload: unknown }) => void): void
}

export const subscribeToActions = (
  slice: Record<string, unknown>,
  path: string[],
  onSlice: (slice: Record<string, unknown>) => void,
) => {
  if (typeof slice === 'function' || !slice) {
    return
  }

  if (ACTION_SPY in slice) {
    if (onSlice) {
      onSlice(slice)
    } else {
      // @ts-expect-error - development hidden field
      slice[ACTION_SPY].subscribe(() => {
        // Do nothing
      })
    }
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

export const spyOnActions = (
  actions: Actions,
  path: string[],
  slice: Slices,
) => {
  // @ts-expect-error - development hidden field
  const devtools = slice[ACTION_SPY] as ActionSpy
  Object.keys(actions).forEach((key) => {
    if (typeof actions[key] === 'function') {
      const impl = actions[key] as Action
      actions[key] = (...args: Parameters<typeof impl>) => {
        const ret = impl(...args)

        devtools.__push({
          type: ['@action', ...path, key].join('.'),
          payload: args,
        })

        if (ret && 'then' in ret && 'catch' in ret) {
          Promise.resolve(ret)
            .then((success) => {
              devtools.__push({
                type: ['@action', ...path, key + '(success)'].join('.'),
                payload: args,
                success,
              })
            })
            .catch((fail) => {
              devtools.__push({
                type: ['@action', ...path, key + '(fail)'].join('.'),
                payload: args,
                fail,
              })
            })
        }

        return ret
      }
      devtools.__actions[['@action', ...path, key].join('.')] = actions[key] as (...args: any[]) => any
    } else {
      spyOnActions(actions[key] as Actions, [...path, key], slice)
    }
  })

  return actions
}

export const prepareActionSpy = (model: any) => {
  model[ACTION_SPY] = (): ActionSpy => {
    const devtools = {
      __actions: {},
      __push(_: { type: string; payload: unknown }) {
        // Does nothing by default
      },
      subscribe(onAction: (a: { type: string; payload: unknown }) => void) {
        devtools.__push = onAction
      },
    }

    return devtools
  }

  return model
}
