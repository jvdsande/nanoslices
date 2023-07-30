import { ReadableAtom, Store } from 'nanostores'
import { Slice, SliceAction, SliceExtension } from '@nanoslices/types'

import { createResourceLoader, Resource, StoreValues, LOADER } from './shared'

export interface SingleResourceLoader<ViewModel, Params = never> {
  [LOADER]: 'single'
  read: () => ReadableAtom<Resource<ViewModel>>
  listen: [Params] extends [never]
    ? () => ReadableAtom<Resource<ViewModel>>
    : (params: Params) => ReadableAtom<Resource<ViewModel>>
  refresh: [Params] extends [never]
    ? () => Resource<ViewModel>
    : (params: Params) => Resource<ViewModel>
}
type SingleResourceLoaderDefinition<ViewModel, Params = never> = Omit<
  SingleResourceLoader<ViewModel, Params>,
  'refresh'
> & {
  refresh: SliceAction<SingleResourceLoader<ViewModel, Params>['refresh']>
}

export function singleResourceLoader<
  ApiModel,
  ViewModel = ApiModel,
  Params = never,
  Dependencies extends Store[] = [],
  Initial extends SliceExtension = never,
  Context = never,
  Slices extends Record<string, Slice> = never,
>(options: {
  fetch: (context: ReadableAtom<Context>, params: Params) => Promise<ApiModel>
  transform?: {
    resolver: (
      resource: ApiModel | null,
      ...dependencies: StoreValues<Dependencies>
    ) => ViewModel
    dependencies?: Dependencies
  }
  pollingInterval?: number | ((resource: Resource<ViewModel>) => number)
}): (
  slice: Slice<Initial, Context, Slices>,
) => Slice<
  Initial & SingleResourceLoaderDefinition<ViewModel, Params>,
  Context,
  Slices
> {
  return (slice) => {
    const { listen, read, createResource, params, extended } =
      createResourceLoader(slice, {
        ...options,
        fetch: (_, context: ReadableAtom<Context>, params: Params) =>
          options.fetch( context, params),
      })

    return extended.state(() => ({
      read() {
        createResource('single')
        return read.get().get('single') as ReadableAtom<Resource<ViewModel>>
      },
      listen(...args: any) {
        createResource('single')
        params.get().set('single', args[0])
        return listen.get().get('single') as ReadableAtom<Resource<ViewModel>>
      },
    }))
  }
}
