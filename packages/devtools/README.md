# @nanoslices/devtools

Nanoslices plugin for adding a connection to the Redux Devtools.

## Installation

`@nanoslices/devtools` depends on `@nanoslices/core`, refer to [@nanoslices/core](https://npmjs.com/package/@nanoslices/core)
for its installation instruction.

**npm**

```
npm install --save @nanoslices/devtools
```

**yarn**

```
yarn add @nanoslices/devtools
```

## Usage

Simply import `@nanoslices/devtools` somewhere in your application, preferably in the file from which your store is exported.

After that, two new options will be available in `createStore` calls:

- `devtools: boolean` controls whether to setup the Redux DevTools connection. It is not recommended to use this is production.
- `name: string` lets you set a name for your DevTools store. Defaults to `Nanoslices` if omitted.
