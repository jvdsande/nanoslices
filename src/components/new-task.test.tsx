import { expect } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

import { Store } from '../store'

import { NewTask } from './new-task.tsx'

describe('the NewTask component', () => {
  const StoreSpy = Store.spy({
    reset: beforeEach,
  })

  beforeEach(() => {
    render(<NewTask />)
  })

  it('should render an input linked to the store', () => {
    expect(screen.queryByRole('textbox')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).toHaveAttribute('value', '')

    act(() => StoreSpy.snapshot({
      newTask: {
        value: 'Hello world'
      }
    }))

    expect(screen.queryByRole('textbox')).toHaveAttribute('value', 'Hello world')
  })

  it('should render a submit button disabled when the form is invalid', () => {
    expect(screen.queryByRole('button')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toHaveAttribute('type', 'submit')
    expect(screen.queryByRole('button')).toHaveAttribute('disabled')

    act(() => StoreSpy.snapshot({
      newTask: {
        value: 'Hello world'
      }
    }))

    expect(screen.queryByRole('button')).not.toHaveAttribute('disabled')
  })

  it('should call the setValue action on input change', async () => {
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'From input' } })

    expect(StoreSpy.history).toContainEqual({
      type: '@action.newTask.setValue',
      payload: ['From input']
    })
  })

  it('should call the submit action on form submit', async () => {
    act(() => StoreSpy.snapshot({ newTask: { value: 'Task to submit' } }))

    fireEvent.click(screen.getByRole('button'))

    expect(StoreSpy.history).toContainEqual({
      type: '@action.newTask.submit',
      payload: []
    })
    expect(StoreSpy.history).toContainEqual({
      type: '@action.tasks.addTask',
      payload: ['Task to submit']
    })
  })
})
