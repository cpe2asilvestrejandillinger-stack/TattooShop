# AirWizard Tattoo

A responsive tattoo portfolio and appointment booking web app for AirWizard Tattoo. The public site showcases the artist's work, offers a price estimate, and lets customers request appointments. Supabase provides authentication, database, and private reference-image storage.

## Tech stack

- React 19 for the user interface
- Vite 8 for development and production builds
- Tailwind CSS 4 for styling
- Supabase for authentication, PostgreSQL, Row Level Security, and storage
- Lucide React for icons
- ESLint for code quality checks

## Current features

- Responsive portfolio homepage with design gallery and image lightbox
- Tattoo price estimator based on selected style, size, and placement
- Claimable flash design cards with artwork, availability, and pricing
- Customer registration and sign-in
- Appointment request form with tattoo details and reference-image upload
- Admin appointment list with search, status filtering, and status updates
- Studio location and contact information

## Project structure

```text
src/
  assets/                 # Artist, portfolio, and flash design images
  components/
    common/               # Shared UI such as the portfolio lightbox
    forms/                # Authentication, booking, and modal components
  data/                   # Portfolio and flash content
  lib/                    # Supabase client and appointment field definitions
  pages/
    admin/                # Appointment management
    public/               # Public homepage and portfolio
  utils/                  # Appointment data mapping helpers
  App.jsx                 # App state and feature coordination
  index.css               # Global styles
  main.jsx                # React entry point

supabase/
  schema.sql              # Database tables, triggers, RLS policies, and storage setup
```

## Local setup

1. Install dependencies with `npm install`.
2. Create a `.env.local` file in the project root with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Run `supabase/schema.sql` in the Supabase SQL Editor.
4. Start the development server with `npm run dev`.

Use only the Supabase publishable key in this Vite frontend. Never place a Supabase secret or service-role key in a `VITE_` variable.

## Scripts

- `npm run dev` starts the local Vite server.
- `npm run build` creates the production build in `dist/`.
- `npm run preview` serves the production build locally.
- `npm run lint` checks the source with ESLint.

## Three-week build plan

### Week 1 - Current: Scheduling and booking reliability

- [x] Show all future dates as available; mark a date unavailable after an admin confirms a booking.
- [x] Prevent new requests or confirmations on a date that already has a confirmed appointment.
- [x] Show the same confirmed-date calendar to the admin without requiring manual schedule setup.
- [ ] Apply the updated `supabase/schema.sql` to Supabase and verify date availability with customer and admin accounts.
- [ ] Verify booking requests and reference-image access with customer and admin accounts.

### Week 2 - Customer follow-up

- [ ] Add a customer appointment history with current booking statuses.
- [ ] Add clear booking confirmation and status-update messages.
- [ ] Review and refine the customer booking flow based on testing.

### Week 3 - Testing and release preparation

- [ ] Test the customer and admin flows on desktop and mobile.
- [ ] Deploy a Vercel preview and resolve issues.
- [ ] Review production settings before opening the site to customers.

Update the checkboxes as work is completed each week.
