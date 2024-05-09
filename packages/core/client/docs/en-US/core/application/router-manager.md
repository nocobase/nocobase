# RouterManager

Used for managing routes.

```tsx | pure
import { ComponentType } from 'react';
import { RouteObject } from 'react-router-dom';

interface RouteType extends Omit<RouteObject, 'children' | 'Component'> {
  Component?: ComponentType<T> | string;
}

class RouterManager {
    add(name: string, route: RouteType): void;
    getRoutes(): Record<string, RouteType>;
    getRoutesTree(): RouteObject[];
    get(name: string): RouteType;
    has(name: string): boolean;
    remove(name: string): void;
    setType(type: 'browser' | 'memory' | 'hash'): void;
    setBasename(basename: string): void;
}
```

## Instance Methods

### router.add()

Add a route.

- Type

```tsx | pure
class RouterManager {
    add(name: string, route: RouteType): void
}
```

- Details

The first parameter `name` is the unique identifier for the route, used for subsequent operations such as modification and retrieval. The `name` also supports using `.` to separate hierarchical levels. However, when using `.` for hierarchy, the parent level should use [Outlet](https://reactrouter.com/en/main/components/outlet) to ensure proper rendering of child elements.

The second parameter `RouteType` has a `Component` property that supports both component and string forms. If using a string component, it needs to be registered first using [app.addComponents](/core/application/application#appaddcomponents).

- Example

Single-level routing.

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
      this.app.router.add('home', {
            path: '/',
            Component: () => <div>home page</div>
        })
        this.app.router.add('login', {
            path: '/login',
            element: <div>login page</div>
        })
    }
}
```

```tsx
import { useNavigate } from 'react-router-dom';
import { Plugin, Application } from '@nocobase/client';

const HomePage = () => {
  const navigate = useNavigate();
  return <div>
    <div>home page</div>
    <button onClick={() => navigate('/login')}>GO To LoginPage</button>
  </div>
}

const LoginPage = () => {
  const navigate = useNavigate();
  return <div>
    <div>login page</div>
    <button onClick={() => navigate('/')}>GO To HomePage</button>
  </div>
}

class MyPlugin extends Plugin {
    async load() {
      this.app.router.add('home', {
            path: '/',
            Component: HomePage
        })
        this.app.router.add('login', {
            path: '/login',
            Component: LoginPage
        })
    }
}


const app = new Application({
    plugins: [MyPlugin],
    router: {
        type: 'memory',
        initialEntries: ['/'],
    }
});

export default app.getRootComponent();
```

Multi-level routing.

```tsx | pure
import { Plugin } from '@nocobase/client';
import { Outlet } from 'react-router-dom';

const AdminLayout = () =>{
    return <div>
        <div>This is admin layout</div>
        <Outlet />
    </div>
}

const AdminSettings = () => {
    return <div>This is admin settings page</div>
}

class MyPlugin extends Plugin {
    async load() {
        this.app.router.add('admin', {
            path: '/admin',
            Component: AdminLayout
        })
        this.app.router.add('admin.settings', {
            path: '/admin/settings',
            Component: AdminSettings ,
        })
    }
}
```


```tsx
import { useNavigate, Outlet } from 'react-router-dom';
import { Plugin, Application } from '@nocobase/client';

const AdminLayout = () =>{
    return <div>
        <div>This is admin layout</div>
        <Outlet />
    </div>
}

const AdminSettings = () => {
    return <div>This is admin settings page</div>
}

class MyPlugin extends Plugin {
    async load() {
      this.app.router.add('admin', {
          path: '/admin',
          Component: AdminLayout
      })
      this.app.router.add('admin.settings', {
          path: '/admin/settings',
          Component: AdminSettings ,
      })
    }
}


const app = new Application({
    plugins: [MyPlugin],
    router: {
        type: 'memory',
        initialEntries: ['/admin/settings'],
    }
});

export default app.getRootComponent();
```

The `Component` parameter is a string.

```tsx | pure
const LoginPage = () => {
    return <div>login page</div>
}

class MyPlugin extends Plugin {
    async load() {
        // 通过 app.addComponents 进行注册
        this.app.addComponents({ LoginPage })

        this.app.router.add('login', {
            path: '/login',
            Component: 'LoginPage', // 这里可以使用字符串了
        })
    }
}
```

### router.getRoutes()

Get the list of routes.

- Type

```tsx | pure
class RouterManager {
    getRoutes(): Record<string, RouteType>
}
```

- Example

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        console.log(this.app.router.getRoutes());
    }
}
```

![](../static/CxjJbp0pcogYn6xviVyc6QT8nUg.png)

### router.getRoutesTree()

Get the data for [useRoutes()](https://reactrouter.com/hooks/use-routes).

- Type

```tsx | pure
class RouterManager {
    getRoutesTree(): RouteObject[]
}
```

- Example

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        const routes = this.app.router.getRoutesTree();
    }
}
```

### router.get()

Get a single route configuration.

- Type

```tsx | pure
class RouterManager {
    get(name: string): RouteType
}
```

- Example

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        const adminRoute = this.app.router.get('admin')
        const adminSettings = this.app.router.get('admin.settings')
    }
}
```

### router.has()

Check if a route has been added.

- Type

```tsx | pure
class RouterManager {
    has(name: string): boolean;
}
```

- Example

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        const hasAdminRoute = this.app.router.has('admin')
        const hasAdminSettings = this.app.router.has('admin.settings')
    }
}
```

### router.remove()

Remove route configuration.

- Type

```tsx | pure
class RouterManager {
    remove(name: string): void;
}
```

- Example

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        this.app.router.remove('admin')
        this.app.router.remove('admin.settings')
    }
}
```

### router.setType()

Set the router type, default is `browser`.


- Type

```tsx | pure
class RouterManager {
    setType(type: 'browser' | 'memory' | 'hash'): void;
}
```

- Details
  - browser: [BrowserRouter](https://reactrouter.com/en/main/router-components/browser-router)
  - memory: [MemoryRouter](https://reactrouter.com/en/main/router-components/hash-router)
  - hash: [HashRouter](https://reactrouter.com/en/main/router-components/memory-router)

- Example

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        this.app.router.setType('hash')
    }
}
```

### router.setBasename()

Set [basename](https://reactrouter.com/en/main/router-components/browser-router#basename).

- Type

```tsx | pure
class RouterManager {
    setBasename(basename: string): void;
}
```

- Example

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        this.app.router.setBasename('/')
    }
}
```

## Hooks

### useRouter()

Get the instance of the current route, equivalent to `app.router`.

- Type

```tsx | pure
const useRouter: () => RouterManager
```

- Example

```tsx | pure
import { useRouter } from '@nocobase/client';

const Demo = () => {
    const router = useRouter();
}
```
