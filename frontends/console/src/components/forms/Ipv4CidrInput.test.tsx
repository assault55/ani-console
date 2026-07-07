import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Ipv4CidrInput } from './Ipv4CidrInput'

describe('Ipv4CidrInput', () => {
  it('renders ipv4 octets in one line by default', () => {
    const { container } = render(<Ipv4CidrInput value="10.80.1.1" onChange={() => {}} />)

    const inputs = screen.getAllByRole('spinbutton')
    expect(inputs.map((input) => input.getAttribute('value'))).toEqual(['10', '80', '1', '1'])
    expect(container.firstElementChild).toHaveClass('flex-nowrap')
  })

  it('splits cidr into octet and prefix inputs', () => {
    render(<Ipv4CidrInput value="10.80.1.0/24" onChange={() => {}} withPrefix />)

    const inputs = screen.getAllByRole('spinbutton')
    expect(inputs.map((input) => input.getAttribute('value'))).toEqual(['10', '80', '1', '0', '24'])
  })

  it('emits cidr when an octet or prefix changes', () => {
    const onChange = vi.fn()
    render(<Ipv4CidrInput value="10.80.1.0/24" onChange={onChange} withPrefix />)

    const inputs = screen.getAllByRole('spinbutton')

    fireEvent.change(inputs[1], { target: { value: '90' } })
    expect(onChange).toHaveBeenLastCalledWith('10.90.1.0/24')

    fireEvent.change(inputs[4], { target: { value: '16' } })
    expect(onChange).toHaveBeenLastCalledWith('10.80.1.0/16')
  })

  it('emits ipv4 without prefix by default', () => {
    const onChange = vi.fn()
    render(<Ipv4CidrInput value="10.80.1.1" onChange={onChange} />)

    fireEvent.change(screen.getAllByRole('spinbutton')[3], { target: { value: '2' } })
    expect(onChange).toHaveBeenLastCalledWith('10.80.1.2')
  })

  it('disables fixed octets and enforces prefix minimum', () => {
    render(
      <Ipv4CidrInput
        value="10.72.0.0/25"
        onChange={() => {}}
        withPrefix
        disabledOctets={[true, true, true, false]}
        minPrefix={24}
      />,
    )

    const inputs = screen.getAllByRole('spinbutton')
    expect(inputs[0]).toBeDisabled()
    expect(inputs[1]).toBeDisabled()
    expect(inputs[2]).toBeDisabled()
    expect(inputs[3]).not.toBeDisabled()
    expect(inputs[4]).toHaveAttribute('aria-valuemin', '24')
  })
})
