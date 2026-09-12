---
pkg: "@nocobase/plugin-ai"
title: "Tạo Nhân viên AI mới"
description: "Tạo Nhân viên AI tùy chỉnh: cấu hình Profile, Prompt hệ thống Role setting, quyền Skills, Knowledge Base, định nghĩa persona vai trò và ranh giới năng lực."
keywords: "Tạo Nhân viên AI mới,Tạo Nhân viên AI,Role setting,Prompt hệ thống,Cấu hình Skill,NocoBase"
---

# Tạo Nhân viên AI mới

Nếu Nhân viên AI tích hợp sẵn không thể đáp ứng nhu cầu của bạn, bạn có thể tạo và tùy chỉnh Nhân viên AI của riêng mình.

## Bắt đầu tạo mới

Vào trang quản lý `AI employees`, nhấp `New AI employee`.

## Cấu hình thông tin cơ bản

Trong tab `Profile` cấu hình:

- `Username`: Định danh duy nhất.
- `Nickname`: Tên hiển thị.
- `Position`: Mô tả vị trí công việc.
- `Avatar`: Avatar nhân viên.
- `Bio`: Giới thiệu.
- `About me`: Prompt hệ thống.
- `Greeting message`: Lời chào phiên hội thoại.

![ai-employee-create-without-model-settings-tab.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-create-without-model-settings-tab.png)

## Thiết lập vai trò (Role setting)

Trong tab `Role setting` cấu hình Prompt hệ thống (System Prompt) của nhân viên. Nội dung này sẽ định nghĩa danh tính, mục tiêu, ranh giới công việc và phong cách đầu ra của nhân viên trong hội thoại.

Khuyến nghị bao gồm ít nhất:

- Định vị vai trò và phạm vi trách nhiệm.
- Nguyên tắc xử lý tác vụ và cấu trúc phản hồi.
- Mục cấm, ranh giới thông tin và phong cách ngữ điệu.

Có thể chèn biến theo nhu cầu (như người dùng hiện tại, vai trò hiện tại, ngôn ngữ hiện tại, thời gian), để Prompt tự động thích ứng với ngữ cảnh trong các phiên hội thoại khác nhau.

![ai-employee-role-setting-system-prompt.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-role-setting-system-prompt.png)

## Cấu hình Skills và kiến thức

Trong tab `Skills` cấu hình quyền Skills; nếu đã kích hoạt năng lực Knowledge Base, có thể tiếp tục cấu hình trong các tab liên quan đến Knowledge Base.

## Hoàn thành tạo

Nhấp `Submit` để hoàn thành việc tạo.
