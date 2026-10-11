export const formatConversationMessage = (body = '') => {
  const text = String(body)
  if (!/^(?:New appointment request|Appointment confirmed)(?:\r?\n|$)/i.test(text.trim())) return text
  return text.split(/\r?\n/).filter((line) => !/^Service:\s*/i.test(line.trim())).join('\n')
}
