import { driveManagerToken } from '@nocobase/app-server/drive';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';
import {
  ServerFileRepositoryManager,
  type FileDriveConfig,
} from '../repository.js';
import { serverFileRepositoryManagerToken } from '../token.js';

export class FileRepositoryServiceProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-file';
  public override register(): void {
    this.app.container.singleton(
      serverFileRepositoryManagerToken,
      (container) =>
        new ServerFileRepositoryManager(
          container.resolve(databaseManagerToken),
          container.resolve(driveManagerToken),
          this.app.config?.get<FileDriveConfig>('drive'),
          configuredConnections(
            this.app.config?.get<{
              default?: unknown;
              connections?: Record<string, unknown>;
            }>('database'),
          ),
        ),
    );
  }
}
/** The configured connection names, the default first, so every connection's file Collections are checked. */
function configuredConnections(
  database:
    { default?: unknown; connections?: Record<string, unknown> } | undefined,
): string[] | undefined {
  const names = Object.keys(database?.connections ?? {});
  if (names.length === 0) return undefined;
  const first =
    typeof database?.default === 'string' ? database.default : undefined;
  return first && names.includes(first)
    ? [first, ...names.filter((name) => name !== first)]
    : names;
}

const serviceProviders: readonly (typeof FileRepositoryServiceProvider)[] = [
  FileRepositoryServiceProvider,
];
export default serviceProviders;
