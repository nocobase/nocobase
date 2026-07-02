/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useApp } from '@nocobase/client-v2';
import { useRequest } from 'ahooks';
import { useChat } from '../hooks/useChat';
import { useChatConversationsStore } from '../stores/chat-conversations';
import type { Attachment } from '../../types';

type StorageBasicInfo = {
  rules?: Record<string, unknown>;
  [key: string]: unknown;
};

type UploadRequestOptions = {
  action: string;
  data?: Record<string, string | Blob>;
  file: Blob;
  filename: string;
  headers?: Record<string, string>;
  onError: (error: Error) => void;
  onSuccess: (body: unknown, file: Blob) => void;
  withCredentials?: boolean;
};

type UploadFileItem = Attachment & {
  status?: string;
  response?: {
    data?: Attachment;
  };
};

type UploadChangeInfo = {
  fileList: UploadFileItem[];
};

export function useStorage(storage?: string) {
  const app = useApp();
  const name = storage ?? '';
  const url = `storages:getBasicInfo/${name}`;
  const { loading, data } = useRequest<StorageBasicInfo | null, []>(
    async () => {
      if (!name) {
        return null;
      }
      const response = await app.apiClient.request({ url });
      return (response?.data?.data ?? response?.data ?? null) as StorageBasicInfo | null;
    },
    {
      refreshDeps: [name],
      cacheKey: url,
    },
  );
  return (!loading && (data as StorageBasicInfo | null)) || null;
}

export function useStorageUploadProps(props: Record<string, unknown>, storageName?: string) {
  const storage = useStorage(storageName);
  return {
    rules: storage?.rules,
    ...props,
  };
}

export function useUploadProps(props: Record<string, unknown>) {
  const app = useApp();

  return {
    customRequest({
      action,
      data,
      file,
      filename,
      headers,
      onError,
      onSuccess,
      withCredentials,
    }: UploadRequestOptions) {
      const formData = new FormData();
      if (data) {
        Object.keys(data).forEach((key) => {
          formData.append(key, data[key]);
        });
      }
      formData.append(filename, file);
      return app.apiClient.axios
        .post(action, formData, {
          withCredentials,
          headers,
        })
        .then(({ data }) => {
          onSuccess(data, file);
        })
        .catch((e) => onError(new Error(e.message)));
    },
    ...props,
  };
}

export const useUploadFiles = () => {
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const chat = useChat(currentConversation);
  const setAttachments = chat.setAttachments;

  const uploadProps = {
    action: 'aiFiles:create',
    onChange({ fileList }: UploadChangeInfo) {
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
