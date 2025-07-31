/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isArr, isValid, toArr as toArray } from '@formily/shared';
import { UploadFile } from 'antd/es/upload/interface';
import mime from 'mime';
import match from 'mime-match';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../../api-client';
import { UNKNOWN_FILE_ICON, UPLOAD_PLACEHOLDER } from './placeholder';
import type { IUploadProps, UploadProps } from './type';

export const FILE_SIZE_LIMIT_DEFAULT = 1024 * 1024 * 20;

export interface FileModel {
  id: number;
  filename: string;
  path: string;
  title: string;
  url: string;
  extname: string;
  size: number;
  mimetype: string;
}

export interface PreviewerProps {
  index: number;
  list: FileModel[];
  onSwitchIndex(index): void;
}

export interface AttachmentFileType {
  match(file: any): boolean;
  getThumbnailURL?(file: any): string;
  ThumbnailPreviewer?: React.ComponentType<{ file: FileModel }>;
  Previewer?: React.ComponentType<PreviewerProps>;
}

export class AttachmentFileTypes {
  types: AttachmentFileType[] = [];
  add(type: AttachmentFileType) {
    // NOTE: use unshift to make sure the custom type has higher priority
    this.types.unshift(type);
  }
  getTypeByFile(file): Omit<AttachmentFileType, 'match'> {
    return this.types.find((type) => type.match(file));
  }
}

/**
 * @experimental
 */
export const attachmentFileTypes = new AttachmentFileTypes();

export function matchMimetype(file: FileModel | UploadFile<any>, type: string) {
  if (!file) {
    return false;
  }
  if ((<UploadFile>file).originFileObj) {
    return match((<UploadFile>file).type, type);
  }
  if ((<FileModel>file).mimetype) {
    return match((<FileModel>file).mimetype, type);
  }
  if (file.url) {
    const [fileUrl] = file.url.split('?');
    return match(mime.getType(fileUrl) || '', type);
  }
  return false;
}

const toArr = (value) => {
  if (!isValid(value)) {
    return [];
  }
  if (Object.keys(value).length === 0) {
    return [];
  }
  return toArray(value);
};

const testOpts = (ext: RegExp, options: { exclude?: string[]; include?: string[] }) => {
  if (options && isArr(options.include)) {
    return options.include.some((url) => ext.test(url));
  }

  if (options && isArr(options.exclude)) {
    return !options.exclude.some((url) => ext.test(url));
  }

  return true;
};

export function getThumbnailPlaceholderURL(file, options: any = {}) {
  for (let i = 0; i < UPLOAD_PLACEHOLDER.length; i++) {
    if (UPLOAD_PLACEHOLDER[i].ext.test(file.extname || file.filename || file.url || file.name)) {
      if (testOpts(UPLOAD_PLACEHOLDER[i].ext, options)) {
        return UPLOAD_PLACEHOLDER[i].icon || UNKNOWN_FILE_ICON;
      } else {
        return file.name;
      }
    }
  }
  return UNKNOWN_FILE_ICON;
}

export function getResponseMessage({ error, response }: UploadFile<any>) {
  if (error instanceof Error && 'isAxiosError' in error) {
    // @ts-ignore
    if (error.response) {
      // @ts-ignore
      return error.response.data?.errors?.map?.((item) => item?.message).join(', ');
    } else {
      return error.message;
    }
  }
  if (!response) {
    return '';
  }
  if (typeof response === 'string') {
    return response;
  }
  const { errors } = response.data ?? {};
  if (!errors?.length) {
    return '';
  }
  return errors.map((item) => item?.message).join(', ');
}

export function normalizeFile(file: UploadFile & Record<string, any>) {
  const response = getResponseMessage(file);
  return {
    ...file,
    title: file.name,
    response,
  };
}

export function useUploadProps<T extends IUploadProps = UploadProps>(props: T) {
  const api = useAPIClient();

  return {
    // in customRequest method can't modify form's status(e.g: form.disabled=true )
    // that will be trigger Upload component（actual Underlying is AjaxUploader component ）'s  componentWillUnmount method
    // which will cause multiple files upload fail
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
          onUploadProgress: ({ total, loaded }) => {
            onProgress({ percent: Math.round((loaded / total) * 100).toFixed(2) }, file);
          },
        })
        .then(({ data }) => {
          onSuccess(data, file);
        })
        .catch(onError)
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

export function toValueItem(data) {
  return data;
}

export const toItem = (file) => {
  if (typeof file === 'string') {
    return {
      url: file,
    };
  }
  if (file?.response?.data) {
    file = {
      uid: file.uid,
      ...file.response.data,
    };
  }
  const result = {
    ...file,
    id: file.id || file.uid,
    title: file.title || file.name,
  };
  if (file.url) {
    result.url =
      file.url.startsWith('https://') || file.url.startsWith('http://')
        ? file.url
        : `${location.origin}/${file.url.replace(/^\//, '')}`;
  }
  return result;
};

export const toFileList = (fileList: any) => {
  return toArr(fileList).filter(Boolean).map(toItem);
};

const Rules: Record<string, RuleFunction> = {
  size(file, options: number): null | string {
    const size = options ?? FILE_SIZE_LIMIT_DEFAULT;
    if (size === 0) {
      return null;
    }
    return file.size <= size ? null : 'File size exceeds the limit';
  },
  mimetype(file, options: string | string[] = '*'): null | string {
    const pattern = options.toString().trim();
    if (!pattern || pattern === '*') {
      return null;
    }
    return pattern.split(',').filter(Boolean).some(match(file.type)) ? null : 'File type is not allowed';
  },
};

type RuleFunction = (file: UploadFile, options: any) => string | null;

export function validate(file, rules: Record<string, any>) {
  if (!rules) {
    return null;
  }
  const ruleKeys = Object.keys(rules);
  if (!ruleKeys.length) {
    return null;
  }
  for (const key of ruleKeys) {
    const error = Rules[key](file, rules[key]);
    if (error) {
      return error;
    }
  }
  return null;
}

export function useBeforeUpload(rules) {
  const { t } = useTranslation();

  return useCallback(
    (file) => {
      const error = validate(file, rules);

      if (error) {
        file.status = 'error';
        file.response = t(error);
      } else {
        if (file.status === 'error') {
          delete file.status;
          delete file.response;
        }
      }
      return !error;
    },
    [rules],
  );
}
