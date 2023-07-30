import {
  INITIALIZE,
  SLICE,
  Slice,
  SliceExtension,
  SliceHelpers,
} from '@nanoslices/types'

function ExtendedSlice(
  extensions: ((helpers: SliceHelpers<any, any, any>) => SliceExtension)[],
): Slice {
  return {
    define: (fields) =>
      ExtendedSlice([...extensions, fields as unknown as () => SliceExtension]),
    state: (state) =>
      ExtendedSlice([
        ...extensions,
        (opts) =>
          Object.fromEntries(
            Object.entries(state(opts)).map(([key, field]) => [key, field]),
          ),
      ]),
    actions: (actions) =>
      ExtendedSlice([
        ...extensions,
        (opts) =>
          Object.fromEntries(
            Object.entries(actions(opts)).map(([key, action]) => [
              key,
              opts.define.action(action),
            ]),
          ),
      ]),
    computed: (computed) =>
      ExtendedSlice([
        ...extensions,
        (opts) =>
          Object.fromEntries(
            Object.entries(
              computed({
                ...opts,
                computed: (listen, get) => opts.define.computed(listen, get),
              }),
            ).map(([key, comp]) => [key, comp]),
          ),
      ]),
    nested: (nested) =>
      ExtendedSlice([
        ...extensions,
        (opts) =>
          Object.fromEntries(
            Object.entries(nested(opts)).map(([key, nested]) => [
              key,
              opts.define.nested(nested),
            ]),
          ),
      ]),
    initialize: (init) => {
      return ExtendedSlice([
        ...extensions,
        () => ({ initialize: { [INITIALIZE]: init } }),
      ])
    },
    [SLICE]() {
      return extensions
    },
  }
}

export function createSlice<
  Context = never,
  Store extends Record<string, Slice> = {},
  // @ts-expect-error - ignored parameter
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
>(types?: {
  store?: Store
  context?: Context
}): Slice<never, NonNullable<Context>, NonNullable<Store>> {
  return ExtendedSlice([]) as unknown as Slice<
    never,
    NonNullable<Context>,
    NonNullable<Store>
  >
}
