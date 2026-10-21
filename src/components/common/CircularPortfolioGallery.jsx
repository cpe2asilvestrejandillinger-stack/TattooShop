import { useEffect, useRef } from 'react'

export default function CircularPortfolioGallery({ items, onSelect }) {
  const ringRef = useRef(null)
  const rotationRef = useRef(0)
  const galleryRef = useRef(null)
  const isVisibleRef = useRef(false)
  const isDraggingRef = useRef(false)
  const dragPointerRef = useRef(null)
  const suppressClickRef = useRef(false)
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
      if (previousTime && !isDraggingRef.current) applyRotation(rotationRef.current + (time - previousTime) * 0.004)
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

  const startDrag = (event) => {
    if (event.button !== 0 || !galleryRef.current) return
    isDraggingRef.current = true
    dragPointerRef.current = { id: event.pointerId, x: event.clientX, distance: 0 }
    suppressClickRef.current = false
    event.target.setPointerCapture(event.pointerId)
  }

  const moveDrag = (event) => {
    const drag = dragPointerRef.current
    if (!drag || drag.id !== event.pointerId) return
    const delta = event.clientX - drag.x
    drag.x = event.clientX
    drag.distance += Math.abs(delta)
    if (drag.distance > 6) suppressClickRef.current = true
    if (ringRef.current) {
      rotationRef.current += delta * 0.45
      ringRef.current.style.transform = `rotateY(${rotationRef.current}deg)`
    }
  }

  const endDrag = (event) => {
    if (dragPointerRef.current?.id !== event.pointerId) return
    dragPointerRef.current = null
    isDraggingRef.current = false
  }

  return (
    <div
      ref={galleryRef}
      className="portfolio-gallery"
      role="region"
      aria-label="Tattoo portfolio gallery. Swipe or drag to rotate."
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={(event) => {
        if (suppressClickRef.current) {
          event.preventDefault()
          event.stopPropagation()
          suppressClickRef.current = false
        }
      }}
    >
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
