import React, { useEffect } from 'react';
import {
  connect,
  mapProps,
  mapReadPretty,
  observer,
  useField,
} from '@formily/react';
import { Button, Progress, Space, Upload as AntdUpload } from 'antd';
import {
  UploadChangeParam,
  UploadProps as AntdUploadProps,
  DraggerProps as AntdDraggerProps,
} from 'antd/lib/upload';
import { reaction } from '@formily/reactive';
import { UploadFile } from 'antd/lib/upload/interface';
import { isArr, toArr as toArray, isValid } from '@formily/shared';
import { UPLOAD_PLACEHOLDER } from './placeholder';
import { usePrefixCls } from '@formily/antd/esm/__builtins__';
import { useState } from 'react';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css'; // This only needs to be imported once in your app
import { useMap } from 'ahooks';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import UploadOutlined from '@ant-design/icons/UploadOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import DownloadOutlined from '@ant-design/icons/DownloadOutlined';
import './style.less';
import cls from 'classnames';
import { saveAs } from 'file-saver';
import { useTranslation } from 'react-i18next';
import { Field } from '@formily/core';

const toArr = (value) => {
  if (!isValid(value)) {
    return [];
  }
  if (Object.keys(value).length === 0) {
    return [];
  }
  return toArray(value);
};

type UploadProps = Omit<AntdUploadProps, 'onChange'> & {
  onChange?: (fileList: UploadFile[]) => void;
  serviceErrorMessage?: string;
  value?: any;
};

type DraggerProps = Omit<AntdDraggerProps, 'onChange'> & {
  onChange?: (fileList: UploadFile[]) => void;
  serviceErrorMessage?: string;
};

type ComposedUpload = React.FC<UploadProps> & {
  Dragger?: React.FC<DraggerProps>;
  File?: React.FC<UploadProps>;
  Attachment?: React.FC<UploadProps>;
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
    const field = useField<Field>();
    console.log('field.value', field.value);
    return (field.value || []).map((item) => (
      <div>
        {item.url ? (
          <a target={'_blank'} href={item.url}>
            {item.name}
          </a>
        ) : (
          <span>{item.name}</span>
        )}
      </div>
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

function toItem(file) {
  if (file?.response?.data) {
    file = file.response.data;
  }
  return {
    ...file,
    id: file.id || file.uid,
    title: file.title || file.name,
    imageUrl: getImageByUrl(file.url, {
      exclude: ['.png', '.jpg', '.jpeg', '.gif'],
    }),
  };
}

function toFileList(fileList: any) {
  return toArr(fileList).map(toItem);
}

function toValue(fileList: any) {
  return toArr(fileList)
    .filter((file) => !file.response || file.status === 'done')
    .map((file) => file?.response?.data || file);
}

function toMap(fileList: any) {
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
  console.log({ list, fileList });
  return list.map((item) => {
    return [item.id || item.uid, toItem(item)];
  });
}

const toImages = (fileList) => {
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

Upload.Attachment = connect(
  (props: UploadProps) => {
    const { disabled, multiple, value, onChange } = props;
    const [fileList, setFileList] = useState([]);
    const [sync, setSync] = useState(true);
    const images = fileList;
    const [photoIndex, setPhotoIndex] = useState(0);
    const [visible, setVisible] = useState(false);
    const { t } = useTranslation();
    useEffect(() => {
      if (sync) {
        setFileList(toFileList(value));
      }
    }, [value, sync]);
    return (
      <div>
        <div className={cls('ant-upload-picture-card-wrapper nb-upload')}>
          <div className={'ant-upload-list ant-upload-list-picture-card'}>
            {fileList.map((file) => {
              const handleClick = (e) => {
                e.preventDefault();
                const index = fileList.indexOf(file);
                setVisible(true);
                setPhotoIndex(index);
              };
              return (
                <div className={'ant-upload-list-picture-card-container'}>
                  <div className="ant-upload-list-item ant-upload-list-item-done ant-upload-list-item-list-type-picture-card">
                    <div className={'ant-upload-list-item-info'}>
                      <span className="ant-upload-span">
                        <a
                          className="ant-upload-list-item-thumbnail"
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={handleClick}
                        >
                          {file.imageUrl && (
                            <img
                              src={file.imageUrl}
                              alt={file.title}
                              className="ant-upload-list-item-image"
                            />
                          )}
                        </a>
                        <a
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ant-upload-list-item-name"
                          title={file.title}
                          href={file.url}
                          onClick={handleClick}
                        >
                          {file.status === 'uploading'
                            ? t('Uploading')
                            : file.title}
                        </a>
                      </span>
                    </div>
                    <span className={'ant-upload-list-item-actions'}>
                      <Space size={3}>
                        <Button
                          size={'small'}
                          type={'text'}
                          icon={<DownloadOutlined />}
                          onClick={() => {
                            saveAs(file.url, `${file.title}${file.extname}`);
                          }}
                        />
                        {!disabled && (
                          <Button
                            size={'small'}
                            type={'text'}
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              setSync(false);
                              setFileList((prevFileList) => {
                                if (!multiple) {
                                  onChange(null);
                                  return [];
                                }
                                const index = prevFileList.indexOf(file);
                                prevFileList.splice(index, 1);
                                onChange(toValue([...prevFileList]));
                                return [...prevFileList];
                              });
                            }}
                          />
                        )}
                      </Space>
                    </span>
                    {file.status === 'uploading' && (
                      <div className={'ant-upload-list-item-progress'}>
                        <Progress
                          strokeWidth={2}
                          type={'line'}
                          showInfo={false}
                          percent={file.percent}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div className={'ant-upload-list-picture-card-container'}>
              <AntdUpload
                {...useUploadProps({ ...props })}
                disabled={disabled}
                multiple={multiple}
                listType={'picture-card'}
                fileList={fileList}
                action={`${process.env.API_URL}attachments:upload`}
                onChange={(info) => {
                  setSync(false);
                  if (multiple) {
                    if (info.file.status === 'done') {
                      onChange(toValue(info.fileList));
                    }
                    setFileList(info.fileList.map(toItem));
                  } else {
                    if (info.file.status === 'done') {
                      console.log('field.value', info.file?.response?.data);
                      // TODO(BUG): object 的联动有问题，不响应，折中的办法先置空再赋值
                      onChange(null);
                      onChange(info.file?.response?.data);
                    }
                    setFileList([toItem(info.file)]);
                  }
                }}
                showUploadList={false}
              >
                {!disabled && (multiple || toArr(value).length < 1) && (
                  <span>
                    <PlusOutlined />
                    <br /> {t('Upload')}
                  </span>
                )}
              </AntdUpload>
            </div>
          </div>
        </div>
        {visible && (
          <Lightbox
            // discourageDownloads={true}
            mainSrc={images[photoIndex]?.imageUrl}
            nextSrc={images[(photoIndex + 1) % images.length]?.imageUrl}
            prevSrc={
              images[(photoIndex + images.length - 1) % images.length]?.imageUrl
            }
            onCloseRequest={() => setVisible(false)}
            onMovePrevRequest={() =>
              setPhotoIndex((photoIndex + images.length - 1) % images.length)
            }
            onMoveNextRequest={() =>
              setPhotoIndex((photoIndex + 1) % images.length)
            }
            imageTitle={images[photoIndex]?.title}
            toolbarButtons={[
              <button
                style={{ fontSize: 22, background: 'none', lineHeight: 1 }}
                type="button"
                aria-label="Zoom in"
                title="Zoom in"
                className="ril-zoom-in ril__toolbarItemChild ril__builtinButton"
                onClick={(e) => {
                  e.preventDefault();
                  const file = images[photoIndex];
                  saveAs(file.url, `${file.title}${file.extname}`);
                }}
              >
                <DownloadOutlined />
              </button>,
            ]}
          />
        )}
      </div>
    );
  },
  mapReadPretty((props) => {
    const field = useField<Field>();
    const images = toImages(toArr(field.value));
    const [photoIndex, setPhotoIndex] = useState(0);
    const [visible, setVisible] = useState(false);
    const { size } = props;
    console.log('field.value', field.value, images);
    return (
      <div>
        <div
          className={cls(
            'ant-upload-picture-card-wrapper nb-upload',
            size ? `nb-upload-${size}` : null,
          )}
        >
          <div className={'ant-upload-list ant-upload-list-picture-card'}>
            {images.map((file) => {
              const handleClick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const index = images.indexOf(file);
                setVisible(true);
                setPhotoIndex(index);
              };
              return (
                <div className={'ant-upload-list-picture-card-container'}>
                  <div className="ant-upload-list-item ant-upload-list-item-done ant-upload-list-item-list-type-picture-card">
                    <div className={'ant-upload-list-item-info'}>
                      <span className="ant-upload-span">
                        <a
                          className="ant-upload-list-item-thumbnail"
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={handleClick}
                        >
                          {file.imageUrl && (
                            <img
                              src={`${file.imageUrl}?x-oss-process=style/thumbnail`}
                              alt={file.title}
                              className="ant-upload-list-item-image"
                            />
                          )}
                        </a>
                        <a
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ant-upload-list-item-name"
                          title={file.title}
                          href={file.url}
                          onClick={handleClick}
                        >
                          {file.title}
                        </a>
                      </span>
                    </div>
                    {size !== 'small' && (
                      <span className={'ant-upload-list-item-actions'}>
                        <Space size={3}>
                          <Button
                            size={'small'}
                            type={'text'}
                            icon={<DownloadOutlined />}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              saveAs(file.url, `${file.title}${file.extname}`);
                            }}
                          />
                        </Space>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {visible && (
          <Lightbox
            // discourageDownloads={true}
            mainSrc={images[photoIndex]?.imageUrl}
            nextSrc={images[(photoIndex + 1) % images.length]?.imageUrl}
            prevSrc={
              images[(photoIndex + images.length - 1) % images.length]?.imageUrl
            }
            // @ts-ignore
            onCloseRequest={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setVisible(false);
            }}
            onMovePrevRequest={() =>
              setPhotoIndex((photoIndex + images.length - 1) % images.length)
            }
            onMoveNextRequest={() =>
              setPhotoIndex((photoIndex + 1) % images.length)
            }
            imageTitle={images[photoIndex]?.title}
            toolbarButtons={[
              <button
                style={{ fontSize: 22, background: 'none', lineHeight: 1 }}
                type="button"
                aria-label="Zoom in"
                title="Zoom in"
                className="ril-zoom-in ril__toolbarItemChild ril__builtinButton"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = images[photoIndex];
                  saveAs(file.url, `${file.title}${file.extname}`);
                }}
              >
                <DownloadOutlined />
              </button>,
            ]}
          />
        )}
      </div>
    );
  }),
);

Upload.Dragger = Dragger;

export default Upload;
