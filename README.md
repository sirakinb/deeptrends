# Deep Trends

A modern web application for scheduling automated research queries using the Perplexity API and Make.com integration.

## Features

- Create and manage scheduled research queries
- Set daily, weekly, or weekend schedules
- Specify exact time for query execution
- Integration with Make.com webhooks for result processing
- Modern dark theme UI

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your Perplexity API key:
   ```
   PERPLEXITY_API_KEY=your_api_key_here
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

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