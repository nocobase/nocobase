import { DeleteOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import { connect, mapReadPretty } from '@formily/react';
import { Upload as AntdUpload, Button, Space } from 'antd';
import cls from 'classnames';
import { saveAs } from 'file-saver';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css'; // This only needs to be imported once in your app
import { ReadPretty } from '../upload/ReadPretty';
import { isImage, toArr, toFileList } from '../upload/shared';
import '../upload/style.less';

interface TPreview {
  (props: any): JSX.Element;
  Selector: React.FC<any>;
}

export const Preview = connect((props) => {
  return <ReadPretty.File {...props} />;
}, mapReadPretty(ReadPretty.File));

export const FileSelector = (props: any) => {
  const { disabled, multiple, value, onRemove, onSelect } = props;
  const [fileList, setFileList] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setFileList(toFileList(value));
  }, [value]);

  const handleRemove = (file) => {
    onRemove?.(file);
    return true;
  };

  const handleSelect = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.();
  };

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
                            handleRemove(file);
                          }}
                        />
                      )}
                    </Space>
                  </span>
                </div>
              </div>
            );
          })}
          {!disabled && (multiple || toArr(value).length < 1) && (
            <div className={'ant-upload-list-picture-card-container'}>
              <AntdUpload
                disabled={disabled}
                multiple={multiple}
                listType={'picture-card'}
                fileList={fileList}
                showUploadList={false}
                onRemove={handleRemove}
              >
                {!disabled && (multiple || toArr(value).length < 1) && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={handleSelect}
                  >
                    <PlusOutlined />
                    {t('Select')}
                  </div>
                )}
              </AntdUpload>
            </div>
          )}
        </div>
      </div>
      {/* 预览图片的弹框 */}
      {visible && (
        <Lightbox
          // discourageDownloads={true}
          mainSrc={fileList[photoIndex]?.imageUrl}
          nextSrc={fileList[(photoIndex + 1) % fileList.length]?.imageUrl}
          prevSrc={fileList[(photoIndex + fileList.length - 1) % fileList.length]?.imageUrl}
          onCloseRequest={() => setVisible(false)}
          onMovePrevRequest={() => setPhotoIndex((photoIndex + fileList.length - 1) % fileList.length)}
          onMoveNextRequest={() => setPhotoIndex((photoIndex + 1) % fileList.length)}
          imageTitle={fileList[photoIndex]?.title}
          toolbarButtons={[
            <button
              style={{ fontSize: 22, background: 'none', lineHeight: 1 }}
              type="button"
              aria-label="Zoom in"
              title="Zoom in"
              className="ril-zoom-in ril__toolbarItemChild ril__builtinButton"
              onClick={(e) => {
                e.preventDefault();
                const file = fileList[photoIndex];
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

export default Preview;
