import React, { useEffect } from 'react';
import {
  connect,
  mapProps,
  mapReadPretty,
  observer,
  useField,
} from '@formily/react';
import { Button, Progress, Upload as AntdUpload } from 'antd';
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
import { useState } from 'react';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css'; // This only needs to be imported once in your app
import { useMap } from 'ahooks';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import UploadOutlined from '@ant-design/icons/UploadOutlined';

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
  File?: React.FC<UploadProps>;
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

function toMap(fileList: any) {
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

Upload.File = connect(
  (props: UploadProps & { value?: any }) => {
    const {
      multiple,
      listType = 'picture-card',
      value,
      onChange,
      ...others
    } = props;
    const [map, { set, setAll, remove }] = useMap<string, any>(toMap(value));
    const images = toImages(value);
    const [photoIndex, setPhotoIndex] = useState(0);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
      setAll(toMap(value));
    }, [value]);
    console.log('value', value);
    return (
      <div>
        <AntdUpload
          action={`${process.env.API_URL}attachments:upload`}
          {...useUploadProps({ ...others, multiple })}
          onChange={({ file }) => {
            console.log({ multiple, file });
            if (multiple) {
              set(file.uid, toItem(file));
            } else {
              setAll([[file.uid, toItem(file)]]);
            }
            if (file.status === 'done') {
              if (multiple) {
                onChange([...toArr(value), file?.response?.data]);
              } else {
                onChange(file?.response?.data);
              }
            }
          }}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>上传文件</Button>
        </AntdUpload>
        {[...map.entries()].map(
          ([key, item]) =>
            item.id && (
              <div>
                {item.url ? (
                  <a
                    target={'_blank'}
                    href={item.url}
                    title={item.title}
                    onClick={(e) => {
                      e.preventDefault();
                      const index = images.findIndex(
                        (image) => image.id === item.id,
                      );
                      setVisible(true);
                      setPhotoIndex(index);
                    }}
                  >
                    <img style={{ height: 16 }} src={item.imageUrl} />{' '}
                    {listType !== 'picture-card' && item.title}{' '}
                    <DeleteOutlined
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        remove(key);
                        if (multiple) {
                          const values = toArr(value).filter(
                            (v) => v.id === item.id,
                          );
                          onChange(values);
                        } else {
                          onChange(null);
                        }
                      }}
                    />
                  </a>
                ) : (
                  <span>
                    {item.title}
                    <Progress percent={item.percent} showInfo={false} />
                  </span>
                )}
              </div>
            ),
        )}
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
            // toolbarButtons={[
            //   <div>下载</div>,
            // ]}
            // imageCaption={'xxx'}
          />
        )}
      </div>
    );
  },
  mapReadPretty(
    observer((props) => {
      const field = useField<Formily.Core.Models.Field>();
      const images = toImages(field.value);
      const [photoIndex, setPhotoIndex] = useState(0);
      const [visible, setVisible] = useState(false);
      console.log('field.value', field.value, images);
      return (
        <div>
          {images.map((item) => (
            <div>
              <a
                target={'_blank'}
                href={item.url}
                onClick={(e) => {
                  e.preventDefault();
                  const index = images.indexOf(item);
                  setVisible(true);
                  setPhotoIndex(index);
                }}
              >
                <img style={{ height: 16 }} src={item.imageUrl} /> {item.title}
              </a>
            </div>
          ))}
          {visible && (
            <Lightbox
              // discourageDownloads={true}
              mainSrc={images[photoIndex]?.imageUrl}
              nextSrc={images[(photoIndex + 1) % images.length]?.imageUrl}
              prevSrc={
                images[(photoIndex + images.length - 1) % images.length]
                  ?.imageUrl
              }
              onCloseRequest={() => setVisible(false)}
              onMovePrevRequest={() =>
                setPhotoIndex((photoIndex + images.length - 1) % images.length)
              }
              onMoveNextRequest={() =>
                setPhotoIndex((photoIndex + 1) % images.length)
              }
              imageTitle={images[photoIndex]?.title}
              // toolbarButtons={[
              //   <div>下载</div>,
              // ]}
              // imageCaption={'xxx'}
            />
          )}
        </div>
      );
    }),
  ),
);

Upload.Dragger = Dragger;

export default Upload;
