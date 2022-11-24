import DownloadOutlined from '@ant-design/icons/DownloadOutlined';
import { Field } from '@formily/core';
import { useField } from '@formily/react';
import { Button, Space } from 'antd';
import cls from 'classnames';
import { saveAs } from 'file-saver';
import React, { useState } from 'react';
import Lightbox from 'react-image-lightbox';
import { isImage, toArr, toImages } from './shared';
import type { UploadProps } from './type';

type Composed = React.FC<UploadProps> & {
  Upload?: React.FC<UploadProps>;
  Attachment?: React.FC<UploadProps>;
};

export const ReadPretty: Composed = () => null;

ReadPretty.Attachment = (props: UploadProps) => {
  const field = useField<Field>();
  const images = toImages(toArr(field.value));
  const [photoIndex, setPhotoIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const { size } = props;
  return (
    <div>
      <div className={cls('ant-upload-picture-card-wrapper nb-upload', size ? `nb-upload-${size}` : null)}>
        <div className={'ant-upload-list ant-upload-list-picture-card'}>
          {images.map((file) => {
            const handleClick = (e) => {
              const index = images.indexOf(file);
              if (isImage(file.extname)) {
                e.preventDefault();
                e.stopPropagation();
                setVisible(true);
                setPhotoIndex(index);
              }
              // else {
              //   saveAs(file.url, `${file.title}${file.extname}`);
              // }
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
          prevSrc={images[(photoIndex + images.length - 1) % images.length]?.imageUrl}
          // @ts-ignore
          onCloseRequest={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setVisible(false);
          }}
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
};

ReadPretty.Upload = (props) => {
  const field = useField<Field>();
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
};
