import React from 'react';
import { Link, MemoryRouter as Router } from 'react-router-dom';
import { RouteRedirectProps, RouteSwitchProvider, RouteSwitch } from '@nocobase/client';

const Home = () => <h1>Home</h1>;
const About = () => <h1>About</h1>;

const routes: RouteRedirectProps[] = [
  {
    type: 'route',
    path: '/',
    exact: true,
    component: 'Home',
  },
  {
    type: 'route',
    path: '/about',
    component: 'About',
  },
];

export default () => {
  return (
    <RouteSwitchProvider components={{ Home, About }}>
      <Router initialEntries={['/']}>
        <Link to={'/'}>Home</Link>, <Link to={'/about'}>About</Link>
        <RouteSwitch routes={routes} />
      </Router>
    </RouteSwitchProvider>
  );
};
