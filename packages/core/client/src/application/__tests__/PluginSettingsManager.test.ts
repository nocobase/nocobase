import { Application } from '../Application';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

describe('PluginSettingsManager', () => {
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

    app.pluginSettingsManager.add(name, test);

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
    expect(app.pluginSettingsManager.getSetting('test')).toMatchObject(settingRes);
    expect(app.pluginSettingsManager.get('test')).toMatchObject(getRes);
    expect(app.pluginSettingsManager.hasAuth('test')).toBeTruthy();
    const list = app.pluginSettingsManager.getList();
    expect(list.length).toBe(1);
    expect(list[0]).toMatchObject(getRes);
  });

  it('constructor init', () => {
    const app = new Application({
      pluginSettings: {
        test: test,
      },
    });
    const name = 'test';
    const settingRes = { ...test, name };
    expect(app.pluginSettingsManager.getSetting('test')).toMatchObject(settingRes);
  });

  it('multi', () => {
    app.pluginSettingsManager.add('test1', test1);
    app.pluginSettingsManager.add('test2', test2);
    expect(app.pluginSettingsManager.get('test1')).toMatchObject(test1);
    expect(app.pluginSettingsManager.get('test2')).toMatchObject(test2);
    const list = app.pluginSettingsManager.getList();
    expect(list.length).toBe(2);
    expect(list[0]).toMatchObject(test1);
    expect(list[1]).toMatchObject(test2);
  });

  it('nested', () => {
    app.pluginSettingsManager.add('test1', test1);
    app.pluginSettingsManager.add('test1.test2', test2);
    expect(app.pluginSettingsManager.get('test1')).toMatchObject(test1);
    expect(app.pluginSettingsManager.get('test1.test2')).toMatchObject(test2);
    expect(app.pluginSettingsManager.get('test1').children.length).toBe(1);
    expect(app.pluginSettingsManager.get('test1').children[0]).toMatchObject(test2);
  });

  it('remove', () => {
    app.pluginSettingsManager.add('test1', test1);
    app.pluginSettingsManager.add('test1.test2', test2);

    app.pluginSettingsManager.remove('test1');
    expect(app.pluginSettingsManager.get('test1')).toBeFalsy();
    expect(app.pluginSettingsManager.get('test1.test2')).toBeFalsy();
    expect(app.pluginSettingsManager.getList().length).toBe(0);
  });

  it('has', () => {
    app.pluginSettingsManager.add('test', test);
    expect(app.pluginSettingsManager.has('test')).toBeTruthy();
    expect(app.pluginSettingsManager.has('test1')).toBeFalsy();
  });

  it('acl', () => {
    app.pluginSettingsManager.setAclSnippets(['!pm.test']);
    app.pluginSettingsManager.add('test', test);

    expect(app.pluginSettingsManager.get('test')).toBeFalsy();
    expect(app.pluginSettingsManager.hasAuth('test')).toBeFalsy();
    expect(app.pluginSettingsManager.has('test')).toBeFalsy();

    expect(app.pluginSettingsManager.get('test', false)).toMatchObject({
      ...test,
      isAllow: false,
    });
    expect(app.pluginSettingsManager.getList(false).length).toBe(1);
    expect(app.pluginSettingsManager.getList(false)[0]).toMatchObject({
      ...test,
      isAllow: false,
    });
  });

  it('getAclSnippet()', () => {
    app.pluginSettingsManager.add('test1', test1);
    app.pluginSettingsManager.add('test2', {
      ...test2,
      aclSnippet: 'any.string',
    });
    expect(app.pluginSettingsManager.getAclSnippet('test1')).toBe('pm.test1');
    expect(app.pluginSettingsManager.getAclSnippet('test2')).toBe('any.string');
  });

  it('getAclSnippets()', () => {
    app.pluginSettingsManager.add('test', test);
    app.pluginSettingsManager.add('test1', test1);

    expect(app.pluginSettingsManager.getAclSnippets()).toEqual(['pm.test', 'pm.test1']);
  });

  it('getRouteName()', () => {
    app.pluginSettingsManager.add('test1', test1);
    app.pluginSettingsManager.add('test1.test2', test2);
    expect(app.pluginSettingsManager.getRouteName('test1')).toBe('admin.settings.test1');
    expect(app.pluginSettingsManager.getRouteName('test1.test2')).toBe('admin.settings.test1.test2');
  });

  it('getRoutePath()', () => {
    app.pluginSettingsManager.add('test1', test1);
    app.pluginSettingsManager.add('test1.test2', test2);
    expect(app.pluginSettingsManager.getRoutePath('test1')).toBe('/admin/settings/test1');
    expect(app.pluginSettingsManager.getRoutePath('test1.test2')).toBe('/admin/settings/test1/test2');
  });

  it('router', () => {
    app.pluginSettingsManager.add('test1', test1);
    app.pluginSettingsManager.add('test1.test2', test2);
    expect(app.router.getRoutesTree()[0]).toMatchInlineSnapshot(`
      {
        "children": undefined,
        "element": <AppNotFound />,
        "path": "*",
      }
    `);
  });

  it('When icon is a string, it will be converted to the Icon component', () => {
    const name = 'test';
    const icon = 'test-icon';
    app.pluginSettingsManager.add(name, {
      ...test,
      icon,
    });
    expect(app.pluginSettingsManager.get(name).icon).toMatchInlineSnapshot(`
      <Icon
        type="test-icon"
      />
    `);
  });
});
