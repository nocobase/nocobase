---
title: "Component Development"
description: "NocoBase client component development: build plugin page components with React/Antd, observable state management, and access NocoBase context via useFlowContext()."
keywords: "Component,Component Development,React,Antd,observable,observer,useFlowContext,ctx,NocoBase"
---

# Component Development

In NocoBase, page components mounted on routes are ordinary React components. You can write them directly with React + [Antd](https://5x.ant.design/) — no different from regular frontend development.

NocoBase additionally provides:

- **`observable` + `observer`** — The recommended state management approach, better suited for the NocoBase ecosystem than `useState`
- **`useFlowContext()`** — Access NocoBase context capabilities (making requests, internationalization, route navigation, etc.)

## Basic Usage

A minimal page component:

```tsx
// pages/HelloPage.tsx
export default function HelloPage() {
  return <h1>Hello, NocoBase!</h1>;
}
```

After writing the component, register it in the plugin's `load()` with `this.router.add()`. See [Router](../router) for details.

## State Management: observable

NocoBase recommends using `observable` + `observer` to manage component state instead of React's `useState`. The benefits are:

- Directly modifying object properties triggers updates — no need for `setState`
- Automatic dependency tracking — components only re-render when the properties they use change
- Consistent with NocoBase's underlying reactive mechanism (FlowModel, FlowContext, etc.)

Basic usage: create a reactive object with `observable.deep()` and wrap the component with `observer()`. Both `observable` and `observer` are imported from `@nocobase/flow-engine`:

```tsx
import React from 'react';
import { Input } from 'antd';
import { observable, observer } from '@nocobase/flow-engine';

// Create a reactive state object
const state = observable.deep({
  text: '',
});

// Wrap the component with observer so it auto-updates when state changes
const DemoPage = observer(() => {
  return (
    <div>
      <Input
        placeholder="Type something..."
        value={state.text}
        onChange={(e) => {
          state.text = e.target.value;
        }}
      />
      {state.text && <div style={{ marginTop: 8 }}>You typed: {state.text}</div>}
    </div>
  );
});

export default DemoPage;
```

Live preview:

```tsx file="./_demos/observable-basic.tsx" preview
```

For more usage, see [Observable Reactive Mechanism](../../../flow-engine/observable).

## Using useFlowContext

`useFlowContext()` is the entry point for accessing NocoBase capabilities. Import it from `@nocobase/flow-engine` — it returns a `ctx` object:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();
  // ctx.api — make requests
  // ctx.t — internationalization
  // ctx.router — route navigation
  // ctx.logger — logging
  // ...
}
```

Below are examples of commonly used capabilities.

### Making Requests

Use `ctx.api.request()` to call backend APIs, with the same usage as [Axios](https://axios-http.com/):

```tsx
const response = await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
console.log(response.data);
```

### Internationalization

Use `ctx.t()` to get translated text:

```tsx
const label = ctx.t('Hello');
// Specify namespace
const msg = ctx.t('Save success', { ns: '@my-project/plugin-hello' });
```

### Route Navigation

Use `ctx.router.navigate()` for page navigation:

```tsx
ctx.router.navigate('/some-page'); // -> /v2/some-page
```

Get current route parameters:

```tsx
// e.g., route defined as /users/:id
const { id } = ctx.route.params; // get dynamic parameter
```

Get current route name:

```tsx
const { name } = ctx.route; // get route name
```

<!-- ### Messages, Dialogs, and Notifications

NocoBase wraps Antd's feedback components via ctx, so you can call them directly in your logic code:

```tsx
// Message (lightweight, auto-dismiss)
ctx.message.success('Saved successfully');

// Confirm dialog (blocking, waits for user action)
const confirmed = await ctx.modal.confirm({
  title: 'Confirm deletion?',
  content: 'This cannot be undone',
});

// Notification (slides in from the right, suitable for longer messages)
ctx.notification.open({
  message: 'Import complete',
  description: '42 records imported',
});
```

### Logging

Use `ctx.logger` to output structured logs:

```tsx
ctx.logger.info('Page loaded', { page: 'UserList' });
ctx.logger.error('Failed to load data', { error });
``` -->

For more log levels and usage, see [Context - Common Capabilities](../ctx/common-capabilities).

## Complete Example

Combining observable, useFlowContext, and Antd — a page component that fetches data from the backend and displays it:

```tsx
// pages/PostListPage.tsx
import React, { useEffect } from 'react';
import { Button, Card, List, Spin } from 'antd';
import { observable, observer, FlowContext, useFlowContext } from '@nocobase/flow-engine';

interface Post {
  id: number;
  title: string;
}

// Use observable to manage page state
const state = observable.deep({
  posts: [] as Post[],
  loading: true,
});

const PostListPage = observer(() => {
  const ctx = useFlowContext();

  useEffect(() => {
    loadPosts(ctx);
  }, []);

  return (
    <Card title={ctx.t('Post list')}>
      <Spin spinning={state.loading}>
        <List
          dataSource={state.posts}
          renderItem={(post: Post) => (
            <List.Item
              actions={[
                <Button danger onClick={() => handleDelete(ctx, post.id)}>
                  {ctx.t('Delete')}
                </Button>,
              ]}
            >
              {post.title}
            </List.Item>
          )}
        />
      </Spin>
    </Card>
  );
});

async function loadPosts(ctx: FlowContext) {
  state.loading = true;
  try {
    const response = await ctx.api.request({
      url: 'posts:list',
      method: 'get',
    });
    state.posts = response.data?.data || [];
  } catch (error) {
    ctx.logger.error('Failed to load post list', { error });
  } finally {
    state.loading = false;
  }
}

async function handleDelete(ctx: FlowContext, id: number) {
  await ctx.api.request({
    url: `posts:destroy/${id}`,
    method: 'post',
  });
  loadPosts(ctx); // Refresh the list
}

export default PostListPage;
```

## What's Next

- Full capabilities provided by `useFlowContext` — see [Context](../ctx/index.md)
- Component styles and theme customization — see [Styles & Themes](./styles-themes)
- If your component needs to appear in NocoBase's "Add Block / Field / Action" menus and support visual configuration by users, you need to wrap it with FlowModel — see [FlowEngine](../flow-engine/index.md)
- Not sure whether to use Component or FlowModel? — See [Component vs FlowModel](../component-vs-flow-model)

## Related Links

- [Router](../router) — Register page routes to mount components to URLs
- [Context](../ctx/index.md) — Full introduction to useFlowContext capabilities
- [Styles & Themes](./styles-themes) — createStyles, theme tokens, etc.
- [FlowEngine](../flow-engine/index.md) — Use FlowModel when visual configuration is needed
- [Observable Reactive Mechanism](../../../flow-engine/observable) — FlowEngine's reactive state management
- [Context - Common Capabilities](../ctx/common-capabilities) — Built-in capabilities like ctx.api, ctx.t
- [Component vs FlowModel](../component-vs-flow-model) — Choosing between Component and FlowModel
