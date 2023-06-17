# @nanoslices/core

nanoslices is a wrapper library around [nanostores](https://npmjs.com/nanostores).

It allows creating global stores composed of slices, each slice themselves composed of nanostores `Store`s: atoms, maps,
computed...

The generated store comes with a connection to Redux DevTools, and offers a way to declare _actions_ that can modify the atoms.
Atoms are not writable from outside those actions by default, adding a safety layer around nanostores.

> Disclaimer: nanoslices is not affiliated to nanostores in any way, we are just wrapping the library. Many thanks
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
import { atom, computed } from 'nanostores'
import { createSlice } from '@nanoslices/core'

export const profile = createSlice(() => ({
  firstName: atom(''),
  lastName: atom(''),
}))
  .computed((slice) => ({
    fullName: computed(
      [slice.firstName, slice.lastName],
      (firstName, lastName) => [firstName, lastName].join(' '),
    ),
  }))
  .actions((slice) => ({
    setFullName(firstName: string, lastName: string) {
      slice.firstName.set(firstName)
      slice.lastName.set(lastName)
    },
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
of the configuration object are optional:

- `name: string`: give a name to the store, used internally by the devtools connection. Defaults to `Nanoslices`.
- `devtools: boolean`: whether to activate the devtools connection. This is not recommended in production, as it negatively
  impacts the store's performances.
- `context: any`: variable that will be passed to all slice functions (`computed`, `actions` and `initialize`).
  Use it to inject some shared context across your slices, such as API services or configuration.
- `extensions: Extension[]`: extension system allowing to extend the store with more methods, used by our [React wrapper](https://npmjs.com/@nanoslices/react)

## Slice methods

The object returned by `createSlice` will give you access to several methods to extend your slice. Note that methods
can only be called in a certain order, explained below. Each method returns the extended slice, and can therefore be called as a chain.
Here are the methods available:

- `context<C>()`: **TypeScript-only helper**. Returns the slice as is, but injects `C` as the type of the `context` option
  passed to other methods. Cannot be called after `computed` or `actions`.
- `slices<S>(slices: S)`: **TypeScript-only helper**. Takes a map of slices, to type the `slices` option passed to other methods.
  The map of slices must correspond to slices you actually give to your store. See [Advanced usage](#advanced-usage) below.
  Cannot be called after `computed` or `actions`.
- `computed<C>((slice, options) => C)`: Receives the current slice state as defined by `createSlice` and previous `computed` calls, and an `options` object.
  Returns a map of computed properties using the `computed` nanostores store.
  Through `options.slices`, it is possible to access atoms from other slices and compute them.
  Through `options.context`, it can access the shared store context.
  Cannot be called after `actions`, but can be chained to compose computed together.
- `actions<A>((slice, options) => A)`: Receives the current slice state as defined by `createSlice` and potentially `computed`, and an `options` object.
  Returns a map of actions that can modify the state. Through `options.slices`, it can compose actions from other slices or
  read other slices' state, and through `options.context` it can access the shared store context.
  Can be chained multiple times to compose actions together.
- `initialize((slice, options) => T)`: Receives the current slice and the standard `options`, and is called if `Store.initialize` is called.
  The callback can be used to initialize the slice with asynchronous data in a controlled manner.

## Store methods

The `Store` object exposes several methods:

**Base methods:**

_Main methods to use to consume the state in an application._

- `get(selector: (atoms) => Atom)`: Takes an atom selector in parameter, and returns the current value stored in the atom.
- `act(selector: (actions) => any)`: Takes a store action selector in parameter, and returns anything. You can either return the action itself to be called later,
  or call the action in the selector and return its value.
- `initialize()`: Executes the callbacks passed to the `initialize` method of the various slices.

**Advanced methods:**

_Additional methods used for advances use cases._

- `reset()`: Restore the store to its initial state, before _initialize()_ was called. Restores all the atoms to the default value they were given
  when creating slices. Can optionally take a snapshot as parameter, applied to the state after reset. The snapshot is a deep partial representation 
  of the state, and updates all the atoms accordingly with the new value. Note that any value passed to a `computed` store will be ignored, and the actual computed value from other atoms will be used.
- `snapshot()`: Return a deep representation of the current state as a plain JS object, no atoms.
- `setContext(context)`: Replace the context initially passed in `createStore` with a new value. In TypeScript, the new context type
  must be compatible with the original context type.

**Testing methods:**

_Specific methods used for testing._

- `spy(options)`: Enable spying on action execution, and easily updating the state in a test environment. Returns a `StoreSpy` object
  complete with useful options for testing. Takes an `options` parameter to configure the testing environment.
  
  **Options:**
  - `reset`: Testing hook in which to reset the state and actions history. Pass it one of your testing framework lifecycle functions such as `beforeEach`.
  - `restore`: Testing hook in which to restore the state, removing the spy altogether. Pass it one of your testing framework lifecycle functions such as `afterAll`.
  - `context`: Partial context to set in place of the normal store context, useful for injecting service mocks relevant to the current test suite.
  - `snapshot`: Partial snapshot of the state to apply when `reset` is called, useful for bringing the state to a relevant value for the current test suite.

  **StoreSpy fields:**
  - `context(context)`: Takes a new partial context and replace the store context. Useful for injecting mocks relevant to a specific test.
  - `snapshot(snapshot)`: Takes a partial snapshot and apply it to the store. Useful for bringing the state to a relevant value for a specific test.
  - `clear()`: Clears all recorded actions, to get back an empty history.
  - `reset()`: Resets the state to its original state, then applies the snapshot passed as option to `Store.spy()`, if any. Also calls `clear()` internally.
    Prefer using the `reset` option rather than calling `reset()` yourself.
  - `restore()`: Restore the state to its original state, and removes the spy completely. Prefer using the `restore` option rather than calling `restore` directly.
  - `history`: Array containing an entry for each action that have been called since the last `clear()` call. Each action log is an object containing a `type` 
    field equals to `@action.[path.to.slice].[actionName]` and a `payload` field equals to the `arguments` passed to the action.
    If an action returns a `Promise`, then an additional entry is added after the `Promise` resolves or rejects. The `type` is the same as the action, with either a `(success)` or `(fail)` suffix.

## Advanced usage

### Composing computed

It's possible to chain multiple `.computed` methods to compose computed values in a slice:

```ts
import { computed } from 'nanostores'
import { createSlice } from '@nanoslices/core'

export const statistics = createSlice(() => ({
  tasks: atom<{ done: boolean }>([]),
}))
  .computed((slice) => ({
    total: computed(slice.tasks, (tasks) => tasks.length),
    done: computed(
      slice.tasks,
      (tasks) => tasks.filter((task) => task.done).length,
    ),
  }))
  .computed((slice) => ({
    progress: computed(
      [slice.total, slice.done],
      (total, done) => Math.round(done * 100) / total,
    ),
  }))
```

### Composing actions

It's also possible to chain multiple `.actions` methods to compose actions in a slice:

```ts
import { atom, computed } from 'nanostores'
import { createSlice, createStore } from '@nanoslices/core'

const profile = createSlice(() => ({
  firstName: atom(''),
  lastName: atom(''),
}))
  .computed((slice) => ({
    fullName: computed(
      [slice.firstName, slice.lastName],
      (firstName, lastName) => [firstName, lastName].join(' '),
    ),
  }))
  .actions((slice) => ({
    setFirstName(firstName: string) {
      slice.firstName.set(firstName)
    },
    setLastName(lastName: string) {
      slice.lastName.set(lastName)
    },
  }))
  .actions((slice) => ({
    setFullName(firstName: string, lastName: string) {
      slice.setFirstName(firstName)
      slice.setLastName(lastName)
    },
  }))
```

### Composing slices

You can compose slices together through the `options` parameter passed to slice methods:

```ts
import { atom, computed } from 'nanostores'
import { createSlice, createStore } from '@nanoslices/core'

const profile = createSlice(() => ({
  firstName: atom(''),
  lastName: atom(''),
}))
  .computed((slice) => ({
    fullName: computed(
      [slice.firstName, slice.lastName],
      (firstName, lastName) => [firstName, lastName].join(' '),
    ),
  }))
  .actions((slice) => ({
    setFullName(firstName: string, lastName: string) {
      slice.firstName.set(firstName)
      slice.lastName.set(lastName)
    },
  }))

const employeeCard = createSlice(() => ({
  employeeId: atom(''),
  job: atom(''),
}))
  .slices({ profile })
  .computed((slice, { slices }) => ({
    employeeName: computed([slices.profile.fullName], (name) => name),
  }))

export const Store = createStore({ profile, employeeCard })
```

### Reading the context

You can access the context passed to the store in any of the `Slice` methods:

```ts
// context.ts
import { employeeService } from './services/employee'

export const context = {
  services: {
    employee: employeeService,
  },
}

export type Context = typeof context
```

```ts
// employee-card.ts
import { atom } from 'nanostores'
import { createSlice } from '@nanoslices/core'

import { Context } from './context'

const employeeCard = createSlice(() => ({
  employeeId: atom(''),
  job: atom(''),
}))
  .context<Context>()
  .actions((slice) => ({
    setEmployeeId: (id: string) => slice.employeeId.set(id),
    setJob: (job: string) => slice.job.set(job),
  }))
  .actions((slice, { context }) => ({
    loadEmployee: async (id: string) => {
      const employee = await context.services.employee.getById(id)
      slice.setEmployeeId(id)
      slice.setJob(employee.job)
    },
  }))
```

### Initialize a slice

The `initialize` method of slices can take an optional callback that runs with the complete slice and options, when `Store.initialize()`
is called:

```ts
// employee-card.ts
import { atom } from 'nanostores'
import { createSlice } from '@nanoslices/core'

import { Context } from './context'

const employeeCard = createSlice(() => ({
  employeeId: atom(''),
  job: atom(''),
}))
  .context<Context>()
  .actions((slice) => ({
    setEmployeeId: (id: string) => slice.employeeId.set(id),
    setJob: (job: string) => slice.job.set(job),
  }))
  .actions((slice, { context }) => ({
    loadEmployee: async (id: string) => {
      const employee = await context.services.employee.getById(id)
      slice.setEmployeeId(id)
      slice.setJob(employee.job)
    },
  }))
  .initialize(async (slice) => {
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
