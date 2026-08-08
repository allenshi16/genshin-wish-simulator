import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

describe('simulator pull lifecycle', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('commits immediately, locks controls, and reveals after the timer', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Instruments of Orbit/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Make one wish' }))
    expect(JSON.parse(localStorage.getItem('astral-wish-lab:v2') ?? '{}').total).toBe(1)
    expect(screen.getByRole('button', { name: /Dawn Archive/i })).toBeDisabled()
    expect(screen.getByRole('combobox', { name: /Charted instrument/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Make one wish' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Make ten wishes' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Reset all local data/i })).toBeEnabled()
    expect(screen.getByText('Tracing the signal…')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(720))
    expect(screen.queryByText('Tracing the signal…')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reset all local data/i })).toBeEnabled()
  })

  it('reset cancels a pending visual reveal without restoring data', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Make one wish' }))
    fireEvent.click(screen.getByRole('button', { name: /Reset all local data/i }))
    expect(JSON.parse(localStorage.getItem('astral-wish-lab:v2') ?? '{}').total).toBe(0)
    act(() => vi.advanceTimersByTime(1000))
    expect(JSON.parse(localStorage.getItem('astral-wish-lab:v2') ?? '{}').total).toBe(0)
  })

  it('renders duplicate weapon refinements in batch order', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Wanderer’s Almanac/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Make ten wishes' }))
    act(() => vi.advanceTimersByTime(720))
    expect(screen.getAllByText('New weapon')).toHaveLength(2)
    expect(screen.getByText('Refinement 2')).toBeInTheDocument()
    expect(screen.getByText('Refinement 3')).toBeInTheDocument()
    expect(screen.getByText('Refinement 4')).toBeInTheDocument()
    expect(screen.getByText('Refinement 5')).toBeInTheDocument()
    expect(screen.getAllByText('Refinement 5+')).toHaveLength(4)
    vi.restoreAllMocks()
  })
})
