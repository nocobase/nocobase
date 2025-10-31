# 加密

<PluginInfo commercial="true" name="field-encryption"></PluginInfo>

## 介绍

一些私密的业务数据，如客户手机号、邮箱地址、卡号等，可以进行加密，加密后，以密文的方式被存储至数据库中。

![20240802175127](https://static-docs.nocobase.com/20240802175127.png)

## 环境变量

:::warning
如果 `ENCRYPTION_FIELD_KEY` 丢失，将无法解密数据。
:::

如果需要使用加密功能，需要配置 `ENCRYPTION_FIELD_KEY` 环境变量，该环境变量为加密密钥，长度为 32 位，例如：

```bash
ENCRYPTION_FIELD_KEY='2%&glK;<UA}eMxJVc53-4G(rTi0vg@J]'
```

## 字段配置

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## 加密后对筛选的影响

加密后的字段仅支持：等于、不等于、存在、不存在。

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

## 示例

待补充
