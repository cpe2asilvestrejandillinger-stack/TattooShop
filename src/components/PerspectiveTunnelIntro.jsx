import { useEffect, useState } from 'react'
import './PerspectiveTunnelIntro.css'

const INTRO_IMAGES = [
  { src: 'https://cdn.21st.dev/assets/mirror/c3/c3fbd2afa140223999a441b32ed986f61d473930002708df805a81532a326aac.jpg', title: 'Chroma I', x: '-31vw', y: '-12vh', rotation: '-8deg' },
  { src: 'https://cdn.21st.dev/assets/mirror/9d/9d8b2f675a5814476ada3736ce439bcda23c5c389e0ebf9b25d8a0c09f3bbcfe.jpg', title: 'Prism III', x: '18vw', y: '-25vh', rotation: '7deg' },
  { src: 'https://cdn.21st.dev/assets/mirror/8b/8bb738bf2f00d7f7ed3c3ec034adb9938ad38f4be4ac191d632a6a11ad525574.jpg', title: 'Ether IV', x: '34vw', y: '12vh', rotation: '-5deg' },
  { src: 'https://cdn.21st.dev/assets/mirror/ac/ac5ac700b188d7ef16ee9dab868098b59f15c440db3f71d4e8c03262a3287577.jpg', title: 'Quantum V', x: '-18vw', y: '25vh', rotation: '5deg' },
  { src: 'https://cdn.21st.dev/assets/mirror/ef/ef25eff6ce655fba459b3b7e7711524dc92499aa18f6c7dbea9a0fcc56a8f908.jpg', title: 'Nebula VI', x: '-37vw', y: '22vh', rotation: '-6deg' },
  { src: 'https://cdn.21st.dev/assets/mirror/f2/f28b370a5dcbf76240f1504579c4b05fc0ff0bb990a42aff8dc2f73a5dc46072.jpg', title: 'Cyber VII', x: '3vw', y: '-31vh', rotation: '4deg' },
  { src: 'https://cdn.21st.dev/assets/mirror/f2/f26a1eac85704dda924820392dedfb72d51d8261d35354f83b35d683617295f3.jpg', title: 'Flux VIII', x: '27vw', y: '29vh', rotation: '8deg' },
  { src: 'https://cdn.21st.dev/assets/mirror/77/7755d23eaaa0aa5b403343f44afa7a29b2d06d3065fe54c602b14ba01d00f2aa.jpg', title: 'Aether IX', x: '-6vw', y: '4vh', rotation: '-3deg' },
  { src: 'https://cdn.21st.dev/assets/mirror/65/657317761fe9058a1d43711b13c543a71eb5199b7a5d9abf4c28479674e39cf7.jpg', title: 'Chroma X', x: '39vw', y: '-20vh', rotation: '6deg' },
]

export default function PerspectiveTunnelIntro() {
  const [leaving, setLeaving] = useState(false)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFinished(true)
      return undefined
    }

    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    const leaveTimer = window.setTimeout(() => setLeaving(true), 6900)
    const finishTimer = window.setTimeout(() => setFinished(true), 7700)

    return () => {
      window.clearTimeout(leaveTimer)
      window.clearTimeout(finishTimer)
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
    }
  }, [])

  if (finished) return null

  return (
    <div className={`perspective-intro${leaving ? ' is-leaving' : ''}`} role="status" aria-label="Welcome to AirWizard Tattoo">
      <div className="perspective-intro__grid" aria-hidden="true" />
      <div className="perspective-intro__glow" aria-hidden="true" />
      <div className="perspective-intro__rings" aria-hidden="true" />
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
            <img src={image.src} alt="" />
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
