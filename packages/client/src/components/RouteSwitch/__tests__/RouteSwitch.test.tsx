import React from 'react';
import renderer from 'react-test-renderer';
import { MemoryRouter as Router, useParams, Link } from 'react-router-dom';
import { RouteSwitch } from '../';

const components = {
  Index: () => <div>index</div>,
  Home: ({ children }) => (
    <div>
      <h1>Home</h1>
      {children}
    </div>
  ),
  Blog: ({ children }) => (
    <div>
      <h1>Blog</h1>
      {children}
    </div>
  ),
  BlogPost: () => {
    let { slug } = useParams<any>();
    return <div>Now showing post {slug}</div>;
  },
  Login: () => <div>login</div>,
  Register: () => <div>register</div>,
};

const routes = [
  {
    type: 'redirect',
    from: '/blog/123',
    to: '/blog/1234',
  },
  // {
  //   component: 'Home',
  //   routes: [
  //     {
  //       path: '/blog/123555',
  //       component: () => <div>/blog/123555</div>,
  //     },
  //   ],
  // },
  {
    path: '/blog',
    component: 'Blog',
    routes: [
      {
        path: '/blog/:slug',
        // exact: true,
        component: 'BlogPost',
      },
    ],
  },
  {
    component: 'Home',
    routes: [
      // {
      //   path: '/blog/123555',
      //   component: () => <div>/blog/123555</div>,
      // },
      {
        path: '/login',
        component: 'Login',
      },
      {
        path: '/register',
        component: 'Register',
      },
      {
        path: '/',
        // exact: true,
        component: 'Index',
      },
    ],
  },
];

it('route component', () => {
  const t = renderer
    .create(
      <Router initialEntries={['/']}>
        <RouteSwitch
          routes={[
            {
              path: '/',
              component: () => <div>test</div>,
            },
          ]}
        />
      </Router>,
    )
    .toJSON();
  expect(t).toMatchSnapshot();
});

it('pathname=/', () => {
  const t = renderer
    .create(
      <Router initialEntries={['/']}>
        <RouteSwitch routes={routes} components={components} />
      </Router>,
    )
    .toJSON();
  expect(t).toMatchSnapshot();
});

it('pathname=/login', () => {
  const t = renderer
    .create(
      <Router initialEntries={['/login']}>
        <RouteSwitch routes={routes} components={components} />
      </Router>,
    )
    .toJSON();
  expect(t).toMatchSnapshot();
});

it('pathname=/blog/123', () => {
  const t = renderer
    .create(
      <Router initialEntries={['/blog/123']}>
        <RouteSwitch routes={routes} components={components} />
      </Router>,
    )
    .toJSON();
  expect(t).toMatchSnapshot();
});
