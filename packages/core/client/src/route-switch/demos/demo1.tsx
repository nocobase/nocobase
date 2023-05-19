import { RouteRedirectProps, RouteSwitch, RouteSwitchProvider } from '@nocobase/client';
import React from 'react';
import { Link, MemoryRouter as Router } from 'react-router-dom';

const Home = () => <h1>Home</h1>;
const About = () => <h1>About</h1>;
const SignIn = () => <h1>Sign In</h1>;
const SignUp = () => <h1>Sign Up</h1>;

const AuthLayout = (props) => (
  <div>
    <h1>AuthLayout</h1>
    {props.children}
  </div>
);

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
  {
    type: 'route',
    component: 'AuthLayout',
    routes: [
      {
        type: 'route',
        path: '/signin',
        component: 'SignIn',
      },
      {
        type: 'route',
        path: '/signup',
        component: 'SignUp',
      },
    ],
  },
];

export default () => {
  return (
    <RouteSwitchProvider components={{ Home, About, AuthLayout, SignIn, SignUp }}>
      <Router initialEntries={['/']}>
        <ul>
          <li>
            <Link to={'/'}>Home</Link>
          </li>
          <li>
            <Link to={'/about'}>About</Link>
          </li>
          <li>
            <Link to={'/signin'}>Sign In</Link>
          </li>
          <li>
            <Link to={'/signup'}>Sign Up</Link>
          </li>
        </ul>
        <RouteSwitch routes={routes} />
      </Router>
    </RouteSwitchProvider>
  );
};
