# MoryaBilling

A responsive restaurant POS starter for Morya Misal, built with Next.js, TypeScript, and a black/orange/white theme.

## Current prototype
- Touch-friendly menu and category filtering
- Dine-in / parcel order selector
- Order cart and quantity controls
- Cash, UPI, and card checkout preview
- Bill history, day summary, sales report, menu view
- Dark/light theme toggle
- Responsive desktop and mobile layouts

## Development
1. Install Node.js (LTS).
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` when Supabase is configured.
4. Run `npm run dev`.

## Environment variables
See `.env.example`. Never put a Supabase service-role key in browser code.

## Important
This is an initial UI prototype. Bills are currently kept only in browser memory and disappear on refresh. Do not use it for production billing until Supabase persistence, authentication, authorization, audit logging, bill-number generation, and tested printing are implemented.
