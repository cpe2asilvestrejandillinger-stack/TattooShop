# AirWizard Tattoo Web App Guide

This guide describes the current AirWizard Tattoo booking site: its features, code structure, tools, build process, and Supabase database. The frontend is a React single page application; Supabase supplies authentication, PostgreSQL data, realtime updates, and file storage.

## What the app does

### Public website

- Presents the studio, artist portfolio, location, and contact details.
- Opens portfolio artwork in a lightbox.
- Shows a 3D tattoo pain guide. The anatomy model supports drag rotation and scroll zoom, and rotates automatically unless the visitor has requested reduced motion.
- Estimates a price from tattoo style, size, and body area. Estimates are guidance; the saved appointment request is reviewed by the studio.
- Displays available one of one flash designs and lets customers request a booking for one.
- Provides responsive desktop and mobile navigation.

### Customer features

- Register and sign in with Supabase Auth; Google OAuth is also wired into the app.
- Submit a booking request with date/time, style, size, placement, session location, address for home visits, description, optional flash design, and reference image.
- Receive booking decisions and payment instructions through the customer-to-studio chat.
- Send chat messages and supported image attachments, including payment proof.

### Admin features

- Review, search, filter, and update appointments.
- Manage schedules, services, and flash designs through the admin interface.
- Review customer conversations and payment attachments; send messages and payment QR images.
- Receive booking and conversation updates through Supabase Realtime.

## Main flows

1. **Sign in:** Supabase Auth creates or restores a user session. A database trigger creates a corresponding `profiles` row with the `customer` role. The app reads that row to determine the user's name and permissions.
2. **Request a booking:** the customer selects an available slot and submits appointment details. An optional reference image is uploaded to private storage. The appointment row is inserted with a pending status and zeroed payment totals; database policies and triggers enforce ownership and booking rules.
3. **Admin review:** the admin updates the appointment status and payment fields. The app sends a booking update to the customer's chat. Active booking holds prevent the same date from being confirmed by another appointment.
4. **Chat:** messages live in `customer_messages`. Attachments are uploaded to private storage and represented in the message row by a storage path. The app generates short-lived signed URLs for viewing private images. Realtime events add new messages without a page refresh.
5. **Flash design request:** the app reads design records and public image URLs. When an appointment reaches a reserving status, a database trigger marks the one of one design unavailable; rejection or cancellation can release it.

## Technology used

| Technology | Purpose |
| --- | --- |
| React 19 | UI components, state, and interactive flows |
| Vite 8 | Local development server and production bundler |
| Tailwind CSS 4 with Vite plugin | Utility CSS and styles integration |
| Supabase JS v2 | Auth, database queries, storage, and Realtime |
| Supabase / PostgreSQL | Persistent records, access policies, constraints, and triggers |
| Three.js | Interactive GLB anatomy viewer |
| Lucide React | Interface icons |
| ESLint | Static code checks |
| Vercel | Deployment configuration (`vercel.json` builds to `dist`) |

The repository does not include a separate backend server. Database permissions and transactional booking behavior are implemented in Supabase.

## Code map

```text
src/
  App.jsx                         App state, Supabase integration, booking/auth coordination
  main.jsx                        React entry point
  index.css                       Global styling
  assets/                         Artist and portfolio images
  components/
    TattooPainChart.jsx           Lazy-loaded Three.js anatomy viewer and pain scale
    CustomerAdminChat.jsx         Customer/admin messaging UI
    ConversationPanel.jsx         Older appointment-scoped conversation component
    common/                       Shared UI, including portfolio lightbox
    forms/                        Authentication, booking, and modal UI
  data/siteData.js                Static portfolio/site content
  lib/supabase.js                 Supabase client setup
  lib/appointmentFields.js        Shared appointment field definitions
  pages/public/HomePage.jsx       Public homepage and sections
  pages/admin/AppointmentManager.jsx  Admin appointment management
  utils/                          Data mapping and formatting helpers
supabase/schema.sql               Database, trigger, policy, and storage setup
public/male_anatomy_pain_chart_colored.glb  3D pain guide model
```

The current direct customer-to-admin chat uses `customer_messages`. `ConversationPanel.jsx` is a legacy appointment-scoped component and refers to an older `appointment_messages` table; it is not the schema's current chat design.

## Database: how it works

The schema is in [`supabase/schema.sql`](../supabase/schema.sql). It is designed for Supabase and uses `auth.users` as the identity source. Most application tables have Row Level Security (RLS) enabled, so a query is permitted only when its table policy allows it. Client-side UI checks improve the experience but do not replace these database rules.

### Core tables

| Table | Purpose and key relationships |
| --- | --- |
| `profiles` | App-facing customer name, phone, and `customer`/`admin` role; `id` references `auth.users.id`. |
| `services` | Admin-managed services, descriptions, prices, durations, and active state. |
| `designs` | Flash catalog including image, size, price, and availability. |
| `schedules` | Date/time slots with unique date/start-time and overlap validation. |
| `appointments` | Booking request and payment summary; references a customer profile, and optionally a service, flash design, and schedule. |
| `customer_messages` | Customer-to-admin conversation messages, optional attachment path, and message kind (`text`, `payment_qr`, or `payment_proof`). |

`appointments.status` can be `pending`, `awaiting_payment`, `approved`, `rejected`, `completed`, or `cancelled`. Payment state is `unpaid`, `partial`, or `paid`. The row records tattoo details, studio/home location, date/time, hold expiry, amounts, and optional reference image URL.

### Database safeguards

- A trigger creates a `profiles` row when a Supabase Auth user is created. New profiles default to the customer role.
- RLS lets customers read their own profile and appointments, and lets admins manage records. Public visitors can read active services, designs, and schedule availability.
- Customers may insert only their own pending, unpaid appointment with zero payment amounts. Admin policies permit administrative updates.
- A database function returns unavailable booking dates. Triggers create time-limited holds for pending requests and payment requests and reject overlapping active holds or confirmed bookings on a date.
- The schema defines schedule-slot validation and reservation/release functions. The current customer booking form submits its selected date and time directly and does not set `schedule_id`; the schedule reservation and release triggers are dropped but not recreated in this schema file. Treat `schedules` as an admin-maintained availability table until that wiring is completed.
- Flash designs are reserved when a booking is awaiting payment or approved and released when appropriate.
- Indexes support customer/date lookups and active booking-hold queries.
- `customer_messages` is added to Supabase Realtime when that publication is available. The schema also adds appointments when possible.

### File storage

| Bucket | Access | Used for |
| --- | --- | --- |
| `appointment-references` | Private; customer uploads to their own folder, customer and admin can view | Booking reference images |
| `customer-chat-attachments` | Private; restricted by customer/admin folder policies; images limited to 10 MB and JPEG/PNG/WebP | Chat images and payment proofs/QRs |
| `flash-designs` | Public read, admin-managed | Flash design artwork |

Private file paths are stored in records, not public URLs. The client asks Supabase Storage for a signed URL when it needs to display a private attachment.

## Set up locally

### Requirements

- Node.js and npm (use a current Node.js LTS release compatible with the installed Vite version).
- A Supabase project with its database and Storage enabled.

### Steps

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create `.env.local` in the project root:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
   ```

   Use only the publishable/anon key in browser code. Never put a Supabase service-role or secret key in a `VITE_` variable; Vite embeds `VITE_` values in the client bundle.

3. In the Supabase SQL Editor, run [`supabase/schema.sql`](../supabase/schema.sql). This creates or updates the tables, policies, functions, triggers, indexes, and buckets described above. Review the SQL before applying it to an existing production database because it contains schema migrations as well as initial setup.

4. Start the local server:

   ```sh
   npm run dev
   ```

5. Create a test customer through the app. To grant admin access, use a trusted Supabase admin session/SQL Editor to update that user's `profiles.role` to `admin`. Do not expose service-role credentials in the browser.

Google sign-in also requires enabling and configuring the Google provider and callback URLs in Supabase Auth. Email confirmation and redirect behavior depend on the Supabase project's Auth settings.

## Build and deploy

Available npm scripts:

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs the Vite development server. |
| `npm run build` | Produces the optimized static site in `dist/`. |
| `npm run preview` | Serves the built site locally to inspect the production output. |
| `npm run lint` | Runs ESLint across the repository. |

For Vercel, connect the repository, configure the two public Supabase environment variables for the target environment, and deploy. `vercel.json` sets the build command to `npm run build` and output directory to `dist`. Keep Supabase Auth redirect URLs aligned with the deployed domain.

## Performance notes

- Three.js and its model loader are imported only when the pain-guide viewer is near the viewport. The 3D model file is also deferred until then.
- The viewer stops its animation loop when it leaves the viewport or the browser tab is hidden, and caps renderer pixel ratio to control GPU work.
- Authentication/booking modals and customer chat are loaded when opened rather than in the initial page render.
- Portfolio content is local; booking, flash, chat, and admin data require a working Supabase connection.
- The GLB is a large asset. Keeping it lazy-loaded prevents it from delaying the initial homepage, though downloading the model still takes time when the visitor reaches the pain guide.

## Current project notes

- The app is a client-rendered single page application and needs the Supabase project configured for its data-backed features.
- The displayed estimator prices and portfolio content are currently frontend data; confirm and maintain them in the relevant app files.
- The booking form currently captures date/time directly and relies on the unavailable-date function and database hold triggers. The `schedules` table is not yet connected to that form.
- `npm run lint` is available as a quality check. Some existing code may need lint cleanup before a clean repository-wide lint run; the production build is the separate bundling check.
- The pain guide is informational and provides general placement context. It is not medical advice or a personalized prediction.
