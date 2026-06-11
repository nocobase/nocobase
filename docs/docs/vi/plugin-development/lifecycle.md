---
title: "Vòng đời Plugin"
description: "Các hook vòng đời của Plugin NocoBase: install, enable, disable, uninstall, load, loadAsync, thời điểm gắn kết server và client."
keywords: "vòng đời plugin,load,loadAsync,install,enable,disable,gỡ cài đặt,NocoBase"
---

# Vòng đời

Tài liệu này tổng hợp các hook vòng đời của Plugin trên cả server và client, giúp bạn đăng ký và giải phóng tài nguyên đúng cách.

Có thể đối chiếu với vòng đời của FlowModel để làm nổi bật các khái niệm chung.

## Nội dung đề xuất

- Các callback được kích hoạt khi Plugin cài đặt, kích hoạt, vô hiệu hóa, gỡ cài đặt.
- Thời điểm mount, update và destroy của các Component phía client.
- Khuyến nghị xử lý tác vụ bất đồng bộ và lỗi trong vòng đời.
