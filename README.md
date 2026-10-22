# AirWizard Tattoo

AirWizard Tattoo is a website for a tattoo studio. Visitors can explore tattoo work, browse available flash designs, learn about tattoo placement, and get a starting price estimate. Customers can create an account, request an appointment, and message the studio. The studio admin can review requests, manage flash designs, update booking status, and chat with customers.

The site is a React single-page app. Supabase provides sign-in, the database, file storage, and live message updates. There is no separate custom server in this project.

## What the website can do

- Show the artist, studio details, social links, and tattoo portfolio.
- Open portfolio images in a larger gallery view.
- Show an interactive 3D tattoo placement and pain guide.
- Estimate a starting tattoo price based on style, size, and placement.
- Browse one-of-a-kind flash designs and request one as part of a booking.
- Register or sign in with email and password, or Google; reset a password by email.
- Request a studio or home-service appointment, choose a date and time, and attach a reference image.
- Let the admin review requests, search and filter bookings, set a quote and deposit, and update booking status.
- Let customers and the admin exchange chat messages and image attachments.
- Show studio location and contact information.

Price estimates are for guidance. The admin provides the final quote. A booking request is not confirmed until the studio approves it. The site does not process payments; the admin checks payments separately.

## Technology stack

| Technology | Use in this project |
| --- | --- |
| React 19 | Builds the page, forms, galleries, and interactive features. |
| Vite 8 | Runs the local development server and creates the production build. |
| Tailwind CSS 4 and regular CSS | Style the layout, responsive views, and animations. |
| Supabase | Provides sign-in, PostgreSQL data, file storage, database functions, security rules, and live updates. |
| Three.js | Displays the interactive 3D anatomy model in the placement guide. |
| Lucide React | Provides interface icons. |
| ESLint | Checks JavaScript and JSX for common code issues. |
| Vercel | Deployment configuration for hosting the built website. |

## Project structure

```text
TattooShop/
├── public/                         # Static files served as-is, including the 3D model
├── src/
│   ├── assets/                     # Artist, portfolio, and social media images
│   ├── components/
│   │   ├── common/                 # Shared gallery and lightbox pieces
│   │   ├── forms/                  # Booking, sign-in, and modal forms
│   │   ├── CustomerAdminChat.jsx   # Customer and admin messages
│   │   ├── ConversationPanel.jsx   # Admin conversation view
│   │   ├── PerspectiveTunnelIntro.jsx # Intro animation
│   │   └── TattooPainChart.jsx     # Interactive 3D placement guide
│   ├── data/siteData.js            # Portfolio content used by the homepage
│   ├── lib/                        # Supabase client and appointment field names
│   ├── pages/
│   │   ├── public/                 # Public homepage and its styles
│   │   └── admin/                  # Admin booking and design management
│   ├── utils/                      # Date, message, and database data helpers
│   ├── App.jsx                     # Main app state and feature coordination
│   ├── index.css                   # Global styles
│   └── main.jsx                    # Starts the React app
├── supabase/schema.sql             # Database tables, rules, and setup functions
├── docs/PROJECT_GUIDE.md           # Longer feature and database guide
├── index.html                      # Browser page template
├── package.json                    # Dependencies and project commands
├── vite.config.js                  # Vite and Tailwind setup
└── vercel.json                     # Vercel deployment settings
```

### How the main parts fit together

- `main.jsx` starts React and loads `App.jsx`.
- `App.jsx` coordinates the signed-in user, bookings, designs, and modals. It also sends and receives data through Supabase.
- `HomePage.jsx` displays the public sections. Form and gallery components are kept in `components/` so they can be reused.
- `AppointmentManager.jsx` contains the admin booking tools.
- `supabase/schema.sql` sets up the database and access rules used by the app.

The website currently uses one main homepage rather than separate page URLs. Booking, sign-in, admin, and chat tools open as dialogs or panels.

## Run the project locally

### Requirements

- Node.js and npm
- A Supabase project

### Setup

1. Open a terminal in the project folder.
2. Install the packages:

   ```bash
   npm install
   ```

3. Create a `.env.local` file in the project root with your Supabase project values:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   ```

4. In the Supabase dashboard, open the SQL Editor and run `supabase/schema.sql`.
5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open the local address printed in the terminal, usually `http://localhost:5173`.

Use the Supabase publishable key in this browser app. Do not put a Supabase secret or service-role key in a `VITE_` variable. Supabase Row Level Security policies in the schema control access to customer and admin data. An admin account must be assigned the admin role in Supabase; visitors cannot choose that role when signing up.

## Project commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the local development server. |
| `npm run build` | Creates the production website in `dist/`. |
| `npm run preview` | Serves the production build locally for a preview. |
| `npm run lint` | Runs ESLint on the project files. |

## Data and setup notes

- Portfolio content is kept in `src/data/siteData.js`; its images are in `src/assets/`.
- Flash design details, profiles, appointments, and chat messages are stored in Supabase.
- Flash design art, booking reference images, and chat attachments use Supabase Storage.
- Customer and admin access is limited by Supabase Row Level Security policies.
- Appointment availability is checked by date. The current booking form does not select admin-created time slots.
- The `docs/PROJECT_GUIDE.md` file explains the features and database behavior in more detail.

## Deployment

The project includes `vercel.json` for deployment on Vercel. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the deployment environment, apply the Supabase schema, and deploy the project. Vite writes the built site to `dist/`.
