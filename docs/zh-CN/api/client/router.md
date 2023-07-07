# Router

## API

### 初始化

```tsx | pure

const app = new Application({
  router: {
    type: 'browser' // type 的默认值就是 `browser`
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

### 添加路由

#### 基础用法

```tsx | pure
import { RouteObject } from 'react-router-dom'
const app = new Application()

const Hello = () => {
  return <div>Hello</div>
}

// 第一个参数是名称, 第二个参数是 `RouteObject`
app.router.add('root', {
  path: '/',
  element: <Hello />
})

app.router.add('root', {
  path: '/',
  Component: Hello
})
```

#### 支持 Component 是字符串

```tsx | pure
// register Hello
app.addComponents({
  Hello
})

// Component is `Hello` string
app.router.add('root', {
  path: '/',
  Component: 'Hello'
})
```

#### 嵌套路由

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

它将会被渲染为如下形式:

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

### 删除路由

```tsx | pure
// 传递 name 即可删除
app.router.remove('root.home')
app.router.remove('hello')
```

#### 插件中修改路由

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

## 示例

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
