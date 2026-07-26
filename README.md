# AI-Powered Product Description Generator

An e-commerce tool built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, **Prisma**, **OpenAI GPT-4 Vision**, and **Stripe**. Automatically analyze product images and generate compelling, SEO-optimized product titles, descriptions, and tags. Export your generated catalogue directly to standard CSV or Shopify CSV.

---

## Features

- 📸 **Vision AI Generation**: Analyze product images using OpenAI GPT-4 Vision.
- 🎨 **Tone & Language Customization**: Generate titles, descriptions, and SEO tags in multiple languages and brand tones.
- ⚙️ **Custom Prompt Templates**: Save, manage, and apply custom AI generation prompt templates.
- 📊 **Tiered Usage & Subscriptions**: Integrated with Stripe for Free, Pro, and Business tier limits.
- 📁 **CSV & Shopify Export**: Export generated product catalogues as standard CSV or Shopify-compatible import files.
- ⚡ **Automated CI/CD**: Built-in GitHub Actions workflow running linter, test suite, and build checks on every Pull Request.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & ORM**: PostgreSQL & Prisma ORM
- **Authentication**: NextAuth.js (Credentials & Google OAuth)
- **AI Engine**: OpenAI API (GPT-4o Vision)
- **Payments**: Stripe API & Webhooks
- **Media Storage**: Cloudinary
- **Testing**: Vitest & Testing Utilities
- **Deployment**: Vercel & Supabase / Railway Postgres

---

## Getting Started

### Prerequisites

- **Node.js**: v18.x or v20.x
- **npm**: v9.x or higher
- **PostgreSQL Database**: Local PostgreSQL instance, Supabase database, or Railway Postgres.

---

### Local Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/ai-product-description-generator.git
   cd ai-product-description-generator
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Copy `.env.example` to `.env` and fill in your API credentials:
   ```bash
   cp .env.example .env
   ```

---

## Environment Variables Reference

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string with Prisma schema query | `postgresql://user:pass@localhost:5432/ai_product_desc_db?schema=public` |
| `OPENAI_API_KEY` | OpenAI API Key for GPT-4 Vision generation | `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx` |
| `GEMINI_API_KEY` | (Optional) Gemini API Key for alternative provider | `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX` |
| `STRIPE_SECRET_KEY` | Stripe Secret Key for payment processing | `sk_test_51XXXXXXXXXXXXXXXXXXXXXXXX` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret for signature verification | `whsec_XXXXXXXXXXXXXXXXXXXXXXXX` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key for frontend Stripe elements | `pk_test_51XXXXXXXXXXXXXXXXXXXXXXXX` |
| `STRIPE_PRICE_FREE` | Stripe Price ID for Free tier | `price_free_placeholder` |
| `STRIPE_PRICE_PRO` | Stripe Price ID for Pro tier | `price_pro_placeholder` |
| `STRIPE_PRICE_BUSINESS` | Stripe Price ID for Business tier | `price_business_placeholder` |
| `NEXTAUTH_SECRET` | Secret key for signing NextAuth JWT tokens | `your-nextauth-secret-32-chars-minimum` |
| `NEXTAUTH_URL` | Base URL of the deployed application | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `your-google-client-id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `your-google-client-secret` |
| `CLOUDINARY_URL` | Cloudinary Connection URL for media upload | `cloudinary://key:secret@cloud_name` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name | `your_cloud_name` |

---

## Database Setup & Migration

1. **Run Prisma Migrations**:
   Create and apply database tables to your PostgreSQL instance:
   ```bash
   npx prisma migrate dev --name init
   ```

2. **Seed Initial Database Data**:
   Populate initial default prompt templates and demo credentials:
   ```bash
   npm run seed
   # Or: npx prisma db seed
   ```

---

## 🔑 Demo Account Credentials

A pre-configured demo account is automatically created during database seeding:

- **Email**: `demo@example.com`
- **Password**: `password123`
- **Plan**: `pro` (Includes standard generation limits and pre-populated prompt templates)

> **Note**: You can also register a new account directly via the UI `/register`.

---

## Development & Testing

### Running Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Test Suite
Execute unit and integration tests (Vitest):
```bash
npm run test
```

### Running Linter & Production Build
```bash
npm run lint
npm run build
```

---

## Deployment Guide

### 1. Database Deployment (Supabase / Railway Postgres)

#### Option A: Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Project Settings** -> **Database** and copy the Connection String (`URI`).
3. Set `DATABASE_URL` in your environment settings (add `?pgbouncer=true` if using connection pooling).
4. Run `npx prisma db push` or `npx prisma migrate deploy` to create production tables.

#### Option B: Railway Postgres
1. Create a project on [railway.app](https://railway.app) and provision a PostgreSQL service.
2. Copy the `DATABASE_URL` provided under variables.
3. Apply migrations using `npx prisma migrate deploy`.

---

### 2. Frontend & API Deployment (Vercel)

1. Import the repository into your [Vercel Dashboard](https://vercel.com).
2. Set the **Framework Preset** to **Next.js**.
3. Add all required environment variables in Vercel **Project Settings -> Environment Variables**.
4. Deploy! Vercel will automatically execute `prisma generate && next build` as configured in `vercel.json`.

---

## 🔄 GitHub Actions CI/CD Pipeline

The project includes an automated GitHub Actions workflow (`.github/workflows/ci.yml`).

On every **Pull Request** and push to `main`:
1. Checks out repository and sets up Node.js 20.
2. Installs clean dependencies via `npm ci`.
3. Generates Prisma Client (`npx prisma generate`).
4. Executes Linter (`npm run lint`).
5. Runs Vitest test suite (`npm run test`).
6. Validates production build (`npm run build`).

---

## License

This project is licensed under the MIT License.
# AI-Powered-Product-Description-Generator
