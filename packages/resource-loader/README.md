# @nanoslices/resource-loader

Set of helpers allowing to create opinionated nanoslices slices for resource loading, such as fetching data from a 
remote backend API.

## Installation

`@nanoslices/resource-loader` depends on `@nanoslices/core` and `@nanoslices/react`, refer to [@nanoslices/react](https://npmjs.com/package/@nanoslices/core)
for installation instructions.

**npm**

```
npm install --save @nanoslices/resource-loader
```

**yarn**

```
yarn add @nanoslices/resource-loader
```

## Usage

The package exports a `resourceLoader` object containing three loader constructors:

- `resourceLoader.single` creates a slice for handling the loading and refresh of a single resource. This can either
  be an isolated resource, or a list for instance.
- `resourceLoader.mapped` creates a slice for handling the loading and refresh of multiple resources that can be
  uniquely references by an ID. Each resource will have its own lifecycle within the slice.
- `resourceLoader.mutation` creates a different kind of slice dedicated to executing mutations.

Each loader constructor is _curried_: it first takes the loader parameters as a first call, which returns the actual
slice creator taking a slice as parameter and extending it with the loader state and actions.

### Single and Mapped loaders

Single and Mapped loaders are fairly similar. They both share most of their parameters, the main difference being that
Mapped loaders rely on resource IDs to differentiate resources, while Single loaders only handle one resource internally.

The parameters are as follows:

- `fetch(id: string, context: Context, params?: Params)`: asynchronous function receiving the resource ID, the store context,
  and any params passed to the listen/refresh calls, and returning the loaded resource.

  In the case of Single loaders, the `id` parameters is skipped and only `context` and `params` are used.
- `transform`: used to set up a transform of the loaded resource, in which case the resource accessible from the state will
  be a computed value from the resource received from the `fetch` function. It takes two sub-parameters:
  - `transform.dependencies: Dependencies`: optional list of nanostores to listen to and use in the computed function.
  - `transform.resolver(resource: Raw, ...dependencies: Dependencies)`: transformation function to use, receiving
    the raw resource as returned from the `fetch` function, and all passed dependencies. 
    Called everytime the base raw resource is updated, or any of the dependency changes.
    Should return a transformed version of the resource's value.
- `pollingInterval: number`: if set, listening to a resource will set up a polling interval with the passed number of milliseconds.

  Can also be a function, in which case it receives the last known state of the resource as first parameter, and the ID of the
  resource in case of a Mapped loader, and must return the number in milliseconds to wait. 

  If the polling value is `0` or negative, polling is disabled.
- `ttl: number`: if set, listening to a resource will only trigger a refresh if the last known state is older than the specified TTL value .

Internally, each resource is stored in the state, in the following form:

```ts
interface Resource<Model> {
  data: Model | null
  error: Error | null
  refreshing: boolean
  refreshedOn: boolean
}
```

The returned slice is comprised from two atom getters (`read` and `listen`), and one action (`refresh`).

- `read(id: string)` is a `computed` value that contains the last known state of the resource.
- `listen(id: string, params?: Params)` is also a `computed` value containing the last known state of the resource, but
  it also triggers a call to refresh the resource and sets up polling if configured.
  
  This uses `nanostores` subscription/mounting mechanism, so if multiple parts of the view listen on the same resource, only
  the initial listener triggers the refresh and polling. When the last view parts unmounts, the polling is automatically stopped.
- `refresh(id: string, params?: Params)` is an action that forcefully refreshes a resource, regardless of the TTL value and if
  it's currently listened to.

### Mutation loader

The mutation loader is slightly different from the query loaders described above. While a query loader fetches state
linked to a resource, a mutation loader cares more about the status of the mutation _attempt_ than it of the resource
itself.

It takes only one parameter:

- `mutate(context: Context, params?: Params)`: asynchronous function receiving the store context
  and any params passed to the execute call, and returning the result of the mutation.

Internally, each mutation attempt is stored in the state, in the following form:

```ts
interface MutationResource<Model> {
  data: Model | null
  error: Error | null
  running: boolean
  completedOn: boolean
}
```

The returned slice is comprised from one atom getter (`result`) and three actions (`initialize`, `execute` and `release`).

- `result(seed: string)` is a `computed` value that contains the last known state of the attempt linked to the passed `seed`.
- `initialize()` is an `action` that returns a unique string seed, which can be used to identify an attempt in the state.
- `execute(seed: string, params?: Params)` is an action that runs the configured mutation for the passed `seed`.
- `release(seed: string)` is an action that cleans up the state, removing all stored information for the passed `seed`.

Each mutation attempt is identified through a `seed`, which allows to retrieve the `result` after calling `execute`. You
can either provide your own seed, or generate one automatically through `initialize` and memoize the result.

You can know when the mutation is currently running through its `running` metadata, and react to either its success or error
through its `data` or `error` fields.

## React Hooks

If using React, you can take advantage of built-in hooks to simplify the usage of your loaders. Each hook follows a similar pattern,
where the first two arguments serve as selecting the loader sub-slice. The first argument should be your store, and the second
argument a mapper that selects the loader sub-slice from your store. The third argument changes depending on your loader type:

- `useSingleLoader(store, mapper, { params?: Params, listen?: boolean })`: get the current resource out of a single loader.
  With the third parameter, you can set the parameters to pass down to the fetch calls, and toggle listening on or off. The
  listening is on by default, and can be turned off by passing `listen: false`.
- `useMappedLoader(store, mapper, { resource: string, params?: Params, listen?: boolean })`: get the state of a resource
  out of a mapped resource loader. With the third parameter you must set the ID of the resource to get, and as for the single
  loader hook you can pass parameters to the fetch calls and toggle listening on or off.
- `useMutationLoader(store, mapper, { seed?: string })`: get the current state of a mutation attempt. If you do not pass
  a seed yourself, it will generate one internally and memoize it as long as the calling component is mounted.

Each hook return a tuple in the form of `[resource, refresh]`, where `resource` is the last known state of the resource,
and `refresh` is a curried function around the loader's `refresh` action. In case of a mapped loader, there is no need
to specify the resource ID again in the `refresh` call, it gets added automatically internally. The same is true for
mutation loaders, where the seed does not need to be passed to the `execute` call.
