import { ReadableAtom, Store } from 'nanostores'
import { Slice, SliceAction, SliceExtension } from '@nanoslices/types'

import { createResourceLoader, LOADER, Resource, StoreValues } from './shared'

export interface MappedResourceLoader<ViewModel, Params = never> {
  [LOADER]: 'mapped'
  read: (id: string) => ReadableAtom<Resource<ViewModel>>
  listen: [Params] extends [never]
    ? (id: string) => ReadableAtom<Resource<ViewModel>>
    : (id: string, params: Params) => ReadableAtom<Resource<ViewModel>>
  refresh: [Params] extends [never]
    ? (id: string) => Resource<ViewModel>
    : (id: string, params: Params) => Resource<ViewModel>
}

type MappedResourceLoaderDefinition<ViewModel, Params = never> = Omit<
  MappedResourceLoader<ViewModel, Params>,
  'refresh'
> & {
  refresh: SliceAction<MappedResourceLoader<ViewModel, Params>['refresh']>
}

export function mappedResourceLoader<
  ApiModel,
  ViewModel = ApiModel,
  Params = never,
  Dependencies extends Store[] = [],
  Initial extends SliceExtension = never,
  Context = never,
  Slices extends Record<string, Slice> = never,
>(options: {
  fetch: (
    id: string,
    context: ReadableAtom<Context>,
    params: Params,
  ) => Promise<ApiModel>
  transform?: {
    resolver: (
      resource: ApiModel | null,
      ...dependencies: StoreValues<Dependencies>
    ) => ViewModel
    dependencies?: Dependencies
  },
  pollingInterval?: number | ((resource: Resource<ViewModel>, id: string) => number)
}): (
  slice: Slice<Initial, Context, Slices>,
) => Slice<
  Initial & MappedResourceLoaderDefinition<ViewModel, Params>,
  Context,
  Slices
> {
  return (slice) => {
    const { extended, read, listen, createResource, params } =
      createResourceLoader(slice, options)

    return extended.state(() => ({
      read(id: string) {
        createResource(id)
        return read.get().get(id) as ReadableAtom<Resource<ViewModel>>
      },
      listen(id: string, ...args: any) {
        createResource(id)
        params.get().set(id, args[0])
        return listen.get().get(id) as ReadableAtom<Resource<ViewModel>>
      },
    }))
  }
}
