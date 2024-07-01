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
import { useTranslation } from 'react-i18next';
import match from 'mime-match';
import { useCallback } from 'react';
import { useAPIClient } from '../../../api-client';
import { UNKNOWN_FILE_ICON, UPLOAD_PLACEHOLDER } from './placeholder';
import type { IUploadProps, UploadProps } from './type';

export const FILE_SIZE_LIMIT_DEFAULT = 1024 * 1024 * 20;

export const isImage = (file) => {
  return match(file.mimetype || file.type, 'image/*');
};

export const isPdf = (file) => {
  return match(file.mimetype || file.type, 'application/pdf');
};

export const toMap = (fileList: any) => {
  if (!fileList) {
    return [];
  }
  if (typeof fileList !== 'object') {
    return [];
  }
  let list = fileList;
  if (!Array.isArray(fileList)) {
    if (Object.keys({ ...fileList }).length === 0) {
      return [];
    }
    list = [fileList];
  }
  return list.map((item) => {
    return [item.id || item.uid, toItem(item)];
  });
};

export const toImages = (fileList) => {
  if (!fileList) {
    return [];
  }
  if (typeof fileList !== 'object') {
    return [];
  }
  if (Object.keys(fileList).length === 0) {
    return [];
  }
  let list = fileList;
  if (!Array.isArray(fileList) && typeof fileList === 'object') {
    list = [fileList];
  }
  return list.map((item) => {
    return {
      ...item,
      title: item.title || item.name,
      imageUrl: getImageByUrl(item.url, {
        exclude: ['.png', '.jpg', '.jpeg', '.gif'],
      }),
    };
  });
};

export const toArr = (value) => {
  if (!isValid(value)) {
    return [];
  }
  if (Object.keys(value).length === 0) {
    return [];
  }
  return toArray(value);
};

export const testOpts = (ext: RegExp, options: { exclude?: string[]; include?: string[] }) => {
  if (options && isArr(options.include)) {
    return options.include.some((url) => ext.test(url));
  }

  if (options && isArr(options.exclude)) {
    return !options.exclude.some((url) => ext.test(url));
  }

  return true;
};

export const getImageByUrl = (url: string, options: any = {}) => {
  for (let i = 0; i < UPLOAD_PLACEHOLDER.length; i++) {
    // console.log(UPLOAD_PLACEHOLDER[i].ext, testOpts(UPLOAD_PLACEHOLDER[i].ext, options));
    if (UPLOAD_PLACEHOLDER[i].ext.test(url)) {
      if (testOpts(UPLOAD_PLACEHOLDER[i].ext, options)) {
        return UPLOAD_PLACEHOLDER[i].icon || UNKNOWN_FILE_ICON;
      } else {
        return url;
      }
    }
  }
  return UNKNOWN_FILE_ICON;
};

export const getURL = (target: any) => {
  return target?.['url'] || target?.['downloadURL'] || target?.['imgURL'] || target?.['name'];
};
export const getThumbURL = (target: any) => {
  return target?.['thumbUrl'] || target?.['url'] || target?.['downloadURL'] || target?.['imgURL'] || target?.['name'];
};

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
  const imageUrl = isImage(file) ? URL.createObjectURL(file.originFileObj) : getImageByUrl(file.name);
  const response = getResponseMessage(file);
  return {
    ...file,
    title: file.name,
    thumbUrl: imageUrl,
    imageUrl,
    response,
  };
}

export const normalizeFileList = (fileList: UploadFile[]) => {
  if (fileList && fileList.length) {
    return fileList.map(normalizeFile);
  }
  return [];
};

export function useUploadProps<T extends IUploadProps = UploadProps>(props: T) {
  const api = useAPIClient();

  return {
    ...props,
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
  };
}

export function toValueItem(file) {
  return file.response?.data;
}

export const toItem = (file) => {
  if (file?.response?.data) {
    file = {
      uid: file.uid,
      ...file.response.data,
    };
  }
  return {
    ...file,
    id: file.id || file.uid,
    title: file.title || file.name,
    imageUrl: getImageByUrl(file.url, {
      exclude: ['.png', '.jpg', '.jpeg', '.gif'],
    }),
  };
};

export const toFileList = (fileList: any) => {
  return toArr(fileList).filter(Boolean).map(toItem);
};

export const toValue = (fileList: any) => {
  return toArr(fileList)
    .filter((file) => !file.response || file.status === 'done')
    .map((file) => file?.response?.data || file);
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

function validate(file, rules: Record<string, any>) {
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
