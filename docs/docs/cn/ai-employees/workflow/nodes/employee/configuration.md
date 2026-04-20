# AI 员工节点

## 介绍

AI 员工节点用于在工作流中指派 AI 员工去完成指定任务然后输出结构化信息。

创建工作流后，可以在添加工作流节点时选择 AI 员工节点。

![20260420142250](https://static-docs.nocobase.com/20260420142250.png)

## 节点配置
### 准备工作

配置 AI 员工节点之前，需要先了解如何搭建工作流、如何配置 LLM 服务，以及内置 AI 员工的作用和如何创建 AI 员工。

可以查看下列文档：
  - [工作流](/workflow)
  - [配置 LLM 服务](/ai-employees/features/llm-service)
  - [内置 AI 员工](/ai-employees/features/built-in-employee)
  - [新建 AI 员工](/ai-employees/features/new-ai-employees)

### 任务
#### 选择 AI 员工

选择一个 AI 员工负责处理这个节点的任务。从下拉列表选择一个在系统内已启用的内置 AI 员工或自己创建的 AI 员工。

![20260420143554](https://static-docs.nocobase.com/20260420143554.png)

#### 选择模型

选择驱动 AI 员工的大语言模型。从下拉列表选择一个由系统内已配置的 LLM 服务提供的模型。

![20260420145057](https://static-docs.nocobase.com/20260420145057.png)

#### 选择操作人

选择一个系统内的用户为 AI 员工提供数据访问权限，AI 员工查询数据时将限制在该用户的权限范围中。

如果触发器提供了操作人（如 `Custom action event`），则优先使用该操作人的权限。

![20260420145244](https://static-docs.nocobase.com/20260420145244.png)

#### 提示词与任务描述

`Background` 会作为发送给 AI 的系统提示词，通常用来描述任务背景信息和约束条件。

`Default user message` 是发送给 AI 的用户提示词，通常描述任务内容，告诉 AI 要做什么。

![20260420174515](https://static-docs.nocobase.com/20260420174515.png)

#### 附件

`Attachments` 会连同 `Default user message` 一并发送给 AI。通常是任务需要处理的文档或图片。

附件支持两种类型：

1. `File(load via Files collection)` 使用主键从指定文件表获取数据作为发送给 AI 的附件使用。

![20260420150933](https://static-docs.nocobase.com/20260420150933.png)

2. `File via URL` 从指定 URL 获取文件并作为发送给 AI 的附件使用。

![20260420151702](https://static-docs.nocobase.com/20260420151702.png)

#### 技能与工具

通常一个 AI 员工会绑定多个技能和工具，这里可以限制在当前任务中只使用某几个技能或工具。

![20260420151902](https://static-docs.nocobase.com/20260420151902.png)

#### 联网搜索

`Web search` 开关控制当前节点的 AI 是否使用联网搜索能力，关于 AI 员工的联网搜索查看：[联网搜索](/ai-employees/features/web-search)

![20260420152058](https://static-docs.nocobase.com/20260420152058.png)

### 反馈与通知
#### 结构化输出

用户可以按照 [JSON Schema](https://json-schema.org/) 规范来定义 AI 员工节点最终输出的数据结构。

![20260420162603](https://static-docs.nocobase.com/20260420162603.png)

工作流中其他节点获取 AI 员工节点数据也会按照这个 `JSON Schema` 生成选项。

![20260420201141](https://static-docs.nocobase.com/20260420201141.png)

##### 默认值

默认提供了下面这个 `JSON Schema` 定义，它定义了一个对象，对象包含一个名为result且类型为字符串的属性。并且给属性设置了一个标题：Result。

```json
{
  "type": "object",
  "properties": {
    "result": {
      "title": "Result",
      "type": "string",
      "description": "The text message sent to the user"
    }
  }
}
```

根据这个定义，AI 员工节点会输出符合定义的 JSON 结构数据。

```json
{
  result: "Some text generated from LLM "
}
```

#### 审批设置

节点支持三种审批模式

- `No required` AI 输出内容不需要人工审核。AI 结束输出后，工作流自动继续流转。
- `Human decision` AI 输出内容必须通知审核人进行人工审核，人工审核后工作流才继续流转。
- `AI decision` 由 AI 决定是否通知审核人对输出内容进行人工审核。

![20260420162755](https://static-docs.nocobase.com/20260420162755.png)

如果审批模式不是 `No required`，则必须为节点配置一个或多个审核人。

当 AI 员工节点中的 AI 输出完所有内容后，会给该节点配置的所有审核人发送通知。只需要被通知的审核人中的一人完成审批操作，工作流即可继续流转。

![20260420163807](https://static-docs.nocobase.com/20260420163807.png)
