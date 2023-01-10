# UI Routing

NocoBase Client's Router is based on [React Router](https://v5.reactrouter.com/web/guides/quick-start) and can be configured via `<RouteSwitch routes={[]} />` to configure ui routes with the following example.

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

In a full NocoBase application, the Route can be extended in a similar way as follows.

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

See [packages/samples/custom-page](https://github.com/nocobase/nocobase/tree/develop/packages/samples/custom-page) for the full example
