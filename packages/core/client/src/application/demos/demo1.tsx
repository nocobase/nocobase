import { Application, Plugin } from '@nocobase/client';
import React, { FC } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

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

const Home = () => {
  return <div>this is Home</div>;
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

class Test1Plugin extends Plugin {
  async load() {
    this.router.add('root.team', {
      path: 'team',
      Component: 'Team',
    });
  }
}

class Test2Plugin extends Plugin {
  async load() {
    this.router.add('root.about', {
      path: 'about',
      Component: 'About',
    });
  }
}

class NocobasePresetPlugin extends Plugin {
  async afterAdd() {
    // mock load remote plugin
    await this.addRemotePlugin();
  }

  async addRemotePlugin() {
    await this.pm.add(Test1Plugin);
    await this.pm.add(Test2Plugin);
  }

  async load() {
    this.router.add('root', {
      path: '/',
      Component: 'Root',
    });
    this.router.add('root.home', {
      path: '/',
      Component: 'Home',
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
  plugins: [NocobasePresetPlugin],
  components: { Root, Home, Team, About },
});

const HelloProvider: FC = (props) => {
  const location = useLocation();
  if (location.pathname === '/hello') {
    return <div>Hello</div>;
  }
  return <>{props.children}</>;
};

app.use(HelloProvider);

export default app.getRootComponent();
