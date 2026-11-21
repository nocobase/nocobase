import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import { driveManagerToken } from '@nocobase/app-server/drive';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import type { AppDriveConfig } from '@nocobase/drive';
import { Hono } from 'hono';

import {
  FILE_STORAGE_CHECK,
  FILE_STORAGE_PAGE,
} from '../shared/storage-access.js';
import {
  describeDisks,
  runCheck,
  type CheckResult,
  type DiskDescription,
} from './storage.js';
import {
  CheckResultSchema,
  DiskParams,
  FileStorageSchema,
} from './storage-schemas.js';
import { serverFileRepositoryManagerToken } from './token.js';
import { defaultDiskOf } from './usages.js';

/** The plugin's namespace: the first segment of its routes and the `domain` of its errors. */
const DOMAIN = 'file';
const tags = ['File'];

const accessDescription =
  'Requires the `page:file-storage/access` grant; without it the route answers 403 `FILE_STORAGE_ACCESS_REQUIRED`.';

interface LayeredConfig {
  layers?(): {
    readonly defaults: Record<string, unknown>;
    readonly overrides: Record<string, unknown>;
  };
}

/**
 * The file storage settings routes. Both require the file storage page grant; the check, which writes to a disk, also
 * requires the `check` action of the `file-storage` settings item. Applications without the authentication and
 * authorization plugins get no routes, since nothing could guard them.
 */
export const storageRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes((app: AppPluginApplication) => {
    const root = new Hono();
    const router = new Hono<AuthorizationEnv>();
    const { container } = app;
    if (
      !container.has(authenticationToken) ||
      !container.has(authorizationToken)
    )
      return root;
    const authentication = container.resolve(authenticationToken);
    const authorization = container.resolve(authorizationToken);
    // The latest check of each disk on this instance. A restart forgets them: the page then shows "not checked".
    const checks = new Map<string, CheckResult>();

    const disks = (): DiskDescription[] => {
      const drive = app.config.get<AppDriveConfig>('drive');
      const loaded = container.has(driveManagerToken)
        ? Object.keys(container.resolve(driveManagerToken).limits)
        : [];
      return describeDisks({
        drive,
        layers: (app.config as LayeredConfig).layers?.(),
        rootDir: app.paths.rootDir,
        loaded,
      });
    };

    router.onError((error, context) => apiErrorHandler(error, context));
    router.use(
      '/file/*',
      authentication.required(),
      authorization.middleware(),
      async (context, next) => {
        const allowed = await context.get('authz').can(FILE_STORAGE_PAGE);
        if (!allowed)
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            reason: 'FILE_STORAGE_ACCESS_REQUIRED',
            domain: DOMAIN,
            message: 'File storage access is required.',
          });
        await next();
      },
    );

    router.get(
      '/file/storage',
      describeRoute({
        tags,
        summary: 'Describe the file storage',
        operationId: 'fileGetStorage',
        description: `Lists the disks the application's \`drive\` configuration declares and the features that store files, with how many files each holds. Disk locations are summaries: no credential, secret or absolute path on the server is included. ${accessDescription}`,
        responses: {
          200: dataResponse(FileStorageSchema),
          ...apiErrorResponses,
        },
      }),
      async (context) => {
        const manager = container.has(serverFileRepositoryManagerToken)
          ? container.resolve(serverFileRepositoryManagerToken)
          : undefined;
        const usages = manager?.describeUsages() ?? [];
        // One aggregate per feature, in parallel; a feature whose count fails shows no figures and leaves the rest.
        const stats = await Promise.allSettled(
          usages.map((usage) =>
            manager!.usageStats({
              collection: usage.collection,
              connection: usage.connection ?? undefined,
            }),
          ),
        );
        stats.forEach((result, index) => {
          if (result.status === 'rejected')
            console.error(
              `File storage could not count the files of "${usages[index].id}".`,
              result.reason,
            );
        });
        return context.json({
          data: {
            defaultDisk: defaultDiskOf(app.config),
            disks: disks().map((disk) => ({
              ...disk,
              lastCheck: checks.get(disk.name) ?? null,
            })),
            usages: usages.map((usage, index) => {
              const result = stats[index];
              return {
                ...usage,
                stats: result.status === 'fulfilled' ? result.value : null,
              };
            }),
          },
        });
      },
    );

    router.post(
      '/file/disks/:disk/check',
      async (context, next) => {
        const allowed = await context.get('authz').can(FILE_STORAGE_CHECK);
        if (!allowed)
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            reason: 'FILE_STORAGE_CHECK_REQUIRED',
            domain: DOMAIN,
            message: 'Permission to check file storage is required.',
          });
        await next();
      },
      describeRoute({
        tags,
        summary: 'Check a disk',
        operationId: 'fileCheckDisk',
        description: `Writes a temporary file under the disk's \`nocobase-check/\` directory, reads it back and compares it, asks for its URL, and deletes it, reporting each step. No other file is touched, and only this application instance is checked. A disk whose configuration is incomplete is not contacted: its first step fails with \`CONFIG_INCOMPLETE\`. A failure names a fixed reason and the error's own name, never its message. ${accessDescription} The check also requires the \`settings:file-storage/check\` grant, else 403 \`FILE_STORAGE_CHECK_REQUIRED\`.`,
        responses: {
          200: dataResponse(CheckResultSchema, 'The steps of the check.'),
          ...apiErrorResponses,
          404: apiErrorResponse(
            404,
            'No disk of this name is configured (`DISK_NOT_FOUND`).',
          ),
        },
      }),
      apiValidator('param', DiskParams),
      async (context) => {
        const { disk: name } = context.req.valid('param');
        const disk = disks().find((item) => item.name === name);
        if (!disk)
          throw new ApiError({
            status: 'NOT_FOUND',
            reason: 'DISK_NOT_FOUND',
            domain: DOMAIN,
            message: `Disk "${name}" is not configured.`,
          });
        const result = await runCheck({
          disk,
          drive: container.resolve(driveManagerToken),
          log: (message, error) => console.error(message, error),
        });
        checks.set(disk.name, result);
        return context.json({ data: result });
      },
    );
    root.route('/', router);
    return root;
  });
