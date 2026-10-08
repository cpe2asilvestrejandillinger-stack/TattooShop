import './PortfolioLightbox.css'
import { X } from 'lucide-react'

export default function PortfolioLightbox(props) {
  const { selectedImage, setSelectedImage } = props
  return (
    <>
      {/* LIGHTBOX MODAL FOR PORTFOLIO */}
      {selectedImage && (
        <div className="portfolio-lightbox__lightbox-backdrop">
          <div className="portfolio-lightbox__lightbox-content">
            <button 
              onClick={() => setSelectedImage(null)}
              className="portfolio-lightbox__close-button"
            >
              <X className="portfolio-lightbox__close-icon" />
            </button>
            <img 
              src={selectedImage.img} 
              alt={selectedImage.title} 
              className="portfolio-lightbox__image"
            />
            <div className="portfolio-lightbox__caption">
              <h3 className="portfolio-lightbox__title">{selectedImage.title}</h3>
              <p className="portfolio-lightbox__description">{selectedImage.description}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
