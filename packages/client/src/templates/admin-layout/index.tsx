import React, { useContext } from 'react';
import { Button, Spin } from 'antd';
import isEmpty from 'lodash/isEmpty';
import {
  Link,
  useLocation,
  useRouteMatch,
  useHistory,
  Redirect,
} from 'react-router-dom';
import {
  useGlobalAction,
  refreshGlobalAction,
  RouteComponentContext,
} from '../../';

function LogoutButton() {
  const history = useHistory();
  return (
    <Button
      onClick={async () => {
        history.push('/login');
        await refreshGlobalAction('routes:getAccessible');
      }}
    >
      注销
    </Button>
  );
}

function Menu() {
  const { data = [], loading } = useGlobalAction('routes:getMenu');
  if (loading) {
    return <Spin />;
  }
  console.log('menu', data);
  return (
    <ul>
      {data.map((item, index) => (
        <li key={index}>
          <Link to={item.name}>{item.title}</Link>
        </li>
      ))}
    </ul>
  );
}

export function AdminLayout({ route, children }: any) {
  const location = useLocation();
  const { PageTemplate } = useContext<any>(RouteComponentContext);
  // const history = useHistory();
  const match = useRouteMatch<any>(route.path);
  const { data = {}, loading } = useGlobalAction('users:check');
  if (isEmpty(data) || loading) {
    return <Spin />;
  }
  if (!data.token) {
    return <Redirect to={'/login'} />;
  }
  const name = match?.params?.name;
  return (
    <div>
      <h1>Admin - {data.username}</h1>
      <LogoutButton />
      <Menu />
      <h2>{route.title}</h2>
      {/* {children} */}
      {PageTemplate && <PageTemplate route={{ name }} />}
    </div>
  );
}

export default AdminLayout;
