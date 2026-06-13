---
title: Menyiapkan lingkungan pengembangan lokal di Windows dengan WSL
description: Siapkan Ubuntu, Docker Desktop, Node.js, Yarn, dan Codex CLI dengan WSL 2 di Windows untuk pengembangan lokal NocoBase dan alur kerja AI Agent.
---

# Menyiapkan lingkungan pengembangan lokal di Windows dengan WSL

Untuk pengembangan lokal NocoBase di Windows, kami merekomendasikan menyiapkan WSL 2 terlebih dahulu. Dengan begitu Node.js, Yarn, NocoBase CLI, perintah Docker, dan AI Agent berjalan dalam shell Linux yang sama, dengan path, izin, dan build dependency native yang lebih dekat dengan lingkungan Linux umum.

Jika belum yakin apakah perlu WSL, lihat dulu [Menyiapkan pengembangan lokal](./local-development-setup.md).

## Persiapan

Sebelum mulai, periksa versi Windows dan status virtualisasi.

### Periksa versi Windows

Tekan `Win + R`, masukkan `winver`, lalu pastikan sistem memenuhi salah satu syarat berikut:

- Windows 11
- Windows 10 version 2004 atau lebih baru, Build 19041 atau lebih baru

Jika versinya lebih lama, perbarui Windows terlebih dahulu.

### Periksa virtualisasi

Buka Task Manager, masuk ke Performance / CPU, lalu pastikan Virtualization berstatus Enabled.

Jika belum aktif, aktifkan dari BIOS / UEFI. Nama opsinya bisa berbeda, seperti Intel VT-x, Intel Virtualization Technology, AMD-V, atau SVM Mode.

## Langkah 1: instal WSL 2

Buka PowerShell sebagai administrator dan jalankan:

```powershell
wsl --install
```

Restart komputer setelah instalasi. Secara default, perintah ini menginstal Ubuntu. Saat pertama kali dibuka, Ubuntu akan meminta username dan password Linux. Keduanya hanya digunakan di dalam WSL.

Untuk memilih distribusi tertentu, lihat daftar distribusi dulu:

```powershell
wsl --list --online
```

Lalu instal distribusi, misalnya Ubuntu:

```powershell
wsl --install -d Ubuntu
```

## Langkah 2: konfirmasi versi WSL

Di PowerShell, jalankan:

```powershell
wsl --list --verbose
```

Pastikan distribusi yang digunakan memiliki `VERSION 2`:

```text
  NAME      STATE           VERSION
* Ubuntu    Running         2
```

Jika masih WSL 1, ubah ke WSL 2 dan jadikan WSL 2 sebagai default:

```powershell
wsl --set-version Ubuntu 2
wsl --set-default-version 2
wsl --update
```

## Langkah 3: instal Docker Desktop

Jika Anda akan menginstal atau menjalankan NocoBase dengan Docker, instal Docker Desktop for Windows.

- [Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)

Untuk pengembangan lokal, mode `Per-user` biasanya cukup. Pada halaman konfigurasi, pilih `Use WSL 2 instead of Hyper-V`, lalu jalankan Docker Desktop dari menu Start.

## Langkah 4: aktifkan integrasi WSL Docker

Di Docker Desktop, aktifkan backend WSL 2:

1. Docker Desktop / Settings / General
2. Use the WSL 2 based engine
3. Apply

![Docker Desktop WSL 2 engine](https://static-docs.nocobase.com/2026-06-12-19-10-41.png)

Lalu aktifkan integrasi distribusi WSL:

1. Docker Desktop / Settings / Resources / WSL Integration
2. Enable integration with my default WSL distro
3. Aktifkan distribusi, misalnya `Ubuntu`
4. Apply & restart atau Apply

![Docker Desktop WSL integration](https://static-docs.nocobase.com/2026-06-12-19-11-09.png)

Jika WSL Integration tidak muncul, Docker Desktop biasanya berada di mode Windows containers. Ubah ke Linux containers dari ikon Docker di system tray Windows, lalu periksa lagi.

## Langkah 5: verifikasi Docker

Periksa dari PowerShell:

```powershell
wsl --list --verbose
docker version
docker compose version
docker run hello-world
```

Masuk ke WSL:

```powershell
wsl
```

Lalu jalankan di WSL:

```bash
docker version
docker compose version
docker run hello-world
```

Jika container `hello-world` berhasil diunduh dan dijalankan, integrasi Docker Desktop dan WSL 2 sudah berfungsi.

## Langkah 6: instal Node.js dan Yarn di WSL

WSL bukan runtime Node.js secara default. Ubuntu yang diinstal lewat `wsl --install` biasanya belum berisi Node.js dan npm.

Di WSL, periksa dulu:

```bash
node -v
npm -v
```

Jika command tidak ditemukan, instal Node.js 22 dengan NodeSource:

```bash
sudo apt update
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh
sudo -E bash nodesource_setup.sh
sudo apt install -y nodejs
node -v
npm -v
npx -v
```

Jika perlu berpindah versi Node.js antar proyek, gunakan nvm:

```bash
sudo apt update
sudo apt install -y curl ca-certificates
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
node -v
npm -v
npx -v
```

:::warning Catatan

Pilih NodeSource atau nvm. Tidak disarankan mencampur dua cara pengelolaan Node.js dalam user WSL yang sama.

:::

Instal Yarn 1.x:

```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
yarn -v
```

Jika Corepack tidak tersedia:

```bash
npm install -g yarn@1.22.22
yarn -v
```

## Langkah 7: instal Codex CLI

Codex CLI juga bisa digunakan di command line Windows native. Di panduan ini, Codex dipasang di WSL agar Codex dan toolchain NocoBase berada dalam lingkungan Linux yang sama.

Pastikan Anda berada di WSL:

```bash
echo $WSL_DISTRO_NAME
```

Instal Codex CLI di WSL:

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

Instalasi non-interaktif:

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | CODEX_NON_INTERACTIVE=1 sh
```

Jalankan dan verifikasi Codex:

```bash
codex
codex --version
```

Sebaiknya jalankan Codex dari direktori proyek di WSL:

```bash
mkdir -p ~/projects
cd ~/projects/my-app
codex
```

:::tip Catatan

Karena Codex dipasang di WSL, jalankan `codex` dari terminal WSL. PowerShell menggunakan lingkungan Windows native, bukan lingkungan WSL yang disiapkan di panduan ini.

:::

## Tempat menyimpan file proyek

Simpan proyek di filesystem WSL:

```bash
~/projects/my-app
```

Hindari lokasi mount Windows sebagai default:

```bash
/mnt/c/Users/<your-name>/projects/my-app
```

Biasanya ini memberi performa file yang lebih baik dan mengurangi masalah izin serta symlink.

Untuk mengakses file WSL dari Windows Explorer:

```text
\\wsl$\Ubuntu\home\<your-name>
```

## FAQ

### WSL tidak menemukan perintah docker

Pastikan distribusi memakai WSL 2, lalu aktifkan integrasinya di Docker Desktop / Settings / Resources / WSL Integration.

```powershell
wsl --list --verbose
wsl --set-version Ubuntu 2
```

### WSL Integration tidak muncul

Docker Desktop kemungkinan berada di mode Windows containers. Ubah ke Linux containers dari ikon Docker, lalu buka kembali pengaturan WSL Integration.

### Docker Desktop gagal start atau WSL terlihat bermasalah

Coba jalankan:

```powershell
wsl --shutdown
wsl --update
```

Lalu restart Docker Desktop.

### Docker Engine sudah diinstal manual di WSL

Docker merekomendasikan menghapus Docker Engine atau Docker CLI yang diinstal langsung di distribusi WSL sebelum memakai Docker Desktop, agar tidak bentrok dengan integrasi WSL.

### WSL tidak menemukan perintah codex

Pastikan Anda berada di WSL, lalu periksa `PATH`:

```bash
echo $WSL_DISTRO_NAME
which codex
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

## Referensi resmi

- [Microsoft Learn: How to install Linux on Windows with WSL](https://learn.microsoft.com/en-us/windows/wsl/install)
- [Microsoft Learn: Install Node.js on Windows Subsystem for Linux](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl)
- [Docker Docs: Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [Docker Docs: Docker Desktop WSL 2 backend on Windows](https://docs.docker.com/desktop/features/wsl/)
- [Docker Docs: Change your Docker Desktop settings](https://docs.docker.com/desktop/settings-and-maintenance/settings/)
- [OpenAI Developers: Codex CLI](https://developers.openai.com/codex/cli)
- [OpenAI Developers: Codex on Windows](https://developers.openai.com/codex/windows)
- [nvm: Node Version Manager](https://github.com/nvm-sh/nvm)
- [npm Docs: Downloading and installing Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm/)
