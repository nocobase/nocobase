import DownloadOutlined from '@ant-design/icons/DownloadOutlined';
import { Field } from '@formily/core';
import { useField } from '@formily/react';
import { isString } from '@nocobase/utils/client';
import { Button, Space, Modal } from 'antd';
import cls from 'classnames';
import { saveAs } from 'file-saver';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Lightbox from 'react-image-lightbox';
import { useRecord } from '../../../record-provider';
import { isImage, isPdf, toArr, toImages } from './shared';
import type { UploadProps } from './type';

type Composed = React.FC<UploadProps> & {
  Upload?: React.FC<UploadProps>;
  File?: React.FC<UploadProps>;
};

export const ReadPretty: Composed = () => null;

ReadPretty.File = function File(props: UploadProps) {
  const { t } = useTranslation();
  const record = useRecord();
  const field = useField<Field>();
  const value = isString(field.value) ? record : field.value;
  const images = toImages(toArr(value));
  const [fileIndex, setFileIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [fileType, setFileType] = useState<'image' | 'pdf'>();
  const { size } = props;

  function closeIFrameModal() {
    setVisible(false);
  }

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
                setFileIndex(index);
                setFileType('image');
              } else if(isPdf(file.extname)) {
                e.preventDefault();
                e.stopPropagation();
                setVisible(true);
                setFileIndex(index);
                setFileType('pdf');
              }
              // else {
              //   saveAs(file.url, `${file.title}${file.extname}`);
              // }
            };
            return (
              <div key={file.name} className={'ant-upload-list-picture-card-container'}>
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
      {visible && fileType === 'image' && (
        <Lightbox
          // discourageDownloads={true}
          mainSrc={images[fileIndex]?.imageUrl}
          nextSrc={images[(fileIndex + 1) % images.length]?.imageUrl}
          prevSrc={images[(fileIndex + images.length - 1) % images.length]?.imageUrl}
          // @ts-ignore
          onCloseRequest={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setVisible(false);
          }}
          onMovePrevRequest={() => setFileIndex((fileIndex + images.length - 1) % images.length)}
          onMoveNextRequest={() => setFileIndex((fileIndex + 1) % images.length)}
          imageTitle={images[fileIndex]?.title}
          toolbarButtons={[
            <button
              key={'download'}
              style={{ fontSize: 22, background: 'none', lineHeight: 1 }}
              type="button"
              aria-label="Zoom in"
              title="Zoom in"
              className="ril-zoom-in ril__toolbarItemChild ril__builtinButton"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = images[fileIndex];
                saveAs(file.url, `${file.title}${file.extname}`);
              }}
            >
              <DownloadOutlined />
            </button>,
          ]}
        />
      )}
      
      {visible && fileType === 'pdf' && (
        <Modal
          open={visible}
          title={'PDF - ' + images[fileIndex].title}
          onCancel={closeIFrameModal}
          footer={[
            <Button
              style={{
                textTransform: 'capitalize'
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = images[fileIndex];
                saveAs(file.url, `${file.title}${file.extname}`);
              }}
            >
              {t('download')}
            </Button>,
            <Button onClick={closeIFrameModal} style={{textTransform: 'capitalize'}}>
              {t('close')}
            </Button>
          ]}
          width={'85vw'}
          centered={true}
        >
          <div style={{
            padding: '8px',
            maxWidth: '100%',
            maxHeight: 'calc(100vh - 256px)',
            height: '90vh',
            width: '100%',
            background: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflowY: 'auto'
          }} >
            <iframe src={images[fileIndex].url} style={{
              width: '100%',
              maxHeight: '90vh',
              flex: '1 1 auto'
            }}>
            </iframe>
          </div>
        </Modal>
      )}

    </div>
  );
};

ReadPretty.Upload = function Upload(props) {
  const field = useField<Field>();
  return (field.value || []).map((item) => (
    <div key={item.name}>
      {item.url ? (
        <a target={'_blank'} href={item.url} rel="noreferrer">
          {item.name}
        </a>
      ) : (
        <span>{item.name}</span>
      )}
    </div>
  ));
};
