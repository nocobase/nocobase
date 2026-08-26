---
title: "Ví dụ cấu hình SAML: Google Workspace"
description: "Cấu hình Google Workspace làm SAML IdP: cài đặt Web app và Mobile app, copy SSO URL và certificate, thêm authenticator SAML trên NocoBase, ánh xạ thuộc tính."
keywords: "SAML,Google Workspace,cấu hình IdP,SSO,ánh xạ thuộc tính,certificate,NocoBase"
---

# Google Workspace

## Cài đặt Google làm IdP

[Google Admin Console](https://admin.google.com/) - Apps - Web and mobile apps

![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)

Sau khi cấu hình ứng dụng, copy **SSO URL**, **Entity ID** và **Certificate**.

![](https://static-docs.nocobase.com/aafd20a794730e85411c0c8f368637e0.png)

## Thêm authenticator trên NocoBase

Cài đặt plugin - Xác thực người dùng - Thêm - SAML

![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)

Điền các thông tin vừa copy vào tương ứng

- SSO URL: SSO URL
- Public Certificate: Certificate
- IdP Issuer: Entity ID
- http: Nếu test cục bộ qua http, tick chọn

Sau đó copy SP Issuer/EntityID và ACS URL trong phần Usage.

## Điền thông tin SP trên Google

Quay lại Google Console, trên trang **Service provider details**, nhập ACS URL và Entity ID vừa copy, và tick chọn **Signed response**.

![](https://static-docs.nocobase.com/1536268bf8df4a5ebc72384317172191.png)

![](https://static-docs.nocobase.com/c7de1f8b84c1335de110e5a7c96255c4.png)

Trong phần **Attribute mapping**, thêm ánh xạ để map các thuộc tính tương ứng.

![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)
