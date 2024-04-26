# SMS Auth

提供短信登录认证功能。

## 依赖

- `@nocobase/auth` 认证插件，提供认证相关功能，表、模型、函数复用等。
- `@nocobase/plugin-verification` 验证码插件，提供短信发送功能。

## 使用方法

### 新增验证码Provider
插件设置 - Verification/验证码   
新增一个Provider, 并设置为默认方式。

<img src="https://s2.loli.net/2023/05/16/6VKDcqW41F8P9Gu.png" width="800px" />

### 新增SMS认证器
插件设置 - Authentication/认证   
新增，选择认证类型为SMS，新增一个Authenticator。

效果如图：   
<img src="https://s2.loli.net/2023/05/16/GVW5mHTvBhn8Zck.png" width="400px" />
