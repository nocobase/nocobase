---
title: "Proxy tài nguyên tĩnh bằng Caddy"
description: "Dùng Caddy làm proxy cho tài nguyên tĩnh của NocoBase để đơn giản hóa HTTPS và cấu hình đầu vào trong môi trường production."
keywords: "Caddy,proxy tài nguyên tĩnh,reverse proxy,HTTPS tự động,production,NocoBase"
---

# Caddy

Nếu hiện tại bạn muốn cấu hình proxy production cho một ứng dụng NocoBase, tốt nhất hãy bắt đầu từ [Reverse proxy trong production](../../../quickstart/production/reverse-proxy/index.md), rồi tiếp tục với trang [Caddy](../../../quickstart/production/reverse-proxy/caddy.md).

Phần cũ này chủ yếu từng đóng vai trò là điểm vào cho proxy tài nguyên tĩnh. Tài liệu hiện tại đã được tổ chức lại xoay quanh `nb proxy caddy`, bao quát thống nhất việc tạo cấu hình, chạy local hoặc Docker, điểm vào HTTPS, cùng các route `uploads`, `dist`, `api`, `ws` và SPA.
