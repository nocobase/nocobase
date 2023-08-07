# v0.11: Update instructions

## New features

- New client application, plugin and router
- Ant design upgrade to v5
- New plugin
  - Data visualization
  - API keys
  - Google map

## Incompatible changes

### New client application, plugin and router

#### Plugin changes

before you had to pass a component and the component needed to pass `props.children`, for example:

```tsx | pure
const HelloProvider = (props) => {
  // do something logic
  return <div>
    {props.children}
  </div>;
}

export default HelloProvider
```

now you need to change to the plugin way, for example:

```diff | pure
+import { Plugin } from '@nocobase/client'

const HelloProvider = (props) => {
  // do something logic
  return <div>
    {props.children}
  </div>;
}

+ export class HelloPlugin extends Plugin {
+   async load() {
+     this.app.addProvider(HelloProvider);
+   }
+ }

- export default HelloProvider;
+ export default HelloPlugin;
```

plugins are very powerful and can do a lot of things in the `load` phase:

- modify routes
- add Components
- add Providers
- add Scopes
- load other plugins

#### Routing changes

if you used `RouteSwitchContext` to modify the route before, you now need to replace it with a plugin:

```tsx | pure
import { RouteSwitchContext } from '@nocobase/client';

const HelloProvider = () => {
  const { routes, ...others } = useContext(RouteSwitchContext);
  routes[1].routes.unshift({
    path: '/hello',
    component: Hello,
  });

  return <div>
    <RouteSwitchContext.Provider value={{ ...others, routes }}>
      {props.children}
    </RouteSwitchContext.Provider>
  </div>
}
```

now you need to change to the plugin way, for example:

```diff | pure
- import { RouteSwitchContext } from '@nocobase/client';
+ import { Plugin } from '@nocobase/client';

const HelloProvider = (props) => {
-  const { routes, ...others } = useContext(RouteSwitchContext);
-  routes[1].routes.unshift({
-    path: '/hello',
-    component: Hello,
-  });

  return <div>
-   <RouteSwitchContext.Provider value={{ ...others, routes }}>
      {props.children}
-   </RouteSwitchContext.Provider>
  </div>
}

+ export class HelloPlugin extends Plugin {
+  async load() {
+    this.app.router.add('admin.hello', {
+       path: '/hello',
+       Component: Hello,
+    });
+    this.app.addProvider(HelloProvider);
+  }
+ }
+ export default HelloPlugin;
```

more details can be found in [packages/core/client/src/application/index.md](https://github.com/nocobase/nocobase/blob/main/packages/core/client/src/application/index.md)

### antd upgrade to v5

- antd related details view the official website [V4 to V5](https://ant.design/docs/react/migration-v5)
- `@formily/antd` replace with `@formily/antd-v5`
