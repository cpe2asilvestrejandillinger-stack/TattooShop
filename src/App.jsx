import { useCallback, useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { APPOINTMENT_SELECT } from './lib/appointmentFields'
import HomePage from './pages/public/HomePage'
import AppModals from './components/forms/AppModals'
import CustomerAdminChat from './components/CustomerAdminChat'
import { toAppointment, toCurrentUser } from './utils/appointmentMappers'

const ALLOWED_REFERENCE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_REFERENCE_IMAGE_SIZE = 10 * 1024 * 1024
const FLASH_IMAGE_BUCKET = 'flash-designs'

const localDateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const toPhoneDigits = (phone = '') => {
  let digits = String(phone).replace(/\D/g, '')
  if (digits.startsWith('63')) digits = `0${digits.slice(2)}`
  else if (digits.startsWith('9') && digits.length === 10) digits = `0${digits}`
  return digits.slice(0, 11)
}

async function fetchUnavailableDates() {
  const { data, error } = await supabase.rpc('get_unavailable_booking_dates', { p_start_date: localDateKey() })
  if (error) throw error
  return (data || []).map((row) => row.appointment_date)
}




export default function App() {
  const [authUser, setAuthUser] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [unavailableDates, setUnavailableDates] = useState([])
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState('')
  const [flashDesigns, setFlashDesigns] = useState([])
  const [flashLoaded, setFlashLoaded] = useState(false)
  const [flashError, setFlashError] = useState('')
  const [flashSubmitting, setFlashSubmitting] = useState(false)
  const [pendingFlash, setPendingFlash] = useState(null)
  const [pendingEstimate, setPendingEstimate] = useState(null)
  const [bookingFlashId, setBookingFlashId] = useState(null)
  const [appointmentError, setAppointmentError] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [isCustomerConversationsOpen, setIsCustomerConversationsOpen] = useState(false)
  const [unreadConversationIds, setUnreadConversationIds] = useState([])

  // Modals
  const [authModal, setAuthModal] = useState(null); // 'login' | 'register' | null
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Auth Forms state
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Booking Form state
  const [bookName, setBookName] = useState('');
  const [bookPhone, setBookPhone] = useState('');
  const [bookStyle, setBookStyle] = useState('Fine Line');
  const [bookSize, setBookSize] = useState('Small (5-10cm)');
  const [bookPlacement, setBookPlacement] = useState('');
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('');
  const [bookNotes, setBookNotes] = useState('');
  const [bookImageFile, setBookImageFile] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Price Estimator state
  const [estStyle, setEstStyle] = useState(3000);
  const [estSize, setEstSize] = useState(2000);
  const [estPlacement, setEstPlacement] = useState(500);

  // Admin filter state
  const [adminSearch, setAdminSearch] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('All');

  // Restore Supabase auth state, then load the user's database profile.
  useEffect(() => {
    let isMounted = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return
      if (error) setAuthError(error.message)
      setAuthUser(data.session?.user || null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthUser(session?.user || null)
      if (event === 'PASSWORD_RECOVERY') setAuthModal('reset-password')
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!authUser) return

    let isActive = true
    const loadProfile = async () => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, phone, role')
        .eq('id', authUser.id)
        .maybeSingle()

      if (!isActive) return
      if (error) {
        setAuthError(`Could not load your profile: ${error.message}`)
        return
      }
      if (!profile) {
        setAuthError('Your profile is missing. Run the Supabase schema setup, then register again.')
        return
      }

      const user = toCurrentUser(authUser, profile)
      setCurrentUser(user)
      if (user.role === 'customer') {
        setBookName(user.name)
        setBookPhone(toPhoneDigits(user.phone))
      }
    }

    loadProfile()
    return () => { isActive = false }
  }, [authUser])

  useEffect(() => {
    if (!currentUser?.id) return

    let isActive = true
    let isLoadingAppointments = false
    const loadAppointments = async () => {
      if (isLoadingAppointments) return
      isLoadingAppointments = true
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(APPOINTMENT_SELECT)
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true })

        if (!isActive) return
        if (error) {
          setAppointmentError(`Could not load bookings: ${error.message}`)
          return
        }

        setAppointmentError('')
        setAppointments((data || []).map(toAppointment))
      } finally {
        isLoadingAppointments = false
      }
    }

    loadAppointments()
    const channel = supabase.channel('appointment-updates-' + currentUser.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, loadAppointments)
      .subscribe()
    const refreshInterval = window.setInterval(loadAppointments, 15000)
    return () => {
      isActive = false
      window.clearInterval(refreshInterval)
      supabase.removeChannel(channel)
    }
  }, [currentUser?.id])

  useEffect(() => {
    if (!currentUser?.id) { setUnreadConversationIds([]); return undefined }
    setUnreadConversationIds([])
    let isActive = true
    const loadUnreadConversations = async () => {
      const { data, error } = await supabase.from('customer_messages')
        .select('id, customer_id, sender_id, created_at')
        .order('created_at', { ascending: false }).limit(500)
      if (!isActive || error) return
      const latestByCustomer = new Map()
      for (const message of data || []) {
        if (!latestByCustomer.has(message.customer_id)) latestByCustomer.set(message.customer_id, message)
      }
      let readThrough = {}
      try { readThrough = JSON.parse(window.localStorage.getItem(`tattoo-chat-read:${currentUser.id}`) || '{}') } catch { /* Ignore unavailable or invalid browser storage. */ }
      setUnreadConversationIds([...latestByCustomer.values()]
        .filter((message) => message.sender_id !== currentUser.id && readThrough[message.customer_id] !== message.id)
        .map((message) => message.customer_id))
    }
    loadUnreadConversations()
    const channel = supabase.channel('conversation-notifications-' + currentUser.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'customer_messages' }, (payload) => {
        const message = payload.new
        let readThrough = {}
        try { readThrough = JSON.parse(window.localStorage.getItem(`tattoo-chat-read:${currentUser.id}`) || '{}') } catch { /* Ignore unavailable or invalid browser storage. */ }
        const isRead = readThrough[message.customer_id] === message.id
        setUnreadConversationIds((ids) => message.sender_id === currentUser.id || isRead
          ? ids.filter((id) => id !== message.customer_id)
          : ids.includes(message.customer_id) ? ids : [...ids, message.customer_id])
      }).subscribe()
    return () => { isActive = false; supabase.removeChannel(channel) }
  }, [currentUser?.id])

  useEffect(() => {
    if (!isAdminModalOpen && !isBookingOpen) return
    if (isBookingOpen && currentUser?.role !== 'customer') return

    let isActive = true
    setAvailabilityLoading(true)
    fetchUnavailableDates().then((dates) => {
      if (!isActive) return
      setUnavailableDates(dates)
      setAvailabilityError('')
    }).catch((error) => {
      if (!isActive) return
      setAvailabilityError(`Could not load booking availability: ${error.message}`)
    }).finally(() => {
      if (isActive) setAvailabilityLoading(false)
    })

    const refreshInterval = window.setInterval(() => {
      fetchUnavailableDates().then((dates) => {
        if (!isActive) return
        setUnavailableDates(dates)
        setAvailabilityError('')
      }).catch((error) => {
        if (isActive) setAvailabilityError(`Could not load booking availability: ${error.message}`)
      })
    }, 15000)
    return () => { isActive = false; window.clearInterval(refreshInterval) }
  }, [currentUser?.role, isAdminModalOpen, isBookingOpen])

  useEffect(() => {
    let isActive = true
    const loadFlashDesigns = async () => {
      const { data, error } = await supabase
        .from('designs')
        .select('id, title, description, image_url, size, price, is_available')
        .order('created_at', { ascending: false })

      if (!isActive) return
      if (error) {
        setFlashError(`Could not load flash designs: ${error.message}`)
        setFlashLoaded(true)
        return
      }

      setFlashError('')
      setFlashDesigns(data || [])
      setFlashLoaded(true)
    }

    loadFlashDesigns()
    return () => { isActive = false }
  }, [currentUser?.id])

  useEffect(() => {
    if (currentUser?.role !== 'customer' || !pendingFlash) return

    setBookStyle(`Flash: ${pendingFlash.title}`)
    setBookDate('')
    setBookTime('')
    setBookSize(pendingFlash.size || 'Small (5-10cm)')
    setBookPlacement('')
    setBookNotes(`1/1 Flash claim: ${pendingFlash.title}`)
    setBookingFlashId(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(pendingFlash.id || '') ? pendingFlash.id : null)
    setBookingError('')
    setAuthModal(null)
    setIsBookingOpen(true)
    setPendingFlash(null)
  }, [currentUser, pendingFlash])

  const beginBooking = useCallback((estimate) => {
    if (currentUser?.role !== 'customer') {
      setAuthError('Sign in with a customer account to request an appointment.')
      setAuthModal('login')
      return
    }
    setBookStyle(estimate?.style || 'Fine Line')
    setBookDate('')
    setBookTime('')
    setBookSize(estimate?.size || 'Small (5-10cm)')
    setBookPlacement(estimate?.placement || '')
    setBookNotes('')
    setBookingFlashId(null)
    setBookingError('')
    setIsBookingOpen(true)
  }, [currentUser])
  const openBooking = () => beginBooking()
  const openBookingWithEstimate = (estimate) => {
    if (currentUser?.role !== 'customer') {
      setPendingEstimate(estimate)
      beginBooking()
      return
    }
    setPendingEstimate(null)
    beginBooking(estimate)
  }

  useEffect(() => {
    if (currentUser?.role !== 'customer' || !pendingEstimate) return
    beginBooking(pendingEstimate)
    setPendingEstimate(null)
  }, [beginBooking, currentUser, pendingEstimate])

  const handleClaimFlash = (flash) => {
    if (currentUser?.role === 'customer') {
      setPendingFlash(flash)
      return
    }

    setAuthError(currentUser?.role === 'admin'
      ? 'Sign in with a customer account to claim a flash design.'
      : '')
    setPendingFlash(flash)
    setAuthModal('login')
  }

  const handleFlashSubmit = async (event, flashDraft) => {
    event.preventDefault()
    setFlashError('')
    setFlashSubmitting(true)
    let uploadedImagePath = null

    try {
      if (currentUser?.role !== 'admin') throw new Error('Only admins can add flash designs.')
      if (!flashDraft.imageFile || !ALLOWED_REFERENCE_IMAGE_TYPES.has(flashDraft.imageFile.type)) {
        throw new Error('Choose a JPG, PNG, or WebP flash image.')
      }
      if (flashDraft.imageFile.size > MAX_REFERENCE_IMAGE_SIZE) {
        throw new Error('The flash image must be 10 MB or smaller.')
      }

      const extension = flashDraft.imageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
      uploadedImagePath = `${currentUser.id}/${crypto.randomUUID()}.${extension}`
      const { error: uploadError } = await supabase.storage
        .from(FLASH_IMAGE_BUCKET)
        .upload(uploadedImagePath, flashDraft.imageFile, { contentType: flashDraft.imageFile.type })
      if (uploadError) throw uploadError

      const { data: publicUrl } = supabase.storage.from(FLASH_IMAGE_BUCKET).getPublicUrl(uploadedImagePath)
      const { data, error } = await supabase
        .from('designs')
        .insert({
          title: flashDraft.title.trim(),
          description: flashDraft.description.trim() || null,
          size: flashDraft.size.trim(),
          price: Number(flashDraft.price),
          image_url: publicUrl.publicUrl,
          is_available: true,
        })
        .select('id, title, description, image_url, size, price, is_available')
        .single()
      if (error) throw error

      setFlashDesigns((items) => [data, ...items])
      return true
    } catch (error) {
      if (uploadedImagePath) {
        await supabase.storage.from(FLASH_IMAGE_BUCKET).remove([uploadedImagePath])
      }
      setFlashError(error.message || 'Could not save this flash design.')
      return false
    } finally {
      setFlashSubmitting(false)
    }
  }

  const deleteFlashDesign = async (flash) => {
    setFlashError('')
    const { error } = await supabase.from('designs').delete().eq('id', flash.id)
    if (error) {
      setFlashError(`Could not delete flash design: ${error.message}`)
      return
    }

    setFlashDesigns((items) => items.filter((item) => item.id !== flash.id))
    const imagePath = flash.image_url?.split(`/storage/v1/object/public/${FLASH_IMAGE_BUCKET}/`)[1]
    if (imagePath) await supabase.storage.from(FLASH_IMAGE_BUCKET).remove([imagePath])
  }

  const toggleFlashAvailability = async (flash) => {
    setFlashError('')
    const { error } = await supabase
      .from('designs')
      .update({ is_available: !flash.is_available })
      .eq('id', flash.id)
    if (error) {
      setFlashError(`Could not update flash design: ${error.message}`)
      return
    }

    setFlashDesigns((items) => items.map((item) => (
      item.id === flash.id ? { ...item, is_available: !flash.is_available } : item
    )))
  }
  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthError('')
    setAuthMessage('')
    setAuthLoading(true)

    try {
      const email = authEmail.trim().toLowerCase()
      const result = authModal === 'register'
        ? await supabase.auth.signUp({
            email,
            password: authPassword,
            options: { data: { full_name: authName.trim() } },
          })
        : authModal === 'reset-password'
          ? await supabase.auth.updateUser({ password: authPassword })
          : await supabase.auth.signInWithPassword({ email, password: authPassword })

      if (result.error) throw result.error

      if (authModal === 'reset-password') {
        setAuthPassword('')
        setAuthModal(null)
        return
      }

      if (!result.data.session) {
        setAuthMessage('Account created. Check your email to confirm the account before signing in.')
        return
      }

      setAuthUser(result.data.session.user)

      setAuthEmail('')
      setAuthPassword('')
      setAuthName('')
      setAuthModal(null)
    } catch (error) {
      setAuthError(error.message || 'Unable to sign in. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setAuthError('')
    setAuthMessage('')
    setAuthLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (error) throw error
    } catch (error) {
      setAuthError(error.message || 'Unable to sign in with Google.')
    } finally {
      setAuthLoading(false)
    }
  }
  const handlePasswordReset = async () => {
    setAuthError('')
    setAuthMessage('')
    const email = authEmail.trim().toLowerCase()
    if (!email) {
      setAuthError('Enter your email address first, then select forgot password.')
      return
    }

    setAuthLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
      setAuthMessage('If an account exists for that email, a password reset link is on its way.')
    } catch (error) {
      setAuthError(error.message || 'Unable to send a password reset link.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      setAuthError(error.message)
      return
    }
    setCurrentUser(null)
    setIsCustomerConversationsOpen(false)
    setAppointments([])
    setIsAdminModalOpen(false)
    setBookName('')
  }

  const closeAuthModal = () => {
    setAuthModal(null)
    setPendingEstimate(null)
    setPendingFlash(null)
  }

  const closeBookingModal = () => {
    setIsBookingOpen(false)
    setBookingFlashId(null)
  }
  const handleReferenceImageChange = (event) => {
    const file = event.currentTarget.files?.[0] || null
    setBookingError('')

    if (!file) {
      setBookImageFile(null)
      return
    }

    if (!ALLOWED_REFERENCE_IMAGE_TYPES.has(file.type)) {
      setBookImageFile(null)
      event.currentTarget.value = ''
      setBookingError('Choose a JPG, PNG, or WebP image.')
      return
    }

    if (file.size > MAX_REFERENCE_IMAGE_SIZE) {
      setBookImageFile(null)
      event.currentTarget.value = ''
      setBookingError('The reference image must be 10 MB or smaller.')
      return
    }

    setBookImageFile(file)
  }

  const handleBookingSubmit = async (event) => {
    event.preventDefault()
    setBookingError('')
    setBookingSubmitting(true)

    try {
      if (!currentUser?.id || currentUser.role !== 'customer') {
        throw new Error('Sign in with a customer account before booking.')
      }
      if (availabilityLoading) throw new Error('Wait for booking availability to finish loading.')
      if (availabilityError) throw new Error('Booking availability could not be checked. Please try again.')
      if (!bookDate) throw new Error('Choose an available date on the calendar.')
      if (bookDate < localDateKey()) throw new Error('Choose a future date.')
      if (unavailableDates.includes(bookDate)) throw new Error('That date has an active booking hold or a confirmed appointment. Choose another date.')
      if (!/^09\d{9}$/.test(bookPhone)) throw new Error('Enter an 11-digit phone number starting with 09.')

      if (bookImageFile && !ALLOWED_REFERENCE_IMAGE_TYPES.has(bookImageFile.type)) {
        throw new Error('Choose a JPG, PNG, or WebP reference image.')
      }
      if (bookImageFile && bookImageFile.size > MAX_REFERENCE_IMAGE_SIZE) {
        throw new Error('The reference image must be 10 MB or smaller.')
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: bookName.trim(), phone: `+63${bookPhone.slice(1)}` })
        .eq('id', currentUser.id)
      if (profileError) throw profileError

      let referenceImagePath = null
      if (bookImageFile) {
        const extension = bookImageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
        referenceImagePath = `${currentUser.id}/${crypto.randomUUID()}.${extension}`
        const { error: uploadError } = await supabase.storage
          .from('appointment-references')
          .upload(referenceImagePath, bookImageFile, { contentType: bookImageFile.type })
        if (uploadError) throw uploadError
      }
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          customer_id: currentUser.id,
          flash_design_id: bookingFlashId,
          appointment_date: bookDate,
          appointment_time: bookTime,
          tattoo_style: bookStyle,
          tattoo_size: bookSize,
          body_placement: bookPlacement.trim(),
          description: bookNotes.trim() || null,
          reference_image_url: referenceImagePath,
          status: 'pending',
        })
        .select(APPOINTMENT_SELECT)
        .single()
      if (error) throw error

      if (bookingFlashId) setBookingFlashId(null)
      setAppointments((currentAppointments) => [...currentAppointments, toAppointment(data)])
      fetchUnavailableDates().then(setUnavailableDates).catch((error) => setAvailabilityError(`Booking submitted, but availability could not refresh: ${error.message}`))
      setBookingSuccess(true)
      window.setTimeout(() => {
        setBookingSuccess(false)
        setIsBookingOpen(false)
        setBookNotes('')
        setBookPlacement('')
        setBookImageFile(null)
        setBookTime('')
      }, 2000)
    } catch (error) {
      setBookingError(error.message || 'Could not submit this booking.')
    } finally {
      setBookingSubmitting(false)
    }
  }

  const viewAppointmentReference = async (path) => {
    const { data, error } = await supabase.storage
      .from('appointment-references')
      .createSignedUrl(path, 300)

    if (error) {
      setAppointmentError(`Could not open reference image: ${error.message}`)
      return
    }

    setSelectedImage({ img: data.signedUrl, title: 'Booking Reference', description: '' })
  }
  const updateAppointmentStatus = async (appointmentId, status, rejectionReason = '') => {
    const appointment = appointments.find((item) => item.id === appointmentId)
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId)

    if (error) {
      setAppointmentError(`Could not update booking: ${error.message}`)
      return false
    }

    const bookingUpdateMessages = {
      approved: 'Your booking has been approved.',
      rejected: 'Your booking request has been rejected.',
      completed: 'Your appointment has been marked as completed.',
      cancelled: 'Your booking has been cancelled.',
    }
    if (appointment?.customerId && currentUser?.role === 'admin' && bookingUpdateMessages[status]) {
      const { error: conversationError } = await supabase.from('customer_messages').insert({
        customer_id: appointment.customerId,
        sender_id: currentUser.id,
        body: `Booking update: ${bookingUpdateMessages[status]}${status === 'rejected' && rejectionReason.trim() ? `\nReason: ${rejectionReason.trim()}` : ''}`,
      })
      if (conversationError) {
        setAppointmentError(`Booking status changed, but the conversation update could not be sent: ${conversationError.message}`)
      }
    }

    setAppointments((currentAppointments) => currentAppointments.map((appointment) => (
      appointment.id === appointmentId ? { ...appointment, status, holdExpiresAt: '' } : appointment
    )))
    if (appointment?.flashDesignId) {
      if (status === 'approved') {
        setFlashDesigns((items) => items.map((item) => (
          item.id === appointment.flashDesignId ? { ...item, is_available: false } : item
        )))
      } else if (['rejected', 'cancelled'].includes(status) && ['approved', 'completed'].includes(appointment.status)) {
        setFlashDesigns((items) => items.map((item) => (
          item.id === appointment.flashDesignId ? { ...item, is_available: true } : item
        )))
      }
    }
    try {
      setUnavailableDates(await fetchUnavailableDates())
      setAvailabilityError('')
    } catch (refreshError) {
      setAvailabilityError(`Booking status changed, but availability could not refresh: ${refreshError.message}`)
    }
    return true
  }
  const markConversationRead = useCallback((customerId) => setUnreadConversationIds((ids) => ids.filter((id) => id !== customerId)), [])
  const modalProps = { unreadConversationIds, markConversationRead, unavailableDates, availabilityLoading, availabilityError, authModal, setAuthModal, closeAuthModal, authEmail, setAuthEmail, authPassword, setAuthPassword, authName, setAuthName, authError, authMessage, authLoading, handleAuthSubmit, handlePasswordReset, handleGoogleSignIn, isBookingOpen, setIsBookingOpen, closeBookingModal, bookingSuccess, bookName, setBookName, bookPhone, setBookPhone, bookStyle, setBookStyle, bookSize, setBookSize, bookPlacement, setBookPlacement, bookDate, setBookDate, bookTime, setBookTime, setBookImageFile, handleReferenceImageChange, bookNotes, setBookNotes, bookingError, bookingSubmitting, handleBookingSubmit, isAdminModalOpen, setIsAdminModalOpen, currentUser, adminSearch, setAdminSearch, adminStatusFilter, setAdminStatusFilter, appointmentError, appointments, viewAppointmentReference, updateAppointmentStatus, flashDesigns, flashError, flashSubmitting, handleFlashSubmit, deleteFlashDesign, toggleFlashAvailability, selectedImage, setSelectedImage }

  return (
    <>
      <HomePage
        currentUser={currentUser}
        hasUnreadConversation={Boolean(currentUser && unreadConversationIds.includes(currentUser.id))}
        hasProfileUpdates={currentUser?.role === 'admin' && appointments.some((appointment) => appointment.status === 'pending')}
        openBooking={openBooking}
        openBookingWithEstimate={openBookingWithEstimate}
        handleLogout={handleLogout}
        openConversations={() => setIsCustomerConversationsOpen(true)}
        setAuthModal={(modal) => { setPendingFlash(null); setAuthModal(modal) }}
        setIsAdminModalOpen={setIsAdminModalOpen}
        setSelectedImage={setSelectedImage}
        estStyle={estStyle}
        setEstStyle={setEstStyle}
        estSize={estSize}
        setEstSize={setEstSize}
        estPlacement={estPlacement}
        setEstPlacement={setEstPlacement}
        flashDesigns={flashDesigns}
        flashLoaded={flashLoaded}
        onClaimFlash={handleClaimFlash}
      />
      <AppModals {...modalProps} />
      {isCustomerConversationsOpen && currentUser?.role === 'customer' && (
        <CustomerAdminChat currentUser={currentUser} onConversationRead={markConversationRead} onClose={() => setIsCustomerConversationsOpen(false)} />
      )}
    </>
  )
}
