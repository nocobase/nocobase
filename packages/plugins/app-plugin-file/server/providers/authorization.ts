import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

import { FILE_STORAGE_SETTINGS_ID } from '../../shared/storage-access.js';

const NAMESPACE = '@nocobase/app-plugin-file';

/**
 * Registers the file storage settings item with its one action, `check`, so a role can open the file storage page
 * without being able to write to a disk. The page itself is a client route; the authorization plugin lists it from the
 * route tree. Settings items are placed under administration by default.
 */
export class FileStorageAuthorizationProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = `${NAMESPACE}/authorization`;

  public override boot(): Promise<void> {
    if (!this.app.container.has(authorizationToken)) return Promise.resolve();
    const authz = this.app.container.resolve(authorizationToken);
    authz.settings.add({
      id: FILE_STORAGE_SETTINGS_ID,
      title: { key: 'storage.title', ns: NAMESPACE },
      actions: [
        { name: 'check', title: { key: 'storage.checkAction', ns: NAMESPACE } },
      ],
    });
    return Promise.resolve();
  }
}
