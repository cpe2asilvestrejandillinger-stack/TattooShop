import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, MessageCircle, Paperclip, Search, Send, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatConversationMessage } from '../utils/formatConversationMessage'
import './CustomerAdminChat.css'

const formatMessageDate = (value) => new Date(value).toLocaleString('en-PH', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})
const formatConversationTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  const today = new Date()
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}
const isMissingChatTable = (error) => error?.code === 'PGRST205' || /could not find the table.*customer_messages/i.test(error?.message || '')
const isOutdatedChatSchema = (error) => isMissingChatTable(error) || error?.code === 'PGRST204' || /attachment_path.*(customer_messages|schema cache|column)|customer_messages.*(schema cache|column)/i.test(error?.message || '')
const isVerboseAppointmentConfirmation = (message) => /^Appointment confirmed(?:\r?\n|$)/i.test((message.body || '').trim()) && /confirmed by the studio/i.test(message.body || '')

export default function CustomerAdminChat({ currentUser, onClose, onConversationRead, isAdmin = false }) {
  const [clients, setClients] = useState([])
  const readThroughStorageKey = `tattoo-chat-read:${currentUser.id}`
  const [readThroughByClient, setReadThroughByClient] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem(readThroughStorageKey) || '{}') } catch { return {} }
  })
  const [selectedClientId, setSelectedClientId] = useState(isAdmin ? '' : currentUser.id)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [attachmentFile, setAttachmentFile] = useState(null)
  const [attachmentPreview, setAttachmentPreview] = useState('')
  const [search, setSearch] = useState('')
  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(!isAdmin)
  const [error, setError] = useState('')
  const [chatSetupRequired, setChatSetupRequired] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const messagesEndRef = useRef(null)
  const composerRef = useRef(null)
  const activeClient = isAdmin
    ? clients.find((client) => client.id === selectedClientId)
    : { id: currentUser.id, name: currentUser.name || 'Client' }
  const activeClientId = activeClient?.id
  const latestMessage = messages[messages.length - 1]
  const isThreadVisible = !isAdmin || isMobileChatOpen || (typeof window !== 'undefined' && !window.matchMedia('(max-width: 760px)').matches)

  useEffect(() => {
    if (!isAdmin) return undefined
    let active = true
    setLoadingClients(true)
    supabase.from('profiles').select('id, full_name').eq('role', 'customer').order('full_name')
      .then(async ({ data, error: queryError }) => {
        if (!active) return
        if (queryError) setError(queryError.message)
        else {
          const { data: recentMessages } = await supabase.from('customer_messages')
            .select('id, customer_id, sender_id, body, attachment_path, created_at')
            .order('created_at', { ascending: false })
            .limit(500)
          if (!active) return
          const latestByCustomer = new Map()
          for (const message of recentMessages || []) {
            if (!latestByCustomer.has(message.customer_id) && !isVerboseAppointmentConfirmation(message)) latestByCustomer.set(message.customer_id, message)
          }
          const nextClients = (data || []).map((client) => {
            const lastMessage = latestByCustomer.get(client.id)
            return { id: client.id, name: client.full_name || 'Client', lastMessage: lastMessage?.body || '', hasLastMessageAttachment: Boolean(lastMessage?.attachment_path), lastMessageAt: lastMessage?.created_at || '', lastMessageId: lastMessage?.id || '', lastMessageSenderId: lastMessage?.sender_id || '', hasIncomingUpdate: Boolean(lastMessage && lastMessage.sender_id !== currentUser.id) }
          })
          setClients(nextClients)
          setSelectedClientId((selectedId) => nextClients.some((client) => client.id === selectedId) ? selectedId : nextClients[0]?.id || '')
        }
        setLoadingClients(false)
      })
    return () => { active = false }
  }, [isAdmin])

  useEffect(() => {
    if (!activeClientId) { setMessages([]); return undefined }
    let active = true
    setMessages([])
    setLoadingMessages(true)
    setError('')
    setChatSetupRequired(false)
    supabase.from('customer_messages').select('id, customer_id, sender_id, body, attachment_path, created_at')
      .eq('customer_id', activeClientId).order('created_at', { ascending: true })
      .then(async ({ data, error: queryError }) => {
        if (!active) return
        if (queryError) {
          setError(queryError.message)
          setChatSetupRequired(isOutdatedChatSchema(queryError))
        }
        else {
          const hydratedMessages = await Promise.all((data || []).map(async (message) => {
            if (!message.attachment_path) return message
            const { data: signedImage } = await supabase.storage.from('customer-chat-attachments').createSignedUrl(message.attachment_path, 3600)
            return { ...message, attachmentUrl: signedImage?.signedUrl || '' }
          }))
          if (!active) return
          setMessages(hydratedMessages)
        }
        setLoadingMessages(false)
      })
    const channel = supabase.channel('customer-conversation-' + activeClientId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'customer_messages', filter: 'customer_id=eq.' + activeClientId }, (payload) => {
        const addRealtimeMessage = async () => {
          let message = payload.new
          if (message.attachment_path) {
            const { data: signedImage } = await supabase.storage.from('customer-chat-attachments').createSignedUrl(message.attachment_path, 3600)
            message = { ...message, attachmentUrl: signedImage?.signedUrl || '' }
          }
          setMessages((items) => items.some((item) => item.id === message.id) ? items : [...items, message])
        }
        addRealtimeMessage()
      }).subscribe()
    return () => { active = false; supabase.removeChannel(channel) }
  }, [activeClientId, retryCount])

  useEffect(() => {
    try { window.localStorage.setItem(readThroughStorageKey, JSON.stringify(readThroughByClient)) } catch { /* Chat still works when browser storage is unavailable. */ }
  }, [readThroughByClient, readThroughStorageKey])

  useEffect(() => {
    if (!isThreadVisible || !activeClientId || !latestMessage?.id) return
    setReadThroughByClient((readThrough) => readThrough[activeClientId] === latestMessage.id
      ? readThrough
      : { ...readThrough, [activeClientId]: latestMessage.id })
    onConversationRead?.(activeClientId)
  }, [activeClientId, isThreadVisible, latestMessage?.id, onConversationRead])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  useEffect(() => {
    const textarea = composerRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    const maxHeight = Number.parseFloat(window.getComputedStyle(textarea).maxHeight) || 130
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [draft])

  useEffect(() => {
    if (!attachmentFile) { setAttachmentPreview(''); return undefined }
    const previewUrl = URL.createObjectURL(attachmentFile)
    setAttachmentPreview(previewUrl)
    return () => URL.revokeObjectURL(previewUrl)
  }, [attachmentFile])

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return
      if (isAdmin && window.matchMedia('(max-width: 760px)').matches && isMobileChatOpen) setIsMobileChatOpen(false)
      else onClose?.()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isAdmin, isMobileChatOpen, onClose])

  const selectClient = (clientId) => {
    if (clientId !== selectedClientId) setDraft('')
    if (clientId !== selectedClientId) setAttachmentFile(null)
    const selectedClient = clients.find((client) => client.id === clientId)
    if (selectedClient?.lastMessageId) {
      setReadThroughByClient((readThrough) => ({ ...readThrough, [clientId]: selectedClient.lastMessageId }))
      onConversationRead?.(clientId)
    }
    setSelectedClientId(clientId)
    setIsMobileChatOpen(true)
  }

  const handleAttachmentSelection = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Images must be 10 MB or smaller.')
      return
    }
    setError('')
    setAttachmentFile(file)
  }

  const sendMessage = async (event) => {
    event.preventDefault()
    const body = draft.trim()
    if ((!body && !attachmentFile) || !activeClientId || sending) return
    setSending(true)
    setError('')
    let uploadedAttachmentPath = ''
    try {
      if (attachmentFile) {
        const extension = attachmentFile.type === 'image/jpeg' ? 'jpg' : attachmentFile.type === 'image/png' ? 'png' : 'webp'
        const fileId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
        uploadedAttachmentPath = `${activeClientId}/${currentUser.id}/${fileId}.${extension}`
        const { error: uploadError } = await supabase.storage.from('customer-chat-attachments').upload(uploadedAttachmentPath, attachmentFile, {
          contentType: attachmentFile.type,
          upsert: false,
        })
        if (uploadError) throw uploadError
      }
      const { data, error: sendError } = await supabase.from('customer_messages')
        .insert({ customer_id: activeClientId, sender_id: currentUser.id, body: body || null, attachment_path: uploadedAttachmentPath || null })
        .select('id, customer_id, sender_id, body, attachment_path, created_at').single()
      if (sendError) throw sendError
      let attachmentUrl = ''
      if (uploadedAttachmentPath) {
        const { data: signedImage } = await supabase.storage.from('customer-chat-attachments').createSignedUrl(uploadedAttachmentPath, 3600)
        attachmentUrl = signedImage?.signedUrl || ''
      }
      setMessages((items) => items.some((item) => item.id === data.id) ? items : [...items, { ...data, attachmentUrl }])
      setDraft('')
      setAttachmentFile(null)
    } catch (sendFailure) {
      setError(sendFailure.message || 'Could not send your message. Please try again.')
      setChatSetupRequired(isOutdatedChatSchema(sendFailure))
      if (uploadedAttachmentPath) await supabase.storage.from('customer-chat-attachments').remove([uploadedAttachmentPath])
    } finally {
      setSending(false)
    }
  }

  const visibleMessages = messages.filter((message) => !isVerboseAppointmentConfirmation(message))
  const shouldHighlightUnreadClient = (client) => client.hasIncomingUpdate && readThroughByClient[client.id] !== client.lastMessageId && (!isThreadVisible || client.id !== activeClientId)
  const visibleClients = clients.filter((client) => client.name.toLowerCase().includes(search.trim().toLowerCase()))

  return createPortal((
    <div className="customer-chat__backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.() }}>
      <section className="customer-chat" role="dialog" aria-modal="true" aria-label={isAdmin ? 'Client conversations' : 'Chat with the studio'}>
        <header className={'customer-chat__header' + (isAdmin ? ' is-admin' : '') + (isMobileChatOpen ? ' is-chat-open' : '')}>
          <div className="customer-chat__heading">
            {isAdmin && <button type="button" className="customer-chat__back" aria-label="Back to clients" onClick={() => setIsMobileChatOpen(false)}><ChevronLeft size={19} /></button>}
            <div><span className="customer-chat__eyebrow">AIRWIZARD TATTOO</span><h2><MessageCircle size={20} />{isAdmin ? 'Client conversations' : 'Chat with the studio'}</h2></div>
          </div>
          <button type="button" className="customer-chat__close" aria-label="Close chat" onClick={onClose}><X size={20} /></button>
        </header>

        <div className={'customer-chat__layout' + (isAdmin ? ' is-admin' : ' is-customer') + (isMobileChatOpen ? ' is-chat-open' : '')}>
          {isAdmin && <aside className="customer-chat__clients" aria-label="Client conversations">
            <div className="customer-chat__client-heading"><strong>Clients</strong><span>Select a client to open a private chat.</span></div>
            <label className="customer-chat__search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search clients" aria-label="Search clients" /></label>
            {loadingClients ? <p className="customer-chat__list-empty">Loading clients…</p> : visibleClients.length === 0 ? <p className="customer-chat__list-empty">{search ? 'No clients match that search.' : 'Client accounts will appear here.'}</p> : visibleClients.map((client) => (
              <button type="button" key={client.id} aria-label={`${client.name}${shouldHighlightUnreadClient(client) ? ', unread message' : ''}`} className={'customer-chat__client' + (client.id === activeClientId ? ' is-selected' : '') + (shouldHighlightUnreadClient(client) ? ' has-unread' : '')} onClick={() => selectClient(client.id)}>
                <span className={'customer-chat__avatar' + (shouldHighlightUnreadClient(client) ? ' has-update' : '')}>{client.name.charAt(0).toUpperCase()}</span>
                <span className="customer-chat__client-copy">
                  <span className="customer-chat__client-topline"><strong className="customer-chat__client-name">{client.name}</strong><time>{formatConversationTime(client.lastMessageAt)}</time></span>
                  <span className="customer-chat__client-preview">{client.lastMessage ? `${client.lastMessageSenderId === currentUser.id ? 'You: ' : ''}${client.lastMessage}` : client.hasLastMessageAttachment ? 'Photo' : 'Start a conversation'}</span>
                </span>
              </button>
            ))}
            {error && !activeClientId && <p className="customer-chat__error" role="alert">{error}</p>}
          </aside>}

          <main key={activeClientId || 'no-client'} className="customer-chat__thread">
            {activeClient ? <>
              <div className="customer-chat__thread-header">
                <span className="customer-chat__avatar">{(isAdmin ? activeClient.name : 'S').charAt(0).toUpperCase()}</span>
                <div><strong>{isAdmin ? activeClient.name : 'Studio admin'}</strong><span>{isAdmin ? 'Private customer conversation' : 'Send a message to the studio admin'}</span></div>
              </div>
              <div className="customer-chat__messages" aria-live="polite">
                {loadingMessages ? <p className="customer-chat__hint">Loading conversation…</p> : chatSetupRequired ? <div className="customer-chat__setup-state"><span className="customer-chat__setup-icon"><MessageCircle size={22} /></span><strong>{isAdmin ? 'Chat setup is incomplete' : 'Messaging is unavailable'}</strong><p>{isAdmin ? 'Run the updated supabase/schema.sql in the Supabase SQL Editor, then retry.' : 'The studio chat is being set up. Please contact the studio directly for now.'}</p>{isAdmin && <small>{error}</small>}<button type="button" onClick={() => setRetryCount((count) => count + 1)}>Retry connection</button></div> : error && visibleMessages.length === 0 ? <div className="customer-chat__empty"><MessageCircle size={28} /><strong>Conversation unavailable</strong><p>Please retry in a moment.</p><span className="customer-chat__error" role="alert">{error}</span><button type="button" className="customer-chat__retry" onClick={() => setRetryCount((count) => count + 1)}>Try again</button></div> : visibleMessages.length === 0 ? <div className="customer-chat__empty"><MessageCircle size={28} /><strong>Start a conversation</strong><p>{isAdmin ? 'Send a message to this client.' : 'Ask a question about your tattoo or booking. The admin will reply here.'}</p></div> : visibleMessages.map((message) => {
                  const mine = message.sender_id === currentUser.id
                  return <article key={message.id} className={'customer-chat__message' + (mine ? ' is-mine' : '')}>
                    <span>{mine ? 'You' : isAdmin ? 'Client' : 'Studio admin'}</span>
                    {message.attachment_path && (message.attachmentUrl
                      ? <a className="customer-chat__message-image-link" href={message.attachmentUrl} target="_blank" rel="noreferrer"><img className="customer-chat__message-image" src={message.attachmentUrl} alt="Image attachment" loading="lazy" /></a>
                      : <div className="customer-chat__message-image-unavailable">Image unavailable</div>)}
                    {message.body && <p>{formatConversationMessage(message.body)}</p>}
                    <time dateTime={message.created_at}>{formatMessageDate(message.created_at)}</time>
                  </article>
                })}
                <div ref={messagesEndRef} />
              </div>
              {error && visibleMessages.length > 0 && <p className="customer-chat__error" role="alert">{error}</p>}
              {!chatSetupRequired && <>{attachmentFile && <div className="customer-chat__attachment-preview" role="status">
                <img src={attachmentPreview} alt="Selected image preview" />
                <span>{attachmentFile.name}<small>{(attachmentFile.size / (1024 * 1024)).toFixed(1)} MB</small></span>
                <button type="button" onClick={() => setAttachmentFile(null)} aria-label="Remove attachment"><X size={16} /></button>
              </div>}<form className="customer-chat__composer" onSubmit={sendMessage}>
                <label className="customer-chat__attach-button" aria-label="Attach image" title="Attach image">
                  <Paperclip size={19} />
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAttachmentSelection} />
                </label>
                <textarea ref={composerRef} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} maxLength={2000} rows={1} placeholder="Write a message…" aria-label="Message; press Enter to send, Shift plus Enter for a new line" />
                <button type="submit" disabled={(!draft.trim() && !attachmentFile) || sending} aria-label={sending ? 'Sending message' : 'Send message'} title={sending ? 'Sending message' : 'Send message'}><Send size={18} /></button>
              </form>
              <small className="customer-chat__note">Private chat with the studio · {draft.length}/2000</small></>}
            </> : <div className="customer-chat__empty"><MessageCircle size={28} /><strong>Select a client</strong><p>Choose a client to open a private conversation.</p></div>}
          </main>
        </div>
      </section>
    </div>
  ), document.body)
}
