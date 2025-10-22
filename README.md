# Backend API Project

## Overview

This is a backend API built with Node.js, Express, and TypeScript, designed for managing user subscriptions, payments, and data ingestion from various sources like Gmail, Plaid, and manual uploads. It integrates with third-party services for OAuth authentication, payment processing via Stripe, and AI-powered insights using OpenAI. The project uses Prisma as the ORM for PostgreSQL database management and includes scheduled jobs for automated data syncing and insights generation.

The API provides endpoints for user authentication, subscription management, payment handling, usage tracking, and generating insights based on user data. It supports OAuth integrations with Google, Plaid, and Notion for seamless data ingestion.

## Features

- **User Authentication**: Signup, login, and JWT-based authentication with OAuth support for Google, Plaid, and Notion.
- **Data Ingestion**: Automated ingestion of subscription data from Gmail invoices, Plaid transactions, API usage (e.g., OpenAI), and manual receipt uploads via OCR.
- **Subscription Management**: CRUD operations for subscriptions, including merging duplicates and deactivation.
- **Payment Processing**: Integration with Stripe for checkout sessions, webhooks, and subscription cancellations.
- **Insights and Usage Tracking**: Generate AI-powered insights, track usage scores, and monitor subscription activity.
- **Scheduled Jobs**: Daily data syncing and weekly insights generation using cron jobs.
- **Security**: Encrypted OAuth tokens, JWT authentication, and secure payment handling.
- **Database**: PostgreSQL with Prisma ORM for data modeling and migrations.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT, Passport.js (Google OAuth)
- **Integrations**:
  - Plaid (for financial data)
  - Google APIs (Gmail, OAuth)
  - Notion API
  - Stripe (payments)
  - OpenAI (insights)
- **Other Libraries**:
  - Multer (file uploads)
  - Nodemailer (emails)
  - Cron (scheduled jobs)
  - Axios (HTTP requests)
  - Bcrypt (password hashing)
- **Development Tools**: ts-node, nodemon, Jest (testing)

## Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory with the required variables. Refer to `.env.examples` for a template. Key variables include:

   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Secret for JWT tokens
   - `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`: For Stripe integration
   - OAuth credentials for Google, Plaid, Notion (e.g., `GOOGLE_CLIENT_ID`, `PLAID_CLIENT_ID`)
   - `OPENAI_API_KEY`: For AI insights
   - Email settings for notifications

4. **Database setup**:
   - Ensure PostgreSQL is running.
   - Run Prisma migrations:
     ```bash
     npx prisma migrate dev
     ```
   - Generate Prisma client:
     ```bash
     npx prisma generate
     ```

## Usage

### Running the Application

- **Development mode**:

  ```bash
  npm run dev
  ```

  This starts the server with hot reloading using ts-node.

- **Production build**:

  ```bash
  npm run build
  npm start
  ```

  Builds TypeScript to JavaScript and runs the compiled code.

- **Watch mode**:
  ```bash
  npm run watch
  ```
  Uses nodemon for automatic restarts on file changes.

The server runs on port 5500 by default (configurable via `PORT` env var).

### API Endpoints Overview

#### Authentication (`/api/v1/users`)

- `POST /signup`: User registration
- `POST /login`: User login
- `GET /me`: Get current user info (authenticated)
- OAuth routes: `/google`, `/plaid`, `/notion`

#### Ingestion (`/api/v1/ingest`)

- `POST /gmail`: Ingest Gmail invoices (authenticated)
- `POST /plaid`: Ingest Plaid transactions (authenticated)
- `POST /api`: Ingest API usage data (authenticated)
- `POST /upload`: Upload receipt for OCR ingestion (authenticated)

#### Subscriptions (`/api/v1/subscriptions`)

- `GET /`: Get user subscriptions (authenticated)
- `GET /:subId`: Get specific subscription (authenticated)
- `POST /`: Create subscription (authenticated)
- `PUT /:subId`: Update subscription (authenticated)
- `PATCH /:subId/deactivate`: Deactivate subscription (authenticated)
- `DELETE /:subId`: Delete subscription (authenticated)
- `POST /merge`: Merge duplicate subscriptions (authenticated)

#### Insights (`/api/v1/insights`)

- `GET /`: Get user insights (authenticated)
- `POST /generate`: Generate new insights (authenticated)

#### Usage (`/api/v1/usage`)

- `GET /`: Get user usage (authenticated)
- `POST /`: Upsert usage (authenticated)
- `DELETE /:usageId`: Delete usage (authenticated)

#### Payments (`/api/v1/payments`)

- `POST /webhook`: Stripe webhook handler
- `POST /create-checkout-session`: Create Stripe checkout session
- `DELETE /cancel/:subscriptionId`: Cancel subscription
- `GET /subscriptions/:userId`: Get user subscriptions from Stripe

### Scheduled Jobs

- **Daily Sync**: Runs at midnight to ingest data from Gmail and Plaid for all users.
- **Weekly Insights**: Runs every Sunday at midnight to generate insights for all users.

Jobs are started automatically when the server starts.

## Database Schema

The database uses Prisma with the following key models:

- **User**: Stores user info, linked to OAuth tokens, subscriptions, etc.
- **OAuthToken**: Encrypted tokens for third-party integrations.
- **Subscription**: Subscription details, including payments and insights.
- **Payment**: Payment records with Stripe integration.
- **Usage**: Tracks usage metrics and scores.
- **Insight**: AI-generated insights and recommendations.
- **CryptoWallet**: For crypto payment support.

Run `npx prisma studio` to view and edit data in a GUI.

## Testing

Run tests with:

```bash
npm test
```

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make changes and ensure tests pass.
4. Submit a pull request.

## License

ISC License.

## Support

For issues or questions, please open an issue on the repository.
