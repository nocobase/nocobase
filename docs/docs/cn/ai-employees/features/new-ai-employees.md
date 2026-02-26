# 新建 AI 员工

如果内置 AI 员工不能满足你的需求，可以创建并定制自己的 AI 员工。

## 开始新建

进入 `AI employees` 管理页，点击 `New AI employee`。

## 基本信息配置

在 `Profile` 标签页配置：

- `Username`：唯一标识。
- `Nickname`：显示名称。
- `Position`：岗位描述。
- `Avatar`：员工头像。
- `Bio`：简介。
- `About me`：系统提示词。
- `Greeting message`：会话欢迎语。

![ai-employee-create-without-model-settings-tab.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-create-without-model-settings-tab.png)

## 角色设定（Role setting）

在 `Role setting` 标签页中配置员工的系统提示词（System Prompt）。这段内容会定义员工在对话中的身份、目标、工作边界与输出风格。

建议至少包含：

- 角色定位与职责范围。
- 任务处理原则与回答结构。
- 禁止事项、信息边界与语气风格。

可按需插入变量（如当前用户、当前角色、当前语言、时间），让提示词在不同会话中自动适配上下文。

![ai-employee-role-setting-system-prompt.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-role-setting-system-prompt.png)

## 技能与知识配置

在 `Skills` 标签页配置技能权限；如果已启用知识库能力，可在知识库相关标签页继续配置。

## 完成创建

点击 `Submit` 完成创建。
