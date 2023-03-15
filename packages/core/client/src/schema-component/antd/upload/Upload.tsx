import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import DownloadOutlined from '@ant-design/icons/DownloadOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import { usePrefixCls } from '@formily/antd/lib/__builtins__';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { Button, Progress, Space, Upload as AntdUpload } from 'antd';
import cls from 'classnames';
import { saveAs } from 'file-saver';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css'; // This only needs to be imported once in your app
import { ReadPretty } from './ReadPretty';
import { isImage, toArr, toFileList, toItem, toValue, useUploadProps } from './shared';
import './style.less';
import type { ComposedUpload, DraggerProps, UploadProps } from './type';

export const Upload: ComposedUpload = connect(
  (props: UploadProps) => {
    return <AntdUpload {...useUploadProps(props)} />;
  },
  mapProps({
    value: 'fileList',
  }),
  mapReadPretty(ReadPretty.Upload),
);

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
    const uploadProps = useUploadProps({ ...props });
    return (
      <div>
        <div className={cls('ant-upload-picture-card-wrapper nb-upload')}>
          <div className={'ant-upload-list ant-upload-list-picture-card'}>
            {fileList.map((file) => {
              const handleClick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const index = fileList.indexOf(file);
                if (isImage(file.extname)) {
                  setVisible(true);
                  setPhotoIndex(index);
                } else {
                  saveAs(file.url, `${file.title}${file.extname}`);
                }
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
                            <img src={file.imageUrl} alt={file.title} className="ant-upload-list-item-image" />
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
                          {file.status === 'uploading' ? t('Uploading') : file.title}
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
                        <Progress strokeWidth={2} type={'line'} showInfo={false} percent={file.percent} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {!disabled && (multiple || toArr(value).length < 1) && (
              <div className={'ant-upload-list-picture-card-container'}>
                <AntdUpload
                  {...uploadProps}
                  disabled={disabled}
                  multiple={multiple}
                  listType={'picture-card'}
                  fileList={fileList}
                  onChange={(info) => {
                    setSync(false);
                    if (multiple) {
                      if (info.file.status === 'done') {
                        onChange(toValue(info.fileList));
                      }
                      setFileList(info.fileList.map(toItem));
                    } else {
                      if (info.file.status === 'done') {
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
            )}
          </div>
        </div>
        {visible && (
          <Lightbox
            // discourageDownloads={true}
            mainSrc={images[photoIndex]?.imageUrl}
            nextSrc={images[(photoIndex + 1) % images.length]?.imageUrl}
            prevSrc={images[(photoIndex + images.length - 1) % images.length]?.imageUrl}
            onCloseRequest={() => setVisible(false)}
            onMovePrevRequest={() => setPhotoIndex((photoIndex + images.length - 1) % images.length)}
            onMoveNextRequest={() => setPhotoIndex((photoIndex + 1) % images.length)}
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
  mapReadPretty(ReadPretty.Attachment),
);

Upload.Dragger = connect(
  (props: DraggerProps) => {
    const { tipContent } = props;
    return (
      <div className={usePrefixCls('upload-dragger')}>
        <AntdUpload.Dragger {...useUploadProps(props)}>
          {tipContent}
          {props.children}
        </AntdUpload.Dragger>
      </div>
    );
  },
  mapProps({
    value: 'fileList',
  }),
);

export default Upload;
