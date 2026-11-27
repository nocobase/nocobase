import { I18nRuntime } from '@nocobase/i18n';
import { expect, it } from 'vitest';
import clientLocales from '../../../client/locales/index.js';
import serverLocales from '../../../locales/index.js';
import { authAuditOptions } from '../../audit.js';

const namespace = '@nocobase/app-plugin-authentication';
const historicalKey = 'audit.operations.signIn';

it.each([
  { side: 'server', loaders: serverLocales },
  { side: 'client', loaders: clientLocales },
])(
  'resolves historical and new sign-in names on the $side',
  async ({ loaders }) => {
    const email = authAuditOptions('/sign-in/email');
    const username = authAuditOptions('/sign-in/username');
    if (!email || !username)
      throw new Error('Expected both sign-in declarations');
    expect(email).toMatchObject({
      action: 'auth:signIn',
      operationName: {
        ns: namespace,
        key: 'audit.operations.signInWithEmail',
        defaultValue: 'Sign in with email',
      },
    });
    expect(username).toMatchObject({
      action: 'auth:signIn',
      operationName: {
        ns: namespace,
        key: 'audit.operations.signInWithUsername',
        defaultValue: 'Sign in with a username',
      },
    });

    const runtime = new I18nRuntime({
      defaultLocale: 'en-US',
      locales: ['en-US', 'zh-CN'],
    });
    runtime.registerNamespace(namespace, loaders);
    await runtime.init('en-US');

    const names = () => {
      const translate = runtime.getFixedT(namespace);
      return [
        translate(historicalKey),
        translate('audit.operations.signInWithEmail'),
        translate('audit.operations.signInWithUsername'),
      ];
    };
    expect(names()).toEqual([
      'Sign in',
      'Sign in with email',
      'Sign in with a username',
    ]);
    await runtime.changeLanguage('zh-CN');
    expect(names()).toEqual(['登录', '使用邮箱登录', '使用用户名登录']);
  },
);
