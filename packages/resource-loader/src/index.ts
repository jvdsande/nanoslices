import { singleResourceLoader } from './single'
import { mappedResourceLoader } from './mapped'
import { mutationResourceLoader } from './mutation'

export const resourceLoader = {
  single: singleResourceLoader,
  mapped: mappedResourceLoader,
  mutation: mutationResourceLoader,
}

export * from './hooks'
export { mockResources } from './shared'
export type { Resource } from './shared'
export type { MutationResource } from './mutation'
