# Bookkeep

A simple, modern bookkeeping app built with Expo and Supabase.

Track income and expenses, attach receipt photos, group transactions by month, and close periods.

## Features

- User authentication (sign up / log in)
- Add transactions with amount, category, description, and date
- Attach receipt photos
- Monthly grouping with income, expenses, and balance summary
- Close periods
- Cross-platform (web + mobile)

## Tech Stack

- React Native + Expo
- TypeScript
- Supabase (Auth, Database, Storage)
- Expo Router

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
Create a .env file or update src/lib/supabase.ts with your Supabase URL and anon key
Start the app:Bashnpx expo start
Project Structuretextsrc/
  app/          # Screens (Expo Router)
  lib/          # Supabase clientStatusWork in progress. Core transaction and period features are functional.text4. Save the file.

You can commit it later if you want:

```bash
git add README.md
git commit -m "Update README"
git push