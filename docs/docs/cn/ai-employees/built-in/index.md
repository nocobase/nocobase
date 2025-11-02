# 内置 AI 员工

## 介绍

NocoBase 中内置了以下 AI 员工，他们已经具备了完整的技能、工具、知识库，你只需要为他们配置好 LLM 即可开始投入工作。

- `Orin`: Data modeling expert
- `Avery`: Form filler
- `Viz`: Insights analyst
- `Lexi`: Translator
- `Nathan`: Frontend code engineer
- `Cole`: NocoBase assistant
- `Vera`: Research analyst
- `Dex`: Data organizer
- `Ellis`: Email expert

## 如何启用

进入 AI 员工插件配置页面，点击 `AI employees` 标签页，进入 AI 员工管理页。

可以看到系统已经内置多个 AI 员工了，但是都不是启用状态，在应用页面里还无法和这些AI员工协作。

![20251022121248](https://static-docs.nocobase.com/20251022121248.png)

选择要启用的内置 AI 员工，点击 `Edit` 按钮，进入 AI 员工编辑页面。

首先我们在`Profile` 标签页中，打开`Enable`开关。

![20251022121546](https://static-docs.nocobase.com/20251022121546.png)

然后在`Model settings`标签页中，为内置 AI 员工设置模型：

- 选择我们在 LLM 服务管理中创建的 LLM 服务；
- 输入我们要使用的大模型的名称

![20251022121729](https://static-docs.nocobase.com/20251022121729.png)

### 完成启用

为内置 AI 员工设置模型后，点击 `Submit` 按钮保存修改。

然后我们可以在页面右下角的 AI 员工快捷唤起按钮中可以看到这个内置 AI 员工。

![20251022121951](https://static-docs.nocobase.com/20251022121951.png)

### 注意

部分内置 AI 员工启用后也不会出现在右下角的 AI 员工列表中，比如 Orin 只会在主数据配置页面出现；Nathan 只会在 JS 编辑器上出现。
