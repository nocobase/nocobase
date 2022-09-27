# UI Router

NocoBase Client 的 Router 基于 [React Router](https://v5.reactrouter.com/web/guides/quick-start)，可以通过 `<RouteSwitch routes={[]} />` 来配置 ui routes，例子如下：

```tsx
/**
 * defaultShowCode: true
 */
import React from 'react';
import { Link, MemoryRouter as Router } from 'react-router-dom';
import { RouteRedirectProps, RouteSwitchProvider, RouteSwitch } from '@nocobase/client';

const Home = () => <h1>Home</h1>;
const About = () => <h1>About</h1>;

const routes: RouteRedirectProps[] = [
  {
    type: 'route',
    path: '/',
    exact: true,
    component: 'Home',
  },
  {
    type: 'route',
    path: '/about',
    component: 'About',
  },
];

export default () => {
  return (
    <RouteSwitchProvider components={{ Home, About }}>
      <Router initialEntries={['/']}>
        <Link to={'/'}>Home</Link>, <Link to={'/about'}>About</Link>
        <RouteSwitch routes={routes} />
      </Router>
    </RouteSwitchProvider>
  );
};
```

在完整的 NocoBase 应用里，可以类似以下的的方式扩展 Route：

```tsx | pure
import { RouteSwitchContext } from '@nocobase/client';
import React, { useContext } from 'react';

const HelloWorld = () => {
  return <div>Hello ui router</div>;
};

export default React.memo((props) => {
  const ctx = useContext(RouteSwitchContext);
  ctx.routes.push({
    type: 'route',
    path: '/hello-world',
    component: HelloWorld,
  });
  return <RouteSwitchContext.Provider value={ctx}>{props.children}</RouteSwitchContext.Provider>;
});
```

完整示例查看 [packages/samples/custom-page](https://github.com/nocobase/nocobase/tree/develop/packages/samples/custom-page)