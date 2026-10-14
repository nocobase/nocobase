import { readFile } from 'node:fs/promises';
import { AppCommand, appPath, CommandError } from '@nocobase/app-cli';
import { Flags } from '@oclif/core';
import type { Knex } from 'knex';

/** Applies a reviewed, machine-provable inventory through the existing seed transaction and ledger. */
export default class AccessUpgradeApply extends AppCommand {
  static override summary =
    'Apply the Studio access upgrade from an exact equivalence inventory in maintenance.';
  static override flags = {
    'dry-run': Flags.boolean({
      description:
        'Revalidate the exact inventory without running seeds or writing data.',
    }),
    file: appPath({
      required: true,
      description: 'JSON inventory saved by app access-upgrade prepare --json.',
    }),
  };
  override async run() {
    const { flags } = await this.parse(AccessUpgradeApply);
    const saved: unknown = JSON.parse(await readFile(flags.file, 'utf8'));
    const envelope = saved as {
      result?: { keyInventoryHash?: string };
      keyInventoryHash?: string;
    };
    const expected =
      envelope.result?.keyInventoryHash ?? envelope.keyInventoryHash;
    if (typeof expected !== 'string')
      throw new CommandError(
        'The file must contain a prepared key inventory hash.',
        { code: 'INVALID_INVENTORY' },
      );
    const { databaseManagerToken, createSeeder } = await import('@nocobase/db');
    const { readStudioKeyInventory, studioKeyInventoryHash } =
      await import('../../../database/main/seeds/202610250020_studio_access_v2.js');
    return this.withApp(async ({ app }) => {
      if (app.config.get<boolean>('studio.accessUpgrade.maintenance') !== true)
        throw new CommandError(
          'Stop all writers and enable maintenance before applying.',
          { code: 'STUDIO_ACCESS_MAINTENANCE_REQUIRED' },
        );
      app.registerProviders();
      const database = app.container.resolve(databaseManagerToken);
      const root =
        app.config.get<string>('authorization.permissionSets.rootSet') ??
        'root';
      const member =
        app.config.get<string>('authorization.permissionSets.defaultSet') ??
        'member';
      const current = await readStudioKeyInventory(
        database.connection(),
        root,
        member,
      );
      if (studioKeyInventoryHash(current) !== expected)
        throw new CommandError(
          'The key scope, subject grants or assignments changed; prepare again.',
          { code: 'STUDIO_KEY_INVENTORY_CONFLICT' },
        );
      if (current.some((key) => key.status === 'review-required'))
        throw new CommandError(
          'This inventory contains unresolved delegation differences.',
          {
            code: 'STUDIO_KEY_REVIEW_REQUIRED',
            details: current.filter((key) => key.status === 'review-required'),
          },
        );
      if (flags['dry-run']) {
        this.setStatus('success-noop');
        return { keyInventoryHash: expected, keyInventory: current };
      }
      // The seed recomputes the hash again inside its task lock and transaction, before any write.
      const client = await database.connection().client<Knex>();
      const logger = client.client.logger;
      const warn = logger.warn;
      // Knex's MySQL returning warning normally writes to stdout; keep JSON output a single document.
      logger.warn = (message: string) => this.logToStderr(message);
      try {
        const result = await createSeeder({
          database,
          connection: 'main',
          sources: [
            {
              directory: app.paths.root('database/main/seeds'),
              packageName: '@nocobase/studio',
            },
          ],
          config: {
            get<T>(key: string): T | undefined {
              return key === 'studio.accessUpgrade.expectedKeyInventoryHash'
                ? (expected as T)
                : app.config.get<T>(key);
            },
          },
        }).run();
        return result;
      } finally {
        logger.warn = warn;
      }
    });
  }
}
