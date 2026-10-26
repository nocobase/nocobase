---
title: Triển khai ứng dụng
description: Triển khai lên server của riêng bạn bằng PM2 hoặc Docker, hoặc triển khai lên NocoBase Studio. Chọn một phương thức rồi dùng Agent hoặc làm theo các bước thủ công.
sidebar: false
pageName: deployment
---

# Triển khai ứng dụng

Triển khai lên server của riêng bạn bằng PM2 hoặc Docker, hoặc triển khai lên NocoBase Studio. Chọn một phương thức rồi dùng Agent hoặc làm theo các bước thủ công.

- [Triển khai ứng dụng bằng PM2](#pm2)
- [Triển khai ứng dụng bằng Docker](#docker)
- [Triển khai lên NocoBase Studio](#studio)

## Môi trường ví dụ và truy cập cho PM2 / Docker {#deployment-example}

Hướng dẫn PM2 và Docker dùng các giá trị ví dụ bên dưới. Hãy thay server, thư mục triển khai và URL công khai bằng giá trị của bạn trước khi chạy lệnh. Triển khai lên Studio dùng môi trường do quản trị viên cấu hình và URL hiển thị trên trang App đích.

| Tham số            | Giá trị ví dụ                       |
| -------------------- | ----------------------------------- |
| Môi trường          | `Linux x64 · SQLite`                |
| Thư mục triển khai | `/srv/apps/purchase`                |
| URL công khai           | `https://purchase.example.com/main` |
| Upstream của proxy       | `127.0.0.1:13000`                   |

### Cấu hình truy cập công khai {#deployment-access}

1. Trỏ purchase.example.com về server đích và cấu hình chứng chỉ TLS cho HTTPS.
2. Cấu hình reverse proxy trên cùng server, chuyển tiếp đến 127.0.0.1:13000 và giữ nguyên đường dẫn /main.
3. Bật hỗ trợ WebSocket và chuyển tiếp host và giao thức công khai đến ứng dụng.

Các lệnh triển khai bên dưới không cấu hình DNS, chứng chỉ hay reverse proxy. Hãy hoàn tất các thiết lập này trước khi kiểm tra truy cập công khai.

## Triển khai ứng dụng bằng PM2 {#pm2}

Build một gói lưu trữ trên máy cục bộ, cài đặt và cập nhật qua SSH bằng app-installer, và để PM2 quản lý tiến trình ứng dụng.

### Dùng Agent để triển khai bằng PM2 {#pm2-skill}

Cài Skill nocobase-app-installer, mở một phiên Agent mới trong thư mục ứng dụng và gửi prompt bên dưới. Dùng Skill này cả cho cơ sở dữ liệu bên ngoài, rollback và CI/CD.

**Máy cục bộ · thư mục gốc dự án ứng dụng**

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-app-installer -g
```

**Gửi cho Agent**

```text
Use the nocobase-app-installer Skill to deploy this application with PM2.
SSH: deploy@server.example.com
Directory: /srv/apps/purchase
Public URL: https://purchase.example.com/main
Database: SQLite
Check the environment and configuration, then deploy and verify.
```

### 1. Chuẩn bị môi trường PM2 {#pm2-prepare}

Cài Node.js 24+ và pnpm trên máy cục bộ, và cấu hình truy cập SSH. Cài Node.js 24 và tar trên server Linux, sau đó cài PM2 (4.3+) bằng tài khoản triển khai:

**Server · tài khoản triển khai**

```bash
npm install --global pm2
```

Đảm bảo các phiên SSH không tương tác tìm thấy node và pm2. Tài khoản triển khai phải ghi được vào thư mục cài đặt và thư mục cha của nó; hãy dùng một thư mục mới hoặc trống cho lần cài đặt đầu tiên.

### 2. Build và cài đặt bằng PM2 {#pm2-install}

**Máy cục bộ · thư mục gốc dự án ứng dụng**

```bash
pnpm install --frozen-lockfile
pnpm build --target linux-x64 --node-version 24 --tar
```

Gói lưu trữ được ghi vào storage/exports/dist.tar.gz. Cung cấp mật khẩu quản trị viên ban đầu qua biến môi trường cục bộ INITIAL_ADMIN_PASSWORD, rồi cài đặt:

**Máy cục bộ · thư mục gốc dự án ứng dụng**

```bash
npx --yes @nocobase/app-installer@beta install \
  --ssh deploy@server.example.com \
  --dir /srv/apps/purchase \
  --archive storage/exports/dist.tar.gz \
  --origin https://purchase.example.com \
  --base-path /main \
  --port 13000 --name nocobase-purchase \
  --set-from-env users.initialAdmin.password=INITIAL_ADMIN_PASSWORD \
  --json
```

Trình cài đặt tải gói lưu trữ lên, tạo cấu hình, chạy migration và khởi động ứng dụng. Các ví dụ này dùng @beta; trong CI hãy cố định một phiên bản trình cài đặt đã được kiểm thử.

### 3. Cấu hình PM2 khởi động cùng hệ thống và kiểm tra {#pm2-verify}

**Server · tài khoản triển khai**

```bash
pm2 startup
```

Chạy lệnh dịch vụ hệ thống mà PM2 in ra, sau đó lưu danh sách tiến trình bằng chính tài khoản triển khai đó:

**Server · tài khoản triển khai**

```bash
pm2 save
```

Sau khi cấu hình HTTPS và reverse proxy như mô tả ở trên, hãy kiểm tra trạng thái ứng dụng và truy cập công khai:

**Máy cục bộ · thư mục gốc dự án ứng dụng**

```bash
npx --yes @nocobase/app-installer@beta status \
  --ssh deploy@server.example.com \
  --dir /srv/apps/purchase --json

curl --fail --silent --show-error \
  https://purchase.example.com/main/api/healthz
```

Xác nhận status báo result.health.ok là true và result.pending là null, và endpoint health trả về ok: true. Mở ứng dụng và kiểm tra đăng nhập. Đồng thời kiểm tra việc làm mới trang, đăng nhập và phân quyền, và một thao tác nghiệp vụ chính. Kiểm tra tải lên và tải xuống nếu có dùng lưu trữ tệp, và dữ liệu còn nguyên sau khi khởi động lại nếu thay đổi nơi lưu trữ.

### Cập nhật ứng dụng PM2 {#pm2-update}

Build lại gói lưu trữ, kiểm tra status xem còn thao tác chưa hoàn tất không, rồi chạy bước kiểm tra trước khi nâng cấp:

**Máy cục bộ · thư mục gốc dự án ứng dụng**

```bash
npx --yes @nocobase/app-installer@beta upgrade \
  --ssh deploy@server.example.com \
  --dir /srv/apps/purchase \
  --archive storage/exports/dist.tar.gz \
  --json
```

Xem kết quả kiểm tra trước, thời gian ngừng hoạt động và kế hoạch sao lưu, rồi chạy lại lệnh với --yes để áp dụng cập nhật. Sau đó lặp lại các bước kiểm tra trạng thái và truy cập. Trình cài đặt sao lưu SQLite và cấu hình; hãy sao lưu riêng các tệp đã tải lên. Với cơ sở dữ liệu bên ngoài, hãy sao lưu trước và thêm --backup-done.

## Triển khai ứng dụng bằng Docker {#docker}

Build image bằng Dockerfile có sẵn trong ứng dụng, rồi chạy trên server với cấu hình và dữ liệu được mount vào. Cài Docker trên cả hai máy và đăng nhập vào image registry của bạn.

### Dùng Agent để triển khai bằng Docker {#docker-skill}

Ứng dụng đã có sẵn Skill nocobase-deployment. Hãy yêu cầu Agent dùng Skill này từ thư mục dự án, kể cả cho build đa nền tảng, phân phối offline và CI/CD.

**Gửi cho Agent**

```text
Use the nocobase-deployment Skill to deploy this application with Docker.
SSH: deploy@server.example.com
Image: registry.example.com/purchase:release-001
Directory: /srv/apps/purchase
Public URL: https://purchase.example.com/main
Database: SQLite
Check the configuration and data mounts, then deploy and verify.
```

### 1. Build và phân phối Docker image {#docker-build}

**Máy cục bộ · thư mục gốc dự án ứng dụng**

```bash
docker build --platform linux/amd64 \
  -t registry.example.com/purchase:release-001 .
docker push registry.example.com/purchase:release-001
```

Dockerfile cài dependencies và build ứng dụng; không cần chạy pnpm build trước. Giữ Dockerfile.dockerignore bên cạnh để loại trừ cấu hình, secret và dữ liệu. Ví dụ này nhắm đến x64; dùng linux/arm64 cho server ARM64.

**Server · tài khoản triển khai**

```bash
docker pull registry.example.com/purchase:release-001
```

### 2. Chuẩn bị cấu hình và dữ liệu cho Docker {#docker-config}

Với lần triển khai đầu tiên, hãy tạo các thư mục riêng và tạo cấu hình SQLite với các secret duy nhất. Container chạy với UID 1000 và cần quyền đọc, ghi các thư mục này.

**Server · tài khoản triển khai**

```bash
sudo install -d -o 1000 -g 1000 -m 750 \
  /srv/apps/purchase /srv/apps/purchase/storage

docker run --rm \
  --mount type=bind,src=/srv/apps/purchase,dst=/config \
  registry.example.com/purchase:release-001 \
  node dist/cli/index.js config init \
  --config /config/config.yml --dialect sqlite
```

Cung cấp mật khẩu quản trị viên ban đầu qua biến môi trường INITIAL_ADMIN_PASSWORD trên server, rồi ghi vào cấu hình:

**Server · tài khoản triển khai**

```bash
docker run --rm -e INITIAL_ADMIN_PASSWORD \
  --mount type=bind,src=/srv/apps/purchase/config.yml,dst=/app/config.yml \
  registry.example.com/purchase:release-001 \
  node dist/cli/index.js config set --from-env \
  users.initialAdmin.password=INITIAL_ADMIN_PASSWORD
```

Giữ config.yml và storage/ trên máy chủ và dùng lại chúng qua các lần cập nhật image. Tệp .env của dự án không tự động được truyền vào container; hãy cung cấp các biến bổ sung bằng cùng tùy chọn -e hoặc --env-file cho cả bước kiểm tra cấu hình và khởi động.

### 3. Khởi động và kiểm tra Docker container {#docker-start}

Kiểm tra cấu hình, rồi khởi động container sau khi kiểm tra đạt:

**Server · tài khoản triển khai**

```bash
docker run --rm \
  -v /srv/apps/purchase/config.yml:/app/config.yml:ro \
  -v /srv/apps/purchase/storage:/app/storage \
  registry.example.com/purchase:release-001 \
  node dist/cli/index.js config check
```

**Server · tài khoản triển khai**

```bash
docker run -d --name purchase \
  --init --restart unless-stopped --stop-timeout 60 \
  -p 127.0.0.1:13000:13000 \
  -e APP_PUBLIC_ORIGIN=https://purchase.example.com \
  -e APP_BASE_PATH=/main \
  -v /srv/apps/purchase/config.yml:/app/config.yml:ro \
  -v /srv/apps/purchase/storage:/app/storage \
  registry.example.com/purchase:release-001
```

Sau khi cấu hình HTTPS và reverse proxy như mô tả ở trên, hãy kiểm tra container và truy cập công khai:

**Server · tài khoản triển khai**

```bash
docker inspect --format '{{.State.Health.Status}}' purchase

curl --fail --silent --show-error \
  https://purchase.example.com/main/api/healthz
```

Chờ container chuyển sang trạng thái healthy, xác nhận endpoint health trả về ok: true và kiểm tra đăng nhập trong ứng dụng. Để điều tra lỗi, chạy docker logs --tail 100 purchase. Đồng thời kiểm tra việc làm mới trang, đăng nhập và phân quyền, và một thao tác nghiệp vụ chính. Khi thay đổi cấu hình lưu trữ lâu dài, hãy xác nhận cơ sở dữ liệu và các tệp đã tải lên vẫn còn sau khi tạo lại container.

### Cập nhật ứng dụng Docker {#docker-update}

Build lại và push với tag mới, chẳng hạn release-002, giữ lại image cũ. Pull image mới, lặp lại bước kiểm tra cấu hình với tag đó, và chỉ dừng container cũ sau khi kiểm tra đạt:

**Server · tài khoản triển khai**

```bash
docker pull registry.example.com/purchase:release-002
```

**Server · tài khoản triển khai**

```bash
docker stop --timeout 60 purchase
```

Trong khi ứng dụng đang dừng, hãy sao lưu config.yml, storage/ và mọi cơ sở dữ liệu bên ngoài. Sau khi xác nhận bản sao lưu, xóa container cũ:

**Server · tài khoản triển khai**

```bash
docker rm purchase
```

Lặp lại lệnh khởi động với release-002, giữ nguyên cấu hình, mount dữ liệu và biến môi trường, rồi lặp lại các bước kiểm tra. Khởi động lại container không cập nhật image của nó. Docker không tự động sao lưu dữ liệu; hãy kiểm tra khả năng tương thích của cơ sở dữ liệu trước khi quay về image cũ.

## Triển khai lên NocoBase Studio {#studio}

Làm theo các bước sau để build, tải lên và triển khai ứng dụng cục bộ lên một NocoBase Studio có sẵn. Chạy mọi lệnh trên máy tính cục bộ. Môi trường đích phải chấp nhận gói lưu trữ, và Studio phải xác định được kho mã nguồn của ứng dụng và xác minh được commit.

### Triển khai lên Studio bằng Agent {#studio-skill}

Mở coding agent trong thư mục dự án ứng dụng, thay URL và các ID bên dưới, rồi gửi prompt. Ở lần kết nối đầu tiên, hãy đưa cho agent hướng dẫn thiết lập trong mục Use Studio in your agent ở menu ảnh đại diện của Studio, rồi chấp thuận đăng nhập trên trình duyệt.

**Gửi cho coding agent cục bộ**

```text
Use the nocobase-deployment Skill to deploy the current project to NocoBase Studio.

Studio URL: https://studio.example.com/studio
Application ID: purchase
Environment ID: preview

Reuse the existing CLI connection, then build, upload, and deploy.
Preserve existing configuration and data during updates; ask me for any missing required information.
Check deployment status, error logs, and application access. Return the application URL and verification results.
If approval is required, submit a request and report its current status.
```

### 1. Cài đặt CLI {#studio-cli}

Mở mục Use Studio in your agent từ menu ảnh đại diện của Studio. Sao chép lệnh cài đặt CLI và chạy trong một terminal Bash cục bộ. Hãy dùng lệnh đầy đủ do trang tạo ra; ví dụ bên dưới chỉ minh họa định dạng. Bỏ qua bước cài đặt nếu CLI đã có sẵn.

**Máy cục bộ · terminal Bash**

```bash
curl -fsSL https://studio.example.com/studio/api/agents/dist/installScript \
  | sh -s -- --token '<download-token>'
```

Sau khi cài đặt, kiểm tra lệnh đã dùng được chưa:

**Máy cục bộ · terminal Bash**

```bash
export PATH="$HOME/.local/bin:$PATH"
nb-studio --version
```

### 2. Đăng nhập vào Studio {#studio-login}

Thay URL bằng URL Studio của bạn, bao gồm cả đường dẫn triển khai như /studio. Hướng dẫn này đặt tên kết nối cục bộ là studio. Nếu bạn đã đăng nhập vào đúng Studio cần dùng, hãy chuyển thẳng đến whoami để kiểm tra kết nối.

**Máy cục bộ · terminal Bash**

```bash
nb-studio --profile studio login \
  --server https://studio.example.com/studio
```

Kiểm tra mã xác minh và chấp thuận đăng nhập trên trình duyệt, sau đó kiểm tra danh tính của bạn:

**Máy cục bộ · terminal Bash**

```bash
nb-studio --profile studio whoami --json
```

### 3. Chọn ứng dụng {#studio-app}

Liệt kê các ứng dụng và tìm ID của ứng dụng cần triển khai:

**Máy cục bộ · terminal Bash**

```bash
nb-studio --profile studio app list --json
```

Các lệnh sau dùng purchase; hãy thay bằng ID ứng dụng bạn đã chọn. Nếu chưa có ứng dụng, hãy tạo một ứng dụng trong Release management → Apps của Studio, chọn một môi trường chấp nhận gói lưu trữ và hoàn tất việc liên kết mã nguồn cần cho việc tải lên.

### 4. Build trên máy cục bộ {#studio-build}

Chạy các lệnh này từ thư mục gốc dự án ứng dụng trên máy cục bộ. Ví dụ này nhắm đến Linux x64 và Node.js 24; hãy điều chỉnh tùy chọn build cho môi trường của bạn:

**Máy cục bộ · thư mục gốc dự án ứng dụng · Bash**

```bash
pnpm install --frozen-lockfile
pnpm build --target linux-x64 --node-version 24 --tar
```

Gói triển khai được tạo tại storage/exports/dist.tar.gz.

### 5. Tải gói lưu trữ lên {#studio-upload}

Tải gói lưu trữ lên bằng kết nối ở bước 2. Thay <commit-sha> bằng SHA đầy đủ của commit dùng cho lần build này, mà Studio phải xác minh được:

**Máy cục bộ · thư mục gốc dự án ứng dụng · Bash**

```bash
nb-studio --profile studio release upload \
  --app purchase \
  --sha '<commit-sha>' \
  --file storage/exports/dist.tar.gz \
  --json
```

Xác nhận result.data.superseded là false và có result.data.release, rồi sao chép result.data.release.id cho bước tiếp theo. Tải lên không có nghĩa là đã triển khai ứng dụng.

### 6. Triển khai {#studio-deploy}

Thay <release-id> bằng ID trả về ở trên, rồi kiểm tra các cấu hình bắt buộc:

**Máy cục bộ · terminal Bash**

```bash
nb-studio --profile studio app env list purchase \
  --release '<release-id>' --json
```

Nếu có mục nào hiển thị missing: true, hãy điền chúng trong tab Variables của ứng dụng trên Studio. Với môi trường không được bảo vệ, triển khai bằng lệnh:

**Máy cục bộ · terminal Bash**

```bash
nb-studio --profile studio app deploy purchase \
  --release '<release-id>' --wait true --json
```

Nếu môi trường yêu cầu phê duyệt, hãy gửi yêu cầu triển khai và kiểm tra kết quả sau khi được phê duyệt:

**Máy cục bộ · terminal Bash**

```bash
nb-studio --profile studio deploy request purchase \
  --release '<release-id>' --json
```

--wait true chờ tối đa khoảng 100 giây. Nếu việc triển khai vẫn đang xếp hàng, đang chạy hoặc đang chờ phê duyệt, hãy tiếp tục kiểm tra như mô tả ở bước 7.

### 7. Kiểm tra trạng thái và log lỗi {#studio-verify}

Kiểm tra bản ghi triển khai, trạng thái ứng dụng và log lỗi:

**Máy cục bộ · terminal Bash**

```bash
nb-studio --profile studio deploy list purchase --limit 5 --json
nb-studio --profile studio app get purchase --json
nb-studio --profile studio app logs purchase --level error --json
```

Tìm lần triển khai có releaseId khớp với lần tải lên này. Xác nhận status là succeeded và app.currentDeploymentId từ app get khớp với id của nó. Mở result.data.url để kiểm tra đăng nhập và các luồng công việc chính. Với ứng dụng khởi động theo yêu cầu hoặc đang ngủ, hãy truy cập trước để đánh thức, rồi xác nhận runtime.state là running.

Thông tin đăng nhập quản trị viên ban đầu do Studio tạo có trong tab Overview của ứng dụng, chừng nào chúng còn được lưu và chưa bị ẩn đi.

### Cập nhật ứng dụng trên Studio {#studio-update}

Giữ nguyên ID ứng dụng, cấu hình và lưu trữ hiện có. Sao lưu cơ sở dữ liệu và các tệp đã tải lên trước khi cập nhật.

Build lại và tải gói lưu trữ lên, thay <commit-sha> bằng SHA đầy đủ của commit cho mã nguồn đã cập nhật. Tải lên cùng ứng dụng và SHA một lần nữa sẽ dùng lại release hiện có; hãy dùng commit mã nguồn mới khi nội dung build đã thay đổi:

**Máy cục bộ · thư mục gốc dự án ứng dụng · Bash**

```bash
pnpm install --frozen-lockfile
pnpm build --target linux-x64 --node-version 24 --tar

nb-studio --profile studio release upload \
  --app purchase \
  --sha '<commit-sha>' \
  --file storage/exports/dist.tar.gz \
  --json
```

Sau khi xác nhận lần tải lên trả về một release hợp lệ, thay <release-id> bằng result.data.release.id. Hoàn tất các cấu hình bắt buộc như ở bước 6. Chạy lệnh bên dưới với môi trường không được bảo vệ; nếu cần phê duyệt thì gửi yêu cầu triển khai thay thế.

**Máy cục bộ · thư mục gốc dự án ứng dụng · Bash**

```bash
nb-studio --profile studio app deploy purchase \
  --release '<release-id>' --wait true --json
```

Sau khi triển khai, làm theo bước 7 để xác nhận lần triển khai này thành công và kiểm tra log lỗi, đăng nhập và các luồng công việc chính.
