# 使用技能

技能（Tools）定义了 AI 员工“能做什么”。

## 技能结构

技能页分为三类：

1. `General skills`：所有 AI 员工共享，只读。
2. `Employee-specific skills`：当前员工专属，通常只读。
3. `Custom skills`：自定义技能，可增删并配置默认权限。

![skills-three-sections-general-specific-custom.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/skills-three-sections-general-specific-custom.png)

## 技能权限

技能权限统一为：

- `Ask`：调用前询问确认。
- `Allow`：允许直接调用。

建议：涉及修改数据的技能默认使用 `Ask`。

![skills-permission-ask-allow-segmented.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/skills-permission-ask-allow-segmented.png)

## 添加与维护

在 `Custom skills` 中点击 `Add skill` 添加技能，并按业务风险配置权限。
