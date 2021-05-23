import Mock from 'mockjs';

export async function getAccessible(req: any, res: any) {
  res.json({
    data: [
      {
        type: 'redirect',
        from: '/admin',
        to: '/admin/welcome',
        exact: true,
      },
      {
        type: 'redirect',
        from: '/',
        to: '/admin',
        exact: true,
      },
      {
        path: '/admin/:name(.+)?',
        component: 'AdminLayout',
        title: `后台 - ${Mock.mock('@string')}`,
        // providers: ['CurrentUserProvider', 'MenuProvider'],
      },
      {
        component: 'AuthLayout',
        routes: [
          {
            name: 'login',
            path: '/login',
            component: 'PageTemplate',
            title: `登录 - ${Mock.mock('@string')}`,
          },
          {
            name: 'register',
            path: '/register',
            component: 'PageTemplate',
            title: `注册 - ${Mock.mock('@string')}`,
          },
        ],
      },
    ],
  });
}

export async function getMenu(req: any, res: any) {
  res.json({
    data: [
      {
        name: 'welcome',
        title: `欢迎 - ${Mock.mock('@string')}`,
        children: [
          {
            name: 'page2',
            title: '页面2',
          },
        ],
      },
      {
        name: 'users',
        title: `用户 - ${Mock.mock('@string')}`,
      },
    ],
  });
}

export async function getPage(req: any, res: any) {
  const fields = [
    {
      interface: 'string',
      type: 'string',
      title: `单行文本 - ${Mock.mock('@string')}`,
      name: 'input',
      required: true,
      component: {
        type: 'string',
        default: 'aa',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        'x-component-props': {},
      },
    },
    {
      interface: 'textarea',
      type: 'text',
      title: `多行文本框 - ${Mock.mock('@string')}`,
      name: 'textarea',
      required: true,
      component: {
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input.TextArea',
        'x-component-props': {},
      },
    },
  ];
  res.json({
    data: {
      title: `page - ${req.query.slug} - ${Mock.mock('@string')}`,
      blocks: [
        {
          interface: 'form',
          type: 'form',
          component: {
            'x-component': 'Form',
          },
          fields,
        },
        {
          interface: 'table',
          type: 'table',
          component: {
            'x-component': 'Table',
          },
          fields,
        },
        {
          interface: 'calendar',
          type: 'calendar',
          component: {
            'x-component': 'Calendar',
          },
        },
        {
          interface: 'kanban',
          type: 'kanban',
          component: {
            'x-component': 'Kanban',
          },
        },
        {
          interface: 'grid',
          type: 'grid',
          component: {
            'x-component': 'Grid',
          },
          rowProps: {
            gutter: 16,
          },
          colsProps: [12, 12],
          blocks: [
            {
              interface: 'markdown',
              type: 'markdown',
              component: {
                'x-component': 'Markdown',
              },
              content: `# Markdown Content 1`,
              rowOrder: 1,
              columnOrder: 1,
            },
            {
              interface: 'markdown',
              type: 'markdown',
              component: {
                'x-component': 'Markdown',
              },
              content: `# Markdown Content 2`,
              rowOrder: 2,
              columnOrder: 2,
            },
            {
              interface: 'markdown',
              type: 'markdown',
              component: {
                'x-component': 'Markdown',
              },
              content: `# Markdown Content 1`,
              rowOrder: 1,
              columnOrder: 2,
            },
          ],
        },
        {
          interface: 'markdown',
          type: 'markdown',
          component: {
            'x-component': 'Markdown',
          },
          content: `# Markdown Content`,
        },
      ],
    },
  });
}
