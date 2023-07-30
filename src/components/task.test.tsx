import { expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { Store } from '../store'

import { Task } from './task.tsx'

describe('the Task component', () => {
  const StoreSpy = Store.spy({
    reset: beforeEach,
  })

  it('should render the task corresponding to the passed ID', async () => {
    StoreSpy.snapshot({
      tasks: {
        tasks: {
          '1': { name: 'Task 1', done: true },
          '2': { name: 'Task 2', done: true },
        },
      },
    })

    render(<Task taskId="1" />)

    expect(screen.queryByText('Task 1')).toBeInTheDocument()
    expect(screen.queryByText('Task 2')).not.toBeInTheDocument()
  })
})
