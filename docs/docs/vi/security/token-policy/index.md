---
pkg: '@nocobase/plugin-auth'
title: "Chính sách bảo mật Token"
description: "Chính sách bảo mật Token: cấu hình thời hạn session, chu kỳ hiệu lực Token, thời hạn refresh Token đã hết hạn, xác thực JWT, cơ chế tự động refresh, điểm vào cài đặt plugin - Bảo mật."
keywords: "Chính sách bảo mật Token,thời hạn session,thời hạn Token,JWT,tự động refresh,cấu hình bảo mật,NocoBase"
---

# Chính sách bảo mật Token

## Giới thiệu

Chính sách bảo mật Token là một cấu hình tính năng dùng để bảo vệ bảo mật hệ thống và trải nghiệm. Bao gồm ba mục cấu hình chính: "Thời hạn session", "Chu kỳ hiệu lực Token" và "Thời hạn refresh Token đã hết hạn".

## Điểm vào cấu hình

Điểm vào cấu hình ở Cài đặt plugin - Bảo mật - Chính sách Token:

![20250105111821-2025-01-05-11-18-24](https://static-docs.nocobase.com/20250105111821-2025-01-05-11-18-24.png)

## Thời hạn session

**Định nghĩa:**

Thời hạn session là thời gian tối đa hệ thống cho phép người dùng giữ session hoạt động sau khi đăng nhập.

**Tác dụng:**

Sau khi vượt quá thời hạn session, khi người dùng truy cập lại hệ thống sẽ nhận được lỗi 401, sau đó hệ thống sẽ chuyển hướng người dùng đến trang đăng nhập để xác thực lại.
Ví dụ:
Nếu thời hạn session được đặt là 8 giờ, người dùng từ khi đăng nhập bắt đầu tính, trong trường hợp không có tương tác bổ sung, session sẽ hết hiệu lực sau 8 giờ.

**Khuyến nghị cài đặt:**

- Tình huống thao tác ngắn hạn: Khuyến nghị 1-2 giờ để tăng cường bảo mật.
- Tình huống làm việc dài hạn: Có thể đặt thành 8 giờ để phù hợp với nhu cầu nghiệp vụ.

## Thời hạn Token

**Định nghĩa:**

Thời hạn Token là vòng đời của mỗi Token được hệ thống cấp phát trong session hoạt động của người dùng.

**Tác dụng:**

Khi Token hết hạn, hệ thống sẽ tự động cấp phát Token mới để duy trì session hoạt động.
Mỗi Token đã hết hạn chỉ cho phép refresh một lần.

**Khuyến nghị cài đặt:**

Vì lý do bảo mật, khuyến nghị đặt từ 15 đến 30 phút.
Có thể điều chỉnh theo nhu cầu tình huống. Ví dụ:
Tình huống bảo mật cao: Thời hạn Token có thể rút ngắn xuống 10 phút hoặc thấp hơn.
Tình huống rủi ro thấp: Thời hạn Token có thể kéo dài thích hợp lên 1 giờ.

## Thời hạn refresh Token đã hết hạn

**Định nghĩa:**

Thời hạn refresh Token đã hết hạn là khoảng thời gian tối đa cho phép người dùng lấy Token mới thông qua thao tác refresh sau khi Token hết hạn.

**Đặc điểm:**

Nếu vượt quá thời hạn refresh, người dùng phải đăng nhập lại để lấy Token mới.
Thao tác refresh sẽ không kéo dài thời hạn session, chỉ tạo lại Token.

**Khuyến nghị cài đặt:**

Vì lý do bảo mật, khuyến nghị đặt từ 5 đến 10 phút.
