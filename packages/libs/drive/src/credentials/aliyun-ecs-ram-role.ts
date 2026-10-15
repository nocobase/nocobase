const METADATA = 'http://100.100.100.200';
const ROLES = '/latest/meta-data/ram/security-credentials/';
const TOKEN_TTL = 21600;

interface Credentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
}

class MetadataError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly retryable = false,
  ) {
    super(`Aliyun ECS metadata: ${message}`);
  }
}

function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

// Keep the timeout active until the response body has been consumed.
async function request(path: string, token?: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1000);
  try {
    const response = await fetch(`${METADATA}${path}`, {
      method: token === undefined ? 'PUT' : 'GET',
      headers:
        token === undefined
          ? { 'X-aliyun-ecs-metadata-token-ttl-seconds': String(TOKEN_TTL) }
          : { 'X-aliyun-ecs-metadata-token': token },
      redirect: 'error',
      signal: controller.signal,
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new MetadataError(
        `HTTP ${response.status}`,
        response.status,
        response.status === 429 || response.status >= 500,
      );
    }
    return await response.text();
  } catch (error) {
    if (error instanceof MetadataError) throw error;
    // Fetch errors can include request details; never propagate their contents.
    throw new MetadataError(
      controller.signal.aborted ? 'request timed out' : 'request failed',
      undefined,
      true,
    );
  } finally {
    clearTimeout(timeout);
  }
}

function parseCredentials(body: string): Credentials {
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    throw new MetadataError('invalid JSON');
  }
  if (
    !value ||
    typeof value !== 'object' ||
    !('Code' in value) ||
    value.Code !== 'Success'
  ) {
    throw new MetadataError('unsuccessful credentials response');
  }
  if (
    !('AccessKeyId' in value) ||
    !nonempty(value.AccessKeyId) ||
    !('AccessKeySecret' in value) ||
    !nonempty(value.AccessKeySecret) ||
    !('SecurityToken' in value) ||
    !nonempty(value.SecurityToken)
  ) {
    throw new MetadataError('missing or invalid credential fields');
  }
  const expiration = new Date(
    'Expiration' in value && nonempty(value.Expiration)
      ? value.Expiration
      : NaN,
  );
  if (
    !Number.isFinite(expiration.getTime()) ||
    expiration.getTime() <= Date.now()
  ) {
    throw new MetadataError('missing, invalid or expired Expiration');
  }
  return {
    accessKeyId: value.AccessKeyId,
    secretAccessKey: value.AccessKeySecret,
    sessionToken: value.SecurityToken,
    expiration,
  };
}

export function createAliyunEcsRamRoleProvider(
  roleName?: string,
): () => Promise<Credentials> {
  let token: string | undefined;
  let tokenExpires = 0;
  let pending: Promise<Credentials> | undefined;

  async function resolve(): Promise<Credentials> {
    let recoveredUnauthorized = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (!token || Date.now() >= tokenExpires) {
          const started = Date.now();
          token = undefined;
          const nextToken = await request('/latest/api/token');
          if (!nonempty(nextToken))
            throw new MetadataError('empty metadata token');
          token = nextToken;
          tokenExpires = started + (TOKEN_TTL - 60) * 1000;
        }
        let role = roleName;
        if (role === undefined) {
          const roles = (await request(ROLES, token)).trim().split(/\s+/);
          if (roles.length !== 1 || !nonempty(roles[0])) {
            throw new MetadataError('expected a single instance role');
          }
          role = roles[0];
        }
        if (!nonempty(role)) throw new MetadataError('invalid role name');
        return parseCredentials(
          await request(`${ROLES}${encodeURIComponent(role)}`, token),
        );
      } catch (error) {
        if (!(error instanceof MetadataError)) throw error;
        if (error.status === 401) {
          token = undefined;
          if (recoveredUnauthorized || attempt === 2) throw error;
          recoveredUnauthorized = true;
        } else if (!error.retryable || attempt === 2) {
          throw error;
        }
        await new Promise((resolveDelay) =>
          setTimeout(resolveDelay, 100 * (attempt + 1)),
        );
      }
    }
    throw new MetadataError('attempt limit reached');
  }

  return () => {
    pending ??= resolve().finally(() => {
      pending = undefined;
    });
    return pending;
  };
}
