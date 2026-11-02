import type { TestApp } from '@nocobase/app-testing/server';
import { CookieJar } from 'jsdom';

/** Apply browser cookie path and expiry rules, including across applications sharing the same origin. */
export class Visitor {
  constructor(
    private readonly app: TestApp,
    readonly cookies = new CookieJar(),
  ) {}

  async request(
    path: string,
    method = 'GET',
    body?: unknown,
    origin = 'http://localhost',
  ): Promise<Response> {
    const serverOrigin =
      this.app.application.config.get<string>('app.publicOrigin') ??
      'http://localhost';
    const url = `${serverOrigin}${this.app.publicBasePath}/api${path}`;
    const response = await this.app.request(url, {
      method,
      headers: {
        origin,
        cookie: this.cookies.getCookieStringSync(url),
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    for (const header of response.headers.getSetCookie())
      this.cookies.setCookieSync(header, url);
    return response;
  }

  async signIn(): Promise<string> {
    const response = await this.request(
      '/demoMode/accounts/signInDefault',
      'POST',
    );
    if (response.status !== 200)
      throw new Error(`Sign-in failed: ${await response.text()}`);
    return (await (await this.request('/auth/get-session')).json()).user.id;
  }

  async preferences(): Promise<Record<string, unknown>> {
    const response = await this.request('/users/me/preferences');
    if (response.status !== 200)
      throw new Error(`Preferences failed: ${await response.text()}`);
    return (await response.json()).data;
  }
}
