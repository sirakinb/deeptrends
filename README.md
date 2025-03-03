# Deep Trends

A research automation platform that helps you stay on top of trends and insights using Perplexity AI.

## Features

- Run immediate research queries
- Schedule daily or weekly research updates
- View and manage research schedules
- Automatic execution of scheduled queries
- Results stored in Supabase database

## Tech Stack

- Next.js 14 (Frontend + API)
- TypeScript
- Supabase (Database)
- Perplexity AI API
- Tailwind CSS

## Deployment

This application consists of two parts that need to be deployed separately:

### 1. Frontend + API (Vercel)

1. Fork this repository
2. Create a new project on [Vercel](https://vercel.com)
3. Connect your forked repository
4. Add the following environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   PERPLEXITY_API_KEY=your_perplexity_api_key
   ```
5. Deploy

### 2. Scheduler Service (Render)

1. Create a new Web Service on [Render](https://render.com)
2. Connect your forked repository
3. Use these settings:
   - Build Command: `npm install`
   - Start Command: `npm run scheduler`
4. Add the same environment variables as above
5. Deploy

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the required environment variables
4. Run the development server:
   ```bash
   npm run dev
   ```
5. In a separate terminal, run the scheduler:
   ```bash
   npm run scheduler
   ```

## Environment Variables

Create a `.env` file with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
PERPLEXITY_API_KEY=your_perplexity_api_key
```

## Database Setup

Run the SQL in `schema.sql` in your Supabase SQL editor to create the required tables.

## Usage

1. Enter your research query in the form
2. Select the frequency (daily, weekly, or weekend)
3. Set the time for the query to run (in EST)
4. Add your Make.com webhook URL
5. Click "Create Schedule" to save
6. Use the toggle switch to activate/deactivate schedules
7. Delete schedules using the trash icon

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- Headless UI
- Perplexity API
- Make.com Integration 