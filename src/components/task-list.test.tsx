import { expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'

import { Store } from '../store'

import { TaskList } from './task-list.tsx'

describe('the TaskList component', () => {
  const StoreSpy = Store.spy({
    reset: beforeEach
  })

  beforeEach(() => {
    render(<TaskList />)
  })

  it('should render all the tasks in the state', () => {
    act(() => StoreSpy.snapshot({
      tasks: {
        keys: ['1', '2'],
        tasks: {
          '1': { name: 'Task 1', done: true },
          '2': { name: 'Task 2', done: false },
        },
      }
    }))

    expect(screen.queryByText('Task 1')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Task 2')).toBeInTheDocument()
  })

  it('should ignore tasks that do not have a corresponding key', () => {
    act(() => StoreSpy.snapshot({
      tasks: {
        keys: ['1'],
        tasks: {
          '1': { name: 'Task 1', done: true },
          '2': { name: 'Task 2', done: true },
        },
      }
    }))

    expect(screen.queryByText('Task 1')).toBeInTheDocument()
    expect(screen.queryByRole('Task 2')).not.toBeInTheDocument()
  })
})
