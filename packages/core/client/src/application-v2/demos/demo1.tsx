import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Application } from '../Application';
import { Plugin } from '../Plugin';

const Root = () => {
  return (
    <div>
      <Link to={'/'}>Home</Link>
      <Link to={'/team'}>Team</Link>
      <Link to={'/about'}>About</Link>
      <Outlet />
    </div>
  );
};

const Team = () => {
  return (
    <div>
      Team <Link to={'/about'}>About</Link>
    </div>
  );
};

const About = () => {
  return (
    <div>
      <Link to={'/team'}>Team</Link> About
    </div>
  );
};

class TestPlugin extends Plugin {
  async load() {
    this.router.add('root', {
      path: '/',
      component: 'Root',
    });
    this.router.add('root.team', {
      path: 'team',
      component: 'Team',
    });
    this.router.add('root.about', {
      path: 'about',
      component: 'About',
    });
    console.log(this.router.getRoutes());
  }
}

const mockPlugins = {
  plugins: ['test'],
  importPlugins: async (name) => {
    return {
      test: TestPlugin,
    }[name];
  },
};

const app = new Application({
  apiClient: {
    baseURL: process.env.API_BASE_URL,
  },
  router: {
    type: 'hash',
  },
  components: { Root, Team, About },
  ...mockPlugins,
});

app.use((props) => {
  const location = useLocation();
  if (location.pathname === '/team') {
    return <div>Hello</div>;
  }
  return props.children;
});

export default app.getRootComponent();
