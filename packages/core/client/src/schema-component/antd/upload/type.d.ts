import type { DraggerProps as AntdDraggerProps, UploadProps as AntdUploadProps } from 'antd/es/upload';
import { UploadFile } from 'antd/es/upload/interface';
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
  tipContent?: string | React.ReactNode;
  children?: React.ReactNode;
};

export type DraggerV2Props = Omit<AntdDraggerProps, 'onChange'> & {
  onChange?: (fileList: UploadFile[]) => void;
  serviceErrorMessage?: string;
  title?: string;
  subTitle?: string;
  children?: React.ReactNode;
  useProps?: () => any;
};

export type ComposedUpload = React.FC<UploadProps> & {
  Dragger?: React.FC<DraggerProps>;
  DraggerV2?: React.FC<DraggerProps>;
  File?: React.FC<UploadProps>;
  Attachment?: React.FC<UploadProps>;
  Selector?: React.FC<any>;
};

export type IUploadProps = {
  serviceErrorMessage?: string;
  onChange?: (...args: any) => void;
};
