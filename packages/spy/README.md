# @nanoslices/spy

Nanoslices plugin for spying on and control a nanoslices store during tests.

## Installation

`@nanoslices/spy` depends on `@nanoslices/core`, refer to [@nanoslices/core](https://npmjs.com/package/@nanoslices/core)
for its installation instruction.

**npm**

```
npm install --save @nanoslices/spy
```

**yarn**

```
yarn add @nanoslices/spy
```

## Usage

Simply import `@nanoslices/spy` somewhere in your application, preferably in the file from which your store is exported.

After that, a new `spy` method will be made available on your stores.

Furthermore, a `spyEnabled` option will be available in `createStore` calls. It is `true` by default, but can be set to `false`
to block a store from being spied on.

Calling `Store.spy()` will enable spying on action execution, and easily updating that state and context in a test environment.

It returns a `StoreSpy` object complete with useful options for testing, and takes an `options` parameter to configure the testing environment.

**Options:**

- `reset`: Testing hook in which to reset the state and actions history. Pass it one of your testing framework lifecycle functions such as `beforeEach`.
- `restore`: Testing hook in which to restore the state, removing the spy altogether. Pass it one of your testing framework lifecycle functions such as `afterAll`.
- `context`: Partial context to set in place of the normal store context, useful for injecting service mocks relevant to the current test suite.
- `snapshot`: Partial snapshot of the state to apply when `reset` is called, useful for bringing the state to a relevant value for the current test suite.

**`StoreSpy` fields:**

- `context(context)`: Takes a new partial context and replace the store context. Useful for injecting mocks relevant to a specific test.
- `snapshot(snapshot)`: Takes a partial snapshot and apply it to the store. Useful for bringing the state to a relevant value for a specific test.
- `clear()`: Clears all recorded actions, to get back an empty history.
- `reset()`: Resets the state to its original state, then applies the snapshot passed as option to `Store.spy()`, if any. Also calls `clear()` internally.
  Prefer using the `reset` option rather than calling `reset()` yourself.
- `restore()`: Restore the state to its original state, and removes the spy completely. Prefer using the `restore` option rather than calling `restore` directly.
- `history`: Array containing an entry for each action that have been called since the last `clear()` call. Each action log is an object containing a `type`
  field equals to `@action.[path.to.slice].[actionName]` and a `payload` field equals to the `arguments` passed to the action.
  If an action returns a `Promise`, then an additional entry is added after the `Promise` resolves or rejects. The `type` is the same as the action, with either a `(success)` or `(fail)` suffix.
