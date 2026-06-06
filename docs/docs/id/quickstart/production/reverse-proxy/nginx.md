# Nginx

Untuk env NocoBase yang dikelola CLI, jalur yang direkomendasikan adalah `nb env proxy nginx`. Jika app tidak dikelola oleh CLI, pertahankan blok `server` biasa dan arahkan `proxy_pass` ke alamat internal NocoBase yang sebenarnya.
