---
title: Thiết lập môi trường phát triển cục bộ trên Windows với WSL
description: Chuẩn bị Ubuntu, Docker Desktop, Node.js, Yarn và Codex CLI bằng WSL 2 trên Windows cho phát triển cục bộ NocoBase và quy trình AI Agent.
---

# Thiết lập môi trường phát triển cục bộ trên Windows với WSL

Khi phát triển NocoBase cục bộ trên Windows, chúng tôi khuyến nghị chuẩn bị WSL 2 trước. Node.js, Yarn, NocoBase CLI, lệnh Docker và AI Agent sẽ chạy trong cùng một Linux shell, với đường dẫn, quyền và build dependency native gần với môi trường Linux phổ biến hơn.

Nếu chưa chắc có cần WSL hay không, hãy xem trước [Thiết lập phát triển cục bộ](./local-development-setup.md).

## Chuẩn bị

Trước khi bắt đầu, kiểm tra phiên bản Windows và trạng thái ảo hóa.

### Kiểm tra phiên bản Windows

Nhấn `Win + R`, nhập `winver`, rồi xác nhận hệ thống đáp ứng một trong các điều kiện sau:

- Windows 11
- Windows 10 version 2004 trở lên, Build 19041 trở lên

Nếu phiên bản cũ hơn, hãy cập nhật Windows trước.

### Kiểm tra ảo hóa

Mở Task Manager, vào Performance / CPU và xác nhận Virtualization đang Enabled.

Nếu chưa bật, hãy bật trong BIOS / UEFI. Tên tùy chọn có thể là Intel VT-x, Intel Virtualization Technology, AMD-V hoặc SVM Mode tùy nhà sản xuất.

## Bước 1: cài đặt WSL 2

Mở PowerShell với quyền administrator và chạy:

```powershell
wsl --install
```

Sau khi cài đặt, khởi động lại máy tính. Mặc định lệnh này cài Ubuntu. Khi mở lần đầu, Ubuntu yêu cầu tạo username và password Linux. Chúng chỉ dùng bên trong WSL.

Để chọn bản phân phối cụ thể, xem danh sách trước:

```powershell
wsl --list --online
```

Sau đó cài bản phân phối, ví dụ Ubuntu:

```powershell
wsl --install -d Ubuntu
```

## Bước 2: xác nhận phiên bản WSL

Trong PowerShell, chạy:

```powershell
wsl --list --verbose
```

Xác nhận bản phân phối đang dùng có `VERSION 2`:

```text
  NAME      STATE           VERSION
* Ubuntu    Running         2
```

Nếu vẫn là WSL 1, chuyển sang WSL 2 và đặt WSL 2 làm mặc định:

```powershell
wsl --set-version Ubuntu 2
wsl --set-default-version 2
wsl --update
```

## Bước 3: cài đặt Docker Desktop

Nếu bạn định cài hoặc chạy NocoBase bằng Docker, cài Docker Desktop for Windows.

- [Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)

Với phát triển cục bộ, `Per-user` thường là đủ. Ở màn hình cấu hình, chọn `Use WSL 2 instead of Hyper-V`, rồi mở Docker Desktop từ menu Start.

## Bước 4: bật tích hợp WSL của Docker

Trong Docker Desktop, bật backend WSL 2:

1. Docker Desktop / Settings / General
2. Use the WSL 2 based engine
3. Apply

![Docker Desktop WSL 2 engine](https://static-docs.nocobase.com/2026-06-12-19-10-41.png)

Sau đó bật tích hợp với bản phân phối WSL:

1. Docker Desktop / Settings / Resources / WSL Integration
2. Enable integration with my default WSL distro
3. Bật bản phân phối, ví dụ `Ubuntu`
4. Apply & restart hoặc Apply

![Docker Desktop WSL integration](https://static-docs.nocobase.com/2026-06-12-19-11-09.png)

Nếu không thấy WSL Integration, Docker Desktop thường đang ở chế độ Windows containers. Chuyển sang Linux containers từ biểu tượng Docker trong system tray rồi kiểm tra lại.

## Bước 5: kiểm tra Docker

Kiểm tra trước trong PowerShell:

```powershell
wsl --list --verbose
docker version
docker compose version
docker run hello-world
```

Vào WSL:

```powershell
wsl
```

Sau đó chạy trong WSL:

```bash
docker version
docker compose version
docker run hello-world
```

Nếu container `hello-world` được tải và chạy thành công, tích hợp Docker Desktop và WSL 2 đã hoạt động.

## Bước 6: cài Node.js và Yarn trong WSL

WSL không phải runtime Node.js mặc định. Ubuntu cài bằng `wsl --install` thường chưa có Node.js và npm.

Trong WSL, kiểm tra trước:

```bash
node -v
npm -v
```

Nếu không tìm thấy lệnh, cài Node.js 22 bằng NodeSource:

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

Nếu cần đổi phiên bản Node.js theo từng dự án, dùng nvm:

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

:::warning Ghi chú

Chọn NodeSource hoặc nvm. Không khuyến nghị trộn hai cách quản lý Node.js trong cùng một user WSL.

:::

Cài Yarn 1.x:

```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
yarn -v
```

Nếu không có Corepack:

```bash
npm install -g yarn@1.22.22
yarn -v
```

## Bước 7: cài đặt Codex CLI

Codex CLI cũng có thể dùng trong command line native của Windows. Trong hướng dẫn này, Codex được cài trong WSL để Codex và toolchain cục bộ của NocoBase nằm trong cùng một môi trường Linux.

Xác nhận bạn đang ở trong WSL:

```bash
echo $WSL_DISTRO_NAME
```

Cài Codex CLI trong WSL:

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

Cài đặt không tương tác:

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | CODEX_NON_INTERACTIVE=1 sh
```

Chạy và kiểm tra Codex:

```bash
codex
codex --version
```

Khuyến nghị mở Codex từ thư mục dự án trong WSL:

```bash
mkdir -p ~/projects
cd ~/projects/my-app
codex
```

:::tip Ghi chú

Vì Codex được cài trong WSL, hãy chạy `codex` từ terminal WSL. PowerShell dùng môi trường Windows native, không phải môi trường WSL đã chuẩn bị trong hướng dẫn này.

:::

## Nên đặt tệp dự án ở đâu

Nên đặt dự án trong filesystem của WSL:

```bash
~/projects/my-app
```

Tránh dùng đường dẫn mount của Windows làm vị trí mặc định:

```bash
/mnt/c/Users/<your-name>/projects/my-app
```

Cách này thường cho hiệu năng filesystem tốt hơn và giảm vấn đề về quyền cũng như symlink.

Để truy cập tệp WSL từ Windows Explorer:

```text
\\wsl$\Ubuntu\home\<your-name>
```

## Câu hỏi thường gặp

### WSL không tìm thấy lệnh docker

Xác nhận bản phân phối dùng WSL 2, rồi bật tích hợp trong Docker Desktop / Settings / Resources / WSL Integration.

```powershell
wsl --list --verbose
wsl --set-version Ubuntu 2
```

### Không thấy WSL Integration

Docker Desktop có thể đang ở chế độ Windows containers. Từ biểu tượng Docker, chuyển sang Linux containers rồi mở lại WSL Integration.

### Docker Desktop không khởi động hoặc WSL bất thường

Thử trước:

```powershell
wsl --shutdown
wsl --update
```

Sau đó khởi động lại Docker Desktop.

### Docker Engine đã được cài thủ công trong WSL

Docker khuyến nghị gỡ Docker Engine hoặc Docker CLI đã cài trực tiếp trong bản phân phối WSL trước khi dùng Docker Desktop, để tránh xung đột với tích hợp WSL.

### WSL không tìm thấy lệnh codex

Xác nhận bạn đang ở trong WSL, rồi kiểm tra `PATH`:

```bash
echo $WSL_DISTRO_NAME
which codex
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

## Tài liệu tham khảo chính thức

- [Microsoft Learn: How to install Linux on Windows with WSL](https://learn.microsoft.com/en-us/windows/wsl/install)
- [Microsoft Learn: Install Node.js on Windows Subsystem for Linux](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl)
- [Docker Docs: Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [Docker Docs: Docker Desktop WSL 2 backend on Windows](https://docs.docker.com/desktop/features/wsl/)
- [Docker Docs: Change your Docker Desktop settings](https://docs.docker.com/desktop/settings-and-maintenance/settings/)
- [OpenAI Developers: Codex CLI](https://developers.openai.com/codex/cli)
- [OpenAI Developers: Codex on Windows](https://developers.openai.com/codex/windows)
- [nvm: Node Version Manager](https://github.com/nvm-sh/nvm)
- [npm Docs: Downloading and installing Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm/)
