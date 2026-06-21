---
title: "模板打印 - 媒体字段格式化"
description: "模板打印媒体字段格式化器：attachment 和 signature 用于在模板中输出附件图片与手写签名图片。"
keywords: "模板打印,媒体字段,attachment,signature,NocoBase"
---

### 媒体字段格式化

#### 1. :attachment

##### 语法说明

输出附件字段中的图片。通常可直接从“字段列表”复制变量。

##### 示例

```text
{d.contractFiles[0].id:attachment()}
```

##### 结果

输出对应的附件图片。

#### 2. :signature

##### 语法说明

输出手写签名字段关联的签名图片。通常可直接从“字段列表”复制变量。

##### 示例

```text
{d.customerSignature:signature()}
```

##### 结果

输出对应的手写签名图片。

> **注意：** 对于附件字段和手写签名字段，建议直接从“模板配置”中的字段列表复制变量，避免手动拼写出错。
