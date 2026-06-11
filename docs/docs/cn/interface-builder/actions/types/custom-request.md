# 自定义请求

## 介绍

在流程中需要调用外部接口或第三方服务时，可以通过 Custom request 触发一个自定义 HTTP 请求。常见使用场景包括：

* 调用外部系统 API（如 CRM、AI 服务等）
* 获取远程数据并在后续流程步骤中进行处理
* 向第三方系统推送数据（Webhook、消息通知等）
* 触发内部或外部服务的自动化流程

![](https://static-docs.nocobase.com/Custom-request-03-27-2026_06_07_PM.png)


## 操作配置

![](https://static-docs.nocobase.com/Custom-request-03-27-2026_06_09_PM.png)

在 按钮设置 -> 自定义请求 中，可以配置以下内容：

* HTTP method：HTTP 请求方法，例如 GET、POST、PUT、DELETE 等。
* URL：请求的目标地址，可以填写完整的接口 URL，也可以通过变量动态拼接。
* Headers：请求头信息，用于传递认证信息或接口配置，例如 Authorization、Content-Type 等。
* Parameters：URL 查询参数（Query Parameters），通常用于 GET 请求。
* Body：请求体内容，通常用于 POST、PUT 等请求，可以填写 JSON、表单数据等。
* Timeout config：请求超时时间配置，用于限制请求等待的最大时长，避免流程被长时间阻塞。
* Response type：请求响应的数据类型。
* JSON：接口返回 JSON 数据，返回结果会注入到流程上下文中，可在后续步骤通过 ctx.steps 获取。
* Stream：接口返回数据流（Stream），请求成功后会自动触发文件下载。
* Access control：访问控制，用于限制哪些角色可以触发该请求步骤，确保接口调用的安全性。

## 其它操作配置项

除了请求设置之外，自定义请求按钮还支持这些常见配置：

- [编辑按钮](/interface-builder/actions/action-settings/edit-button)：配置按钮标题、样式、图标等；
- [操作联动规则](/interface-builder/actions/action-settings/linkage-rule)：根据条件动态控制按钮显隐、禁用等状态；
- [二次确认](/interface-builder/actions/action-settings/double-check)：点击后先弹出确认框，再真正发送请求；

