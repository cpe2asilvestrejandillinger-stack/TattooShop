import AuthModal from './AuthModal'
import BookingModal from './BookingModal'
import AppointmentManager from '../../pages/admin/AppointmentManager'
import PortfolioLightbox from '../common/PortfolioLightbox'

export default function AppModals(props) {
  return (
    <>
      <AuthModal {...props} />
      <BookingModal {...props} />
      <AppointmentManager {...props} />
      <PortfolioLightbox {...props} />
    </>
  )
}
