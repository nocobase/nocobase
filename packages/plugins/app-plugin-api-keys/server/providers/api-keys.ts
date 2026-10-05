import { authenticationToken } from '@nocobase/app-plugin-authentication/server';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { apiDocsToken } from '@nocobase/app-server/router';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  createApiKeyApiDocsAccess,
  createApiKeySecurityFragment,
} from '../api-docs.js';

/**
 * Lets a request carrying a valid API key read the application's API documentation, and adds the API key header to
 * the document as a security scheme.
 */
export class ApiKeysProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-api-keys';

  public override async boot(): Promise<void> {
    const { container } = this.app;
    if (!container.has(apiDocsToken) || !container.has(authenticationToken))
      return;
    const apiDocs = container.resolve(apiDocsToken);
    const resolveAuth = () => container.resolve(authenticationToken);
    apiDocs.addAccess(createApiKeyApiDocsAccess(resolveAuth));
    // Resolved on the first request for the document, like the access check, so starting the application builds nothing.
    apiDocs.addFragment(() => createApiKeySecurityFragment(resolveAuth));
  }
}
