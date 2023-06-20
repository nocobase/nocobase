# v0.10：update instructions

v0.10 has made major upgrades to dependencies, including `react`, `react-dom`, `react-router`, `umi`, and `dumi`.

## 依赖升级

- Upgrade `react@^17`, `react-dom@^17` to `react@^18`, `react-dom@^18` version

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

- Upgrade `react-router@5` to `react-router@6`

```diff
{
  "devDependencies": {
+   "react-router-dom": "^6.11.2",
-   "react-router-dom": "^5",
  }
}
```

## `react-router` change description

because the upgrade of `react-router` requires some code changes.

### Layout Component

Layout component needs to use `<Outlet />` instead of `props.children`.

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

if you use `React.cloneElement` to render the route component, you need to change it like this:

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

Change the route component to get the value from `useOutletContext`

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

`<Redirect>` is changed to `<Navigate replace />`.

```diff
- <Redirect to="about" />
+ <Navigate to="about" replace />
```

### useHistory

`useNavigate` is changed to `useHistory`.

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

`useLocation<type>()` is changed to `useLocation`.

```diff
- const location= useLocation<type>();
+ const location= useLocation();
```

`const { query } = useLocation()` is changed to `useSearchParams()`。

```diff
- const location = useLocation();
- const query = location.query;
- const name = query.name;
+ const [searchParams, setSearchParams] = useSearchParams();
+ searchParams.get('name');
```

### path

All of the following are valid route paths in v6:

```
/groups
/groups/admin
/users/:id
/users/:id/messages
/files/*
/files/:id/*
```

The following RegExp-style route paths are not valid in v6:

```
/tweets/:id(\d+)
/files/*/cat.jpg
/files-*
```

For more changes and api changes, please refer to [react-router@6](https://reactrouter.com/en/main/upgrading/v5)。

## Docs Demo

```diff
- <code src="./demo.tsx" />
+ <code src="demo.tsx"></code>
```
