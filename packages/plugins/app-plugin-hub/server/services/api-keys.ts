import { lockUserForAdministration } from '@nocobase/app-plugin-authentication';
import { encryptKey, decryptKey } from './key-secret.js';
import type {
  ApiKeyService,
  ServerApiKeySummary,
} from '@nocobase/app-plugin-api-keys/server';
import type { DatabaseManager, Row } from '@nocobase/db';
import type { Authorization } from '@nocobase/app-plugin-authorization';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import { AuthorizationDeniedError } from '@nocobase/authorization/core';
import { HubError, referencedBy } from './hub.js';
import {
  HUB_API_KEY_SCOPES,
  type HubApiKeyApp,
  type HubApiKeyAppOption,
  type HubApiKeyScope,
  type HubApiKeySummary,
  type CreatedHubApiKey,
  type CreateHubApiKeyInput,
} from '../../shared/api-keys.js';

export const hubApiKeyServiceToken: ServiceToken<HubApiKeyService> =
  createServiceToken<HubApiKeyService>('@nocobase/app-plugin-hub/api-keys');

export class HubApiKeyService {
  constructor(
    private readonly database: DatabaseManager,
    private readonly authorization: Authorization,
    private readonly apiKeys: ApiKeyService,
    private readonly encryptionSecret?: string,
  ) {}

  private query() {
    return this.database.connection().query;
  }

  private async requireApp(appId: string): Promise<void> {
    const app = await this.query()
      .selectFrom('hubApps')
      .select('id')
      .where('id', '=', appId)
      .executeTakeFirst();
    if (!app)
      throw new HubError(
        'Application not found.',
        'APP_NOT_FOUND',
        'NOT_FOUND',
      );
  }

  private async requireUser(userId: string): Promise<void> {
    const user = await this.query()
      .selectFrom('user')
      .select(['id', 'disabledAt'])
      .where('id', '=', userId)
      .executeTakeFirst();
    if (!user || user.disabledAt != null)
      throw new HubError(
        'The credential owner is unavailable.',
        'INVALID_API_KEY',
        'UNAUTHENTICATED',
      );
  }

  async requirePermission(
    userId: string,
    appId: string,
    action: string,
  ): Promise<void> {
    await this.requireUser(userId);
    await this.authorization
      .for({
        principal: { type: 'user', id: userId },
        subjects: [{ type: 'authenticated', id: '*' }],
      })
      .require({ resource: { type: 'hub.app', id: appId }, action });
  }

  async list(userId: string): Promise<readonly HubApiKeySummary[]> {
    await this.requirePermission(userId, '*', 'manage-api-keys');
    const allKeys = await this.canManageAllKeys(userId);
    const rows = await this.query()
      .selectFrom('hubApiKeys')
      .selectAll()
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'desc')
      .execute<Row>();
    const summaries = await Promise.all(
      rows.map(async (row) => {
        const key = await this.apiKeys.get(String(row.id));
        if (!key || (!allKeys && key.referenceId !== userId)) return null;
        return await this.summarize(row, key, userId);
      }),
    );
    return summaries.filter((key) => key !== null);
  }

  private async summarize(
    row: Row,
    key: ServerApiKeySummary,
    userId: string,
  ): Promise<HubApiKeySummary> {
    const user = await this.query()
      .selectFrom('user')
      .select('name')
      .where('id', '=', key.referenceId)
      .executeTakeFirst();
    return summary(
      row,
      await this.keyApps(String(row.id), userId),
      key,
      typeof user?.name === 'string' ? user.name : key.referenceId,
      userId,
    );
  }

  async create(
    userId: string,
    input: CreateHubApiKeyInput,
  ): Promise<CreatedHubApiKey> {
    await this.requirePermission(userId, '*', 'manage-api-keys');
    if (
      !input ||
      !Array.isArray(input.appIds) ||
      (input.allApps !== undefined && typeof input.allApps !== 'boolean') ||
      (input.allApps === true
        ? input.appIds.length > 0
        : !input.appIds.length) ||
      input.appIds.some(
        (id: unknown) => typeof id !== 'string' || !id.trim(),
      ) ||
      typeof input.name !== 'string' ||
      !input.name.trim() ||
      input.name.trim().length > 100 ||
      !Array.isArray(input.scopes) ||
      !input.scopes.length ||
      input.scopes.some(
        (scope: unknown) =>
          typeof scope !== 'string' ||
          !(HUB_API_KEY_SCOPES as readonly string[]).includes(scope),
      )
    ) {
      throw new HubError(
        'A name and at least one supported permission are required.',
        'INVALID_API_KEY_INPUT',
        'INVALID_ARGUMENT',
      );
    }
    const scopes: HubApiKeyScope[] = [...new Set<HubApiKeyScope>(input.scopes)];
    const expiresAt =
      input.expiresAt == null ? null : new Date(input.expiresAt);
    if (
      expiresAt &&
      (typeof input.expiresAt !== 'string' ||
        !Number.isFinite(expiresAt.getTime()) ||
        expiresAt.getTime() <= Date.now() ||
        expiresAt.getTime() - Date.now() > 36500 * 86400000)
    )
      throw new HubError(
        'Expiration must be a valid future date.',
        'INVALID_API_KEY_INPUT',
        'INVALID_ARGUMENT',
      );
    const allApps = input.allApps === true;
    const appIds: string[] = [...new Set<string>(input.appIds)];
    if (allApps) {
      for (const scope of scopes)
        await this.requirePermission(userId, '*', scope);
    }
    for (const appId of appIds) {
      await referencedBy('appIds', () => this.requireApp(appId));
      for (const scope of scopes)
        await this.requirePermission(userId, appId, scope);
    }
    return this.database.transaction(async (connection) => {
      await lockUserForAdministration(connection, userId);
      const owner = await connection.query
        .selectFrom('user')
        .select('disabledAt')
        .where('id', '=', userId)
        .executeTakeFirst();
      if (!owner || owner.disabledAt != null)
        throw new HubError(
          'The credential owner is unavailable.',
          'INVALID_API_KEY',
          'UNAUTHENTICATED',
        );
      const { key, secret } = await this.apiKeys
        .withConnection(connection)
        .create({
          userId,
          name: input.name.trim(),
          expiresIn: expiresAt
            ? (expiresAt.getTime() - Date.now()) / 1000
            : null,
        });
      const row = {
        id: key.id,
        allApps,
        encryptedSecret: encryptKey(
          secret,
          key.id,
          userId,
          this.encryptionSecret,
        ),
        scopes: JSON.stringify(scopes),
        createdAt: new Date(),
        disabledAt: null,
        lastUsedAt: null,
      };
      await connection.query.insertInto('hubApiKeys').values(row).execute();
      if (appIds.length)
        await connection.query
          .insertInto('hubApiKeyApps')
          .values(appIds.map((appId) => ({ keyId: key.id, appId })))
          .execute();
      const apps = appIds.length
        ? await connection.query
            .selectFrom('hubApps')
            .select(['id', 'name'])
            .where('id', 'in', appIds)
            .execute<HubApiKeyApp>()
        : [];
      const user = await connection.query
        .selectFrom('user')
        .select('name')
        .where('id', '=', userId)
        .executeTakeFirst();
      return {
        key: summary(
          row,
          apps,
          key,
          typeof user?.name === 'string' ? user.name : userId,
          userId,
        ),
        secret,
      };
    });
  }

  async appOptions(userId: string): Promise<readonly HubApiKeyAppOption[]> {
    await this.requirePermission(userId, '*', 'manage-api-keys');
    const apps = await this.query()
      .selectFrom('hubApps')
      .select(['id', 'name'])
      .orderBy('name')
      .execute<HubApiKeyApp>();
    const options: HubApiKeyAppOption[] = [];
    for (const app of apps) {
      const permissions: HubApiKeyScope[] = [];
      for (const action of HUB_API_KEY_SCOPES) {
        try {
          await this.requirePermission(userId, app.id, action);
          permissions.push(action);
        } catch (error) {
          if (!(error instanceof AuthorizationDeniedError)) throw error;
        }
      }
      if (permissions.length) options.push({ ...app, permissions });
    }
    return options;
  }

  private async keyApps(
    keyId: string,
    userId: string,
  ): Promise<HubApiKeyApp[]> {
    const apps = await this.query()
      .selectFrom('hubApiKeyApps')
      .innerJoin('hubApps', 'hubApps.id', 'hubApiKeyApps.appId')
      .select(['hubApps.id', 'hubApps.name'])
      .where('keyId', '=', keyId)
      .orderBy('hubApps.id')
      .execute<HubApiKeyApp>();
    const visible: HubApiKeyApp[] = [];
    for (const app of apps) {
      try {
        // A retained key is not a grant to read Apps after its owner loses access.
        await this.requirePermission(userId, app.id, 'read');
        visible.push(app);
      } catch (error) {
        if (!(error instanceof AuthorizationDeniedError)) throw error;
      }
    }
    return visible;
  }

  async reveal(keyId: string, userId: string): Promise<string> {
    await this.requirePermission(userId, '*', 'manage-api-keys');
    const key = await this.apiKeys.get(keyId);
    const row = await this.query()
      .selectFrom('hubApiKeys')
      .selectAll()
      .where('id', '=', keyId)
      .executeTakeFirst<Row>();
    if (!key || !row)
      throw new HubError(
        'API key not found.',
        'API_KEY_NOT_FOUND',
        'NOT_FOUND',
      );
    if (key.referenceId !== userId)
      throw new HubError(
        'Only the creator can copy this key.',
        'API_KEY_OWNER_REQUIRED',
        'PERMISSION_DENIED',
      );
    if (
      !key.enabled ||
      row.disabledAt != null ||
      (key.expiresAt && new Date(key.expiresAt).getTime() <= Date.now())
    )
      throw new HubError(
        'This key is no longer active.',
        'API_KEY_INACTIVE',
        'FAILED_PRECONDITION',
      );
    if (typeof row.encryptedSecret !== 'string')
      throw new HubError(
        'This legacy key cannot be recovered. Create a replacement key.',
        'API_KEY_NOT_RECOVERABLE',
        'FAILED_PRECONDITION',
      );
    try {
      return decryptKey(
        row.encryptedSecret,
        key.id,
        userId,
        this.encryptionSecret,
      );
    } catch {
      throw new HubError(
        'The saved key could not be decrypted. Create a replacement key.',
        'API_KEY_NOT_RECOVERABLE',
        'FAILED_PRECONDITION',
      );
    }
  }

  /** Disables a key and answers with it as it now stands. */
  async disable(keyId: string, userId: string): Promise<HubApiKeySummary> {
    await this.requirePermission(userId, '*', 'manage-api-keys');
    const allKeys = await this.canManageAllKeys(userId);
    await this.database.transaction(async (connection) => {
      const row = await connection.query
        .selectFrom('hubApiKeys')
        .select('id')
        .where('id', '=', keyId)
        .executeTakeFirst();
      if (!row)
        throw new HubError(
          'API key not found.',
          'API_KEY_NOT_FOUND',
          'NOT_FOUND',
        );
      const key = await this.apiKeys.withConnection(connection).get(keyId);
      this.requireKeyOwnerOrAdministrator(key, userId, allKeys);
      await this.apiKeys.withConnection(connection).disable(keyId);
      await connection.query
        .updateTable('hubApiKeys')
        .set({ disabledAt: new Date(), encryptedSecret: null })
        .where('id', '=', keyId)
        .where('disabledAt', 'is', null)
        .execute();
    });
    const [row, key] = await Promise.all([
      this.query()
        .selectFrom('hubApiKeys')
        .selectAll()
        .where('id', '=', keyId)
        .executeTakeFirst<Row>(),
      this.apiKeys.get(keyId),
    ]);
    if (!row || !key)
      throw new HubError(
        'API key not found.',
        'API_KEY_NOT_FOUND',
        'NOT_FOUND',
      );
    return await this.summarize(row, key, userId);
  }

  async remove(keyId: string, userId: string): Promise<void> {
    await this.requirePermission(userId, '*', 'manage-api-keys');
    const allKeys = await this.canManageAllKeys(userId);
    await this.database.transaction(async (connection) => {
      const row = await connection.query
        .selectFrom('hubApiKeys')
        .select('id')
        .where('id', '=', keyId)
        .executeTakeFirst();
      if (!row)
        throw new HubError(
          'API key not found.',
          'API_KEY_NOT_FOUND',
          'NOT_FOUND',
        );
      const key = await this.apiKeys.withConnection(connection).get(keyId);
      this.requireKeyOwnerOrAdministrator(key, userId, allKeys);
      await this.apiKeys.withConnection(connection).remove(keyId);
    });
  }

  private async canManageAllKeys(userId: string): Promise<boolean> {
    // read-all is restricted to Hub administrators by the resource handler.
    return this.authorization
      .for({
        principal: { type: 'user', id: userId },
        subjects: [{ type: 'authenticated', id: '*' }],
      })
      .can({ resource: { type: 'hub.app', id: '*' }, action: 'read-all' });
  }

  private requireKeyOwnerOrAdministrator(
    key: ServerApiKeySummary | null,
    userId: string,
    allKeys: boolean,
  ): void {
    if (!key)
      throw new HubError(
        'API key not found.',
        'API_KEY_NOT_FOUND',
        'NOT_FOUND',
      );
    if (key.referenceId !== userId && !allKeys)
      throw new HubError(
        'Only the creator or a Hub administrator can manage this key.',
        'API_KEY_OWNER_REQUIRED',
        'PERMISSION_DENIED',
      );
  }

  /** Removing one App must preserve a shared key's other App bindings. */
  async removeAppKeys(appId: string): Promise<void> {
    await this.database.transaction(async (connection) => {
      const rows = await connection.query
        .selectFrom('hubApiKeyApps')
        .select('keyId')
        .where('appId', '=', appId)
        .execute();
      await connection.query
        .deleteFrom('hubApiKeyApps')
        .where('appId', '=', appId)
        .execute();
      for (const row of rows) {
        const remaining = await connection.query
          .selectFrom('hubApiKeyApps')
          .select('appId')
          .where('keyId', '=', row.keyId)
          .executeTakeFirst();
        if (!remaining)
          await this.apiKeys
            .withConnection(connection)
            .remove(String(row.keyId));
      }
    });
  }

  /**
   * Verifies a publishing key for one App. Given several scopes, the key passes under the first one it was granted
   * whose action its creator still holds; the returned `scope` names it.
   */
  async verify(
    secret: string,
    appId: string,
    scopes: HubApiKeyScope | readonly HubApiKeyScope[],
  ): Promise<{
    readonly id: string;
    readonly createdBy: string;
    readonly scope: HubApiKeyScope;
  }> {
    const requested: readonly HubApiKeyScope[] =
      typeof scopes === 'string' ? [scopes] : scopes;
    const key = await this.apiKeys.verify(secret);
    if (!key)
      throw new HubError(
        'API key is invalid, disabled, or expired.',
        'INVALID_API_KEY',
        'UNAUTHENTICATED',
      );
    const row = await this.query()
      .selectFrom('hubApiKeys')
      .selectAll()
      .where('id', '=', key.id)
      .executeTakeFirst<Row>();
    if (!row || row.disabledAt != null)
      throw new HubError(
        'Invalid publishing key.',
        'INVALID_API_KEY',
        'UNAUTHENTICATED',
      );
    const binding = await this.query()
      .selectFrom('hubApiKeyApps')
      .select('appId')
      .where('keyId', '=', key.id)
      .where('appId', '=', appId)
      .executeTakeFirst();
    const granted = parseScopes(row.scopes);
    const candidates = requested.filter((scope) => granted.includes(scope));
    if ((!row.allApps && !binding) || candidates.length === 0)
      throw new HubError(
        'API key does not allow this application or operation.',
        'API_KEY_FORBIDDEN',
        'PERMISSION_DENIED',
      );
    await this.requireApp(appId);
    let scope: HubApiKeyScope | undefined;
    let denied: AuthorizationDeniedError | undefined;
    for (const candidate of candidates) {
      try {
        await this.requirePermission(key.referenceId, appId, candidate);
        scope = candidate;
        break;
      } catch (error) {
        // Only a missing permission moves on to the next scope; an unavailable owner fails the key outright.
        if (!(error instanceof AuthorizationDeniedError)) throw error;
        denied = error;
      }
    }
    if (!scope) throw denied ?? new Error('No publishing scope was checked.');
    await this.query()
      .updateTable('hubApiKeys')
      .set({ lastUsedAt: new Date() })
      .where('id', '=', row.id)
      .execute();
    return { id: String(row.id), createdBy: key.referenceId, scope };
  }
}
function date(value: unknown): Date | null {
  return value == null
    ? null
    : value instanceof Date
      ? value
      : new Date(
          typeof value === 'number' || typeof value === 'string'
            ? value
            : Number.NaN,
        );
}
function parseScopes(value: unknown): HubApiKeyScope[] {
  return (
    typeof value === 'string' ? JSON.parse(value) : value
  ) as HubApiKeyScope[];
}
function summary(
  row: Row,
  apps: readonly HubApiKeyApp[],
  key: ServerApiKeySummary,
  creatorName: string,
  userId: string,
): HubApiKeySummary {
  const expiresAt = date(key.expiresAt);
  return {
    id: String(row.id),
    canCopy:
      key.referenceId === userId &&
      typeof row.encryptedSecret === 'string' &&
      key.enabled &&
      row.disabledAt == null &&
      (!expiresAt || expiresAt.getTime() > Date.now()),
    apps,
    allApps: Boolean(row.allApps),
    name: key.name ?? '',
    prefix: key.start ?? key.prefix ?? '',
    scopes: parseScopes(row.scopes),
    status:
      !key.enabled || row.disabledAt != null
        ? 'disabled'
        : expiresAt && expiresAt.getTime() <= Date.now()
          ? 'expired'
          : 'active',
    createdBy: key.referenceId,
    creatorName,
    createdAt: date(row.createdAt)!.toISOString(),
    expiresAt: expiresAt?.toISOString() ?? null,
    lastUsedAt: date(row.lastUsedAt)?.toISOString() ?? null,
  };
}
