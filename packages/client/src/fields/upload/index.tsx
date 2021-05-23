import React, { useEffect } from 'react';
import { connect, mapProps, mapReadPretty, useField } from '@formily/react';
import { Upload as AntdUpload } from 'antd';
import {
  UploadChangeParam,
  UploadProps as AntdUploadProps,
  DraggerProps as AntdDraggerProps,
} from 'antd/lib/upload';
import { reaction } from '@formily/reactive';
import { UploadFile } from 'antd/lib/upload/interface';
import { isArr, toArr } from '@formily/shared';
import { UPLOAD_PLACEHOLDER } from './placeholder';
import { usePrefixCls } from '@formily/antd/esm/__builtins__';

type UploadProps = Omit<AntdUploadProps, 'onChange'> & {
  onChange?: (fileList: UploadFile[]) => void;
  serviceErrorMessage?: string;
};

type DraggerProps = Omit<AntdDraggerProps, 'onChange'> & {
  onChange?: (fileList: UploadFile[]) => void;
  serviceErrorMessage?: string;
};

type ComposedUpload = React.FC<UploadProps> & {
  Dragger?: React.FC<DraggerProps>;
};

type IUploadProps = {
  serviceErrorMessage?: string;
  onChange?: (...args: any) => void;
};

const testOpts = (
  ext: RegExp,
  options: { exclude?: string[]; include?: string[] },
) => {
  if (options && isArr(options.include)) {
    return options.include.some((url) => ext.test(url));
  }

  if (options && isArr(options.exclude)) {
    return !options.exclude.some((url) => ext.test(url));
  }

  return true;
};

const getImageByUrl = (url: string, options: any) => {
  for (let i = 0; i < UPLOAD_PLACEHOLDER.length; i++) {
    if (
      UPLOAD_PLACEHOLDER[i].ext.test(url) &&
      testOpts(UPLOAD_PLACEHOLDER[i].ext, options)
    ) {
      return UPLOAD_PLACEHOLDER[i].icon || url;
    }
  }

  return url;
};

const getURL = (target: any) => {
  return target?.['url'] || target?.['downloadURL'] || target?.['imgURL'];
};
const getThumbURL = (target: any) => {
  return (
    target?.['thumbUrl'] ||
    target?.['url'] ||
    target?.['downloadURL'] ||
    target?.['imgURL']
  );
};

const getErrorMessage = (target: any) => {
  return target?.errorMessage ||
    target?.errMsg ||
    target?.errorMsg ||
    target?.message ||
    typeof target?.error === 'string'
    ? target.error
    : '';
};

const getState = (target: any) => {
  if (target?.success === false) return 'error';
  if (target?.failed === true) return 'error';
  if (target?.error) return 'error';
  return target?.state || target?.status;
};

const normalizeFileList = (fileList: UploadFile[]) => {
  if (fileList && fileList.length) {
    return fileList.map((file, index) => {
      return {
        ...file,
        uid: file.uid || `${index}`,
        status: getState(file.response) || getState(file),
        url: getURL(file) || getURL(file?.response),
        thumbUrl: getImageByUrl(
          getThumbURL(file) || getThumbURL(file?.response),
          {
            exclude: ['.png', '.jpg', '.jpeg', '.gif'],
          },
        ),
      };
    });
  }
  return [];
};

const useValidator = (validator: (value: any) => string) => {
  const field = useField<Formily.Core.Models.Field>();
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

const useUploadValidator = (serviceErrorMessage = 'Upload Service Error') => {
  useValidator((value) => {
    const list = toArr(value);
    for (let i = 0; i < list.length; i++) {
      if (list[i]?.status === 'error') {
        return (
          getErrorMessage(list[i]?.response) ||
          getErrorMessage(list[i]) ||
          serviceErrorMessage
        );
      }
    }
  });
};

function useUploadProps<T extends IUploadProps = UploadProps>({
  serviceErrorMessage,
  ...props
}: T) {
  useUploadValidator(serviceErrorMessage);
  const onChange = (param: UploadChangeParam<UploadFile>) => {
    props.onChange?.(normalizeFileList([...param.fileList]));
  };
  return {
    ...props,
    onChange,
  };
}

export const Upload: ComposedUpload = connect(
  (props: UploadProps) => {
    return <AntdUpload {...useUploadProps(props)} />;
  },
  mapProps({
    value: 'fileList',
  }),
  mapReadPretty((props) => {
    const field = useField<Formily.Core.Models.Field>();
    console.log('field.value', field.value);
    return (field.value || []).map((item) => (
      <div>{item.url ? <a target={'_blank'} href={item.url}>{item.name}</a> : <span>{item.name}</span>}</div>
    ));
  }),
);

const Dragger = connect(
  (props: DraggerProps) => {
    return (
      <div className={usePrefixCls('upload-dragger')}>
        <AntdUpload.Dragger {...useUploadProps(props)} />
      </div>
    );
  },
  mapProps({
    value: 'fileList',
  }),
);

Upload.Dragger = Dragger;

export default Upload;
