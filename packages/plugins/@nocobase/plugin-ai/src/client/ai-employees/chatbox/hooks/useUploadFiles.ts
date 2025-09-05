/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient, usePlugin, useRequest } from '@nocobase/client';
import PluginFileManagerClient from '@nocobase/plugin-file-manager/client';
import { useAISettingsContext } from '../../AISettingsProvider';
import { useChatMessagesStore } from '../stores/chat-messages';

export function useStorage(storage: string) {
  const name = storage ?? '';
  const url = `storages:getBasicInfo/${name}`;
  const { loading, data } = useRequest<any>(
    {
      url,
    },
    {
      refreshDeps: [name],
      cacheKey: url,
    },
  );
  return (!loading && data?.data) || null;
}

export function useStorageUploadProps(props: any) {
  const { storage: storageName } = useAISettingsContext();
  const plugin = usePlugin(PluginFileManagerClient);
  const storage = useStorage(storageName);
  const storageType = plugin.getStorageType(storageName);
  const useStorageTypeUploadProps = storageType?.useUploadProps;
  const storageTypeUploadProps = useStorageTypeUploadProps?.({ storage, rules: storage.rules, ...props }) || {};
  return {
    rules: storage?.rules,
    ...storageTypeUploadProps,
  };
}

export function useUploadProps(props: any) {
  const api = useAPIClient();

  return {
    customRequest({ action, data, file, filename, headers, onError, onProgress, onSuccess, withCredentials }) {
      const formData = new FormData();
      if (data) {
        Object.keys(data).forEach((key) => {
          formData.append(key, data[key]);
        });
      }
      formData.append(filename, file);
      // eslint-disable-next-line promise/catch-or-return
      api.axios
        .post(action, formData, {
          withCredentials,
          headers,
          // onUploadProgress: ({ total, loaded }) => {
          //   onProgress({ percent: Math.round((loaded / total) * 100).toFixed(2) }, file);
          // },
        })
        .then(({ data }) => {
          onSuccess(data, file);
        })
        .catch((e) => onError(new Error(e.message)))
        .finally(() => {});

      return {
        abort() {
          console.log('upload progress is aborted.');
        },
      };
    },
    ...props,
  };
}

export const useUploadFiles = () => {
  const setAttachments = useChatMessagesStore.use.setAttachments();

  const uploadProps = {
    action: 'aiFiles:create',
    onChange({ fileList }) {
      setAttachments(
        fileList.map((file) => {
          if (file.status === 'done') {
            if (!file?.response?.data) {
              return file;
            }
            return { ...file.response.data, status: file.status };
          }
          return file;
        }),
      );
    },
  };

  const props = useUploadProps(uploadProps);
  const storageUploadProps = useStorageUploadProps(uploadProps);
  return {
    ...props,
    ...uploadProps,
    ...storageUploadProps,
  };
};
