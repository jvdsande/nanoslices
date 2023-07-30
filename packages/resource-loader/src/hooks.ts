import { useEffect, useMemo } from 'react'
import '@nanoslices/react'
import { NanoSlices, Slice, UnwrapSlices } from '@nanoslices/types'
import { SingleResourceLoader } from './single'
import { MappedResourceLoader } from './mapped'
import { MutationResource, MutationResourceLoader } from './mutation'
import { Resource } from './shared'

export function useSingleLoader<
  Store extends Record<string, Slice>,
  Loader extends SingleResourceLoader<any, any>,
  Model extends Loader extends SingleResourceLoader<infer M, any> ? M : never,
  Params extends Loader extends SingleResourceLoader<any, infer P> ? P : never,
>(
  store: NanoSlices<Store>,
  mapper: (store: UnwrapSlices<Store>) => Loader,
  ...args: [unknown] extends [Params]
    ? [options?: { listen: boolean }]
    : [
        options:
          | {
              listen?: boolean
              params: Params
            }
          | {
              listen: false
              params?: Params
            },
      ]
): [
  Resource<Model>,
  [unknown] extends [Params]
    ? () => Resource<Model>
    : (params: Params & (Loader extends MappedResourceLoader<any, infer P> ? P : never)) => Resource<Model>,
] {
  const [options] = args
  return [
    store.use((state) =>
      mapper(state as any)[options?.listen === false ? 'read' : 'listen'](
        (options as { params: Params })?.params,
      ),
    ),
    store.act((state) => mapper(state as any).refresh) as [unknown] extends [Params]
      ? () => Resource<Model>
      : (params: Params & (Loader extends MappedResourceLoader<any, infer P> ? P : never)) => Resource<Model>,
  ]
}

export function useMappedLoader<
  Store extends Record<string, Slice>,
  Loader extends MappedResourceLoader<any, any>,
  Model extends Loader extends MappedResourceLoader<infer M, any> ? M : never,
  Params extends Loader extends MappedResourceLoader<any, infer P> ? P : never,
>(
  store: NanoSlices<Store>,
  mapper: (store: UnwrapSlices<Store>) => Loader,
  options: [unknown] extends [Params]
    ? { resource: string; listen?: boolean }
    : {
        resource: string
      } & (
        | {
            listen?: boolean
            params: Params &
              (Loader extends MappedResourceLoader<any, infer P> ? P : never)
          }
        | {
            listen: false
            params?: Params &
              (Loader extends MappedResourceLoader<any, infer P> ? P : never)
          }
      ),
): [
  Resource<Model>,
  [unknown] extends [Params]
    ? () => Resource<Model>
    : (...[params]: [unknown] extends [Params]
      ? []
      : [
        params: Loader extends MappedResourceLoader<any, infer P>
          ? P
          : never,
      ]) => Resource<Model>,
] {
  const refresh = store.act((state) => mapper(state as any).refresh)
  const wrapped = useMemo(() => (...[params]: [unknown] extends [Params]
    ? []
    : [
      params: Loader extends MappedResourceLoader<any, infer P>
        ? P
        : never,
    ]) => refresh(options.resource, params), [refresh, options.resource])
  return [
    store.use((state) =>
      mapper(state as any)[options?.listen === false ? 'read' : 'listen'](
        options.resource,
        (options as { params: Params })?.params,
      ),
    ),
    wrapped,
  ]
}

export function useMutationLoader<
  Store extends Record<string, Slice>,
  Loader extends MutationResourceLoader<any, any>,
  Model extends Loader extends MutationResourceLoader<infer M, any> ? M : never,
  Params extends Loader extends MutationResourceLoader<any, infer P>
    ? P
    : never,
>(
  store: NanoSlices<Store>,
  mapper: (store: UnwrapSlices<Store>) => Loader,
  options?: { seed: string },
): [
  MutationResource<Model>,
  [unknown] extends [Params]
    ? () => MutationResource<Model>
    : (
        ...[params]: [unknown] extends [Params]
          ? []
          : [
              params: Loader extends MutationResourceLoader<any, infer P>
                ? P
                : never,
            ]
      ) => MutationResource<Model>,
] {
  const seed = useMemo(() => {
    return (
      options?.seed ?? store.act((state) => mapper(state as any).initialize())
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options?.seed])

  useEffect(
    () => () => store.act((state) => mapper(state as any).release(seed)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed],
  )

  const execute = store.act((state) => mapper(state as any).execute)
  const wrapped = useMemo(
    () =>
      (
        ...[params]: [unknown] extends [Params]
          ? []
          : [
              params: Loader extends MutationResourceLoader<any, infer P>
                ? P
                : never,
            ]
      ) =>
        execute(seed, params),
    [execute, seed],
  )

  return [store.use((state) => mapper(state as any).result(seed)), wrapped]
}
