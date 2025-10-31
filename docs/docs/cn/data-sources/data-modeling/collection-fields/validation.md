# 字段验证
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

校验规则同样适用于子表格和子表单组件：
![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

需要注意的是，在子表单或子表格场景中，关系字段的必填验证暂不生效。
![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## 与客户端字段验证的区别
与服务端字段验证适用于不同的应用场景，两者在实现方式和规则触发时机上存在显著差异，因此需要分别进行管理。

### 配置方式差异
- **客户端验证**：在编辑表单中配置规则（如下图所示）
- **服务端字段验证**：在数据源 → 数据表配置中设置字段规则
![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)


### 校验触发时机差异
- **客户端验证**：在用户填写字段时实时触发验证，并立即显示错误信息
- **服务端字段验证**：在数据提交后，由服务端在数据入库前进行校验，错误信息通过 API 响应返回
- **应用范围**：服务端字段验证除了在表单提交时生效外，还会在工作流、数据导入等所有涉及数据新增或修改的场景中触发
- **错误信息**：客户端验证支持自定义错误信息，服务端验证暂不支持自定义错误信息