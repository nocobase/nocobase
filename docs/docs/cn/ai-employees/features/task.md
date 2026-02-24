# 快捷任务

为了更高效地让 AI 员工开始工作，我们可以在场景区块上绑定 AI 员工，并预先设定几个常用的任务。

这样用户可以一键快速开始任务处理，不必每次都要 **选择区块** 和 **输入指令**。

## 区块绑定 AI 员工

页面进入 UI 编辑模式后，支持设置 `Actions` 的区块上，选择 `Actions` 下的 `AI employees` 菜单，然后选择一个 AI 员工，这个 AI 员工就会和当前区块绑定。

![20251022135306](https://static-docs.nocobase.com/20251022135306.png)

完成绑定后，每次进入页面，区块 Actions 区域展示与当前区块绑定的 AI 员工。

![20251022135438](https://static-docs.nocobase.com/20251022135438.png)

## 设置任务

页面进入 UI 编辑模式后，鼠标悬停在与区块绑定的 AI 员工图标上，浮现一个菜单按钮，选择 `Edit tasks`，进入任务设置页面。

进入了任务设置页面，可以给当前 AI 员工添加多个任务。

每个标签页都代表一个独立的任务，点击旁边“+”号添加新的任务。

![clipboard-image-1771913187](https://static-docs.nocobase.com/clipboard-image-1771913187.png)

任务设置表单：

- 在 `Title` 输入框中输入任务标题，简短表述任务内容，这个标题将会出现在 AI 员工的任务列表中。
- 在 `Background` 输入框中输入任务的主要内容，这个内容将会作为与 AI 员工对话时使用的系统提示词。
- 在 `Default user message` 输入框中输入默认发送的用户消息，选中任务后会自动填充到用户输入框中。
- 在 `Work context` 中选择默认发送给 AI 员工的应用上下文信息，这部分操作和在对话框中的操作一样。
- 在 `Skills` 选择框中展示的是当前 AI 员工是否具备的技能，可以取消某个技能，让 AI 员工执行该任务时忽略不使用该技能。
- `Send default user message automatically` 勾选框配置是否点击执行任务后自动发送默认用户消息。


## 任务列表

为 AI 员工设置好任务后，这些任务会显示在 AI 员工的简介浮窗和会话开始前的打招呼消息中，点击即可执行任务。

![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)
