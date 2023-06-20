# v0.10: Update instructions

## New features in the second quarter

- Association field component improvements, support for multiple component switching
  - Select
  - Record picker
  - Sub-form/Sub-details
  - Sub-table
  - File manager
  - Title(read only)
- Quick creation of relational data, supports two quick creation modes
  - Add in drop-down menu to quickly create a new record based on the title field
  - Add in pop-up window to configure complex add forms
- Duplicate action, supports two modes
  - Direct duplicate
  - Copy into the form and continue to fill in
- Form data templates
- Filter data scope support variables
- List block
- Grid card block
- Mobile client plugin
- User authentication plugin, support for different authentication methods
  - Email/Password
  - SMS
  - OIDC
  - SAML
- Workflow nodes
  - Manual node upgrade, support for adding and editing from existing collections
  - Loop node
  - Aggregate node
- File manager
  - Provide file collection template
  - Provide file manager component

## Upgrading applications

### Upgrading for Docker compose

No change, upgrade reference [Upgrading for Docker compose](/welcome/getting-started/upgrading/docker-compose)

### Upgrading for Git source code

v0.10 has a major upgrade of dependencies, so to prevent errors when upgrading the source code, you need to delete the following directories before upgrading

```bash
# Remove .umi cache
yarn rimraf -rf "./**/{.umi,.umi-production}"
# Delete compiled files
yarn rimraf -rf "./packages/*/*/{lib,esm,es,dist,node_modules}"
# Remove dependencies
yarn rimraf -rf node_modules
```

See [Upgrading for Git source code](/welcome/getting-started/upgrading/git-clone) for more details

### Upgrading for create-nocobase-app

It is recommended that `yarn create` re-download the new version and modify the `.env` configuration, for more details refer to [major version upgrade guide](/welcome/getting-started/upgrading/create-nocobase-app#major-upgrade)

## Upcoming deprecated and potentially incompatible changes

### Sub-table field component

Not compatible with new version, block fields need to be removed and reassigned (UI reassignment only)

### Attachment upload api changes

In addition to the built-in attachments table, users can also custom file collection, the upload api for attachments has been changed from `/api/attachments:upload` to `/api/<file-collection>:create`, upload is deprecated, still compatible with v0.10 but will be Removed.

### signin/signup api changes

The nocobase kernel provides a more powerful [auth module](https://github.com/nocobase/nocobase/tree/main/packages/plugins/auth) with the following changes to the user login, registration, verification, and logout apis:

```bash
/api/users:signin -> /api/auth:signIn
/api/users:signup -> /api/auth:signUp
/api/users:signout -> /api/auth:signOut
/api/users:check -> /api/auth:check
```

Note: The above users interface, which is deprecated, is still compatible with v0.10, but will be removed in the next major release.

### Adjustments to date field filtering

If date related filtering was previously configured in the data range, it needs to be deleted and reconfigured.

## Third-party plugin upgrade guide

### Dependencies upgrade

dependencies mainly including

- `react` upgrade to v18
- `react-dom` upgrade to v18
- `react-router` upgrade to v6.11
- `umi` upgrade to v4
- `dumi` upgrade to v2

The `package.json` dependencies should be changed to the latest version, e.g:

```diff
{
  "devDependencies": {
+   "react": "^18".
+   "react-dom": "^18".
+   "react-router-dom": "^6.11.2".
-   "react": "^17".
-   "react-dom": "^17".
-   "react-router-dom": "^5".
  }
}
```

### Code changes

Because react-router has been upgraded, the related code also needs to be changed, the main changes include

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

For more api changes, please refer to [react-router@6](https://reactrouter.com/en/main/upgrading/v5)。
