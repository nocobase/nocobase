# NocoBase

## Browser API client

`@nocobase/sdk/client` creates the standard NocoBase `APIClient` for a browser application. It uses the runtime API URL when available, otherwise the same-origin `/api/` endpoint. Authentication uses same-origin cookies, CSRF protection uses the existing CSRF cookie, and temporary sign-in tokens are stored in memory by default.

```ts
import { createClient } from '@nocobase/sdk/client';

const client = createClient();

const response = await client.request({
  url: 'orders:list',
  method: 'get',
  params: { pageSize: 20 },
});
```

The standard runtime globals are optional:

- `window.__nocobase_api_base_url__` supplies the API base URL.
- `window.__nocobase_public_path__` supplies the deployment root used to infer a sub-application name.

Both values can be overridden explicitly:

```ts
const client = createClient({
  appName: 'inventory',
  baseURL: '/custom-api/',
  rootPublicPath: '/console/',
});
```

Cross-origin authentication is not part of this API. Keep the application and API on the same origin.

### Vite and React

Create one framework-independent client module and import it where requests are needed:

```ts
// src/client.ts
import { createClient } from '@nocobase/sdk/client';

export const client = createClient();
```

```tsx
// src/Orders.tsx
import { useEffect, useState } from 'react';
import { client } from './client';

export function Orders() {
  const [orders, setOrders] = useState<unknown[]>([]);

  useEffect(() => {
    client.request<{ data: unknown[] }>({ url: 'orders:list', method: 'get' }).then((response) => {
      setOrders(response.data.data);
    });
  }, []);

  return <pre>{JSON.stringify(orders, null, 2)}</pre>;
}
```

The SDK package does not depend on React; the component above is only an integration example.

### Native fetch

Native `fetch` can use the same server-managed cookies. GET and HEAD requests only need same-origin credentials:

```ts
await fetch('/api/orders:list?pageSize=20', {
  credentials: 'same-origin',
});
```

Unsafe methods must copy the readable CSRF cookie into the `X-CSRF-Token` header. Cookie names are scoped by application name:

```ts
function readCookie(name: string) {
  const prefix = `${name}=`;
  return document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length);
}

const appName = 'main';
const csrfToken = readCookie(`nb_csrf_token_${appName}`);

await fetch('/api/orders:create', {
  method: 'POST',
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/json',
    ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
  },
  body: JSON.stringify({ title: 'New order' }),
});
```

Do not copy authentication tokens from browser storage. Access to an application workspace and access to API data are separate server-side checks; passing one does not bypass the other.

<video width="100%" controls>
  <source src="https://github.com/user-attachments/assets/4d11a87b-00e2-48f3-9bf7-389d21072d13" type="video/mp4">
</video>

<p align="center">
<a href="https://trendshift.io/repositories/4112" target="_blank"><img src="https://trendshift.io/api/badge/repositories/4112" alt="nocobase%2Fnocobase | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
<a href="https://www.producthunt.com/posts/nocobase?embed=true&utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_souce=badge-nocobase" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=456520&theme=light&period=weekly&topic_id=267" alt="NocoBase - Scalability&#0045;first&#0044;&#0032;open&#0045;source&#0032;no&#0045;code&#0032;platform | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
</p>

## What is NocoBase

NocoBase is the most extensible AI-powered no-code platform.   
Total control. Infinite extensibility. AI collaboration.  
Enable your team to adapt quickly and cut costs dramatically.  
No years of development. No millions wasted.  
Deploy NocoBase in minutes — and take control of everything.

Homepage:  
https://www.nocobase.com/  

Online Demo:  
https://demo.nocobase.com/new

Documents:  
https://docs.nocobase.com/

Forum:  
https://forum.nocobase.com/

Use Cases:  
https://www.nocobase.com/en/blog/tags/customer-stories

## Release Notes

Our [blog](https://www.nocobase.com/en/blog/timeline) is regularly updated with release notes and provides a weekly summary.

## Distinctive features

### 1. Data model-driven, not form/table–driven

Instead of being constrained by forms or tables, NocoBase adopts a data model–driven approach, separating data structure from user interface to unlock unlimited possibilities.

- UI and data structure are fully decoupled
- Multiple blocks and actions can be created for the same table or record in any quantity or form
- Supports the main database, external databases, and third-party APIs as data sources

![model](https://static-docs.nocobase.com/model.png)

### 2. AI employees, integrated into your business systems
Unlike standalone AI demos, NocoBase allows you to embed AI capabilities seamlessly into your interfaces, workflows, and data context, making AI truly useful in real business scenarios.

- Define AI employees for roles such as translator, analyst, researcher, or assistant
- Seamless AI–human collaboration in interfaces and workflows
- Ensure AI usage is secure, transparent, and customizable for your business needs

![AI-employee](https://static-docs.nocobase.com/ai-employee-home.png)

### 3. What you see is what you get, incredibly easy to use

While enabling the development of complex business systems, NocoBase keeps the experience simple and intuitive.

- One-click switch between usage mode and configuration mode
- Pages serve as a canvas to arrange blocks and actions, similar to Notion
- Configuration mode is designed for ordinary users, not just programmers

![wysiwyg](https://static-docs.nocobase.com/wysiwyg.gif)

### 4. Everything is a plugin, designed for extension
Adding more no-code features will never cover every business case. NocoBase is built for extension through its plugin-based microkernel architecture.

- All functionalities are plugins, similar to WordPress
- Plugins are ready to use upon installation
- Pages, blocks, actions, APIs, and data sources can all be extended through custom plugins

![plugins](https://static-docs.nocobase.com/plugins.png)

## Installation

NocoBase supports three installation methods:

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/docker-compose">Installing With Docker (👍Recommended)</a>

  Suitable for no-code scenarios, no code to write. When upgrading, just download the latest image and reboot.

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/create-nocobase-app">Installing from create-nocobase-app CLI</a>

  The business code of the project is completely independent and supports low-code development.

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/git-clone">Installing from Git source code</a>

  If you want to experience the latest unreleased version, or want to participate in the contribution, you need to make changes and debug on the source code, it is recommended to choose this installation method, which requires a high level of development skills, and if the code has been updated, you can git pull the latest code.

## How NocoBase works

<video width="100%" controls>
  <source src="https://github.com/user-attachments/assets/8d183b44-9bb5-4792-b08f-bc08fe8dfaaf" type="video/mp4">
</video>
