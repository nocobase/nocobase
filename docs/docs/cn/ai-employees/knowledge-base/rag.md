---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "RAG 检索增强生成"
description: "在 AI 员工设置中启用 RAG，配置 Knowledge Base、Retrieval strategy、Top K 和 Score，并按用户角色控制知识库访问权限。"
keywords: "RAG,检索增强,知识库检索,Retrieval strategy,知识库权限,Top K,NocoBase"
---

# RAG 检索

## 介绍

在 NocoBase 中，**RAG（检索增强生成）** 可以让 AI 员工先从知识库获取相关内容，再结合这些内容回答问题。

AI 员工实际可以使用哪些知识库，由 AI 员工的「Knowledge Base」配置和当前用户所属角色的知识库权限共同决定。只有同时处于这两个范围内的知识库，才会参与检索。

## 配置 AI 员工的知识库

进入「AI employees」配置页，选择要启用 RAG 的 AI 员工，点击「Edit」。在编辑抽屉中切换到「Knowledge Base」标签页，然后打开「Enable」开关。

![](https://static-docs.nocobase.com/ai-employee-knowledge-base-settings-202608171620.png)

其中：

- 「Knowledge Base」— 可选。留空时，会从当前用户角色有权访问的所有已启用知识库中检索；选择知识库后，只会从选中且有权访问的知识库中检索
- 「Retrieval strategy」— 设置什么时候检索知识库，其中：
  - 「Retrieve on demand」— AI 员工判断当前问题需要知识库内容时才执行检索。新建 AI 员工默认使用该策略，通常来说也推荐使用该策略
  - 「Automatically retrieve for every question」— 在每个用户问题发送给 AI 员工前执行检索，适合每轮对话都依赖知识库内容的场景
- 「Knowledge Base Prompt」— 设置如何把检索内容提供给 AI 员工。`{knowledgeBaseData}` 是固定占位符，不要删除或修改
- 「Top K」— 每次检索最多返回的知识库内容数量，可设置为 1–100，默认为 3
- 「Score」— 检索结果需要达到的最低相似度，可设置为 0–1，默认为 0.6。数值越高，进入结果的内容越相关，返回数量也可能越少

配置完成后，点击「Submit」保存。

## 配置知识库权限

AI 员工选择了知识库，不代表所有用户都能访问这些知识库。还需要进入「Users & Permissions / Roles & Permissions」，选择用户所属的角色，然后打开「Permissions / Knowledge bases」。

在知识库列表中勾选「Available」，为该角色授予对应知识库的访问权限。如果希望以后新建的知识库自动对该角色开放，可以勾选「New knowledge bases are allowed by default」。

![](https://static-docs.nocobase.com/knowledge-base-role-permissions-202608171620.png)

:::warning 注意

AI 员工检索的知识库范围，是「Knowledge Base」配置与当前用户角色权限的交集。未授权的知识库会被自动排除。

:::

## 没有知识库权限时

如果 AI 员工已经启用知识库，但配置范围与当前用户角色权限没有任何交集，AI 员工会先使用不依赖知识库的信息回答问题，然后在回答末尾醒目提示：本次回答没有使用知识库内容，因为当前用户没有知识库访问权限；如需使用，请联系管理员申请权限。

![](https://static-docs.nocobase.com/ai-employee-no-knowledge-base-access-side-panel-202608171653.png)

如果当前用户存在可访问的知识库，只是当前问题没有检索到相关内容，则不会显示无权限提示。

## 相关链接

- [知识库](./knowledge-base/index.md) — 创建和维护用于 RAG 检索的知识库
- [角色与权限](../../users-permissions/acl/permissions.md) — 配置角色的系统、菜单和数据访问权限
