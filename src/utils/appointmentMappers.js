export const toCurrentUser = (authUser, profile) => ({
  id: authUser.id,
  name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Client',
  email: authUser.email || '',
  phone: profile?.phone || '',
  role: profile?.role === 'admin' ? 'admin' : 'customer',
})

export const toAppointment = (row) => ({
  id: row.id,
  customerId: row.customer_id,
  flashDesignId: row.flash_design_id,
  clientName: row.profiles?.full_name || 'Customer',
  phone: row.profiles?.phone || '',
  style: row.tattoo_style,
  size: row.tattoo_size,
  placement: row.body_placement,
  date: row.appointment_date,
  time: row.appointment_time,
  notes: row.description || '',
  totalAmount: Number(row.total_amount || 0),
  depositAmount: Number(row.deposit_amount || 0),
  balanceAmount: Number(row.balance_amount || 0),
  paymentStatus: row.payment_status || 'unpaid',
  status: ['pending', 'awaiting_payment'].includes(row.status) && row.booking_hold_expires_at && new Date(row.booking_hold_expires_at).getTime() <= Date.now()
    ? (row.status === 'pending' ? 'expired' : 'awaiting_payment_expired')
    : row.status,
  holdExpiresAt: row.booking_hold_expires_at || '',
  refImage: row.reference_image_url,
})
