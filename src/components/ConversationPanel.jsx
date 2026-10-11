import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, MessageCircle, Send, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatTime } from '../utils/formatTime'
import './ConversationPanel.css'

const formatAppointmentDate = (value) => new Date(value + 'T12:00:00').toLocaleDateString('en-PH', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export default function ConversationPanel({ appointments = [], currentUser, onClose, isAdmin = false }) {
  const [selectedId, setSelectedId] = useState(appointments[0]?.id || '')
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const selected = appointments.find((item) => item.id === selectedId) || appointments[0]

  useEffect(() => {
    if (!appointments.some((item) => item.id === selectedId)) setSelectedId(appointments[0]?.id || '')
  }, [appointments, selectedId])

  useEffect(() => {
    if (!selected?.id) { setMessages([]); return undefined }
    let active = true
    setLoading(true)
    setError('')
    supabase.from('appointment_messages').select('id, appointment_id, sender_id, body, created_at')
      .eq('appointment_id', selected.id).order('created_at', { ascending: true })
      .then(({ data, error: queryError }) => {
        if (!active) return
        if (queryError) setError(queryError.message)
        else setMessages(data || [])
        setLoading(false)
      })
    const channel = supabase.channel('appointment-messages-' + selected.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'appointment_messages', filter: 'appointment_id=eq.' + selected.id }, (payload) => {
        setMessages((items) => items.some((item) => item.id === payload.new.id) ? items : [...items, payload.new])
      }).subscribe()
    return () => { active = false; supabase.removeChannel(channel) }
  }, [selected?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return
      if (window.matchMedia('(max-width: 650px)').matches && isMobileChatOpen) setIsMobileChatOpen(false)
      else onClose?.()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isMobileChatOpen, onClose])

  const selectAppointment = (appointmentId) => {
    if (appointmentId !== selectedId) setDraft('')
    setSelectedId(appointmentId)
    setIsMobileChatOpen(true)
  }

  const sendMessage = async (event) => {
    event.preventDefault()
    const body = draft.trim()
    if (!body || !selected?.id || sending) return
    setSending(true)
    setError('')
    try {
      const { data, error: sendError } = await supabase.from('appointment_messages')
        .insert({ appointment_id: selected.id, sender_id: currentUser.id, body })
        .select('id, appointment_id, sender_id, body, created_at').single()
      if (sendError) setError(sendError.message)
      else {
        setMessages((items) => items.some((item) => item.id === data.id) ? items : [...items, data])
        setDraft('')
      }
    } catch (sendFailure) {
      setError(sendFailure.message || 'Could not send your message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return createPortal((
    <div className="conversation-panel__backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.() }}>
      <section className="conversation-panel" role="dialog" aria-modal="true" aria-label="Appointment conversations">
        <header className={'conversation-panel__header' + (isMobileChatOpen ? ' is-chat-open' : '')}>
          <div className="conversation-panel__header-title">
            <button type="button" className="conversation-panel__back" aria-label="Back to appointments" onClick={() => setIsMobileChatOpen(false)}><ChevronLeft size={19} /></button>
            <div><span className="conversation-panel__eyebrow">AIRWIZARD TATTOO</span><h2><MessageCircle size={20} /> Conversations</h2></div>
          </div>
          <button type="button" className="conversation-panel__close" aria-label="Close conversations" onClick={onClose}><X size={20} /></button>
        </header>
        <div className={'conversation-panel__layout' + (isMobileChatOpen ? ' is-chat-open' : '')}>
          <aside className="conversation-panel__bookings" aria-label="Appointments">
            <div className="conversation-panel__list-heading"><strong className="conversation-panel__list-title">{isAdmin ? 'Client bookings' : 'My bookings'}</strong><span>Select a booking to open its conversation.</span></div>
            {appointments.length === 0 ? <div className="conversation-panel__empty-list"><MessageCircle size={24} /><strong>No bookings yet</strong><p>{isAdmin ? 'Customer conversations will appear here after a booking is submitted.' : 'Submit a booking request first. Your studio conversation will appear here.'}</p></div> : appointments.map((appointment) => (
              <button type="button" key={appointment.id} onClick={() => selectAppointment(appointment.id)} className={'conversation-panel__booking' + ((selected?.id === appointment.id) ? ' is-selected' : '')}>
                <span className="conversation-panel__booking-top"><strong>{isAdmin ? appointment.clientName : appointment.style}</strong><span className={'conversation-panel__status is-' + appointment.status}>{appointment.status}</span></span>
                <span>{isAdmin ? appointment.style : appointment.clientName}</span>
                <small>{formatAppointmentDate(appointment.date)} · {formatTime(appointment.time)}</small>
              </button>
            ))}
          </aside>
          <div className="conversation-panel__chat">
            {!selected ? <div className="conversation-panel__no-chat"><MessageCircle size={30} /><strong>Select an appointment</strong><p>Choose a booking to see and send messages about it.</p></div> : <>
              <div className="conversation-panel__chat-heading">
                <div><strong>{isAdmin ? selected.clientName : 'Studio conversation'}</strong><span>{selected.style} · {formatAppointmentDate(selected.date)} · {formatTime(selected.time)}</span></div>
                <span className={'conversation-panel__status is-' + selected.status}>{selected.status}</span>
              </div>
              <div className="conversation-panel__messages" aria-live="polite">
                {loading ? <p className="conversation-panel__hint">Loading conversation…</p> : error && messages.length === 0 ? <div className="conversation-panel__no-chat"><MessageCircle size={28} /><p>Could not load this conversation. Check the database setup and try selecting the booking again.</p></div> : messages.length === 0 ? <div className="conversation-panel__no-chat"><MessageCircle size={28} /><strong>Start a conversation</strong><p>Ask a question or share details about this appointment.</p></div> : messages.map((message) => {
                  const mine = message.sender_id === currentUser.id
                  return <article key={message.id} className={'conversation-panel__message' + (mine ? ' is-mine' : '')}>
                <span>{mine ? 'You' : (isAdmin ? 'Client' : 'Studio')}</span>
                    <p>{message.body}</p>
                    <time dateTime={message.created_at}>{new Date(message.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</time>
                  </article>
                })}
                <div ref={messagesEndRef} />
              </div>
              {error && messages.length > 0 && <p className="conversation-panel__error" role="alert">{error}</p>}
              <form className="conversation-panel__composer" onSubmit={sendMessage}>
                <textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} rows={2} placeholder="Write a message…" aria-label="Message" />
                <button type="submit" disabled={!draft.trim() || sending} aria-label={sending ? 'Sending message' : 'Send message'}><Send size={17} /><span>{sending ? 'Sending…' : 'Send'}</span></button>
              </form>
              <small className="conversation-panel__note">Text messages only · {draft.length}/2000</small>
            </>}
          </div>
        </div>
      </section>
    </div>
  ), document.body)
}

