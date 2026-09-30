import './PortfolioLightbox.css'
import { X } from 'lucide-react'

export default function PortfolioLightbox(props) {
  const { selectedImage, setSelectedImage } = props
  return (
    <>
      {/* LIGHTBOX MODAL FOR PORTFOLIO */}
      {selectedImage && (
        <div className="portfolio-lightbox__41583c62">
          <div className="portfolio-lightbox__6e610bab">
            <button 
              onClick={() => setSelectedImage(null)}
              className="portfolio-lightbox__0c9d78f8"
            >
              <X className="portfolio-lightbox__a8600f1b" />
            </button>
            <img 
              src={selectedImage.img} 
              alt={selectedImage.title} 
              className="portfolio-lightbox__dff9ebf1"
            />
            <div className="portfolio-lightbox__1e3c6581">
              <h3 className="portfolio-lightbox__0a275a21">{selectedImage.title}</h3>
              <p className="portfolio-lightbox__5aa543ea">{selectedImage.description}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
