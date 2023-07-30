import {
  atom,
  computed,
  map,
  MapStore,
  onMount,
  ReadableAtom,
  Store,
  StoreValue,
} from 'nanostores'
import { Slice } from '@nanoslices/types'

type ResourceMetadata = {
  refreshing: boolean
  refreshedOn: Date
}
export type ResourceError = {
  error: Error
  data: null
}
export type ResourceData<Model> = {
  error: null
  data: Model
}

export type Resource<Model> =
  | null
  | (ResourceMetadata & ResourceError)
  | (ResourceMetadata & ResourceData<Model>)

export type StoreValues<Stores extends Store[]> = {
  [Index in keyof Stores]: StoreValue<Stores[Index]>
}

export const LOADER = Symbol()

export function createResourceLoader<
  ApiModel,
  ViewModel,
  Params,
  Dependencies extends Store[],
  Context = never,
  Slices extends Record<string, Slice> = never,
>(
  original: Slice<any, Context, Slices>,
  options: {
    fetch: (
      id: string,
      context: ReadableAtom<Context>,
      params: Params,
    ) => Promise<ApiModel>
    pollingInterval?:
      | number
      | ((resource: Resource<ViewModel>, id: string) => number)
    ttl?: number
    transform?: {
      resolver: (
        resource: ApiModel | null,
        ...dependencies: StoreValues<Dependencies>
      ) => ViewModel
      dependencies?: Dependencies
    }
  },
): {
  read: Store<Map<string, ReadableAtom<Resource<ViewModel>>>>
  listen: Store<Map<string, ReadableAtom<Resource<ViewModel>>>>
  resources: Store<
    Map<string, MapStore<NonNullable<Resource<ApiModel> & { loaded: boolean }>>>
  >
  params: Store<Map<string, Params>>
  createResource: (id: string) => void
  devtools: {
    [key: string]: ReadableAtom<NonNullable<
      Resource<ViewModel> & { raw: ApiModel | null }
    > | null>
  }
  extended: Slice
} {
  let context: ReadableAtom<Context>
  const resources = atom(
    new Map<
      string,
      MapStore<NonNullable<Resource<ApiModel> & { loaded: boolean }>>
    >(),
  )
  const read = atom(new Map<string, ReadableAtom<Resource<ViewModel>>>())
  const listen = atom(new Map<string, ReadableAtom<Resource<ViewModel>>>())
  const release: { [key: string]: () => void } = {}
  const devtools: {
    [key: string]: ReadableAtom<NonNullable<
      Resource<ViewModel> & { raw: ApiModel | null }
    > | null>
  } = {}
  const params = atom(new Map<string, Params>())

  const transform = options?.transform
  const runPromises = atom(new Map<string, Promise<void>>())
  const ttlPromises = atom(new Map<string, Promise<void>>())

  async function loadResource(id: string, params: Params) {
    if (runPromises.get().get(id)) {
      return runPromises.get().get(id)
    }
    if (resources.get().get(id)) {
      const promise = options
        .fetch(id, context, params as Params)
        .then((data) => {
          actions.setResource(id, {
            data,
            error: null,
          })
        })
        .catch((error) => {
          actions.setResource(id, {
            data: null,
            error,
          })
        })
        .finally(() => {
          runPromises.get().delete(id)
          if (!options.ttl) {
            ttlPromises.get().delete(id)
          } else if (options.ttl !== Number.POSITIVE_INFINITY) {
            setTimeout(() => {
              ttlPromises.get().delete(id)
            }, options.ttl)
          }
        })
      runPromises.get().set(id, promise)
      ttlPromises.get().set(id, promise)
      await promise
    }
  }
  function listenTo(id: string) {
    release[id]?.()
    release[id] = onMount(listen.get().get(id) as Store, () => {
      let mounted = true
      let timeout = 0

      const loop = async () => {
        if (!mounted) {
          return
        }

        await actions.refresh(
          ...([id, params.get().get(id)] as [Params] extends [never]
            ? [id: string]
            : [id: string, params: Params]),
        )
        const polling =
          typeof options.pollingInterval === 'function'
            ? options.pollingInterval(
                read.get().get(id)?.get() as Resource<ViewModel>,
                id,
              )
            : options.pollingInterval

        if (polling && polling > 0) {
          timeout = window.setTimeout(loop, polling)
        }
      }
      window.setTimeout(loop)

      return () => {
        mounted = false
        window.clearTimeout(timeout)
      }
    })
  }
  function createResource(id: string) {
    resources.get().set(
      id,
      resources.get().get(id) ??
        map({
          data: null,
          error: null,
          refreshing: false,
          refreshedOn: null,
        }),
    )
    read.get().set(
      id,
      read.get().get(id) ??
        computed(
          [
            resources.get().get(id) as Store,
            ...((transform?.dependencies ?? []) as []),
          ],
          (v, ...deps) =>
            v.loaded
              ? {
                  error: v.error,
                  data: transform?.resolver
                    ? (transform.resolver(
                        { ...v.data },
                        ...(deps as StoreValues<Dependencies>),
                      ) as ViewModel)
                    : (v.data as ViewModel),
                  refreshing: v.refreshing,
                  refreshedOn: v.refreshedOn,
                }
              : null,
        ),
    )
    listen
      .get()
      .set(
        id,
        listen.get().get(id) ?? computed(read.get().get(id) as Store, (v) => v),
      )
    listenTo(id)
    devtools[id] =
      devtools[id] ??
      computed(
        [resources.get().get(id) as Store, read.get().get(id) as Store],
        (api, view) =>
          view
            ? {
                raw: api.data,
                ...view,
              }
            : null,
      )
  }

  const actions = {
    setResource(
      id: string,
      resource: {
        data: ApiModel | null
        error: Error | null
      },
    ) {
      resources
        .get()
        .get(id)
        ?.set({
          ...(resource as ResourceData<ApiModel>),
          refreshing: false,
          refreshedOn: new Date(),
          loaded: true,
        })
    },
    async refresh(
      ...args: [Params] extends [never]
        ? [id: string]
        : [id: string, params: Params]
    ) {
      const [id] = args

      createResource(id)
      resources.get().get(id)?.setKey('refreshing', true)

      await loadResource(id, args[1] as Params)
      return (read.get().get(id) as Store).get()
    },
  }

  const promises = {
    run: runPromises,
    ttl: ttlPromises,
  }

  return {
    read,
    listen,
    resources,
    params,
    createResource,
    devtools,
    extended: original
      .state(() => ({
        resources: devtools,
      }))
      .nested(() => ({
        _system: (slice) =>
          slice.state(() => ({
            resources,
            read,
            listen,
            params,
            promises,
          })),
      }))
      .actions(() => actions)
      .state(({ slice, context: receivedContext }) => {
        actions.refresh = slice.refresh
        actions.setResource = slice.setResource
        context = receivedContext as ReadableAtom<Context>

        return {}
      }),
  }
}

export function mockResources(
  resources: Record<
    string,
    | { data: any; refreshing?: false; refreshedOn?: Date }
    | { error: any; refreshing?: false; refreshedOn?: Date }
  >,
) {
  return {
    _system: {
      resources: Object.fromEntries(
        Object.entries(resources).map(([key, value]) => [
          key,
          atom({
            loaded: true,
            ...value,
          }),
        ]),
      ),
    },
  } as unknown as { read: undefined }
}
