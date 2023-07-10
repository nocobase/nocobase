# Router

## API

### Initial

```tsx | pure

const app = new Application({
  router: {
    type: 'browser' // type default value is `browser`
  }
})

// or
const app = new Application({
  router: {
    type: 'memory',
    initialEntries: ['/']
  }
})
```

### add Route

#### basic

```tsx | pure
import { RouteObject } from 'react-router-dom'
const app = new Application()

const Hello = () => {
  return <div>Hello</div>
}

// first argument is `name` of route, second argument is `RouteObject`
app.router.add('root', {
  path: '/',
  element: <Hello />
})

app.router.add('root', {
  path: '/',
  Component: Hello
})
```

#### Component is String

```tsx | pure
app.addComponents({
  Hello
})
app.router.add('root', {
  path: '/',
  Component: 'Hello'
})
```

#### nested

```tsx | pure
import { Outlet } from 'react-router-dom'

const Layout = () => {
  return <div>
    <Link to='/home'>Home</Link>
    <Link to='/about'>about</Link>

    <Outlet />
  </div>
}

const Home = () => {
  return <div>Home</div>
}

const About = () => {
  return <div>About</div>
}

app.router.add('root', {
  element: <Layout />
})
app.router.add('root.home', {
  path: '/home',
  element: <Home />
})
app.router.add('root.about', {
  path: '/about',
  element: <About />
})
```

It will generate the following routes:

```tsx | pure
{
  element: <Layout />,
  children: [
    {
      path: '/home',
      element: <Home />
    },
    {
      path: '/about',
      element: <About />
    }
  ]
}
```

### remove Route

```tsx | pure
// remove route by name
app.router.remove('root.home')
app.router.remove('hello')
```

#### Router in plugin

```tsx | pure
class MyPlugin extends Plugin {
  async load() {
    // add route
    this.app.router.add('hello', {
      path: '/hello',
      element: <div>hello</div>,
    })

    // remove route
    this.app.router.remove('world');
  }
}
```

## Example

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
