# 从企业微信同步用户数据

<PluginInfo commercial="true" name="wecom"></PluginInfo>

## 介绍

**企业微信**插件支持用户从企业微信同步用户和部门数据。

## 创建和配置企业微信自建应用。

首先需要在企业微信管理后台，创建企业微信自建应用，并获取**企业 ID**, **AgentId** 和 **Secret**.

参考 [用户认证 - 企业微信](./auth)。

## 在 NocoBase 上添加同步数据源

用户和权限 - 同步 - 添加，填写获取的相关信息。

![](https://static-docs.nocobase.com/202412041251867.png)

## 配置通讯录同步

进入企业微信管理后台 - 安全和管理 - 管理工具，点击通讯录同步。

![](https://static-docs.nocobase.com/202412041249958.png)

按如图所示设置，并设置企业可信 IP.

![](https://static-docs.nocobase.com/202412041250776.png)

接下来就可以进行用户数据同步了。

## 设置接收事件服务器

如果希望企业微信侧的用户、部门数据变动可以及时同步给 NocoBase 应用，可以进一步设置。

在填写了前面的配置信息之后，可以复制通讯录回调通知地址。

![](https://static-docs.nocobase.com/202412041256547.png)

填写到企业微信设置上，并获取 Token 和 EncodingAESKey, 完成 NocoBase 用户同步数据源配置。

![](https://static-docs.nocobase.com/202412041257947.png)
