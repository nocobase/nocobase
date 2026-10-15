import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';

import type OSS from 'ali-oss';
import { DriveDirectory, DriveFile } from 'flydrive';
import type {
  DriverContract,
  ObjectMetaData,
  ObjectVisibility,
  SignedURLOptions,
  WriteOptions,
} from 'flydrive/types';

import { createAliyunEcsRamRoleProvider } from './credentials/aliyun-ecs-ram-role.js';
import type { OssDriveDiskConfig } from './types.js';

interface ClientState {
  client: OSS;
  expiration?: Date;
}

function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function statusOf(error: unknown): number | undefined {
  return error &&
    typeof error === 'object' &&
    'status' in error &&
    typeof error.status === 'number'
    ? error.status
    : undefined;
}

function seconds(value: string | number = 1800): number {
  if (typeof value === 'number') return value;
  const match =
    /^(\d+(?:\.\d+)?)\s*(ms|s|sec(?:ond)?s?|m|min(?:ute)?s?|h|hours?|d|days?|w|weeks?)?$/i.exec(
      value.trim(),
    );
  if (!match) throw new Error('Invalid OSS signed URL lifetime.');
  const unit = (match[2] || 's').toLowerCase();
  const scale =
    unit === 'ms'
      ? 0.001
      : unit.startsWith('m')
        ? 60
        : unit.startsWith('h')
          ? 3600
          : unit.startsWith('d')
            ? 86400
            : unit.startsWith('w')
              ? 604800
              : 1;
  return Number(match[1]) * scale;
}

function headersFor(
  options: WriteOptions = {},
  visibility?: ObjectVisibility,
): Record<string, string> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  for (const [option, header] of Object.entries({
    contentType: 'Content-Type',
    contentLanguage: 'Content-Language',
    contentEncoding: 'Content-Encoding',
    contentDisposition: 'Content-Disposition',
    cacheControl: 'Cache-Control',
    contentLength: 'Content-Length',
  })) {
    if (options[option] !== undefined)
      headers[header] = String(options[option]);
  }
  if (visibility)
    headers['x-oss-object-acl'] =
      visibility === 'public' ? 'public-read' : 'private';
  return headers;
}

export function createOssDriver(config: OssDriveDiskConfig): DriverContract {
  return new OssDriver(config);
}

class OssDriver implements DriverContract {
  #config: OssDriveDiskConfig;
  #provider?: ReturnType<typeof createAliyunEcsRamRoleProvider>;
  #state?: ClientState;
  #pending?: Promise<ClientState>;

  constructor(config: OssDriveDiskConfig) {
    if (!/^oss-[a-z0-9-]+$/.test(config.region) || !nonempty(config.bucket))
      throw new Error('OSS requires a region (oss-<region>) and bucket.');
    if (config.domain) {
      const domain = new URL(config.domain);
      if (
        domain.protocol !== 'https:' ||
        domain.username ||
        domain.password ||
        domain.pathname !== '/' ||
        domain.search ||
        domain.hash
      )
        throw new Error('OSS domain must be an HTTPS origin.');
    }
    const credentials = config.credentials;
    if (!credentials || typeof credentials !== 'object')
      throw new Error('OSS credentials are required.');
    if ('provider' in credentials) {
      if (
        credentials.provider !== 'aliyun-ecs-ram-role' ||
        'accessKeyId' in credentials ||
        'accessKeySecret' in credentials
      )
        throw new Error('OSS requires exactly one credentials source.');
      if (credentials.roleName !== undefined && !nonempty(credentials.roleName))
        throw new Error('Invalid OSS instance role name.');
      this.#provider = createAliyunEcsRamRoleProvider(credentials.roleName);
    } else if (
      !nonempty(credentials.accessKeyId) ||
      !nonempty(credentials.accessKeySecret) ||
      'roleName' in credentials
    ) {
      throw new Error('OSS requires exactly one credentials source.');
    }
    this.#config = { ...config, credentials: { ...credentials } };
  }

  async #createClient(
    accessKeyId: string,
    accessKeySecret: string,
    stsToken?: string,
  ): Promise<OSS> {
    // FS and S3 users do not load the OSS runtime dependency.
    const { default: OSSClient } = await import('ali-oss');
    return new OSSClient({
      region: this.#config.region,
      bucket: this.#config.bucket,
      internal: this.#config.internal,
      secure: true,
      authorizationV4: true,
      // This driver replaces clients on demand; the SDK never refreshes them.
      refreshSTSTokenInterval: Infinity,
      ...(this.#config.domain
        ? { endpoint: this.#config.domain, cname: true, internal: false }
        : {}),
      accessKeyId,
      accessKeySecret,
      stsToken,
    });
  }

  async #client(): Promise<ClientState> {
    if (
      this.#state &&
      (!this.#state.expiration ||
        this.#state.expiration.getTime() - Date.now() > 300000)
    )
      return this.#state;
    this.#pending ??= this.#resolveClient().finally(() => {
      this.#pending = undefined;
    });
    return this.#pending;
  }

  async #resolveClient(): Promise<ClientState> {
    let state: ClientState;
    if (this.#provider) {
      const credentials = await this.#provider();
      state = {
        client: await this.#createClient(
          credentials.accessKeyId,
          credentials.secretAccessKey,
          credentials.sessionToken,
        ),
        expiration: credentials.expiration,
      };
    } else {
      const credentials = this.#config.credentials;
      state = {
        client: await this.#createClient(
          credentials.accessKeyId!,
          credentials.accessKeySecret!,
        ),
      };
    }
    this.#state = state;
    return state;
  }

  async #run<T>(
    operation: string,
    callback: (state: ClientState) => Promise<T>,
  ): Promise<T> {
    // SDK errors can contain request headers or response bodies. Never expose them.
    const state = await this.#client();
    try {
      return await callback(state);
    } catch (error) {
      const status = statusOf(error);
      // eslint-disable-next-line preserve-caught-error -- SDK causes can contain credentials and signed URLs.
      throw new Error(
        `OSS ${operation} failed${status ? ` (HTTP ${status})` : ''}.`,
      );
    }
  }

  async exists(key: string): Promise<boolean> {
    return this.#run('head', async ({ client }) => {
      try {
        await client.head(key);
        return true;
      } catch (error) {
        if (statusOf(error) === 404) return false;
        throw error;
      }
    });
  }

  async get(key: string): Promise<string> {
    return Buffer.from(await this.getBytes(key)).toString('utf8');
  }

  async getBytes(key: string): Promise<Uint8Array> {
    return this.#run('get', async ({ client }) => {
      const content: unknown = (await client.get(key)).content;
      if (!Buffer.isBuffer(content))
        throw new Error('Missing OSS response content.');
      return content;
    });
  }

  async getStream(key: string): Promise<Readable> {
    return this.#run('get stream', async ({ client }) => {
      const stream: unknown = (await client.getStream(key)).stream;
      if (!(stream instanceof Readable))
        throw new Error('Missing OSS response stream.');
      return stream;
    });
  }

  async getMetaData(key: string): Promise<ObjectMetaData> {
    return this.#run('head', async ({ client }) => {
      const { res } = await client.head(key);
      const headers = res.headers as Record<string, string>;
      return {
        contentType: headers['content-type'],
        contentLength: Number(headers['content-length']),
        etag: headers.etag,
        lastModified: new Date(headers['last-modified']),
      };
    });
  }

  async #visibility(client: OSS, key: string): Promise<ObjectVisibility> {
    let acl: string = (await client.getACL(key)).acl;
    if (acl === 'default')
      ({ acl } = await client.getBucketACL(this.#config.bucket));
    return acl === 'public-read' || acl === 'public-read-write'
      ? 'public'
      : 'private';
  }

  async getVisibility(key: string): Promise<ObjectVisibility> {
    if (this.#config.supportsACL === false) return this.#config.visibility;
    return this.#run('get ACL', ({ client }) => this.#visibility(client, key));
  }

  async setVisibility(
    key: string,
    visibility: ObjectVisibility,
  ): Promise<void> {
    if (this.#config.supportsACL === false) return;
    await this.#run('set ACL', async ({ client }) => {
      await client.putACL(
        key,
        visibility === 'public' ? 'public-read' : 'private',
      );
    });
  }

  async getUrl(key: string): Promise<string> {
    const { domain, bucket, region, internal } = this.#config;
    const origin =
      domain ||
      `https://${bucket}.${region}${internal ? '-internal' : ''}.aliyuncs.com`;
    return `${origin.replace(/\/$/, '')}/${key.split('/').map(encodeURIComponent).join('/')}`;
  }

  async #signedUrl(
    key: string,
    method: 'GET' | 'PUT',
    options: SignedURLOptions = {},
  ): Promise<string> {
    const requested = seconds(options.expiresIn);
    if (!Number.isFinite(requested) || requested < 1)
      throw new Error('Invalid OSS signed URL lifetime.');
    return this.#run('sign URL', async ({ client, expiration }) => {
      const ttl = Math.min(
        Math.floor(requested),
        604800,
        expiration
          ? Math.floor((expiration.getTime() - Date.now()) / 1000)
          : Infinity,
      );
      if (ttl < 1) throw new Error('OSS signing credentials have expired.');
      const headers: Record<string, string> = {};
      const queries: Record<string, string> = {};
      if (method === 'GET') {
        if (options.contentType)
          queries['response-content-type'] = options.contentType;
        if (options.contentDisposition)
          queries['response-content-disposition'] = options.contentDisposition;
      } else if (options.contentType)
        headers['Content-Type'] = options.contentType;
      return client.signatureUrlV4(method, ttl, { headers, queries }, key);
    });
  }

  async getSignedUrl(key: string, options?: SignedURLOptions): Promise<string> {
    return this.#signedUrl(key, 'GET', options);
  }

  async getSignedUploadUrl(
    key: string,
    options?: SignedURLOptions,
  ): Promise<string> {
    return this.#signedUrl(key, 'PUT', options);
  }

  #writeOptions(
    options: WriteOptions = {},
  ): OSS.PutObjectOptions & { contentLength?: number } {
    return {
      headers: headersFor(
        options,
        this.#config.supportsACL === false
          ? undefined
          : options.visibility || this.#config.visibility,
      ),
      meta: options.meta as OSS.UserMeta | undefined,
      mime: options.contentType,
      contentLength: options.contentLength,
    };
  }

  async put(
    key: string,
    contents: string | Uint8Array,
    options?: WriteOptions,
  ): Promise<void> {
    await this.#run('put', async ({ client }) => {
      await client.put(key, Buffer.from(contents), this.#writeOptions(options));
    });
  }

  async putStream(
    key: string,
    contents: Readable,
    options?: WriteOptions,
  ): Promise<void> {
    // Sources can fail while credentials or the SDK are still loading.
    let sourceFailed = Boolean(contents.errored);
    const onError = (): void => {
      sourceFailed = true;
    };
    contents.on('error', onError);
    try {
      await this.#run('put stream', async ({ client }) => {
        if (sourceFailed || contents.destroyed)
          throw new Error('OSS input stream failed.');
        // The SDK accepts optional options here; its community types mark them required.
        await client.putStream(
          key,
          contents,
          this.#writeOptions(options) as OSS.PutStreamOptions,
        );
      });
    } finally {
      if (!contents.readableEnded) contents.destroy();
      // A destroyed stream can still have a pending error from opening its file.
      // Keep the guard until completion; #run already handles upload failures.
      await finished(contents, { cleanup: true, writable: false }).catch(
        () => undefined,
      );
      contents.off('error', onError);
    }
  }

  async #copy(
    client: OSS,
    source: string,
    destination: string,
    options: WriteOptions = {},
  ): Promise<void> {
    const visibility =
      this.#config.supportsACL === false
        ? undefined
        : options.visibility || (await this.#visibility(client, source));
    await client.copy(destination, source, {
      headers: headersFor(options, visibility),
      meta: options.meta as OSS.UserMeta | undefined,
    });
  }

  async copy(
    source: string,
    destination: string,
    options?: WriteOptions,
  ): Promise<void> {
    await this.#run('copy', ({ client }) =>
      this.#copy(client, source, destination, options),
    );
  }

  async move(
    source: string,
    destination: string,
    options?: WriteOptions,
  ): Promise<void> {
    await this.#run('move', async ({ client }) => {
      await this.#copy(client, source, destination, options);
      await client.delete(source);
    });
  }

  async delete(key: string): Promise<void> {
    await this.#run('delete', async ({ client }) => {
      await client.delete(key);
    });
  }

  async deleteAll(prefix: string): Promise<void> {
    // List recursively without a delimiter, including directory marker objects.
    let token: string | undefined;
    do {
      token = await this.#run('delete all', async ({ client }) => {
        const page = await client.listV2(
          {
            prefix: prefix === '/' ? '' : prefix,
            'continuation-token': token,
            'max-keys': 1000,
          },
          {},
        );
        if (page.objects?.length)
          await client.deleteMulti(
            page.objects.map((object) => object.name),
            { quiet: true },
          );
        return page.nextContinuationToken || undefined;
      });
    } while (token);
  }

  async listAll(
    prefix: string,
    options: {
      recursive?: boolean;
      paginationToken?: string;
      maxResults?: number;
    } = {},
  ): Promise<{
    paginationToken?: string;
    objects: Iterable<DriveFile | DriveDirectory>;
  }> {
    if (prefix && !options.recursive) prefix = `${prefix.replace(/\/$/, '')}/`;
    return this.#run('list', async ({ client }) => {
      const page = await client.listV2(
        {
          prefix: prefix === '/' ? '' : prefix,
          delimiter: options.recursive ? '' : '/',
          'continuation-token': options.paginationToken,
          'max-keys': options.maxResults ?? 1000,
        },
        {},
      );
      const objects: (DriveFile | DriveDirectory)[] = (page.prefixes || []).map(
        (value) => new DriveDirectory(value.replace(/\/$/, '')),
      );
      for (const object of page.objects || [])
        objects.push(
          new DriveFile(object.name, this, {
            contentLength: object.size,
            etag: object.etag,
            lastModified: new Date(object.lastModified),
          }),
        );
      return {
        paginationToken: page.nextContinuationToken || undefined,
        objects,
      };
    });
  }

  bucket(bucket: string): DriverContract {
    return new OssDriver({ ...this.#config, bucket });
  }
}
