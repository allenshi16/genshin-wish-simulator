import { describe, expect, it } from 'vitest'
import { startAmbientField } from './audioField'

describe('ambient audio field', () => {
  it('fails safely when AudioContext is unavailable', () => {
    expect(startAmbientField()).toBeNull()
  })
})
