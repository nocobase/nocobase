/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 废弃文件，暂时保留
 */

import {
  Input,
  Upload,
  useCollection,
  useCollectionField,
  useCollectionRecordData,
  usePlugin,
  useRequest,
  withDynamicSchemaProps,
} from '@nocobase/client';
import React, { useEffect } from 'react';
import FileManagerPlugin from './';
import { connect, mapProps, mapReadPretty, useField } from '@formily/react';

function useStorage(storage) {
  const name = storage ?? '';
  const field = useField<any>();
  const url = `storages:getStorage/${name}`;
  const { loading, data, run } = useRequest<any>(
    {
      url: `storages:getStorage/${name}`,
    },
    {
      manual: true,
      refreshDeps: [name],
      cacheKey: url,
    },
  );
  useEffect(() => {
    run();
  }, [field.pattern, run]);
  return (!loading && data?.data) || null;
}

function useStorageCfg() {
  const field = useCollectionField();
  const collection = useCollection();
  const plugin = usePlugin(FileManagerPlugin);
  const storage = useStorage(field?.storage || collection?.getOption('storage'));
  const storageType = plugin.getStorageType(storage?.type);
  return {
    storage,
    storageType,
  };
}

function AttachmentFileUpload(props) {
  const { storage, storageType } = useStorageCfg();
  if (storageType?.attachmentUpload) {
    const Uploader = storageType?.attachmentUpload;
    return <Uploader {...props} storage={storage}></Uploader>;
  }
  return <Upload.Attachment {...props} />;
}

function AttachmentReadPretty(props) {
  const { storage, storageType } = useStorageCfg();
  if (storageType?.attachmentUpload) {
    const Uploader = storageType?.attachmentUpload;
    return <Uploader {...props} storage={storage}></Uploader>;
  }
  return <Upload.Attachment {...props} />;
}

function Dragger(props) {
  const { storage, storageType } = useStorageCfg();
  if (storageType?.draggerUpload) {
    const Uploader = storageType?.draggerUpload;
    return <Uploader {...props} storage={storage}></Uploader>;
  }
  return <Upload.DraggerV2 {...props} />;
}
function DraggerReadPretty(props) {
  const { storage, storageType } = useStorageCfg();
  if (storageType?.attachmentUpload) {
    const Uploader = storageType?.attachmentUpload;
    return <Uploader {...props} storage={storage}></Uploader>;
  }
  return <Upload.DraggerV2 {...props} />;
}

export const FileUploadPreview = connect((props) => {
  const data = useCollectionRecordData();
  const { storage, storageType } = useStorageCfg();
  if (storageType?.preview) {
    const Preview = storageType?.preview;
    return <Preview {...props} storage={storage}></Preview>;
  }
  return <Upload.ReadPretty {...props} value={data} />;
});

export const FileUploadPreviewUrl = connect((props) => {
  const data = useCollectionRecordData();
  const { storage, storageType } = useStorageCfg();
  if (storageType?.previewUrl) {
    const Preview = storageType?.previewUrl;
    return <Preview {...props} storage={storage}></Preview>;
  }
  return <Input.URL value={data.url} />;
});

export const FileUpload = withDynamicSchemaProps(
  connect(
    AttachmentFileUpload,
    // mapProps({
    //   value: 'fileList',
    // }),
    mapReadPretty(AttachmentReadPretty),
  ),
  {
    displayName: 'FileUpload',
  },
);

export const FileUploadDragger = withDynamicSchemaProps(
  connect(
    Dragger,
    // mapProps({
    //   value: 'fileList',
    // }),
    mapReadPretty(DraggerReadPretty),
  ),
  {
    displayName: 'FileUploadDragger',
  },
);

export default FileUpload;
