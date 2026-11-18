# Digital Chain of Custody

Bukti Medikolegal Tracking System — web app for tracking medico-legal evidence (barang bukti) from collection to court.

Live: https://thelegokid4455.github.io/chain-of-custody/

## Features
- User accounts (register / login) with roles: Admin, Dokter Forensik, Penyidik Polisi, Petugas Laboratorium, Kejaksaan, Pengadilan
- Dashboard: stats, recent evidence, activity feed, notifications, quick actions
- Tambah Barang Bukti with photo upload (stored privately)
- Daftar Barang Bukti with search and filters
- Detail page with custody history and a QR code (print / download) that opens the item when scanned
- Perpindahan: record transfers; the item's location updates automatically
- Log Chain of Custody with per-item filter and CSV export

## Database (Supabase)
The site is static (GitHub Pages); data lives in Supabase.

1. Create a project at https://supabase.com.
2. SQL Editor → run `supabase/schema.sql` (and `supabase/seed.sql` for demo data, optional).
3. Project Settings → API → copy the Project URL and the anon/publishable key into `js/config.js`.
4. Authentication → URL Configuration → set Site URL to the live site URL.
5. Register on the site, then make yourself Admin with the UPDATE at the bottom of `schema.sql`.

Security rules (enforced in the database):
- Only logged-in users can read anything; photos are in a private bucket.
- A location changes only through a recorded transfer.
- The custody log is append-only — no edits or deletes.
- Only Admins can delete evidence; nobody can self-register as Admin.

With `js/config.js` left empty the app runs in local demo mode (data in this browser only).
