
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
