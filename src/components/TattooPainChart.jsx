import { useEffect, useRef, useState } from 'react'
import './TattooPainChart.css'

function AnatomyViewer() {
  const hostRef = useRef(null)
  const isNearViewportRef = useRef(false)
  const syncAnimationRef = useRef(null)
  const [loadRequested, setLoadRequested] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [viewerError, setViewerError] = useState(false)
  const [isAutoRotating, setIsAutoRotating] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    if (typeof IntersectionObserver === 'undefined') {
      const fallbackFrame = window.requestAnimationFrame(() => {
        isNearViewportRef.current = true
        setLoadRequested(true)
      })
      return () => window.cancelAnimationFrame(fallbackFrame)
    }

    const observer = new IntersectionObserver(([entry]) => {
      isNearViewportRef.current = entry.isIntersecting
      if (entry.isIntersecting) setLoadRequested(true)
      syncAnimationRef.current?.()
    }, { rootMargin: '400px 0px' })
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!loadRequested) return undefined

    const host = hostRef.current
    if (!host) return undefined

    let frameId
    let disposed = false
    let model
    let modelReady = false
    let renderer
    let controls
    let resizeObserver
    let scene
    let camera
    const disposeModel = (root) => {
      root?.traverse((part) => {
        if (part.geometry) part.geometry.dispose()
        const materials = Array.isArray(part.material) ? part.material : [part.material]
        materials.filter(Boolean).forEach((material) => {
          Object.values(material).forEach((value) => {
            if (value?.isTexture) value.dispose()
          })
          material.dispose()
        })
      })
    }

    const initialize = async () => {
      try {
        const [THREE, { GLTFLoader }, { OrbitControls }] = await Promise.all([
          import('three'),
          import('three/addons/loaders/GLTFLoader.js'),
          import('three/addons/controls/OrbitControls.js'),
        ])
        if (disposed) return

        scene = new THREE.Scene()
        scene.background = new THREE.Color('#17181c')
        camera = new THREE.PerspectiveCamera(29, 1, 0.1, 100)
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.setSize(host.clientWidth, host.clientHeight)
        host.appendChild(renderer.domElement)

        scene.add(new THREE.HemisphereLight(0xffffff, 0x55545a, 2.6))
        const keyLight = new THREE.DirectionalLight(0xffffff, 3.4)
        keyLight.position.set(3, 5, 5)
        scene.add(keyLight)
        const fillLight = new THREE.DirectionalLight(0xdde3f0, 1.8)
        fillLight.position.set(-4, 1, -3)
        scene.add(fillLight)
        const rimLight = new THREE.DirectionalLight(0xffffff, 1.4)
        rimLight.position.set(-2, 4, 4)
        scene.add(rimLight)

        controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.07
        controls.enablePan = false
        controls.minDistance = 2
        controls.maxDistance = 12
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        controls.autoRotate = !prefersReducedMotion
        controls.autoRotateSpeed = 0.8
        setIsAutoRotating(!prefersReducedMotion)
        controls.target.set(0, 0, 0)

        const render = () => {
          frameId = null
          if (disposed || !modelReady || !isNearViewportRef.current || document.hidden) return
          controls.update()
          renderer.render(scene, camera)
          frameId = window.requestAnimationFrame(render)
        }
        const syncAnimation = () => {
          const shouldRender = modelReady && isNearViewportRef.current && !document.hidden
          if (shouldRender && frameId == null) frameId = window.requestAnimationFrame(render)
          if (!shouldRender && frameId != null) {
            window.cancelAnimationFrame(frameId)
            frameId = null
          }
        }
        syncAnimationRef.current = syncAnimation
        document.addEventListener('visibilitychange', syncAnimation)

        resizeObserver = new ResizeObserver(() => {
          if (!host.clientWidth || !host.clientHeight) return
          camera.aspect = host.clientWidth / host.clientHeight
          camera.updateProjectionMatrix()
          renderer.setSize(host.clientWidth, host.clientHeight)
          syncAnimation()
        })
        resizeObserver.observe(host)

        setIsLoading(true)
        new GLTFLoader().load('/male_anatomy_pain_chart_colored.glb', (gltf) => {
          if (disposed) {
            disposeModel(gltf.scene)
            return
          }
          model = gltf.scene
          const bounds = new THREE.Box3().setFromObject(model)
          const center = bounds.getCenter(new THREE.Vector3())
          const size = bounds.getSize(new THREE.Vector3())
          model.position.sub(center)
          model.rotation.y = -0.12
          scene.add(model)
          const height = Math.max(size.y, 1)
          controls.target.set(0, 0, 0)
          camera.position.set(height * 0.3, height * 0.06, height * 2.05)
          camera.near = height / 100
          camera.far = height * 20
          camera.updateProjectionMatrix()
          controls.minDistance = height * 1.2
          controls.maxDistance = height * 4
          modelReady = true
          setIsLoading(false)
          syncAnimation()
        }, undefined, () => {
          if (!disposed) {
            setViewerError(true)
            setIsLoading(false)
          }
        })
      } catch {
        if (!disposed) {
          setViewerError(true)
          setIsLoading(false)
        }
      }
    }

    setIsLoading(true)
    initialize()

    return () => {
      disposed = true
      if (frameId != null) window.cancelAnimationFrame(frameId)
      document.removeEventListener('visibilitychange', syncAnimationRef.current)
      syncAnimationRef.current = null
      resizeObserver?.disconnect()
      controls?.dispose()
      renderer?.dispose()
      if (renderer?.domElement.parentNode === host) host.removeChild(renderer.domElement)
      scene?.clear()
      disposeModel(model)
    }
  }, [loadRequested])

  return (
    <div className="pain-chart__viewer-wrap">
      <div ref={hostRef} className="pain-chart__viewer" aria-label="Interactive 3D male anatomy model" />
      {viewerError && <div className="pain-chart__viewer-error">The 3D model could not load. Try refreshing the page.</div>}
      {isLoading && <div className="pain-chart__viewer-status" role="status">Loading the 3D model…</div>}
      <div className="pain-chart__viewer-caption">{isAutoRotating && <><span className="pain-chart__live-dot" /> Auto-rotating <span aria-hidden="true">·</span></>} Drag to rotate <span aria-hidden="true">·</span> Scroll to zoom</div>
    </div>
  )
}

export default function TattooPainChart() {
  return (
    <section id="pain-guide" className="pain-chart scroll-reveal" aria-labelledby="pain-chart-title">
      <div className="pain-chart__heading">
        <span className="home-page__eyebrow">Placement guide</span>
        <h2 id="pain-chart-title" className="home-page__section-title">Tattoo Pain Chart</h2>
        <p className="home-page__section-subtitle">Rotate the model to explore how discomfort can vary by placement.</p>
      </div>

      <div className="pain-chart__layout">
        <AnatomyViewer />
        <div className="pain-chart__scale pain-chart__scale--model" role="group" aria-label="Pain scale from usually easier to often more intense">
          <div className="pain-chart__scale-labels"><span>Usually easier</span><span>Often more intense</span></div>
          <div className="pain-chart__scale-bar" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        </div>
      </div>
    </section>
  )
}
