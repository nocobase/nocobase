import { Application, Plugin, RouterManager, useApp } from '@nocobase/client';
import React, { useMemo } from 'react';
import { Link, Navigate, Outlet, useParams } from 'react-router-dom';

const Root = () => {
  return (
    <div>
      <Link to={'/'}>Home</Link>|<Link to={'/admin'}>Admin</Link>|<Link to={'/admin/setting'}>Admin Setting</Link>
      <Outlet />
    </div>
  );
};

const Home = () => {
  return <div>Home</div>;
};

const Admin = () => {
  return (
    <div>
      <div>Admin</div>
      <Outlet />
    </div>
  );
};

const MobileLayout = () => {
  return (
    <div>
      <div>MobileLayout</div>
      <Link to={'/mobile/123'}>Mobile 123</Link>|<Link to={'/mobile/456'}>Mobile 456</Link>
      <Outlet />
    </div>
  );
};

const MobilePage = () => {
  const { id } = useParams();

  return <div>id: {id}</div>;
};

const AdminSetting = () => {
  const app = useApp();
  const MobileRouter = useMemo(() => {
    const router = new RouterManager({ type: 'memory', initialEntries: ['/'] }, app);
    router.add('mobile', {
      element: <MobileLayout />,
    });
    router.add('mobile.index', {
      path: '/',
      element: <Navigate replace to="/mobile/123" />,
    });
    router.add('mobile.page', {
      path: '/mobile/:id',
      element: <MobilePage />,
    });

    return router.getRouterComponent();
  }, [app]);

  return (
    <div>
      <div>AdminSetting</div>
      <MobileRouter />
    </div>
  );
};

class NocobasePresetPlugin extends Plugin {
  async load() {
    this.router.add('root', {
      path: '/',
      element: <Root />,
    });
    this.router.add('root.home', {
      path: '/',
      element: <Home />,
    });
    this.router.add('root.admin', {
      path: '/admin',
      element: <Admin />,
    });
    this.router.add('root.admin.setting', {
      path: '/admin/setting',
      element: <AdminSetting />,
    });
  }
}

const app = new Application({
  router: { type: 'hash' },
  plugins: [NocobasePresetPlugin],
});

export default app.getRootComponent();
