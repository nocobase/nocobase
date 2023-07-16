import { DeleteOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import { connect, mapReadPretty } from '@formily/react';
import { Upload as AntdUpload, Button, Progress, Space, UploadFile } from 'antd';
import cls from 'classnames';
import { saveAs } from 'file-saver';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css'; // This only needs to be imported once in your app
import { ReadPretty } from '../upload/ReadPretty';
import { isImage, toFileList, useUploadProps } from '../upload/shared';
import { useStyles } from '../upload/style';
import { UploadProps } from '../upload/type';

type Props = UploadProps & {
  /** 是否显示 Upload 按钮 */
  quickUpload: boolean;
  /** 是否显示 Select 按钮 */
  selectFile: boolean;
  onRemove?: (file) => void;
  onSelect?: () => void;
};

export const Preview = connect((props) => {
  return <ReadPretty.File {...props} />;
}, mapReadPretty(ReadPretty.File));

export const FileSelector = (props: Props) => {
  const { disabled, multiple, value, quickUpload, selectFile, onRemove, onSelect } = props;
  const uploadProps = useUploadProps({ ...props });
  const [fileList, setFileList] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  const internalFileList = useRef([]);
  const { wrapSSR, hashId, componentCls: prefixCls } = useStyles();

  // 兼容旧版本
  const showSelectButton = selectFile === undefined && quickUpload === undefined;

  useEffect(() => {
    const fileList = toFileList(value);
    setFileList(fileList);
    internalFileList.current = fileList;
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

  const list = fileList.length ? (multiple ? fileList : [fileList[fileList.length - 1]]) : [];

  return wrapSSR(
    <div>
      <div className={cls(`${prefixCls}-wrapper`, `${prefixCls}-picture-card-wrapper`, 'nb-upload', hashId)}>
        <div className={cls(`${prefixCls}-list`, `${prefixCls}-list-picture-card`)}>
          {list.map((file) => {
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
              <div
                key={file.uid || file.id}
                className={`${prefixCls}-list-picture-card-container ${prefixCls}-list-item-container`}
              >
                <div
                  className={cls(
                    `${prefixCls}-list-item`,
                    `${prefixCls}-list-item-done`,
                    `${prefixCls}-list-item-list-type-picture-card`,
                  )}
                >
                  <div className={`${prefixCls}-list-item-info`}>
                    <span className={`${prefixCls}-span`}>
                      <a
                        className={`${prefixCls}-list-item-thumbnail`}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleClick}
                      >
                        {file.imageUrl && (
                          <img src={file.imageUrl} alt={file.title} className={`${prefixCls}-list-item-image`} />
                        )}
                      </a>
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${prefixCls}-list-item-name`}
                        title={file.title}
                        href={file.url}
                        onClick={handleClick}
                      >
                        {file.status === 'uploading' ? t('Uploading') : file.title}
                      </a>
                    </span>
                  </div>
                  <span className={`${prefixCls}-list-item-actions`}>
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
                            internalFileList.current = internalFileList.current.filter((item) => item.uid !== file.uid);
                          }}
                        />
                      )}
                    </Space>
                  </span>
                  {file.status === 'uploading' && (
                    <div className={`${prefixCls}-list-item-progress`}>
                      <Progress strokeWidth={2} type={'line'} showInfo={false} percent={file.percent} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <>
            {showSelectButton ? (
              <div className={cls(`${prefixCls}-list-picture-card-container`, `${prefixCls}-list-item-container`)}>
                <AntdUpload
                  disabled={disabled}
                  multiple={multiple}
                  listType={'picture-card'}
                  showUploadList={false}
                  onRemove={handleRemove}
                >
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
                </AntdUpload>
              </div>
            ) : null}
            {quickUpload ? (
              <div className={cls(`${prefixCls}-list-picture-card-container`, `${prefixCls}-list-item-container`)}>
                <AntdUpload
                  {...uploadProps}
                  disabled={disabled}
                  multiple={multiple}
                  listType={'picture-card'}
                  fileList={fileList}
                  showUploadList={false}
                  onRemove={handleRemove}
                  onChange={(info) => {
                    // info.fileList 有 BUG，会导致上传状态一直是 uploading
                    // 所以这里仿照 antd 源码，自己维护一个 fileList
                    const list = updateFileList(info.file, internalFileList.current);
                    internalFileList.current = list;

                    // 如果不在这里 setFileList 的话，会导致 onChange 只会执行一次
                    setFileList(toFileList(list));
                    uploadProps.onChange?.({ fileList: list });
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PlusOutlined />
                    {t('Upload')}
                  </div>
                </AntdUpload>
              </div>
            ) : null}
            {selectFile ? (
              <div className={cls(`${prefixCls}-list-picture-card-container`, `${prefixCls}-list-item-container`)}>
                <AntdUpload
                  disabled={disabled}
                  multiple={multiple}
                  listType={'picture-card'}
                  showUploadList={false}
                  onRemove={handleRemove}
                >
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
                </AntdUpload>
              </div>
            ) : null}
          </>
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
              key={'preview-img'}
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
    </div>,
  );
};

export default Preview;

function updateFileList(file: UploadFile, fileList: (UploadFile | Readonly<UploadFile>)[]) {
  const nextFileList = [...fileList];
  const fileIndex = nextFileList.findIndex(({ uid }) => uid === file.uid);
  if (fileIndex === -1) {
    nextFileList.push(file);
  } else {
    nextFileList[fileIndex] = file;
  }
  return nextFileList;
}
