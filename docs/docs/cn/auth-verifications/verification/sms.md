# 验证：短信

<PluginInfo name="verification"></PluginInfo>

## 介绍

短信验证码是内置的验证类型，用于生成一次性动态密码 (OTP) 并通过短信发送给用户。

## 添加短信验证器

进入验证管理页面。

![](https://static-docs.nocobase.com/202502271726791.png)

添加 - SMS OTP

![](https://static-docs.nocobase.com/202502271726056.png)

## 管理员配置

![](https://static-docs.nocobase.com/202502271727711.png)

目前支持的短信服务商有：

- <a href="https://www.aliyun.com/product/sms" target="_blank">阿里云短信</a>
- <a href="https://cloud.tencent.com/product/sms" target="_blank">腾讯云短信</a>

在服务商管理后台配置短信模板时，需要给短信验证码预留参数。

- 阿里云配置示例：`您的验证码为：${code}`

- 腾讯云配置示例：`您的验证码为：{1}`

开发者也可以以插件形式扩展其他的短信服务商。参考：[扩展短信服务商](../../../handbook/verification/sms/dev)

## 用户绑定

添加验证器后，用户可以在个人的验证管理中绑定验证手机号。

![](https://static-docs.nocobase.com/202502271737016.png)

![](https://static-docs.nocobase.com/202502271737769.png)

![](https://static-docs.nocobase.com/202502271738515.png)

绑定成功后，即可在绑定了该验证器的验证场景中进行身份验证。

![](https://static-docs.nocobase.com/202502271739607.png)

## 用户解绑

解绑手机号需要通过已绑定的验证方式，进行验证。

![](https://static-docs.nocobase.com/202502282103205.png)
