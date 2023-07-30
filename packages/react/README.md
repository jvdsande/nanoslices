# @nanoslices/react

React wrapper for [@nanoslices/core](https://npmjs.com/@nanoslices/core).
Re-export all helpers from Core, but the created stores have a new `use` property.

## Installation

`@nanoslices/react` depends on `@nanoslices/core`, refer to [@nanoslices/core](https://npmjs.com/package/@nanoslices/core)
for its installation instruction.

`@nanoslices/react` also depends on `@nanostores/react` as peer dependency, so you need to install it manually if you are
not using npm 7 or higher.

**npm >= 7**

```
npm install --save @nanoslices/react
```

**npm < 7**

```
npm install --save @nanoslices/react @nanostores/react
```

**yarn**

```
yarn add @nanoslices/react @nanostores/react
```

## Usage

Simply import `@nanoslices/react` somewhere in your application, preferably in the file from which your store is exported.

After that, a new `use` method will be made available on your stores.

This hook takes a selector which receives the nanostores stores from the state, and must return one. Internally, it
will call `@nanostores/react`'s `useStore` on the received nanostore, subscribing to updates.

Just like the base nanoslices `get` method, it is also possible to return an array of stores from the selector. In this case,
the return value of the hook will be an array of store values, in order.

## useLocalStore

In addition to extending the base store constructor, the plugin also exposes a `useLocalStore` hook that can be used
to create a store to house a component's inner state. The store is created on component first mount, and is deleted
when the component unmounts.

It takes a function as first parameter, which should return a record of slices, or a single slice. The function receives
an empty slice as parameter, that can be used as a basis of the returned slice. An optional second parameter to the hook
can be used to pass options to the store creation call.

```tsx
import { atom } from 'nanostores'
import { useLocalStore } from '@nanoslices/react'

export const Checkbox = () => {
  const store = useLocalStore((slice) => slice
    .state(() => ({ checked: atom(false) }))
    .actions(({ slice }) => ({ toggle: (checked: boolean) => slice.checked.set(toggle) }))
  )
  const checked = store.use((state) => state.checked)
  const toggle = store.act((state) => state.toggle)
  
  return <input type="checkbox" checked={checked} onChange={(e) => state.toggle(e.currentTarget.checked)} />
}
```
