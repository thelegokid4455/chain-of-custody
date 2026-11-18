-- Optional demo data (the 3 items / 9 transfers from the prototype).
-- Run after schema.sql. Skip it if you want to start with an empty database.

insert into public.items (code, type, description, location, collected_date, officer, created_by) values
  ('BB-001', 'Darah', 'Sampel darah dari korban, diambil dari luka tembak', 'Rumah Sakit Umum', '2024-01-15', 'Dr. Ahmad', null),
  ('BB-002', 'Pakaian Korban', 'Kemeja korban dengan bercak darah dan robekan di bagian dada', 'TKP', '2024-01-16', 'Inspektur Rudi', null),
  ('BB-003', 'Proyektil', 'Proyektil kaliber 9mm yang diambil dari tubuh korban', 'TKP', '2024-01-17', 'Forensik Dr. Maya', null)
on conflict do nothing;

insert into public.transfers (code, from_loc, to_loc, officer, moved_date, moved_time, note, created_by) values
  ('BB-001', 'Rumah Sakit Umum', 'Penyidik Polisi', 'Dr. Ahmad', '2024-01-15', '10:30', 'Pengambilan awal', null),
  ('BB-002', 'TKP', 'Penyidik Polisi', 'Inspektur Rudi', '2024-01-16', '09:00', 'Pengambilan dari TKP', null),
  ('BB-001', 'Penyidik Polisi', 'Laboratorium Forensik', 'Budi Santoso', '2024-01-16', '14:15', 'Untuk analisis DNA', null),
  ('BB-002', 'Penyidik Polisi', 'Laboratorium Forensik', 'Siti Aminah', '2024-01-17', '11:45', 'Analisis serat dan DNA', null),
  ('BB-003', 'TKP', 'Penyidik Polisi', 'Forensik Dr. Maya', '2024-01-17', '13:30', 'Pengambilan dari tubuh korban', null),
  ('BB-003', 'Penyidik Polisi', 'Laboratorium Forensik', 'Teknisi Lab', '2024-01-18', '10:15', 'Analisis balistik', null),
  ('BB-002', 'Laboratorium Forensik', 'Kejaksaan', 'Jaksa Agung', '2024-01-18', '16:20', 'Untuk keperluan persidangan', null),
  ('BB-003', 'Laboratorium Forensik', 'Kejaksaan', 'Jaksa', '2024-01-19', '09:45', 'Laporan balistik', null),
  ('BB-003', 'Kejaksaan', 'Pengadilan', 'Panitera', '2024-01-20', '14:00', 'Untuk sidang', null);

delete from public.activity;
