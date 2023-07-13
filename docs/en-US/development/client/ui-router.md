# UI Routing

NocoBase Client's Router is based on [React Router](https://v5.reactrouter.com/web/guides/quick-start) and can be configured via `app.router` to configure ui routes with the following example.

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

In a full NocoBase application, the Route can be extended in a similar way as follows.

```tsx | pure
import { Plugin } from '@nocobase/client';

class MyPlugin extends Plugin {
  async load() {
    // add
    this.app.router.add('hello', {
      path: '/hello',
      element: <div>hello</div>,
    })

    // remove
    this.app.router.remove('hello');
  }
}
```

See [packages/samples/custom-page](https://github.com/nocobase/nocobase/tree/develop/packages/samples/custom-page) for the full example
