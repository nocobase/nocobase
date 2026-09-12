---
title: "字段校验"
description: "字段校验规则：基于 Joi 的配置规则与校验规则，支持字符串、数字、日期等类型的最小/最大长度、必填等。"
keywords: "字段验证,字段校验,Joi,校验规则,配置规则,NocoBase"
---

# 字段校验
为了确保数据表的准确性、安全性和一致性，NocoBase 提供了字段校验功能。该功能主要分为两个部分：配置规则和校验规则。

## 配置规则
![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)

NocoBase 系统字段是集成了 [Joi](https://joi.dev/api/) 的规则，支持情况如下：

### 字符串类型
Joi 字符串类型对应的 NocoBase 字段类型包括：单行文本、多行文本、手机号、邮箱、URL、密码、UUID。
#### 通用规则
- 最小长度
- 最大长度
- 长度
- 正则表达式
- 必填

#### 邮箱
![20250819192011](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192011.png)
[查看更多选项](https://joi.dev/api/?v=17.13.3#stringemailoptions)

#### URL
![20250819192409](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192409.png)
[查看更多选项](https://joi.dev/api/?v=17.13.3#stringurioptions)

#### UUID
![20250819192731](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192731.png)
[查看更多选项](https://joi.dev/api/?v=17.13.3#stringguid---aliases-uuid)

### 数字类型
Joi 数字类型对应的 NocoBase 字段类型包括：整数、数字、百分比。
#### 通用规则
- 大于
- 小于
- 最大值
- 最小值
- 整数倍

#### 整数
除通用规则外，整数字段额外支持[整数验证](https://joi.dev/api/?v=17.13.3#numberinteger)和[不安全整数验证](https://joi.dev/api/?v=17.13.3#numberunsafeenabled)。
![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### 数字与百分比
除通用规则外，数字和百分比字段额外支持[精度验证](https://joi.dev/api/?v=17.13.3#numberinteger)。
![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### 日期类型
Joi 日期类型对应的 NocoBase 字段类型包括：日期（含时区）、日期（不含时区）、仅日期、Unix 时间戳。

支持的验证规则：
- 大于
- 小于
- 最大值
- 最小值
- 时间戳格式验证
- 必填

### 关系字段
关系字段仅支持必填验证。需要注意的是，关系字段的必填验证暂不支持在子表单或子表格场景下应用。
![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## 校验规则应用
配置字段规则后，在添加或修改数据时将触发相应的校验规则。
![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

当字段用于表单时，字段验证规则也会显示在字段的验证设置中。这些规则会出现在「服务端字段验证规则」下，并且在这里只读展示。如果需要修改这些规则，需要回到「数据源 / 数据表配置」中编辑字段。

你仍然可以在「客户端验证规则」下为当前表单字段添加额外规则。这些规则只影响当前字段组件。最终生效的验证规则会合并「服务端字段验证规则」和「客户端验证规则」。

校验规则同样适用于子表格和子表单组件：
![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

需要注意的是，在子表单或子表格场景中，关系字段的必填验证暂不生效。
![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## 服务端字段验证规则与客户端验证规则的区别
服务端字段验证规则和客户端验证规则配置在不同位置，作用范围也不同。

### 配置方式差异
- **服务端字段验证规则**：在「数据源 / 数据表配置」中设置字段规则。这些规则是字段的基础规则
- **客户端验证规则**：在表单字段的设置中添加额外规则。这些规则只影响当前字段组件
![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)


### 校验触发时机差异
- **服务端字段验证规则**：字段用于表单时会触发前端验证，数据写入前也会触发校验。工作流、数据导入等新增或修改数据的场景也会应用这些规则
- **客户端验证规则**：只在当前表单字段中触发前端验证
- **规则展示**：服务端字段验证规则会作为继承规则只读展示。客户端验证规则会单独展示，并且可以在这里编辑
- **错误信息**：客户端验证规则支持自定义错误信息，服务端字段验证规则暂不支持自定义错误信息
