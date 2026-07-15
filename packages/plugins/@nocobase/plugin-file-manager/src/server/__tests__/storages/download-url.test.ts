/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AttachmentModel, StorageModel } from '../../storages';
import AliOssStorage from '../../storages/ali-oss';
import S3Storage from '../../storages/s3';
import TxCosStorage from '../../storages/tx-cos';

const file = {
  filename: '报告.pdf',
  path: 'documents',
} as AttachmentModel;

function expectDownloadUrl(value: string) {
  const url = new URL(value);
  expect(url.searchParams.get('response-content-disposition')).toContain('attachment');
  expect(url.searchParams.get('response-content-disposition')).toContain("filename*=UTF-8''%E6%8A%A5%E5%91%8A.pdf");
}

describe('storage download URLs', () => {
  it('signs an S3 download URL with response content disposition', async () => {
    const storage = new S3Storage({
      type: 's3',
      name: 's3',
      title: 'S3',
      baseUrl: 'https://bucket.example.com',
      path: '',
      options: {
        region: 'us-east-1',
        endpoint: 'https://s3.example.com',
        accessKeyId: 'access-key',
        secretAccessKey: 'secret-key',
        bucket: 'bucket',
      },
    } as StorageModel);

    expectDownloadUrl(await storage.getFileURL(file, false, { download: true }));
  });

  it('signs an Ali OSS download URL with response content disposition', async () => {
    const storage = new AliOssStorage({
      type: 'ali-oss',
      name: 'ali-oss',
      title: 'Ali OSS',
      baseUrl: 'https://bucket.oss-cn-hangzhou.aliyuncs.com',
      path: '',
      options: {
        region: 'oss-cn-hangzhou',
        accessKeyId: 'access-key',
        accessKeySecret: 'secret-key',
        bucket: 'bucket',
      },
    } as StorageModel);

    expectDownloadUrl(await storage.getFileURL(file, false, { download: true }));
  });

  it('signs a Tencent COS download URL with response content disposition', async () => {
    const storage = new TxCosStorage({
      type: 'tx-cos',
      name: 'tx-cos',
      title: 'Tencent COS',
      baseUrl: 'https://bucket.cos.ap-guangzhou.myqcloud.com',
      path: '',
      options: {
        Region: 'ap-guangzhou',
        SecretId: 'secret-id',
        SecretKey: 'secret-key',
        Bucket: 'bucket-1250000000',
      },
    } as StorageModel);

    expectDownloadUrl(await storage.getFileURL(file, false, { download: true }));
  });
});
