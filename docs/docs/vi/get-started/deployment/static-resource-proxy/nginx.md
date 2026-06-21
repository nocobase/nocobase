---
title: "Proxy tài nguyên tĩnh bằng Nginx"
description: "Dùng Nginx làm proxy cho tài nguyên tĩnh của NocoBase để cải thiện hiệu năng và độ ổn định trong môi trường production."
keywords: "Nginx,proxy tài nguyên tĩnh,reverse proxy,triển khai production,NocoBase"
---

# Nginx

Nếu hiện tại bạn muốn cấu hình proxy production cho một ứng dụng NocoBase, tốt nhất hãy bắt đầu từ [Reverse proxy trong production](../../../nocobase-cli/production/reverse-proxy/index.md), rồi tiếp tục với trang [Nginx](../../../nocobase-cli/production/reverse-proxy/nginx.md).

Phần cũ này chủ yếu từng đóng vai trò là điểm vào cho proxy tài nguyên tĩnh. Tài liệu hiện tại đã được tổ chức lại xoay quanh `nb proxy nginx`, bao quát thống nhất việc tạo cấu hình, chạy local hoặc Docker, cùng các route `uploads`, `dist`, `api`, `ws` và SPA.
