# Digital Chain of Custody

Bukti Medikolegal Tracking System — prototype web app for tracking medico-legal evidence (barang bukti) from collection to court.

## Features
- Login with role (Admin, Dokter Forensik, Penyidik Polisi, Petugas Laboratorium, Kejaksaan, Pengadilan)
- Dashboard: stats, recent evidence, recent activity, quick actions, notifications
- Tambah Barang Bukti: add evidence with photo upload (drag & drop)
- Daftar Barang Bukti: search and filter by type / location
- Detail: evidence info, current status, full custody history, QR code (print / download PNG)
- Perpindahan: record transfers; origin auto-fills from the item's last location
- Log Chain of Custody: full transfer log, filter per item, export CSV

## Notes
- Pure static site (HTML/CSS/JS), no build step — hosted on GitHub Pages.
- Data is saved in the browser's localStorage, so each browser/device has its own data. This is a prototype; a shared database is needed for real multi-user use.
- Login accepts any username/password (prototype only).
- QR codes link to `#/bukti/<KODE>` on this site.
