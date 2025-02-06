/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { MockServer, mockServer } from '@nocobase/test';
import { SourceAndTarget, UserInfo } from '../audit-manager';

async function createApp(options: any = {}) {
  const app = mockServer({
    ...options,
    // 还会有些其他参数配置
  });
  // 这里可以补充一些需要特殊处理的逻辑，比如导入测试需要的数据表
  return app;
}

async function startApp() {
  const app = createApp();
  return app;
}

describe('audit manager', () => {
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

  it('register action', () => {
    app.auditManager.registerAction('create');
    expect(app.auditManager.resources).toMatchInlineSnapshot(`
        Map {
          "__default__" => Map {
            "create" => {
              "name": "create",
            },
          },
        }
      `);
  });

  it('register actions with getMetaData and getUserInfo and getresourceUk', () => {
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
    const getUserInfo = () => {
      return new Promise<UserInfo>((resolve, reject) => {
        resolve({
          userId: '1',
        });
      });
    };
    const getSourceAndTarget = () => {
      return new Promise<SourceAndTarget>((resolve, reject) => {
        resolve({
          sourceCollection: 'users',
          sourceRecordUK: '1',
          targetCollection: 'roles',
          targetRecordUK: '2',
        });
      });
    };
    app.auditManager.registerAction({ name: 'create', getMetaData, getUserInfo, getSourceAndTarget });
    expect(app.auditManager.resources).toMatchInlineSnapshot(`
        Map {
          "__default__" => Map {
            "create" => {
              "getMetaData": [Function],
              "getSourceAndTarget": [Function],
              "getUserInfo": [Function],
              "name": "create",
            },
          },
        }
      `);
  });

  it('register actions', () => {
    app.auditManager.registerActions(['create', 'update', 'user:create', 'user:*', 'user:destory', 'role:*']);
    expect(app.auditManager.resources).toMatchInlineSnapshot(`
        Map {
          "__default__" => Map {
            "create" => {
              "name": "create",
            },
            "update" => {
              "name": "update",
            },
          },
          "user" => Map {
            "create" => {
              "name": "user:create",
            },
            "__default__" => {
              "name": "user:*",
            },
            "destory" => {
              "name": "user:destory",
            },
          },
          "role" => Map {
            "__default__" => {
              "name": "role:*",
            },
          },
        }
      `);
  });

  it('register actions with getMetaData', async () => {
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
          "pm" => Map {
            "enable" => {
              "getMetaData": [Function],
              "name": "pm:enable",
            },
            "add" => {
              "name": "pm:add",
            },
          },
        }
    `);
  });

  it('register actions with getUserInfo', async () => {
    const getUserInfo = () => {
      return new Promise<UserInfo>((resolve, reject) => {
        resolve({
          userId: '1',
          roleName: 'test',
        });
      });
    };
    app.auditManager.registerActions(['pm:enable', { name: 'pm:enable', getUserInfo }, 'pm:add']);
    expect(app.auditManager.resources).toMatchInlineSnapshot(`
      Map {
          "pm" => Map {
            "enable" => {
              "getUserInfo": [Function],
              "name": "pm:enable",
            },
            "add" => {
              "name": "pm:add",
            },
          },
        }
    `);
  });

  it('register actions with getSourceAndTarget', async () => {
    const getSourceAndTarget = () => {
      return new Promise<SourceAndTarget>((resolve, reject) => {
        resolve({
          sourceCollection: 'users',
          sourceRecordUK: '1',
          targetCollection: 'roles',
          targetRecordUK: '2',
        });
      });
    };
    app.auditManager.registerActions(['pm:enable', { name: 'pm:enable', getSourceAndTarget }, 'pm:add']);
    expect(app.auditManager.resources).toMatchInlineSnapshot(`
      Map {
          "pm" => Map {
            "enable" => {
              "getSourceAndTarget": [Function],
              "name": "pm:enable",
            },
            "add" => {
              "name": "pm:add",
            },
          },
        }
    `);
  });

  it('getAction', () => {
    app.auditManager.registerActions(['create', 'update', 'user:create', 'user:*', 'user:destory', 'role:*']);
    expect(app.auditManager.resources).toMatchInlineSnapshot(`
      Map {
        "__default__" => Map {
          "create" => {
            "name": "create",
          },
          "update" => {
            "name": "update",
          },
        },
        "user" => Map {
          "create" => {
            "name": "user:create",
          },
          "__default__" => {
            "name": "user:*",
          },
          "destory" => {
            "name": "user:destory",
          },
        },
        "role" => Map {
          "__default__" => {
            "name": "role:*",
          },
        },
      }
    `);

    const action = app.auditManager.getAction('update');
    expect(action).toMatchInlineSnapshot(`
      {
        "name": "update",
      }
    `);

    const action2 = app.auditManager.getAction('user:update');
    expect(action2).toEqual(null);

    const action3 = app.auditManager.getAction('update', 'app');
    expect(action3).toMatchInlineSnapshot(`
      {
        "name": "update",
      }
    `);

    const action4 = app.auditManager.getAction('update', 'role');
    expect(action4).toMatchInlineSnapshot(`
      {
        "name": "role:*",
      }
    `);

    const action5 = app.auditManager.getAction('update', 'user');
    expect(action5).toMatchInlineSnapshot(`
      {
        "name": "user:*",
      }
    `);

    const action6 = app.auditManager.getAction('update', 'department');
    expect(action6).toMatchInlineSnapshot(`
      {
        "name": "update",
      }
    `);

    const action7 = app.auditManager.getAction('destory');
    expect(action7).toEqual(null);
  });

  it('getAction priority', () => {
    app.auditManager.registerActions(['list']);
    const action8 = app.auditManager.getAction('list', 'department');
    expect(action8).toMatchInlineSnapshot(`
      {
        "name": "list",
      }
    `);

    app.auditManager.registerActions(['department:*']);
    const action9 = app.auditManager.getAction('list', 'department');
    expect(action9).toMatchInlineSnapshot(`
      {
        "name": "department:*",
      }
    `);

    app.auditManager.registerActions(['department:list']);
    const action10 = app.auditManager.getAction('list', 'department');
    expect(action10).toMatchInlineSnapshot(`
      {
        "name": "department:list",
      }
    `);
  });

  it('getAction default', () => {
    app.auditManager.registerActions(['users:updateProfile', 'update']);
    expect(app.auditManager.resources).toMatchInlineSnapshot(`
      Map {
        "users" => Map {
          "updateProfile" => {
            "name": "users:updateProfile",
          },
        },
        "__default__" => Map {
          "update" => {
            "name": "update",
          },
        },
      }
    `);
    const action = app.auditManager.getAction('update', 'users');
    expect(action).toMatchInlineSnapshot(`
      {
        "name": "update",
      }
    `);
  });
});
