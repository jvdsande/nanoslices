# @nanoslices/react

React wrapper for [@nanoslices/core](https://npmjs.com/@nanoslices/core).
Re-export all helpers from Core, but the created stores have a new `use` property.

## Installation

`@nanoslices/react` depends on `@nanoslices/core`, so you need to install both. Furthermore, `@nanoslices/core` depends on
`nanostores` and `@nanoslices/react` depends on `@nanostores/react`, as peer dependencies, so you need them both if you
are not using NPM 7 or higher

**npm >= 7**

```
npm install --save @nanoslices/core @nanoslices/react
```

**npm < 7**

```
npm install --save @nanoslices/core @nanoslices/react nanostores @nanostores/react
```

**yarn**

```
yarn add @nanoslices/core @nanoslices/react nanostores @nanostores/react
```

## The `Store.use` hook

With a Store created through the React wrapper, a new `Store.use` hook is made available.
This hook takes a selector which receives the Nanostores stores from the state, and must return one. Internally, it
will call `@nanostores/react`'s `useStore` on the received Nanostore, subscribing to updates.
