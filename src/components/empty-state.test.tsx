import { expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'

import { Store } from '../store'

import { EmptyState } from './empty-state.tsx'

describe('the EmptyState component', () => {
  const StoreSpy = Store.spy({
    reset: beforeEach,
  })

  beforeEach(() => {
    render(<EmptyState />)
  })

  it('should render a default message when there are no tasks', () => {
    expect(screen.queryByText('No task yet')).toBeInTheDocument()
  })

  it('should render nothing when there are some tasks', () => {
    act(() => StoreSpy.snapshot({
      tasks: {
        keys: ['1']
      }
    }))

    expect(screen.queryByText('No task yet')).not.toBeInTheDocument()
  })
})
