import '@testing-library/jest-dom';
import React from 'react';
import { render, queryByAttribute, fireEvent } from '@testing-library/react';
import type { MemoryHistory} from '@umijs/runtime';
import { createMemoryHistory, Router } from '@umijs/runtime';
import { context as Context } from 'dumi/theme';
import SourceCode from '../builtins/SourceCode';
import Alert from '../builtins/Alert';
import Badge from '../builtins/Badge';
import Previewer from '../builtins/Previewer';
import API from '../builtins/API';
import Layout from '../layout';

let history: MemoryHistory;

// mock history location which import from 'dumi'
jest.mock('dumi', () => ({
  history: { location: { pathname: '/' } },
}));

describe('default theme', () => {
  history = createMemoryHistory({ initialEntries: ['/', '/en-US'], initialIndex: 0 });
  const baseCtx = {
    title: 'test',
    locale: 'zh-CN',
    routes: [
      {
        path: '/',
        title: '首页',
        meta: {},
      },
      {
        path: '/en-US',
        title: 'Home',
        meta: {},
      },
    ],
    config: {
      locales: [
        { name: 'zh-CN', label: '中文' },
        { name: 'en-US', label: 'English' },
      ],
      menus: {},
      navs: {},
      title: 'test',
      logo: '/',
      mode: 'site' as 'doc' | 'site',
      repository: { branch: 'mater' },
    },
    meta: {},
    menu: [
      {
        title: '分组',
        children: [
          {
            title: 'English',
            path: '/en',
          },
        ],
      },
    ],
    nav: [
      {
        path: '/',
        title: '首页',
        children: [],
      },
      {
        title: '生态',
        children: [
          {
            path: 'https://d.umijs.org',
            title: 'GitHub',
            children: [],
          },
        ],
      },
    ],
    base: '/',
  };
  const baseProps = {
    history,
    location: { ...history.location, query: {} },
    match: { params: {}, isExact: true, path: '/', url: '/' },
    route: { path: '/', routes: baseCtx.routes },
  };

  it('should render site home page', () => {
    const wrapper = ({ children }) => (
      <Context.Provider
        value={{
          ...baseCtx,
          meta: {
            title: 'test',
            hero: {
              title: 'Hero',
              desc: 'Hero Description',
              actions: [{ text: '开始', link: '/' }],
            },
            features: [
              { title: 'Feat', desc: 'Feature' },
              { title: 'Feat2', link: '/' },
            ],
          },
        }}
      >
        {children}
      </Context.Provider>
    );
    const { container, getAllByText, getByText } = render(
      <Router history={history}>
        <Layout {...baseProps}>
          <h1>Home Page</h1>
        </Layout>
      </Router>,
      { wrapper },
    );

    // expect navbar be rendered
    expect(getAllByText('首页')).not.toBeNull();

    // expect content be rendered
    expect(getByText('Home Page')).not.toBeNull();

    // expect hero be rendered
    expect(getByText('Hero')).not.toBeNull();

    // expect features be rendered
    expect(getByText('Feature')).not.toBeNull();
    expect(getByText('Feat2')).not.toBeNull();

    // trigger mobile menu display
    queryByAttribute('class', container, '__dumi-default-navbar-toggle').click();

    // expect sidemenu display for mobile
    expect(queryByAttribute('data-mobile-show', container, 'true')).not.toBeNull();
  });

  it('should render documentation page', async () => {
    const updatedTime = 1604026996000;
    const wrapper = ({ children }) => (
      <Context.Provider
        value={{
          ...baseCtx,
          meta: {
            title: 'test',
            slugs: [{ value: 'Slug A', heading: 'a', depth: 2 }],
            updatedTime,
            filePath: 'temp',
          },
        }}
      >
        {children}
      </Context.Provider>
    );
    const { getByText, getAllByText } = render(
      <Router history={history}>
        <Layout {...baseProps}>
          <h1>Doc</h1>
        </Layout>
      </Router>,
      { wrapper },
    );

    // expect slugs be rendered
    expect(getByText('Slug A')).not.toBeNull();

    // expect footer date show
    expect(new Date(updatedTime).toLocaleString([], { hour12: false })).not.toBeNull();

    // trigger locale change
    getAllByText('English')[0].click();

    // expect location change
    expect(history.location.pathname).toEqual(baseCtx.routes[1].path);
  });

  it('should render builtin components correctly', () => {
    const code = "console.log('Hello World!')";
    const wrapper = ({ children }) => (
      <Context.Provider
        value={{
          ...baseCtx,
          meta: {
            title: 'test',
            slugs: [{ value: 'Slug A', heading: 'a', depth: 2 }],
          },
        }}
      >
        {children}
      </Context.Provider>
    );

    const { getByText, getByTitle, getAllByTitle, container } = render(
      <Router history={history}>
        <Layout {...baseProps}>
          <>
            <a href="" id="btn">
              click
            </a>
            <SourceCode code={code} lang="javascript" />
            <Alert type="info">Alert</Alert>
            <Badge type="info">Badge</Badge>
            <Previewer
              title="demo-1"
              identifier="demo-1"
              sources={{
                _: {
                  jsx: "export default () => 'JavaScript'",
                  tsx: "export default () => 'TypeScript'",
                },
              }}
              dependencies={{}}
            >
              <>demo-1 Content</>
            </Previewer>
            <Previewer
              title="demo-2"
              identifier="demo-2"
              sources={{
                _: {
                  jsx: "export default () => 'Main'",
                },
                'Other.jsx': {
                  import: './Other.jsx',
                  content: "export default () => 'Other'",
                },
              }}
              dependencies={{}}
            >
              <>demo-2 Content</>
            </Previewer>
            <Previewer
              title="demo-3"
              identifier="demo-3"
              sources={{
                _: {
                  jsx: "export default () => 'Main'",
                },
                'Other.jsx': {
                  import: './Other.jsx',
                  content: "export default () => 'Other'",
                },
              }}
              dependencies={{}}
              iframe={100}
            >
              <>demo-3 Content</>
            </Previewer>
            <API identifier="MultipleExports" export="Other" />
          </>
        </Layout>
      </Router>,
      { wrapper },
    );

    // toggle side menu display
    fireEvent(
      container.querySelector('.__dumi-default-navbar-toggle'),
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );

    fireEvent(
      container.querySelector('#btn'),
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );

    // expect SourceCode highlight
    expect(getByText('console')).toHaveClass('token');

    // expect Alert be rendered
    expect(getByText('Alert')).toHaveAttribute('type', 'info');

    // expect Badge be rendered
    expect(getByText('Badge')).toHaveClass('__dumi-default-badge');

    // expect Previewer be rendered
    expect(getByText('demo-1')).not.toBeNull();

    // trigger source code display for demo-1
    getAllByTitle('Toggle source code panel')[0].click();

    // expect show TypeScript code default
    expect(getByText("'TypeScript'")).not.toBeNull();

    // trigger source code display for demo-2
    getAllByTitle('Toggle source code panel')[1].click();

    // expect show code of main file
    expect(getByText("'Main'")).not.toBeNull();

    // trigger file change
    getByText('Other.jsx').click();

    // expect show code of main file
    expect(getByText("'Other'")).not.toBeNull();

    // expect render iframe demo
    (container.querySelector('[data-iframe] button[role=refresh]') as HTMLElement).click();
    expect(container.querySelector('[data-iframe]').innerHTML).not.toContain('demo-3 Content');
    expect(container.querySelector('[data-iframe] iframe')).not.toBeNull();
    expect((container.querySelector('[data-iframe] iframe') as HTMLElement).style.height).toEqual(
      '100px',
    );

    // expect render API property
    expect(getByText('other', { selector: 'table td' })).not.toBeNull();
  });
});
