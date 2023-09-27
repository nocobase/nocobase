import { Application } from '../Application';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

describe('SettingsCenter', () => {
  let app: Application;

  const test = {
    title: 'test title',
    Component: () => null,
  };

  const test1 = {
    title: 'test1 title',
    Component: () => null,
  };

  const test2 = {
    title: 'test2 title',
    Component: () => null,
  };

  beforeAll(() => {
    const mock = new MockAdapter(axios);
    mock.onGet('pm:listEnabled').reply(200, {
      data: [],
    });
  });

  beforeEach(() => {
    app = new Application({});
  });

  it('basic use', () => {
    const name = 'test';

    app.settingsCenter.add(name, test);

    const settingRes = { ...test, name };
    const getRes = {
      ...test,
      name,
      label: test.title,
      path: '/admin/settings/test',
      isAllow: true,
      aclSnippet: 'pm.test',
      key: name,
      children: undefined,
    };
    expect(app.settingsCenter.getSetting('test')).toContain(settingRes);
    expect(app.settingsCenter.get('test')).toContain(getRes);
    expect(app.settingsCenter.hasAuth('test')).toBeTruthy();
    const list = app.settingsCenter.getList();
    expect(list.length).toBe(1);
    expect(list[0]).toContain(getRes);
  });

  it('multi', () => {
    app.settingsCenter.add('test1', test1);
    app.settingsCenter.add('test2', test2);
    expect(app.settingsCenter.get('test1')).toContain(test1);
    expect(app.settingsCenter.get('test2')).toContain(test2);

    const list = app.settingsCenter.getList();
    expect(list.length).toBe(2);
    expect(list[0]).toContain(test1);
    expect(list[1]).toContain(test2);
  });

  it('nested', () => {
    app.settingsCenter.add('test1', test1);
    app.settingsCenter.add('test1.test2', test2);
    expect(app.settingsCenter.get('test1')).toContain(test1);
    expect(app.settingsCenter.get('test1.test2')).toContain(test2);
    expect(app.settingsCenter.get('test1').children.length).toBe(1);
    expect(app.settingsCenter.get('test1').children[0]).toContain(test2);
  });

  it('remove', () => {
    app.settingsCenter.add('test1', test1);
    app.settingsCenter.add('test1.test2', test2);

    app.settingsCenter.remove('test1');
    expect(app.settingsCenter.get('test1')).toBeFalsy();
    expect(app.settingsCenter.get('test1.test2')).toBeFalsy();
    expect(app.settingsCenter.getList().length).toBe(0);
  });

  it('acl', () => {
    app.settingsCenter.setAclSnippets(['!pm.test']);
    app.settingsCenter.add('test', test);
    expect(app.settingsCenter.get('test')).toBeFalsy();
    expect(app.settingsCenter.hasAuth('test')).toBeFalsy();
    expect(app.settingsCenter.get('test', false)).toContain({ ...test, isAllow: false });

    expect(app.settingsCenter.getList().length).toBe(0);
    expect(app.settingsCenter.getList(false).length).toBe(1);
    expect(app.settingsCenter.getList(false)[0]).toContain({ ...test, isAllow: false });
  });

  it('has', () => {
    app.settingsCenter.add('test', test);
    expect(app.settingsCenter.has('test')).toBeTruthy();
    expect(app.settingsCenter.has('test1')).toBeFalsy();
  });

  it('getAclSnippet', () => {
    app.settingsCenter.add('test1', test1);
    app.settingsCenter.add('test2', {
      ...test2,
      aclSnippet: 'any.string',
    });
    expect(app.settingsCenter.getAclSnippet('test1')).toBe('pm.test1');
    expect(app.settingsCenter.getAclSnippet('test2')).toBe('any.string');
  });

  it('getRouteName', () => {
    app.settingsCenter.add('test1', test1);
    app.settingsCenter.add('test1.test2', test2);
    expect(app.settingsCenter.getRouteName('test1')).toBe('admin.settings.test1');
    expect(app.settingsCenter.getRouteName('test1.test2')).toBe('admin.settings.test1.test2');
  });

  it('getRoutePath', () => {
    app.settingsCenter.add('test1', test1);
    app.settingsCenter.add('test1.test2', test2);
    expect(app.settingsCenter.getRoutePath('test1')).toBe('/admin/settings/test1');
    expect(app.settingsCenter.getRoutePath('test1.test2')).toBe('/admin/settings/test1/test2');
  });

  it('router', () => {
    app.settingsCenter.add('test1', test1);
    app.settingsCenter.add('test1.test2', test2);
    expect(app.router.getRoutes()[0]).toMatchInlineSnapshot(`
      {
        "children": [
          {
            "children": undefined,
            "element": <Component />,
            "path": "/admin/settings/test1/test2",
          },
        ],
        "element": <Component />,
        "path": "/admin/settings/test1",
      }
    `);
  });
});
