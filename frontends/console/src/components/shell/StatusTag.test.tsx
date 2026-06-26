import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusTag } from './StatusTag'

describe('StatusTag', () => {
  it('renders running as green tag', () => {
    render(<StatusTag status="running" />)
    expect(screen.getByText('running')).toBeInTheDocument()
  })

  it('renders dash for empty status', () => {
    render(<StatusTag status={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
