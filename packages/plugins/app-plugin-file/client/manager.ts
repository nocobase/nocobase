import type { ApiClient, RemoteRepository } from '@nocobase/app-client';
import type {
  FileRecord,
  UploadOneInput,
  UploadManyInput,
  UploadOneResult,
  UploadManyResult,
} from '../shared/types.js';

export type ClientFileRepository = RemoteRepository<FileRecord> & {
  uploadOne(
    input: UploadOneInput,
    options?: ClientUploadOptions,
  ): Promise<UploadOneResult>;
  uploadMany(
    input: UploadManyInput,
    options?: ClientUploadOptions,
  ): Promise<UploadManyResult>;
};
export interface ClientUploadOptions {
  readonly signal?: AbortSignal;
}
export class ClientFileRepositoryManager {
  constructor(private readonly api: ApiClient) {}
  repository(name: string): ClientFileRepository {
    const api = this.api;
    const repository = api.repository<FileRecord>(name);
    return Object.assign(repository, {
      async uploadOne(
        { file }: UploadOneInput,
        options?: ClientUploadOptions,
      ): Promise<UploadOneResult> {
        const body = new FormData();
        body.append('file', file);
        const { data } = await api.request<{ data: UploadOneResult }>({
          path: `/${encodeURIComponent(name)}/uploadOne`,
          method: 'POST',
          body,
          signal: options?.signal,
        });
        return data;
      },
      async uploadMany(
        { files }: UploadManyInput,
        options?: ClientUploadOptions,
      ): Promise<UploadManyResult> {
        const body = new FormData();
        for (const file of files) body.append('file', file);
        const { data } = await api.request<{ data: UploadManyResult }>({
          path: `/${encodeURIComponent(name)}/uploadMany`,
          method: 'POST',
          body,
          signal: options?.signal,
        });
        return data;
      },
    });
  }
}
