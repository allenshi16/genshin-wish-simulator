type AmbientNode = OscillatorNode | GainNode

const BEAT_SECONDS = 0.5
const CHORDS = [
  [110, 164.81, 220],
  [98, 146.83, 196],
  [130.81, 196, 261.63],
  [87.31, 130.81, 174.61],
]
const ARPEGGIOS = [
  [220, 261.63, 329.63, 392, 329.63, 261.63, 220, 164.81],
  [196, 246.94, 293.66, 392, 293.66, 246.94, 196, 146.83],
  [261.63, 329.63, 392, 523.25, 392, 329.63, 261.63, 196],
  [174.61, 220, 261.63, 349.23, 261.63, 220, 174.61, 130.81],
]

function safeStop(node: OscillatorNode) {
  try { node.stop() } catch { /* already stopped */ }
}

export function startAmbientField(): (() => void) | null {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return null

  let context: AudioContext | null = null
  let scheduler: number | null = null
  let disposed = false
  const persistentNodes: AmbientNode[] = []
  const transientNodes = new Set<AmbientNode>()

  try {
    context = new window.AudioContext()
    const master = context.createGain()
    master.gain.value = 0.035
    master.connect(context.destination)
    persistentNodes.push(master)

    const padGains = CHORDS[0].map((frequency, index) => {
      const oscillator = context!.createOscillator()
      const gain = context!.createGain()
      oscillator.type = index === 1 ? 'sine' : 'triangle'
      oscillator.frequency.value = frequency
      gain.gain.value = index === 0 ? 0.26 : 0.13
      oscillator.connect(gain)
      gain.connect(master)
      oscillator.start()
      persistentNodes.push(oscillator, gain)
      return oscillator
    })

    let nextBeat = context.currentTime + 0.08
    let beatIndex = 0
    let chordIndex = 0

    const scheduleBeat = (time: number, index: number, chord: number) => {
      const note = context!.createOscillator()
      const noteGain = context!.createGain()
      note.type = 'sine'
      note.frequency.value = ARPEGGIOS[chord][index]
      noteGain.gain.setValueAtTime(0.0001, time)
      noteGain.gain.exponentialRampToValueAtTime(index === 0 ? 0.045 : 0.025, time + 0.025)
      noteGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.42)
      note.connect(noteGain)
      noteGain.connect(master)
      note.start(time)
      note.stop(time + 0.45)
      transientNodes.add(note)
      transientNodes.add(noteGain)
      note.addEventListener('ended', () => {
        transientNodes.delete(note)
        transientNodes.delete(noteGain)
        note.disconnect()
        noteGain.disconnect()
      }, { once: true })

      if (index === 0 || index === 4) {
        const pulse = context!.createOscillator()
        const pulseGain = context!.createGain()
        pulse.type = 'sine'
        pulse.frequency.value = index === 0 ? 55 : 73.42
        pulseGain.gain.setValueAtTime(0.0001, time)
        pulseGain.gain.exponentialRampToValueAtTime(0.018, time + 0.01)
        pulseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16)
        pulse.connect(pulseGain)
        pulseGain.connect(master)
        pulse.start(time)
        pulse.stop(time + 0.18)
        transientNodes.add(pulse)
        transientNodes.add(pulseGain)
        pulse.addEventListener('ended', () => {
          transientNodes.delete(pulse)
          transientNodes.delete(pulseGain)
          pulse.disconnect()
          pulseGain.disconnect()
        }, { once: true })
      }

      if (index === 7 && chord % 2 === 0) {
        const bell = context!.createOscillator()
        const bellGain = context!.createGain()
        bell.type = 'sine'
        bell.frequency.value = ARPEGGIOS[chord][3] * 2
        bellGain.gain.setValueAtTime(0.0001, time)
        bellGain.gain.exponentialRampToValueAtTime(0.035, time + 0.015)
        bellGain.gain.exponentialRampToValueAtTime(0.0001, time + 1.4)
        bell.connect(bellGain)
        bellGain.connect(master)
        bell.start(time)
        bell.stop(time + 1.45)
        transientNodes.add(bell)
        transientNodes.add(bellGain)
        bell.addEventListener('ended', () => {
          transientNodes.delete(bell)
          transientNodes.delete(bellGain)
          bell.disconnect()
          bellGain.disconnect()
        }, { once: true })
      }
    }

    const tick = () => {
      if (disposed || !context) return
      while (nextBeat < context.currentTime + 0.18) {
        if (beatIndex === 0) {
          const chord = CHORDS[chordIndex]
          padGains.forEach((oscillator, index) => {
            oscillator.frequency.cancelScheduledValues(nextBeat)
            oscillator.frequency.linearRampToValueAtTime(chord[index], nextBeat + 1.2)
          })
        }
        scheduleBeat(nextBeat, beatIndex, chordIndex)
        beatIndex = (beatIndex + 1) % 8
        if (beatIndex === 0) chordIndex = (chordIndex + 1) % CHORDS.length
        nextBeat += BEAT_SECONDS
      }
    }

    scheduler = window.setInterval(tick, 80)
    tick()
    void context.resume().catch((error: unknown) => console.warn('Could not resume ambient audio.', error))

    return () => {
      if (disposed) return
      disposed = true
      if (scheduler !== null) window.clearInterval(scheduler)
      ;[...transientNodes, ...persistentNodes].forEach((node) => {
        if ('stop' in node) safeStop(node)
        node.disconnect()
      })
      void context?.close()
    }
  } catch {
    if (scheduler !== null) window.clearInterval(scheduler)
    ;[...transientNodes, ...persistentNodes].forEach((node) => node.disconnect())
    void context?.close()
    return null
  }
}
