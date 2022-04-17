import type { DraggerProps as AntdDraggerProps, UploadProps as AntdUploadProps } from 'antd/lib/upload';
import { UploadFile } from 'antd/lib/upload/interface';
import React from 'react';

export type UploadProps = Omit<AntdUploadProps, 'onChange'> & {
  onChange?: (fileList: UploadFile[]) => void;
  serviceErrorMessage?: string;
  value?: any;
  size?: string;
};

export type DraggerProps = Omit<AntdDraggerProps, 'onChange'> & {
  onChange?: (fileList: UploadFile[]) => void;
  serviceErrorMessage?: string;
};

export type ComposedUpload = React.FC<UploadProps> & {
  Dragger?: React.FC<DraggerProps>;
  File?: React.FC<UploadProps>;
  Attachment?: React.FC<UploadProps>;
};

export type IUploadProps = {
  serviceErrorMessage?: string;
  onChange?: (...args: any) => void;
};
