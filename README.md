# Api's Mazvall — REST API Platform & Documentation

Professional REST API platform with interactive documentation, rate limiting, and developer tools.

**Base URL:** `https://mazvall-official.my.id`

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS + Framer Motion + Recharts
- **Backend:** Next.js API Routes + Prisma ORM
- **Database:** SQLite (dev) / PostgreSQL (production)
- **Auth:** JWT (jsonwebtoken + bcryptjs)
- **UI:** Custom glassmorphism design with neon accents

## Features

- **Landing Page** — Modern hero with animated gradients and pricing tiers
- **User Dashboard** — API key management, usage stats, charts
- **Admin Panel** — User management, key generation, system stats
- **API Documentation** — Interactive Swagger-style docs with live testing
- **Authentication** — JWT-based login/register
- **Support System** — Ticket creation and FAQ
- **Dark/Light Mode** — Instant theme switching
- **API Key Format:** `MVAL-XXXXXXXXXXXX`

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/mazvall-api-platform.git
cd mazvall-api-platform
npm install
```

### 2. Setup Database

```bash
npx prisma db push
npx prisma generate
npx prisma db seed
```

### 3. Configure Environment

Copy `.env.example` to `.env` and update:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-key"
NEXT_PUBLIC_API_BASE="https://mazvall-official.my.id"
```

### 4. Run Development

```bash
npm run dev
```

Visit `http://localhost:3000`

### 5. Default Credentials

| Role    | Email               | Password  |
|---------|---------------------|-----------|
| Admin   | admin@mazvall.com   | admin123  |
| User    | demo@mazvall.com    | user123   |

## API Endpoints

| Method | Endpoint                 | Auth | Description            |
|--------|--------------------------|------|------------------------|
| POST   | `/api/auth/register`     | No   | Register new user      |
| POST   | `/api/auth/login`        | No   | Login                  |
| GET    | `/api/auth/me`           | Yes  | Get current user       |
| GET    | `/api/keys`              | Yes  | List API keys          |
| POST   | `/api/keys`              | Yes  | Generate API key       |
| DELETE | `/api/keys/:id`          | Yes  | Delete API key         |
| PATCH  | `/api/keys/:id`          | Yes  | Toggle API key         |
| POST   | `/api/validate`          | No   | Validate API key       |
| GET    | `/api/dashboard`         | Yes  | User dashboard stats   |
| POST   | `/api/support`           | Yes  | Create ticket          |
| GET    | `/api/support`           | Yes  | List tickets           |
| GET    | `/api/support/:id`       | Yes  | View ticket + replies  |
| POST   | `/api/support/:id`       | Yes  | Reply to ticket        |
| GET    | `/api/admin/stats`       | Admin| System stats           |
| GET    | `/api/admin/users`       | Admin| List all users         |
| PATCH  | `/api/admin/users/:id`   | Admin| Update user tier/role  |
| DELETE | `/api/admin/users/:id`   | Admin| Delete user            |
| GET    | `/api/admin/keys`        | Admin| List all API keys      |
| POST   | `/api/admin/keys`        | Admin| Generate key for user  |
| GET    | `/api/admin/tickets`     | Admin| List all tickets       |

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/mazvall-api-platform.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure environment variables:
   - `DATABASE_URL` — Use a cloud PostgreSQL (e.g., Neon, Supabase, Railway)
   - `JWT_SECRET` — Your secret key
   - `NEXT_PUBLIC_API_BASE` — `https://mazvall-official.my.id`
4. Update `prisma/schema.prisma` provider from `sqlite` to `postgresql`
5. Deploy

### 3. Database for Production

For Vercel, use a cloud database:

```bash
# Switch to PostgreSQL
# Edit prisma/schema.prisma: provider = "postgresql"
# Update DATABASE_URL in Vercel env vars
npx prisma db push
npx prisma db seed
```

Recommended: [Neon](https://neon.tech) (free tier available)

## Project Structure

```
mazvall-api-platform/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.js              # Seed data
├── src/
│   ├── app/
│   │   ├── api/             # API routes
│   │   │   ├── auth/        # Authentication
│   │   │   ├── keys/        # API key management
│   │   │   ├── admin/       # Admin endpoints
│   │   │   ├── dashboard/   # User dashboard data
│   │   │   ├── validate/    # API key validation
│   │   │   └── support/     # Support tickets
│   │   ├── auth/            # Login/Register pages
│   │   ├── dashboard/       # User dashboard
│   │   ├── admin/           # Admin panel
│   │   ├── docs/            # API documentation
│   │   ├── support/         # Support/FAQ
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Landing page
│   ├── components/
│   │   ├── AuthProvider.tsx  # Auth context
│   │   ├── ThemeProvider.tsx # Theme context
│   │   ├── Providers.tsx     # Combined providers
│   │   ├── layout/          # Navbar, Footer
│   │   └── dashboard/       # Dashboard layout
│   ├── lib/
│   │   ├── prisma.ts        # DB client + utils
│   │   └── auth.ts          # Auth middleware
│   └── styles/
│       └── globals.css      # Global styles
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.mjs
└── .env
```

## Rate Limits

| Tier       | RPM   | RPH    | RPD     |
|------------|-------|--------|---------|
| Free       | 10    | 100    | 1,000   |
| Developer  | 60    | 2,000  | 20,000  |
| Enterprise | 300   | 10,000 | 100,000 |

## License

&copy; Created **Mazz-Vall Developer**. All rights reserved.
