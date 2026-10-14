import { expect, test as base } from '@playwright/test';

import { apiAs, unique, url } from './support/fixtures.ts';

interface SignInUser {
  readonly email: string;
  readonly username: string;
  readonly password: string;
}

const test = base.extend<{ signInUser: SignInUser }>({
  signInUser: async ({ browser }, use) => {
    // Server preferences follow the account across browsers; demo users are shared with other flows.
    const suffix = unique();
    const user = {
      email: `sign-in-${suffix}@example.com`,
      username: `signin${suffix}`,
      password: 'sign-in-e2e-password',
    };
    const admin = await apiAs(browser, 'admin');
    try {
      await admin.api.post('users', {
        ...user,
        name: 'Sign-in test user',
        roleScopes: { studio: ['contributor'] },
      });
    } finally {
      await admin.close();
    }
    await use(user);
  },
});

test.describe('sign-in', () => {
  test('signing in from root lands on inbox', async ({ page, signInUser }) => {
    await page.goto(url('/'));
    await expect(page).toHaveURL(/\/login/);
    await page
      .getByRole('textbox', { name: '用户名或邮箱' })
      .fill(signInUser.email);
    await page.getByRole('textbox', { name: '密码' }).fill(signInUser.password);
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(url('/inbox'));
    await expect(
      page.getByRole('heading', { name: '收件箱', level: 1 }),
    ).toBeVisible();
  });
  test('a signed-out visitor is sent to the sign-in page and signs in as a contributor', async ({
    page,
    signInUser,
  }) => {
    await page.goto(url('/issues'));
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole('heading', { name: /^登录 /, level: 1 }),
    ).toBeVisible();

    await page
      .getByRole('textbox', { name: '用户名或邮箱' })
      .fill(signInUser.email);
    await page.getByRole('textbox', { name: '密码' }).fill(signInUser.password);
    await page.getByRole('button', { name: '登录' }).click();

    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByRole('navigation', { name: '应用导航' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: '打开账户菜单' }),
    ).toBeVisible();
  });

  test('a wrong password keeps the visitor on the sign-in page', async ({
    page,
    signInUser,
  }) => {
    await page.goto(url('/login'));
    await page
      .getByRole('textbox', { name: '用户名或邮箱' })
      .fill(signInUser.email);
    await page.getByRole('textbox', { name: '密码' }).fill('not-the-password');
    await page.getByRole('button', { name: '登录' }).click();

    // The server's error code, in the person's language; never the response's status text.
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      '邮箱或密码不正确。',
    );
    await expect(page).toHaveURL(/\/login/);
  });

  test('signing in with a username works too, and signing out returns to the sign-in page', async ({
    page,
    signInUser,
  }) => {
    await page.goto(url('/login'));
    await page
      .getByRole('textbox', { name: '用户名或邮箱' })
      .fill(signInUser.username);
    await page.getByRole('textbox', { name: '密码' }).fill(signInUser.password);
    await page.getByRole('button', { name: '登录' }).click();
    await expect(
      page.getByRole('button', { name: '打开账户菜单' }),
    ).toBeVisible();

    await page.getByRole('button', { name: '打开账户菜单' }).click();
    await page.getByRole('menuitem', { name: /退出登录/ }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test.describe('in English', () => {
    test('a wrong username or password is explained in English', async ({
      page,
      signInUser,
    }) => {
      // The language this browser chose (`@nocobase/app-client`'s stored locale); the server defaults to zh-CN.
      await page.addInitScript(
        "localStorage.setItem('nocobase.locale', 'en-US')",
      );
      await page.goto(url('/login'));
      await page
        .getByRole('textbox', { name: 'Username or email' })
        .fill(signInUser.username);
      await page.getByRole('textbox', { name: 'Password' }).fill('nope-nope');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page.getByRole('main').getByRole('alert')).toHaveText(
        'Incorrect username or password.',
      );
    });
  });
});
