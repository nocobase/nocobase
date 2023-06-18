import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Application } from '../Application';
import { Plugin } from '../Plugin';

const Root = () => {
  return (
    <div>
      <Link to={'/'}>Home</Link>
      <Link to={'/hello'}>Hello</Link>
      <Link to={'/team'}>Team</Link>
      <Link to={'/about'}>About</Link>
      <Outlet />
    </div>
  );
};

const Nested = () => {
  return (
    <div>
      <Link to={'/'}>Home</Link>
      <Link to={'/about'}>About</Link>
      <Outlet />
    </div>
  );
};

const Team = ({ router }) => {
  return <div>Team: {router.render()}</div>;
};

const About = () => {
  return (
    <div>
      <Link to={'/team'}>Team</Link> About
    </div>
  );
};

class Test1Plugin extends Plugin {
  async load() {
    const nestedRouter = this.app.createRouter({ type: 'memory' });
    nestedRouter.add('home', {
      path: '/',
      component: Nested,
    });
    nestedRouter.add('home.about', {
      path: '/about',
      component: About,
    });
    this.router.add('root.team', {
      path: 'team',
      component: () => <Team router={nestedRouter} />,
    });
  }
}

class Test2Plugin extends Plugin {
  async load() {
    this.router.add('root.about', {
      path: 'about',
      component: 'About',
    });
  }
}

class NocobasePresetPlugin extends Plugin {
  async afterAdd() {
    await this.pm.add('test1');
    await this.pm.add(Test2Plugin, { name: 'test2' });
  }

  async load() {
    this.router.add('root', {
      path: '/',
      component: 'Root',
    });
  }
}

const app = new Application({
  apiClient: {
    baseURL: process.env.API_BASE_URL,
  },
  router: {
    type: 'hash',
  },
  plugins: [[NocobasePresetPlugin, { name: 'nocobase' }]],
  importPlugins: async (name) => {
    return {
      test1: Test1Plugin,
    }[name];
  },
  components: { Root, Team, About },
});

app.use((props) => {
  const location = useLocation();
  if (location.pathname === '/hello') {
    return <div>Hello</div>;
  }
  return props.children;
});

export default app.getRootComponent();
