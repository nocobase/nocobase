# UI 路由

NocoBase Client 的 Router 基于 [React Router](https://v5.reactrouter.com/web/guides/quick-start)，可以通过 `app.router` 来配置 ui routes，例子如下：

```tsx
/**
 * defaultShowCode: true
 */
import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Application } from '@nocobase/client';

const Home = () => <h1>Home</h1>;
const About = () => <h1>About</h1>;

const Layout = () => {
  return <div>
    <div><Link to={'/'}>Home</Link>, <Link to={'/about'}>About</Link></div>
    <Outlet />
  </div>
}

const app = new Application({
  router: {
    type: 'memory',
    initialEntries: ['/']
  }
})

app.router.add('root', {
  element: <Layout />
})

app.router.add('root.home', {
  path: '/',
  element: <Home />
})

app.router.add('root.about', {
  path: '/about',
  element: <About />
})

export default app.getRootComponent();
```

在完整的 NocoBase 应用里，可以类似以下的的方式扩展 Route：

```tsx | pure
import { Plugin } from '@nocobase/client';

class MyPlugin extends Plugin {
  async load() {
    // 添加一条路由
    this.app.router.add('hello', {
      path: '/hello',
      element: <div>hello</div>,
    })

    // 删除一条路由
    this.app.router.remove('hello');
  }
}
```

完整示例查看 [packages/samples/custom-page](https://github.com/nocobase/nocobase/tree/develop/packages/samples/custom-page)
