import { AppCommand } from '@nocobase/app-cli';
import { databaseManagerToken } from '@nocobase/db';
import { prepareStudioAccessUpgrade } from '../../../server/access/upgrade-preflight.js';
import { isApiKeySet } from '../../../server/access/api-keys.js';

/** Offline preflight under the same local administrative boundary as `db apply`. */
export default class AccessUpgradePrepare extends AppCommand {
  static override summary =
    'Inspect the Studio access upgrade without starting or migrating the application.';
  static override description =
    'Requires local access to the application configuration and database, like db apply. Reads role grants and non-secret verification summaries only; never starts jobs, applies seeds, or changes data. Use --json to save the inventory before an authorized maintenance window.';

  override async run() {
    await this.parse(AccessUpgradePrepare);
    return this.withApp(async ({ app }) => {
      app.registerProviders();
      const rootSet =
        app.config.get<string>('authorization.permissionSets.rootSet') ??
        'root';
      const defaultSet =
        app.config.get<string>('authorization.permissionSets.defaultSet') ??
        'member';
      const result = await prepareStudioAccessUpgrade(
        app.container.resolve(databaseManagerToken).connection(),
        {
          isRole: (key) =>
            key !== rootSet && key !== defaultSet && !isApiKeySet(key),
        },
      );
      this.log(JSON.stringify(result, null, 2));
      return result;
    });
  }
}
