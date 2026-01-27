# 多模态对话

<PluginInfo name="ai-ee" licenseBundled="true"></PluginInfo>

## 图片

在模型支持的前提下，LLM 节点可以向模型发送图片。使用的时候需要通过变量选择附件字段，或关联文件表记录。选择文件表记录的时候可以选到只记录对象层级，也可以选择到 URL 字段。

![](https://static-docs.nocobase.com/202503041034858.png)

图片的发送格式有两个选项供选择：

- 通过 URL 发送 - 除了本地存储的图片，都会以 URL 的形式进行发送，本地存储的图片会转换成 base64 格式发送。
- 通过 base64 发送 - 不管是本地存储还是云存储的图片，都以 base64 的格式发送。适用于图片 URL 无法被在线 LLM 服务直接访问的情况。

![](https://static-docs.nocobase.com/202503041200638.png)
