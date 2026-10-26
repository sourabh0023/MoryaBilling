# MoryaBilling

A responsive dine-in restaurant POS for Morya Misal, built with Next.js, TypeScript, Supabase, and a charcoal/orange/white theme.

## Current workflow
- Select a table before adding menu items; each table has its own saved draft.
- Search and filter the menu, use Favorites, and manage menu items.
- Preview an order with restaurant and table details, then save or print a thermal-style receipt.
- Bill history, reports/daily summary, restaurant settings, table management, and dark/light themes.
- Saved orders are marked **Saved**, not **Paid**, until payment recording is implemented.

## Supabase setup
1. In the Supabase SQL Editor, run `supabase/pos-workflow.sql` once. It creates the POS tables and attempts an additive copy of legacy bills into the new history table.
2. In Supabase Authentication, create the restaurant owner's user. Disable public sign-ups so only authorized accounts can sign in.
3. In Vercel Project Settings → Environment Variables, configure:
   - `NEXT_PUBLIC_SUPABASE_URL` = the project URL, e.g. `https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the Supabase publishable key (starts with `sb_publishable_` in the new key format, or the anon key in the legacy format). Do **not** put the URL in this field.
4. Apply the variables to Production and redeploy.
5. Open the deployed app and sign in with the owner account.

Never put the Supabase service-role key in browser code.

## Development
1. Install Node.js (LTS).
2. Run `npm install`.
3. Configure the two public Supabase environment variables in `.env.local`.
4. Run `npm run dev`.

## Production notes
The POS tables use authenticated-only Row Level Security policies. The current app is designed for a single owner account; keep public sign-ups disabled. Review the RLS model before adding staff accounts or multiple branches. Test saving, reloading, table switching, editing, and thermal printing before using it for live transactions.
