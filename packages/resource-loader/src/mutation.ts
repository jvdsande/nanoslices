import { computed, ReadableAtom } from 'nanostores'
import { Slice, SliceAction, SliceExtension } from '@nanoslices/types'

import { createResourceLoader, Resource, ResourceData, ResourceError, LOADER } from './shared'

type MutationResourceMetadata = {
  running: boolean
  completedOn: Date
}
export type MutationResource<Model> = null
 | (MutationResourceMetadata & ResourceData<Model>)
 | (MutationResourceMetadata & ResourceError)

export interface MutationResourceLoader<ViewModel, Params = never> {
  [LOADER]: 'mutation'
  result: (seed: string) => ReadableAtom<MutationResource<ViewModel>>
  execute: [Params] extends [never]
    ? (seed: string) => MutationResource<ViewModel>
    : (seed: string, params: Params) => MutationResource<ViewModel>
  initialize: () => string
  release: (seed: string) => void
}
export interface MutationResourceLoaderDefinition<ViewModel, Params = never> {
  [LOADER]: 'mutation'
  result: MutationResourceLoader<ViewModel, Params>['result']
  execute: SliceAction<MutationResourceLoader<ViewModel, Params>['execute']>
  initialize: SliceAction<
    MutationResourceLoader<ViewModel, Params>['initialize']
  >
  release: SliceAction<MutationResourceLoader<ViewModel, Params>['release']>
}

export function mutationResourceLoader<
  ApiModel,
  ViewModel = ApiModel,
  Params = never,
  Initial extends SliceExtension = never,
  Context = never,
  Slices extends Record<string, Slice> = never,
>(options: {
  mutate: (context: ReadableAtom<Context>, params: Params) => Promise<ApiModel>
}): (
  slice: Slice<Initial, Context, Slices>,
) => Slice<
  Initial & MutationResourceLoaderDefinition<ViewModel, Params>,
  Context,
  Slices
> {
  return (slice) => {
    const { extended, read, listen, resources, createResource, devtools } =
      createResourceLoader(slice, {
        ...options,
        fetch: (_, context: ReadableAtom<Context>, params: Params) =>
          options.mutate(context, params),
      })
    let seed = 0

    return extended
      .state(() => ({
        result(seed: string) {
          createResource(seed)
          return computed([read.get().get(seed) as ReadableAtom<Resource<ViewModel>>], (resource) => resource ? ({
            data: resource.data,
            error: resource.data,
            running: resource.refreshing,
            completedOn: resource.refreshedOn
          }) : null)
        },
      }))
      .actions(({ slice }) => ({
        initialize: () => {
          const nextSeed = (seed += 1).toFixed(0)
          createResource(nextSeed)
          resources.get().get(nextSeed)?.setKey('loaded', true)
          return nextSeed
        },
        execute: (id: string, params: any) =>
          slice.refresh(
            ...([id, params] as [Params] extends [never]
              ? [string]
              : [string, Params]),
          ),
        release: (id: string) => {
          resources.get().delete(id)
          read.get().delete(id)
          listen.get().delete(id)
          delete devtools[id]
        },
      }))
  }
}
