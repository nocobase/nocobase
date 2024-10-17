/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';
import { MockServer, mockServer } from '@nocobase/test';

async function createApp(options: any = {}) {
  const app = mockServer({
    ...options,
    plugins: ['audit-logger'],
    // 还会有些其他参数配置
  });
  // 这里可以补充一些需要特殊处理的逻辑，比如导入测试需要的数据表
  return app;
}

async function startApp() {
  const app = createApp();
  return app;
}

describe('auditManager', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await startApp();
  });

  afterEach(async () => {
    // 运行测试后，清空数据库
    await app.destroy();
    // 只停止不清空数据库
    await app.stop();
  });

  it('audit manager register action', () => {
    app.auditManager.registerAction('create');
    expect(app.auditManager.resources).toMatchInlineSnapshot(`
        Map {
          "create" => Map {
            "*" => "create",
          },
        }
      `);
  }),
    it('audit manager register actions', () => {
      app.auditManager.registerActions(['update', 'app:restart', 'pm:update']);

      expect(app.auditManager.resources).toMatchInlineSnapshot(`
        Map {
          "update" => Map {
            "pm" => "update",
          },
          "restart" => Map {
            "app" => "restart",
          },
        }
    `);
    }),
    it('audit manager register actions with getMetaData', async () => {
      const getMetaData = () => {
        return new Promise((resolve, reject) => {
          resolve({
            request: {
              params: {
                testData: 'testParamData',
              },
              body: {
                testBody: 'testBodyData',
              },
            },
            response: {
              body: {
                testBody: 'testBody',
              },
            },
          });
        });
      };
      app.auditManager.registerActions(['pm:enable', { name: 'pm:enable', getMetaData }, 'pm:add']);

      expect(app.auditManager.resources).toMatchInlineSnapshot(`
      Map {
          "enable" => Map {
            "pm" => {
              "getMetaData": [Function],
              "name": "enable",
            },
          },
          "add" => Map {
            "pm" => "add",
          },
        }
    `);

      // await app.runCommand('pm', 'enable', '@nocobase/plugin-acl');

      const middleware = app.auditManager.middleware();
      const ctx = {
        db: app.db,
        action: {
          actionName: 'enable',
          resourceName: 'pm',
          resourceId: 'acl',
          params: {},
        },
        request: {
          header: {},
        },
        response: {
          status: 200,
        },
      };

      let err;
      try {
        await middleware(ctx, () => {});
      } catch (e) {
        err = e;
      }

      app.auditManager.setLogger({
        // 记录方法，输出日志文件和写入文件日志表
        async log(auditLog: any) {
          const { metadata } = auditLog;
          expect(metadata).toMatchInlineSnapshot(`
          {
            "request": {
              "body": {
                "testBody": "testBodyData",
              },
              "params": {
                "testData": "testParamData",
              },
            },
            "response": {
              "body": {
                "testBody": "testBody",
              },
            },
          }
        `);
        },
      });
    });
});
