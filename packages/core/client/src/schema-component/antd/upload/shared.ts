import { Field } from '@formily/core';
import { useField } from '@formily/react';
import { reaction } from '@formily/reactive';
import { isArr, isValid, toArr as toArray } from '@formily/shared';
import { UploadFile } from 'antd/es/upload/interface';
import { useEffect } from 'react';
import { useAPIClient } from '../../../api-client';
import { UPLOAD_PLACEHOLDER } from './placeholder';
import type { IUploadProps, UploadProps } from './type';

export const isImage = (extName: string) => {
  const reg = /\.(png|jpg|gif|jpeg|webp)$/;
  return reg.test(extName);
};

export const isPdf = (extName: string) => {
  return extName.toLowerCase().endsWith('.pdf');
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

export const getImageByUrl = (url: string, options: any) => {
  for (let i = 0; i < UPLOAD_PLACEHOLDER.length; i++) {
    if (UPLOAD_PLACEHOLDER[i].ext.test(url) && testOpts(UPLOAD_PLACEHOLDER[i].ext, options)) {
      return UPLOAD_PLACEHOLDER[i].icon || url;
    }
  }
  return url;
};

export const getURL = (target: any) => {
  return target?.['url'] || target?.['downloadURL'] || target?.['imgURL'];
};
export const getThumbURL = (target: any) => {
  return target?.['thumbUrl'] || target?.['url'] || target?.['downloadURL'] || target?.['imgURL'];
};

export const getErrorMessage = (target: any) => {
  return target?.errorMessage ||
    target?.errMsg ||
    target?.errorMsg ||
    target?.message ||
    typeof target?.error === 'string'
    ? target.error
    : '';
};

export const getState = (target: any) => {
  if (target?.success === false) return 'error';
  if (target?.failed === true) return 'error';
  if (target?.error) return 'error';
  return target?.state || target?.status;
};

export const normalizeFileList = (fileList: UploadFile[]) => {
  if (fileList && fileList.length) {
    return fileList.map((file, index) => {
      return {
        ...file,
        uid: file.uid || `${index}`,
        status: getState(file.response) || getState(file),
        url: getURL(file) || getURL(file?.response),
        thumbUrl: getImageByUrl(getThumbURL(file) || getThumbURL(file?.response), {
          exclude: ['.png', '.jpg', '.jpeg', '.gif'],
        }),
      };
    });
  }
  return [];
};

export const useValidator = (validator: (value: any) => string) => {
  const field = useField<Field>();
  useEffect(() => {
    const dispose = reaction(
      () => field.value,
      (value) => {
        const message = validator(value);
        field.setFeedback({
          type: 'error',
          code: 'UploadError',
          messages: message ? [message] : [],
        });
      },
    );
    return () => {
      dispose();
    };
  }, []);
};

export const useUploadValidator = (serviceErrorMessage = 'Upload Service Error') => {
  useValidator((value) => {
    const list = toArr(value);
    for (let i = 0; i < list.length; i++) {
      if (list[i]?.status === 'error') {
        return getErrorMessage(list[i]?.response) || getErrorMessage(list[i]) || serviceErrorMessage;
      }
    }
  });
};

export function useUploadProps<T extends IUploadProps = UploadProps>({ serviceErrorMessage, ...props }: T) {
  useUploadValidator(serviceErrorMessage);
  const onChange = (param: { fileList: any[] }) => {
    props.onChange?.(normalizeFileList([...param.fileList]));
  };

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
    onChange,
  };
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
