# @nanoslices/core

nanoslices is a wrapper library around [nanostores](https://npmjs.com/nanostores).

It allows creating global stores composed of slices, each slice themselves composed of nanostores `Store`s: atoms, maps,
computed...

The generated store offers a way to declare _actions_ that can modify atoms. Atoms are not writable from outside those actions by default, adding a safety layer around nanostores.

The store system is extensible through plugins to add functionality such as Redux DevTools support or testability through action spies.

> Disclaimer: nanoslices is not affiliated with nanostores in any way, we are just wrapping the library. Many thanks
> for nanostores for offering solid foundations, and apologies if nanoslices' approach is somehow against nanostores base philosophy :)

## Installation

**npm >= 7**

```
npm install --save @nanoslices/core
```

`@nanoslices/core` depends on `nanostores` as peer dependency, so you need to install it manually if you
are not using NPM 7 or higher

**npm < 7**

```
npm install --save @nanoslices/core nanostores
```

**yarn**

```
yarn add @nanoslices/core nanostores
```

## Usage

The building blocks of nanoslices are called `Slice`s. Each `Slice` encapsulate a part of your final store, composed
of atoms, maps, computed, and actions. You can create a `Slice` using the exported `createSlice` helper:

```ts
import { atom } from 'nanostores'
import { createSlice } from '@nanoslices/core'

export const profile = createSlice()
  .define(() => ({
    firstName: atom(''),
    lastName: atom(''),
  }))
  .define(({ define, slice }) => ({
    fullName: define.computed(
      () => [slice.firstName, slice.lastName],
      (firstName, lastName) => [firstName, lastName].join(' '),
    ),
    setFullName: define.action((firstName: string, lastName: string) => {
      slice.firstName.set(firstName)
      slice.lastName.set(lastName)
    }),
  }))
```

You can then use your `Slice` to create a `Store`. A `Store` simply takes a map of `Slices`, and turns them into a usable store:

```ts
import { createStore } from '@nanoslices/core'
import { profile } from './profile'

export const Store = createStore({ profile })
```

From your `Store`, you can now read your atoms via the `get` method, or call an action via the `act` method:

```ts
import { Store } from './store'

console.log(Store.get(({ profile }) => profile.fullName))
// " "

Store.act(({ profile }) => profile.setFullName('General', 'Kenobi'))

console.log(Store.get(({ profile }) => profile.fullName))
// "General Kenobi"
```

## Store options

You can configure your store through the second argument of `createStore`. Just as the argument itself, all fields
of the configuration object are optional.

By default, two options are available:

- `context`: optional variable that will be passed to the slice extension methods.
  Use it to inject some shared context across your slices, such as API services or configuration.
  The context will be wrapped in a nanostores atom, and can be updated reactively later on after the store creation.
- `snapshot`: optional snapshot applied to the state upon initialization. The snapshot is a deep partial representation
  of the state, and updates all the atoms accordingly with the new value. Can be used to fill in some initial state at
  store creation rather than slice creation.

More options can be added through [plugins](#plugins).

## Slice methods

When calling `createSlice`, you get an empty slice that can be extended by calling one of the several methods available
on the slice. Each method returns an extended slice, and can therefore be called as a chain.

Each slice method takes a function as first and only parameter, which receives an `options` object and returns a set
of fields definition to add to the slice.

The default `options` object contains three properties: `options.slice` contains the current slice as built up to that point,
`options.store` contains a reference to the complete store, and `options.context` exposes the store's context as a readable
nanostore. Additional fields are present on the `options` object of specific methods.

Here are the methods available:

- `define((options) => extension)`: The most versatile method to extend a slice. The `options` object is extended with a `define`
  property that contains three helper functions: `computed` to create computed nanostores, `action` to create traceable action
  functions, and `nested` to add a complete slice as a sub-field of another slice.
  - `define.computed` takes two parameters.
    The first one is a `listen` function that should return an array of nanostores to listen to.
    The second one is a `get` function that receives the latest values of the listened stores, and should return a new computed value.
  - `define.action` takes a single parameter, which is a function. The function will be traced internally, and extensions
    can subscribe to action calls, for instance to create test helpers or connections to debug tools.
  - `define.nested` takes a single parameter that can either be a slice, or a function returning a slice. In the case of a function, 
    an empty slice is received as parameter and can be used as basis for constructing the nested slice.
  
  The `define` method should return an object, in which each field should be either a nanostore, or the result of one of the `define` helpers.
  It's also possible to directly nest objects of the same form.
- `state((options) => state)`: A shorthand method to add state fields to the slice. Contrary to `define`, it does not receive
  any additional options, and can only return nanostores, not computed, actions or nested slices.
- `computed((options) => computed)`: A shorthand method to add computed fields to the slice. Contrary to `define`, it does not
  receive all three helpers, but instead directly receive the `computed` helper as part of its options. It can only return computed fields.
- `actions((options) => actions)`: A shortand method to add actions to the slice. Contrary to `define`, it does not receive
  any additional options, and can only return actions. You can directly return an object of functions from the `actions` method,
  and all functions will be internally wrapped as traceable actions.
- `nested((options) => nested)`: A shorthand method to add nested fields to the slice. Contrary to `define`, it does not
  receive any additional options, and can only return nested slices. Nested slices can also be a function, in which case it will 
  be called with an empty slice as first parameter, that can be used to build the nested slice.
- `initialize((options) => void)`: Receives the standard `options`, and is called if `Store.initialize` is called.
  The callback can be used to initialize the slice with asynchronous data in a controlled manner.

## Store methods

The `Store` object exposes several methods:

**Base methods:**

_Main methods to use to consume the state in an application._

- `get(selector: (atoms) => Atom)`: Takes an atom selector in parameter, and returns the current value stored in the atom.
  Can optionally take a second boolean parameter. If the second parameter is `true`, then the returned value will be wrapped in a readable atom, so
  that it can be subscribed to for instance in a computed from another store.
- `act(selector: (actions) => any)`: Takes a store action selector in parameter, and returns anything. You can either return the action itself to be called later,
  or call the action in the selector and return its value.
- `initialize()`: Executes the callbacks passed to the `initialize` method of the various slices.

The `get` and `act` selectors can also return an array of atoms or actions respectively, in which case the methods
return an array of store values, or the array of actions in the case of `act`.

**Advanced methods:**

_Additional methods used for advances use cases._

- `reset()`: Restore the store to its initial state, before _initialize()_ was called. Restores all the atoms to the default value they were given
  when creating slices. Can optionally take a snapshot as parameter, applied to the state after reset. The snapshot is a deep partial representation
  of the state, and updates all the atoms accordingly with the new value. Note that any value passed to a `computed` store will be ignored, and the actual computed value from other atoms will be used.
- `snapshot()`: Return a deep representation of the current state as a plain JS object, no atoms.
- `replaceContext(context)`: Replace the context initially passed in `createStore` with a new value. In TypeScript, the new context type
  must be compatible with the original context type.
- `destroy()`: Executes all the `onDestroy` callbacks passed by extensions. Should be called when getting rid of a temporary store.

## Advanced usage

### Composing computed

It's possible to chain multiple `.computed` methods to compose computed values in a slice:

```ts
import { createSlice } from '@nanoslices/core'

export const statistics = createSlice()
  .state(() => ({
    tasks: atom<{ done: boolean }>([]),
  }))
  .computed(({ slice, computed }) => ({
    total: computed(() => [slice.tasks], (tasks) => tasks.length),
    done: computed(
            () => [slice.tasks],
      (tasks) => tasks.filter((task) => task.done).length,
    ),
  }))
  .computed(({ slice, computed }) => ({
    progress: computed(
      () => [slice.total, slice.done],
      (total, done) => Math.round(done * 100) / total,
    ),
  }))
```

### Composing actions

It's also possible to chain multiple `.actions` methods to compose actions in a slice:

```ts
import { atom } from 'nanostores'
import { createSlice, createStore } from '@nanoslices/core'

const profile = createSlice()
  .state(() => ({
    firstName: atom(''),
    lastName: atom(''),
  }))
  .computed(({ slice, computed }) => ({
    fullName: computed(
      () => [slice.firstName, slice.lastName],
      (firstName, lastName) => [firstName, lastName].join(' '),
    ),
  }))
  .actions(({ slice }) => ({
    setFirstName(firstName: string) {
      slice.firstName.set(firstName)
    },
    setLastName(lastName: string) {
      slice.lastName.set(lastName)
    },
  }))
  .actions(({ slice }) => ({
    setFullName(firstName: string, lastName: string) {
      slice.setFirstName(firstName)
      slice.setLastName(lastName)
    },
  }))
```

### Composing slices

You can compose slices together through the `options` parameter passed to slice methods.

In TypeScript, you can pass a `store` object to the `createSlice` initial call to infer the type of the `store`
options passed to slice methods. The passed object itself will not be consumed, it is only there for typing inference.
You can pass only the slices you need, the only thing needed is that the passed object matches the form of the actual
store instance.

```ts
import { atom } from 'nanostores'
import { createSlice, createStore } from '@nanoslices/core'

const profile = createSlice()
  .state(() => ({
    firstName: atom(''),
    lastName: atom(''),
  }))
  .computed(({ slice, computed }) => ({
    fullName: computed(
      () => [slice.firstName, slice.lastName],
      (firstName, lastName) => [firstName, lastName].join(' '),
    ),
  }))
  .actions(({ slice }) => ({
    setFullName(firstName: string, lastName: string) {
      slice.firstName.set(firstName)
      slice.lastName.set(lastName)
    },
  }))

const employeeCard = createSlice({ store: { profile } })
  .state(() => ({
    employeeId: atom(''),
    job: atom(''),
  }))
  .computed(({ store, computed }) => ({
    employeeName: computed(() => [store.profile.fullName], (name) => name),
  }))

export const Store = createStore({ profile, employeeCard })
```

Since the `listen` function of a computed is only ran when the field is first subscribed to,
the order in which the slices appear in the store do not matter, all slices will be defined once
the computed field is first evaluated. Nevertheless, circular dependencies between computed won't work
and will make your store crash.

### Reading the context

You can access the context passed to the store in any of the `Slice` methods:

```ts
// context.ts
import { employeeService } from './services/employee'

export const Context = {
  services: {
    employee: employeeService,
  },
}
```

```ts
// employee-card.ts
import { atom } from 'nanostores'
import { createSlice } from '@nanoslices/core'

import { Context } from './context'

const employeeCard = createSlice({ Context })
  .state(() => ({
    employeeId: atom(''),
    job: atom(''),
  }))
  .actions(({ slice }) => ({
    setEmployeeId: (id: string) => slice.employeeId.set(id),
    setJob: (job: string) => slice.job.set(job),
  }))
  .actions(({ slice, context }) => ({
    loadEmployee: async (id: string) => {
      const employee = await context.get().services.employee.getById(id)
      slice.setEmployeeId(id)
      slice.setJob(employee.job)
    },
  }))
```

### Initializing a slice

The `initialize` method of slices can take an optional callback that runs with the complete slice and options, when `Store.initialize()`
is called:

```ts
// employee-card.ts
import { atom } from 'nanostores'
import { createSlice } from '@nanoslices/core'

import { Context } from './context'

const employeeCard = createSlice({ Context })
  .state(() => ({
    employeeId: atom(''),
    job: atom(''),
  }))
  .actions(({ slice }) => ({
    setEmployeeId: (id: string) => slice.employeeId.set(id),
    setJob: (job: string) => slice.job.set(job),
  }))
  .actions(({ slice, context }) => ({
    loadEmployee: async (id: string) => {
      const employee = await context.get().services.employee.getById(id)
      slice.setEmployeeId(id)
      slice.setJob(employee.job)
    },
  }))
  .initialize(async ({ slice }) => {
    await slice.loadEmployee('defaultEmployee')
  })
```

```ts
// store.ts
import { createStore } from '@nanoslices/core'
import { employeeCard } from './employee-card'

export const Store = createStore({ employeeCard })
  // This will trigger the `initialize` callback of all slices
  .initialize()
```

The Store's `initialize` method returns the Store itself, so it can be safely chained in the export statement
if you want to initialize the slices right away.

## Plugins

### Official plugins

Here is a list of plugins developed and maintained by the nanoslices team.

- [@nanoslices/react](https://npmjs.com/package/@nanoslices/react): React wrapper, adding a `use` method on the Store
  to subscribe to atoms in React components.
- [@nanoslices/devtools](https://npmjs.com/package/@nansolices/devtools): Connects nanoslices to the Redux DevTools.
- [@nanoslices/spy](https://npmjs.com/package/@nanoslices/spy): Adds a `spy` method on the Store to help using nanoslices
  in tests.
- [@nanslices/resource-loader](https://npmjs.com/package/@nanoslices/resource-loader): Helper to create opinionated
  pre-configured slices for loading remote resources such as from a backend API.

### Writing a plugin

A nanoslices plugins extends the store creation function to add new methods on the generated store. A plugin consists
in a standardized function passed to the `registerExtension` function exposed by `@nanoslices/core`.

The function receives three parameters:

- The raw store, as in the record of slices with unlimited access to the underlying atoms.
- The options passed to the `createStore` function
- A set of dedicated plugin options:
  - `initialState`: a snapshot of what the state looks like upon initialization
  - `subscribeToActions`: a function for subscribing to actions. Takes a single parameter, which is a function
    called each time an action is executed, and receives an object containing the action's unique `type` (a string
    composed of the action's path in the store) and the `payload` of the action (the arguments array it was called with).
  - `takeSnapshot`: a function returning a snapshot of the current state of the store.
  - `restoreSnapshot`: a function taking a partial state snapshot and applying it to the store.
  - `replaceContext`: a function for replacing the current context value with another value.
  - `onDestroy`: a function for registering a destroy callback, that is called when `store.destroy` is executed.

It returns a map of methods to add to the final store.

Here is an example of plugins, adapted from our React wrapper:

```ts
import { useStore } from '@nanostores/react'
import { registerExtension } from '@nanoslices/core'

// It's good practice to re-export Core from each plugin
// This way for instance, in a React app, @nanoslices/react can become the main entry point
export * from '@nanoslices/core'

const createUseStoreAtom = (store) => {
  return (mapper) => useStore(mapper(store))
}

// The extension receives the store as first parameter, and returns a map
// of method to add to the final store
registerExtension((store) => ({
  use: createUseStoreAtom(store),
}))
```

Since nanoslices is built with TypeScript users in mind, plugins can extend nanoslices' type definitions from the
`@nanoslices/types` package to add typing for additional options (by extending `NanoSlicesOptions`) and additional
methods (by extending `NanoSlices`).

Here is how the React wrapper extends the `NanoSlices` interface:

```ts
import { Store, StoreValue } from 'nanostores'
import { Slice, UnwrapSlicesState } from '@nanoslices/types'

type UseNanoSlices<
  M extends Record<string, Slice> | Slice,
> = <A extends Store>(
        mapper: (
                model: UnwrapSlicesState<M> extends infer U
                        ? { [key in keyof U]: U[key] }
                        : never,
        ) => A,
        options?: UseStoreOptions<A>,
) => StoreValue<A>

declare module '@nanoslices/types' {
  interface NanoSlices<Slices extends Record<string, Slice>> {
    use: UseNanoSlices<Slices>
  }
}
```
