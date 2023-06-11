# v0.10：更新说明

v0.10 进行了依赖的重大升级，主要包括 `react`、`react-dom`、`react-router`、`umi`、`dumi`。

## 依赖升级

- 升级 `react@^17`、`react-dom@^17` 到 `react@^18`、`react-dom@^18` 版本

```diff
{
  "devDependencies": {
+   "react": "^18",
+   "react-dom": "^18",
-   "react": "^17",
-   "react-dom": "^17",
  }
}
```

- 升级 `react-router@5` 到 `react-router@6`

```diff
{
  "devDependencies": {
+   "react-router-dom": "^6.11.2",
-   "react-router-dom": "^5",
  }
}
```

## react-router 改动说明

由于 `react-router` 的升级需要进行代码层面的一些改动。

### Layout 布局组件

Layout 布局组件需要使用 `<Outlet />` 代替 `props.children`。

```diff
import React from 'react';
+ import { Outlet } from 'react-router-dom';

export default function Layout(props) {
  return (
    <div>
-      { props.children }
+      <Outlet />
    </div>
  );
}
```

使用了 `React.cloneElement` 方式渲染的路由组件改造，示例：

```diff
import React from 'react';
+ import { Outlet } from 'react-router-dom';

export default function RouteComponent(props) {
  return (
    <div>
-      { React.cloneElement(props.children, { someProp: 'p1' }) }
+      <Outlet context={{ someProp: 'p1' }} />
    </div>
  );
}
```

组件改成从 `useOutletContext` 取值

```diff
import React from 'react';
+ import { useOutletContext } from 'react-router-dom';

- export function Comp(props){
+ export function Comp() {
+   const props = useOutletContext();
  return props.someProp;
}
```

### Redirect

`<Redirect>` 转为 `<Navigate replace />`。

```diff
- <Redirect to="about" />
+ <Navigate to="about" replace />
```

### useHistory

`useNavigate` 代替 `useHistory`。

```diff
- import { useHistory } from 'react-router-dom';
+ import { useNavigate} from 'react-router-dom';

- const history = useHistory();
+ const navigate = useNavigate();

- history.push('/about')
+ navigate('/about')

- history.replace('/about')
+ navigate('/about', { replace: true })
```

### useLocation

`useLocation<type>()` 改为 `useLocation`。

```diff
- const location= useLocation<type>();
+ const location= useLocation();
```

### path

支持下面的 `path` 方式

```
/groups
/groups/admin
/users/:id
/users/:id/messages
/files/*
/files/:id/*
```

不再支持如下方式
```
/tweets/:id(\d+)
/files/*/cat.jpg
/files-*
```

更多改动和 api 变更，请查阅 [react-router@6](https://reactrouter.com/en/main/upgrading/v5)。

## 文档 Demo

```diff
- <code src="./demo.tsx" />
+ <code src="demo.tsx"></code>
```
