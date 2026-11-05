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

  it('renders SemiLaunch, Firsto, and Lifto badges in the homepage footer', () => {
    render(<App />)
    const semi = screen.getByRole('link', { name: 'Featured on SemiLaunch' })
    expect(semi).toHaveAttribute('href', 'https://semilaunch.com')
    expect(semi.querySelector('img')).toHaveAttribute('src', '/badges/semilaunch.png')
    const firsto = screen.getByRole('link', { name: 'Astral Wish Lab — Launched on Firsto' })
    expect(firsto).toHaveAttribute('href', 'https://firsto.co')
    expect(firsto).toHaveAttribute('title', 'Astral Wish Lab — Launched on Firsto')
    expect(firsto.querySelector('img')).toHaveAttribute('src', '/badges/find-us-on-firsto.svg')
    const lifto = screen.getByRole('link', { name: 'Featured on Lifto' })
    expect(lifto).toHaveAttribute('href', 'https://liftoapp.com/product/astral-wish-lab')
    expect(lifto).toHaveAttribute('rel', 'noopener noreferrer')
    expect(lifto.querySelector('img')).toHaveAttribute('src', '/badges/featured-on-lifto.svg')
  })

  it('states the unofficial fan-project disclaimer on the homepage', () => {
    render(<App />)
    const disclaimer = /Astral Wish Lab is an unofficial fan project and is not affiliated with, endorsed, or sponsored by HoYoverse or any game publisher/
    expect(screen.getAllByText(disclaimer).length).toBeGreaterThanOrEqual(1)
    const footer = document.querySelector('footer')
    expect(footer).toHaveTextContent(disclaimer)
    expect(footer).toHaveTextContent(/trademarks of their respective owners/)
  })
})
