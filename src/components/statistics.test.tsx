import { expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'

import { Store } from '../store'

import { Statistics } from './statistics.tsx'

describe('the Statistics component', () => {
  const StoreSpy = Store.spy({
    reset: beforeEach
  })

  beforeEach(() => {
    render(<Statistics />)
  })

  it('should render statistics about the current tasks', () => {
    expect(screen.queryByText('Done')).toBeInTheDocument()
    expect(screen.queryByText('Total')).toBeInTheDocument()

    expect(screen.queryAllByText('0')).toHaveLength(2)
    expect(screen.queryByText('0.00%')).toBeInTheDocument()
  })

  it('should render the total number of tasks', () => {
    act(() => StoreSpy.snapshot({
      tasks: {
        tasks: {
          '1': { name: '1', done: false },
          '2': { name: '2', done: false },
        },
      }
    }))

    expect(screen.queryByText('2')).toBeInTheDocument()
  })

  it('should render the number of finished tasks', () => {
    act(() => StoreSpy.snapshot({
      tasks: {
        tasks: {
          '1': { name: '1', done: true },
          '2': { name: '2', done: false },
        },
      }
    }))

    expect(screen.queryByText('1')).toBeInTheDocument()
  })

  it('should render the progress in percent', () => {
    act(() => StoreSpy.snapshot({
      tasks: {
        tasks: {
          '1': { name: '1', done: true },
          '2': { name: '2', done: false },
        },
      }
    }))

    expect(screen.queryByText('50.00%')).toBeInTheDocument()
  })
})
