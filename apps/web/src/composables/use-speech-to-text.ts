import { Capacitor, registerPlugin } from '@capacitor/core'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Voice dictation with two engines behind one interface:
 *  - Android APK: the native SpeechRecognition Capacitor plugin.
 *  - Browser: the Web Speech API (Chrome/Edge).
 * Final fragments are delivered through `onText`; `interimText` exposes the
 * in-progress utterance so the UI can preview it.
 */

interface SpeechRecognitionPlugin {
  available(): Promise<{ available: boolean }>
  requestPermissions(): Promise<unknown>
  start(options: {
    language: string
    partialResults: boolean
    popup: boolean
  }): Promise<void>
  stop(): Promise<void>
  addListener(
    event: 'partialResults',
    handler: (data: { matches: string[] }) => void
  ): Promise<{ remove: () => Promise<void> }>
}

const nativeSpeech = registerPlugin<SpeechRecognitionPlugin>('SpeechRecognition')

type WebSpeechRecognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((event: WebSpeechResultEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

interface WebSpeechResultEvent {
  resultIndex: number
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>
}

function getWebSpeechConstructor(): (new () => WebSpeechRecognition) | null {
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | (new () => WebSpeechRecognition)
    | null
}

export interface UseSpeechToText {
  supported: boolean
  listening: boolean
  interimText: string
  error: string | null
  start: () => Promise<void>
  stop: () => Promise<void>
}

export function useSpeechToText(onText: (text: string) => void): UseSpeechToText {
  const isNative = Capacitor.isNativePlatform()
  const [supported, setSupported] = useState(
    isNative || getWebSpeechConstructor() !== null
  )
  const [listening, setListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onTextRef = useRef(onText)
  onTextRef.current = onText

  const webRecognitionRef = useRef<WebSpeechRecognition | null>(null)
  const nativeListenerRef = useRef<{ remove: () => Promise<void> } | null>(null)
  const nativeLastMatchRef = useRef('')

  const language = navigator.language || 'es-ES'

  useEffect(() => {
    if (!isNative) return
    nativeSpeech
      .available()
      .then(({ available }) => setSupported(available))
      .catch(() => setSupported(false))
  }, [isNative])

  const startNative = useCallback(async () => {
    await nativeSpeech.requestPermissions().catch(() => undefined)
    nativeLastMatchRef.current = ''
    nativeListenerRef.current = await nativeSpeech.addListener(
      'partialResults',
      ({ matches }) => {
        const best = matches[0] ?? ''
        nativeLastMatchRef.current = best
        setInterimText(best)
      }
    )
    await nativeSpeech.start({ language, partialResults: true, popup: false })
  }, [language])

  const stopNative = useCallback(async () => {
    await nativeSpeech.stop().catch(() => undefined)
    await nativeListenerRef.current?.remove()
    nativeListenerRef.current = null
    // The native engine only streams partials: commit the last one as final.
    if (nativeLastMatchRef.current) {
      onTextRef.current(nativeLastMatchRef.current)
      nativeLastMatchRef.current = ''
    }
  }, [])

  const startWeb = useCallback(async () => {
    const SpeechRecognitionCtor = getWebSpeechConstructor()
    if (!SpeechRecognitionCtor) throw new Error('Web Speech API no disponible')

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = language
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (!result) continue
        if (result.isFinal) {
          onTextRef.current(result[0].transcript.trim())
        } else {
          interim += result[0].transcript
        }
      }
      setInterimText(interim)
    }
    recognition.onerror = (event) => {
      setError(`Error de reconocimiento: ${event.error}`)
      setListening(false)
    }
    recognition.onend = () => {
      setListening(false)
      setInterimText('')
    }

    webRecognitionRef.current = recognition
    recognition.start()
  }, [language])

  const stopWeb = useCallback(async () => {
    webRecognitionRef.current?.stop()
    webRecognitionRef.current = null
  }, [])

  const start = useCallback(async () => {
    setError(null)
    setInterimText('')
    try {
      await (isNative ? startNative() : startWeb())
      setListening(true)
    } catch (startError) {
      setError(
        startError instanceof Error ? startError.message : String(startError)
      )
    }
  }, [isNative, startNative, startWeb])

  const stop = useCallback(async () => {
    await (isNative ? stopNative() : stopWeb())
    setListening(false)
    setInterimText('')
  }, [isNative, stopNative, stopWeb])

  return { supported, listening, interimText, error, start, stop }
}
