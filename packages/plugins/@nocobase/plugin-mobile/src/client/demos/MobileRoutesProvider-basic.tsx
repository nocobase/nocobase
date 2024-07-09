import React from 'react';
import { Plugin } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import {
  MobileTitleProvider,
  useMobileTitle,
  MobileRoutesProvider,
  useMobileRoutes,
} from '@nocobase/plugin-mobile/client';

const InnerPage = () => {
  const { routeList } = useMobileRoutes();
  const { title } = useMobileTitle();
  return (
    <div>
      <h1>{title}</h1>
      <div>{routeList.length}</div>
    </div>
  );
};

const Demo = () => {
  return (
    <MobileTitleProvider>
      <MobileRoutesProvider>
        <InnerPage />
      </MobileRoutesProvider>
    </MobileTitleProvider>
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/page' });
    this.app.router.add('root.test', { path: '/page/test', Component: Demo });
  }
}

const app = mockApp({
  router: {
    type: 'memory',
    initialEntries: ['/page/test'],
  },
  plugins: [DemoPlugin],
  apis: {
    'mobileRoutes:list': {
      data: [
        {
          "id": 10,
          "createdAt": "2024-07-08T13:22:33.763Z",
          "updatedAt": "2024-07-08T13:22:33.763Z",
          "parentId": null,
          "title": "Test1",
          "icon": "AppstoreOutlined",
          "schemaUid": "test",
          "type": "page",
          "options": null,
          "sort": 1,
          "createdById": 1,
          "updatedById": 1,
        },
        {
          "id": 13,
          "createdAt": "2024-07-08T13:23:01.929Z",
          "updatedAt": "2024-07-08T13:23:12.433Z",
          "parentId": null,
          "title": "Test2",
          "icon": "aliwangwangoutlined",
          "schemaUid": null,
          "type": "link",
          "options": {
            "schemaUid": null,
            "url": "https://github.com",
            "params": [
              {}
            ]
          }
        }
      ],
    },
  },
});

export default app.getRootComponent();
