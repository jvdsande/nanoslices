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
