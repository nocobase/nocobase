# Use Skills

Skills (Tools) define what an AI Employee can do.

## Skill Structure

The Skills page is split into three sections:

1. `General skills`: shared by all AI Employees, read-only.
2. `Employee-specific skills`: specific to the current employee, usually read-only.
3. `Custom skills`: custom skills that can be added/removed and configured with default permissions.

![skills-three-sections-general-specific-custom.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/skills-three-sections-general-specific-custom.png)

## Permission Model

Permissions are unified as:

- `Ask`: ask for confirmation before calling.
- `Allow`: allow direct calling.

Recommendation: use `Ask` by default for data-modifying skills.

![skills-permission-ask-allow-segmented.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/skills-permission-ask-allow-segmented.png)

## Add and Maintain

Use `Add skill` in `Custom skills` to add skills and configure permissions based on risk.
