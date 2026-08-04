---
title: "Building with an AI Agent"
description: "Drive an AI Agent to write AI Portal frontend pages in natural language, including how to write prompts, collaboration tips, and how to handle common problems."
keywords: "AI Portal,AI Agent,collaborative building,prompts,nocobase-portal-manage,Skills"
---

# Building with an AI Agent

:::tip Prerequisites

Before reading this page, make sure you have your first Portal running by following the [AI Portal Quick Start](./index.md).

:::

Day-to-day AI Portal development is a conversation with an AI Agent — you describe the page you want, it writes the code, you check the result in the browser.

## Work inside the Portal directory

Before you start, go into the Portal's source directory and open your AI Agent there. That way the Agent starts out in the right context, with access to `AGENTS.md` and the existing code.

First find out where the directory is:

```bash
nb portal info main
```

The dev path in the output is where the Portal source lives. `cd` there, then open your AI Agent:

```bash
cd <dev workspace directory>
```

After that, just describe what you need:

```
Add an order list page to the main portal of my nocobase app
```

## Have the AI read before it writes

There's an `AGENTS.md` at the root of the template describing this project's conventions: prefer reusing what's already in `src/extensions`, customize UI components through composition rather than editing the base components, and don't bring in Ant Design. AI Agents that read this file follow these conventions automatically.

You can also add your own project's conventions to `AGENTS.md` — naming habits, business terminology, directories to leave alone. Once they're in there they apply to every conversation, so you don't have to repeat yourself.

`src/extensions` contains a few built-in extensions. Among them, `nocobase-users-example` is a complete CRUD page with list, create, edit, and detail views. Pointing the AI at it beats describing a new page from scratch:

```
Build a product management page following the pattern in nocobase-users-example
```

## Prompt examples

### Scenario A: Create a new business page

Three things are enough — what's on the page, where the data comes from, and how it behaves:

```
Add a customer management page:
the table shows name, phone, email, and creation time, with search by name,
clicking a row opens a detail drawer where the record can be edited and saved
```

<!-- 需要一张 AI 生成的客户管理页面效果截图，展示表格、搜索框和详情抽屉 -->

### Scenario B: Modify an existing page

For a change request, be specific about what changes. No need to describe the whole page again:

```
Add a status filter to the customer list,
with the options "Following up", "Won", and "Lost", unfiltered by default
```

<!-- 需要一张添加状态筛选后的页面截图 -->

### Scenario C: Wire up a new collection

Once a collection exists, have the AI generate the matching pages. It reads the field definitions and picks form controls and list columns accordingly:

```
I just created a contracts collection, build me a matching set of CRUD pages
```

If the collection doesn't exist yet, use [Data Modeling](../data-modeling.md) to have the AI design the data structure first, then come back to the pages.

<!-- 需要一张根据数据表自动生成的增删改查页面截图 -->

### Scenario D: Reproduce a design

When you have a design file or an existing HTML prototype, hand it to the AI:

```
Build the home page from this prototype,
keep the colors and layout the same, and connect the data to the orders collection
```

<!-- 需要一个视频，展示给出原型图后 AI 复刻出页面的过程 -->

### Scenario E: Add an authentication method

Once an authentication method is enabled on the server, the login page needs matching frontend support:

```
DingTalk login is enabled in NocoBase, add a DingTalk login button to the login page
```

<!-- 需要一张登录页出现第三方登录按钮的截图 -->

## Collaboration tips

**Iterate in small steps.** Have the AI do one page or one change at a time, and check the result before moving on. If you describe five pages in one go, it's hard to tell which step went off the rails when something breaks.

**Leave the dev server running.** `nb portal dev main` hot-reloads, so you see the result right after each change the AI makes. That's the shortest feedback loop you can get.

**Give it the exact error.** A blank page, a failed build, a 403 from an API — paste the full error message and a screenshot to the AI instead of making it guess. A few rounds usually sort it out. You don't need to work out which layer the problem is in first.

![error](https://static-docs.nocobase.com/20260803204308.png)

## Common questions

**How do I roll back when the AI gets it wrong?**

If the Portal source is under Git, `git checkout` is all you need. With the default `nocobase` source storage, you can pull a fresh copy from source storage over the local one:

```bash
nb portal pull main --force
```

`--force` deletes the dev workspace and pulls again, so make sure there's nothing you want to keep before running it. To avoid that trade-off, move the source to Git early on — see [Deployment and Source Management](./deploy.md).

**How do I troubleshoot a failed build?**

Run a build locally first to see the full error:

```bash
nb portal deploy main
```

TypeScript type errors and missing dependencies are the two most common causes. Paste the error to the AI and let it fix them.

**Do my manual edits conflict with the AI's?**

No. The Portal source is an ordinary frontend project — you can edit it yourself whenever you want, and let the AI pick up from there. As long as you're not both editing the same file at the same moment, there's no problem.

## Related Links

- [AI Portal Quick Start](./index.md) — Get your first AI-written frontend entry running
- [Deployment and Source Management](./deploy.md) — Putting Portal source under Git, and the deployment flow
- [Project Structure and Tech Stack](./project-structure.md) — The template's directory conventions, so you can tell whether the AI got it right
- [Standard Components and Extensions](./components.md) — The shadcn/ui component base and the extension mechanism
- [Data Modeling](../data-modeling.md) — Have the AI design the collections before building pages
- [`nb portal info`](../../api/cli/portal/info.md) — Check where a Portal's dev workspace is
- [`nb portal pull`](../../api/cli/portal/pull.md) — Pull the source again from source storage
