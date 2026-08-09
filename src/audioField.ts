type AmbientNode = OscillatorNode | GainNode | AudioBufferSourceNode

export function startAmbientField(): (() => void) | null {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return null

  let context: AudioContext | null = null
  const nodes: AmbientNode[] = []
  try {
    context = new window.AudioContext()
    const master = context.createGain()
    master.gain.value = 0.018
    master.connect(context.destination)
    nodes.push(master)

    const frequencies = [110, 164.81, 220]
    frequencies.forEach((frequency, index) => {
      const oscillator = context!.createOscillator()
      const gain = context!.createGain()
      oscillator.type = index === 1 ? 'sine' : 'triangle'
      oscillator.frequency.value = frequency
      gain.gain.value = index === 0 ? 0.7 : 0.35
      oscillator.connect(gain)
      gain.connect(master)
      oscillator.start()
      nodes.push(oscillator, gain)
    })

    const lfo = context.createOscillator()
    const lfoGain = context.createGain()
    lfo.frequency.value = 0.08
    lfoGain.gain.value = 0.006
    lfo.connect(lfoGain)
    lfoGain.connect(master.gain)
    lfo.start()
    nodes.push(lfo, lfoGain)

    void context.resume().catch((error: unknown) => {
      console.warn('Could not resume ambient audio.', error)
    })
    return () => {
      nodes.forEach((node) => {
        if ('stop' in node) {
          try { node.stop() } catch { /* oscillator may already be stopped */ }
        }
        node.disconnect()
      })
      void context?.close()
    }
  } catch {
    nodes.forEach((node) => node.disconnect())
    void context?.close()
    return null
  }
}
