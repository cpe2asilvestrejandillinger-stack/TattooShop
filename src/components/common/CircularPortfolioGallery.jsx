import { useEffect, useRef } from 'react'

export default function CircularPortfolioGallery({ items, onSelect }) {
  const ringRef = useRef(null)
  const rotationRef = useRef(0)
  const galleryRef = useRef(null)
  const isVisibleRef = useRef(false)
  const anglePerItem = items.length ? 360 / items.length : 0

  useEffect(() => {
    const gallery = galleryRef.current
    const ring = ringRef.current
    if (!gallery || !ring) return undefined

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let animationFrameId = null
    let previousTime = 0

    const applyRotation = (degrees) => {
      rotationRef.current = degrees
      ring.style.transform = `rotateY(${degrees}deg)`
    }

    const animate = (time) => {
      if (!isVisibleRef.current) {
        animationFrameId = null
        previousTime = 0
        return
      }
      if (previousTime) applyRotation(rotationRef.current + (time - previousTime) * 0.004)
      previousTime = time
      animationFrameId = window.requestAnimationFrame(animate)
    }

    const startAnimation = () => {
      if (prefersReducedMotion || !isVisibleRef.current || animationFrameId !== null) return
      previousTime = 0
      animationFrameId = window.requestAnimationFrame(animate)
    }

    const stopAnimation = () => {
      if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
      animationFrameId = null
      previousTime = 0
    }

    const observer = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting
      if (entry.isIntersecting) startAnimation()
      else stopAnimation()
    }, { threshold: 0.05 })
    observer.observe(gallery)

    return () => {
      stopAnimation()
      observer.disconnect()
    }
  }, [])

  return (
    <div ref={galleryRef} className="portfolio-gallery" role="region" aria-label="Tattoo portfolio gallery">
      <div className="portfolio-gallery__stage">
        <div ref={ringRef} className="portfolio-gallery__ring">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className="portfolio-gallery__card"
              style={{ '--item-angle': `${index * anglePerItem}deg` }}
              onClick={() => onSelect(item)}
              aria-label={`View ${item.title}, ${item.category}`}
            >
              <span className="portfolio-gallery__image-wrap">
                <img src={item.img} alt={item.title} loading="lazy" decoding="async" />
                <span className="portfolio-gallery__category">{item.category}</span>
              </span>
              <span className="portfolio-gallery__caption">
                <span className="portfolio-gallery__title">{item.title}</span>
                <span className="portfolio-gallery__description">{item.description}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
