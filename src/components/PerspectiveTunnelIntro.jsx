import { useEffect, useState } from 'react'
import artistImage from '../assets/artist.jpg'
import design1Image from '../assets/design1.jpg'
import design2Image from '../assets/design2.jpg'
import design3Image from '../assets/design3.jpg'
import design4Image from '../assets/design4.png'
import design5Image from '../assets/design5.jpg'
import design6Image from '../assets/design6.jpg'
import design7Image from '../assets/design7.jpg'
import design8Image from '../assets/design8.jpg'
import design9Image from '../assets/design9.jpg'
import './PerspectiveTunnelIntro.css'

const INTRO_IMAGES = [
  { src: design1Image, title: 'Design 1', x: '-31vw', y: '-12vh', rotation: '-8deg' },
  { src: design2Image, title: 'Design 2', x: '18vw', y: '-25vh', rotation: '7deg' },
  { src: design3Image, title: 'Design 3', x: '34vw', y: '12vh', rotation: '-5deg' },
  { src: design4Image, title: 'Design 4', x: '-18vw', y: '25vh', rotation: '5deg' },
  { src: design5Image, title: 'Design 5', x: '-37vw', y: '22vh', rotation: '-6deg' },
  { src: design6Image, title: 'Design 6', x: '3vw', y: '-31vh', rotation: '4deg' },
  { src: design7Image, title: 'Design 7', x: '27vw', y: '29vh', rotation: '8deg' },
  { src: design8Image, title: 'Design 8', x: '-6vw', y: '4vh', rotation: '-3deg' },
  { src: design9Image, title: 'Design 9', x: '39vw', y: '-20vh', rotation: '6deg' },
]

export default function PerspectiveTunnelIntro() {
  const [leaving, setLeaving] = useState(false)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFinished(true)
      return undefined
    }

    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    const restorePageScroll = () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
    }

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    let cancelled = false
    let introStarted = false
    let fallbackTimer
    let leaveTimer
    let finishTimer

    const beginIntro = () => {
      if (cancelled || introStarted) return
      introStarted = true
      window.clearTimeout(fallbackTimer)
      setStarted(true)
      leaveTimer = window.setTimeout(() => setLeaving(true), 6900)
      finishTimer = window.setTimeout(() => {
        restorePageScroll()
        setFinished(true)
      }, 7700)
    }

    const decodeImage = (src) => new Promise((resolve) => {
      const image = new Image()
      const finish = () => {
        if (typeof image.decode === 'function') {
          image.decode().catch(() => {}).finally(resolve)
        } else {
          resolve()
        }
      }
      image.onload = finish
      image.onerror = resolve
      image.src = src
      if (image.complete && image.naturalWidth > 0) finish()
    })

    fallbackTimer = window.setTimeout(beginIntro, 2500)
    Promise.all(INTRO_IMAGES.map(({ src }) => decodeImage(src))).then(beginIntro)

    return () => {
      cancelled = true
      window.clearTimeout(fallbackTimer)
      window.clearTimeout(leaveTimer)
      window.clearTimeout(finishTimer)
      restorePageScroll()
    }
  }, [])

  if (finished) return null

  return (
    <div className={`perspective-intro${started ? ' is-started' : ''}${leaving ? ' is-leaving' : ''}`} role="status" aria-label="Welcome to AirWizard Tattoo">
      <div className="perspective-intro__grid" aria-hidden="true" />
      <div className="perspective-intro__glow" aria-hidden="true" />
      <img className="perspective-intro__logo" src={artistImage} alt="" aria-hidden="true" decoding="async" />
      <div className="perspective-intro__cards" aria-hidden="true">
        {INTRO_IMAGES.map((image, index) => (
          <div
            className="perspective-intro__card"
            key={image.title}
            style={{
              '--card-index': index,
              '--card-x': image.x,
              '--card-y': image.y,
              '--card-rotation': image.rotation,
            }}
          >
            <img src={image.src} alt="" decoding="async" />
            <span>{image.title}</span>
          </div>
        ))}
      </div>
      <div className="perspective-intro__title">
        <span className="perspective-intro__eyebrow">Guiguinto, Bulacan</span>
        <h1>AirWizard<br />Tattoo</h1>
        <p>Art that moves with you.</p>
      </div>
    </div>
  )
}
