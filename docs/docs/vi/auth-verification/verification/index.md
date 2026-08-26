---
pkg: '@nocobase/plugin-verification'
title: "Quản lý kiểm tra"
description: "Trung tâm quản lý kiểm tra NocoBase: SMS code, TOTP authenticator, hỗ trợ đăng nhập SMS, 2FA, kiểm tra hai bước cho thao tác có rủi ro, có thể mở rộng loại và kịch bản kiểm tra."
keywords: "quản lý kiểm tra,SMS code,TOTP,2FA,kiểm tra danh tính,kiểm tra hai bước,NocoBase"
---

# Kiểm tra

:::info{title=Mẹo}
Từ `1.6.0-alpha.30`, tính năng **Mã xác minh** ban đầu được nâng cấp thành **Quản lý kiểm tra**, hỗ trợ quản lý và tích hợp các phương thức kiểm tra danh tính người dùng khác nhau. Sau khi người dùng gắn phương thức kiểm tra tương ứng, có thể kiểm tra danh tính trong các kịch bản cần thiết. Tính năng này dự kiến hỗ trợ ổn định từ `1.7.0`.
:::

<PluginInfo name="verification"></PluginInfo>

## Giới thiệu

**Trung tâm quản lý kiểm tra hỗ trợ quản lý và tích hợp các phương thức kiểm tra danh tính người dùng khác nhau.** Ví dụ:

- SMS code - được plugin verification cung cấp mặc định. Tham khảo: [Kiểm tra: SMS](./sms)
- TOTP Authenticator - tham khảo: [Kiểm tra: TOTP Authenticator](../verification-totp/index.md)

Bạn cũng có thể mở rộng các loại kiểm tra khác dưới dạng plugin. Tham khảo: [Mở rộng loại kiểm tra](./dev/type)

**Sau khi người dùng gắn phương thức kiểm tra tương ứng, có thể kiểm tra danh tính trong các kịch bản cần thiết.** Ví dụ:

- Đăng nhập bằng SMS code - tham khảo: [Xác thực: SMS](./sms)
- Xác thực hai yếu tố (2FA) - tham khảo: [Xác thực hai yếu tố (2FA)](../2fa)
- Kiểm tra hai bước cho thao tác có rủi ro - sẽ hỗ trợ trong tương lai

Bạn cũng có thể tích hợp kiểm tra danh tính vào các kịch bản cần thiết khác dưới dạng plugin mở rộng. Tham khảo: [Mở rộng kịch bản kiểm tra](./dev/scene)

**Sự khác biệt và mối liên hệ giữa module kiểm tra và module xác thực người dùng:** Module xác thực người dùng chủ yếu chịu trách nhiệm về xác thực danh tính trong kịch bản đăng nhập, trong đó các luồng như đăng nhập SMS, xác thực hai yếu tố phụ thuộc vào verifier do module kiểm tra cung cấp; module kiểm tra chịu trách nhiệm về kiểm tra danh tính trong các thao tác có rủi ro khác nhau, đăng nhập là một trong những kịch bản thao tác có rủi ro.

![](https://static-docs.nocobase.com/202502262315404.png)

![](https://static-docs.nocobase.com/202502262315966.png)
