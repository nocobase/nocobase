import { DeleteOutlined, DownloadOutlined, InboxOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { Upload as AntdUpload, Button, Modal, Progress, Space, Tooltip } from 'antd';
import cls from 'classnames';
import { saveAs } from 'file-saver';
import { filesize } from 'filesize';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LightBox from 'react-image-lightbox';
import 'react-image-lightbox/style.css'; // This only needs to be imported once in your app
import { withDynamicSchemaProps } from '../../../application/hoc/withDynamicSchemaProps';
import { useProps } from '../../hooks/useProps';
import { ReadPretty } from './ReadPretty';
import {
  DEFAULT_MAX_FILE_SIZE,
  isImage,
  isPdf,
  normalizeFile,
  toFileList,
  toValueItem,
  useBeforeUpload,
  useUploadProps,
} from './shared';
import { useStyles } from './style';
import type { ComposedUpload, DraggerProps, DraggerV2Props, UploadProps } from './type';

export const Upload: ComposedUpload = connect(
  (props: UploadProps) => {
    const { onChange, ...rest } = props;
    const onFileChange = useCallback(
      (info) => {
        onChange?.(toFileList(info.fileList));
      },
      [onChange],
    );
    return <AntdUpload {...useUploadProps(rest)} onChange={onFileChange} />;
  },
  mapProps({
    value: 'fileList',
  }),
  mapReadPretty(ReadPretty.Upload),
);

function useSizeHint(size: number = DEFAULT_MAX_FILE_SIZE) {
  const { t, i18n } = useTranslation();
  const sizeString = filesize(size, { base: 2, standard: 'jedec', locale: i18n.language });
  return size !== 0 ? t('File size should not exceed {{size}}.', { size: sizeString }) : '';
}

function FileListItem(props) {
  const { file, disabled, onPreview, onDelete: propsOnDelete } = props;
  const { componentCls: prefixCls } = useStyles();
  const { t } = useTranslation();
  const handleClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      onPreview?.(file);
    },
    [file, onPreview],
  );
  const onDelete = useCallback(() => {
    propsOnDelete?.(file);
  }, [file, propsOnDelete]);

  const item = [
    <span key="thumbnail" className={`${prefixCls}-list-item-thumbnail`}>
      {file.imageUrl && <img src={file.imageUrl} alt={file.title} className={`${prefixCls}-list-item-image`} />}
    </span>,
    <span key="title" className={`${prefixCls}-list-item-name`} title={file.title}>
      {file.status === 'uploading' ? t('Uploading') : file.title}
    </span>,
  ];
  const wrappedItem = file.id ? (
    <a target="_blank" rel="noopener noreferrer" href={file.url} onClick={handleClick}>
      {item}
    </a>
  ) : (
    <span className={`${prefixCls}-span`}>{item}</span>
  );

  const content = (
    <div
      className={cls(
        `${prefixCls}-list-item`,
        `${prefixCls}-list-item-${file.status ?? 'done'}`,
        `${prefixCls}-list-item-list-type-picture-card`,
      )}
    >
      <div className={`${prefixCls}-list-item-info`}>{wrappedItem}</div>
      <span className={`${prefixCls}-list-item-actions`}>
        <Space size={3}>
          {file.id && (
            <Button
              size={'small'}
              type={'text'}
              icon={<DownloadOutlined />}
              onClick={() => {
                saveAs(file.url, `${file.title}${file.extname}`);
              }}
            />
          )}
          {!disabled && <Button size={'small'} type={'text'} icon={<DeleteOutlined />} onClick={onDelete} />}
        </Space>
      </span>
      {file.status === 'uploading' && (
        <div className={`${prefixCls}-list-item-progress`}>
          <Progress size={2} type={'line'} showInfo={false} percent={file.percent} />
        </div>
      )}
    </div>
  );

  return (
    <div className={`${prefixCls}-list-picture-card-container ${prefixCls}-list-item-container`}>
      {file.status === 'error' ? (
        <Tooltip title={file.response} getPopupContainer={(node) => node.parentNode as HTMLElement}>
          {content}
        </Tooltip>
      ) : (
        content
      )}
    </div>
  );
}

const PreviewerTypes = [
  {
    matcher: isImage,
    Component({ index, list, onSwitchIndex }) {
      return (
        <LightBox
          // discourageDownloads={true}
          mainSrc={list[index]?.imageUrl}
          nextSrc={list[(index + 1) % list.length]?.imageUrl}
          prevSrc={list[(index + list.length - 1) % list.length]?.imageUrl}
          onCloseRequest={() => onSwitchIndex(null)}
          onMovePrevRequest={() => onSwitchIndex((index + list.length - 1) % list.length)}
          onMoveNextRequest={() => onSwitchIndex((index + 1) % list.length)}
          imageTitle={list[index]?.title}
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
                const file = list[index];
                saveAs(file.url, `${file.title}${file.extname}`);
              }}
            >
              <DownloadOutlined />
            </button>,
          ]}
        />
      );
    },
  },
  {
    matcher: isPdf,
    Component({ index, list, onSwitchIndex }) {
      const { t } = useTranslation();
      const onClose = useCallback(() => {
        onSwitchIndex(null);
      }, [onSwitchIndex]);
      return (
        <Modal
          open={index != null}
          title={'PDF - ' + list[index].title}
          onCancel={onClose}
          footer={[
            <Button
              key="download"
              style={{
                textTransform: 'capitalize',
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = list[index];
                saveAs(file.url, `${file.title}${file.extname}`);
              }}
            >
              {t('Download')}
            </Button>,
            <Button key="close" onClick={onClose} style={{ textTransform: 'capitalize' }}>
              {t('Close')}
            </Button>,
          ]}
          width={'85vw'}
          centered={true}
        >
          <div
            style={{
              padding: '8px',
              maxWidth: '100%',
              maxHeight: 'calc(100vh - 256px)',
              height: '90vh',
              width: '100%',
              background: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              overflowY: 'auto',
            }}
          >
            <iframe
              src={list[index].url}
              style={{
                width: '100%',
                maxHeight: '90vh',
                flex: '1 1 auto',
              }}
            />
          </div>
        </Modal>
      );
    },
  },
];

function Previewer({ index, onSwitchIndex, list }) {
  if (index == null) {
    return null;
  }
  const file = list[index];
  const { Component } = PreviewerTypes.find((type) => type.matcher(file)) ?? {};
  if (!Component) {
    return null;
  }

  return <Component index={index} list={list} onSwitchIndex={onSwitchIndex} />;
}

function useDefaultRules(props) {
  return props.rules;
}

Upload.Attachment = connect(
  ({
    useRules = useDefaultRules,
    rules: propsRules,
    quickUpload = true,
    selectFile,
    onSelect,
    ...props
  }: UploadProps) => {
    const { disabled, multiple, value, onChange } = props;
    const [fileList, setFileList] = useState<any[]>([]);
    const [pendingList, setPendingList] = useState<any[]>([]);
    const [preview, setPreview] = useState<number>(null);
    const { t } = useTranslation();

    const uploadProps = useUploadProps(props);

    const rules = useRules({ rules: propsRules, ...props });
    const beforeUpload = useBeforeUpload(rules);

    const { wrapSSR, hashId, componentCls: prefixCls } = useStyles();

    useEffect(() => {
      const list = toFileList(value);
      setFileList(list);
    }, [value]);

    const onUploadChange = useCallback(
      (info) => {
        if (multiple) {
          const uploadedList = info.fileList.filter((file) => file.status === 'done');
          if (uploadedList.length) {
            const valueList = [...(value ?? []), ...uploadedList.map(toValueItem)];
            onChange?.(valueList);
            // NOTE: to avoid the list blink, update the list before value changed once in advance
            setFileList(toFileList(valueList));
          }
          setPendingList(info.fileList.filter((file) => file.status !== 'done').map(normalizeFile));
        } else {
          // NOTE: 用 fileList 里的才有附加的验证状态信息，file 没有（不清楚为何）
          const file = info.fileList.find((f) => f.uid === info.file.uid);
          if (file.status === 'done') {
            onChange?.(toValueItem(file));
            // NOTE: to avoid the list blink, update the list before value changed once in advance
            setFileList(toFileList([file]));
            setPendingList([]);
          } else {
            setPendingList([normalizeFile(file)]);
          }
        }
      },
      [value, multiple, onChange],
    );

    const onPreview = useCallback(
      (file) => {
        const index = file.id ? fileList.findIndex((item) => item.id === file.id) : pendingList.indexOf(file);
        const previewType = PreviewerTypes.find((type) => type.matcher(file));
        if (previewType) {
          setPreview(index);
        } else {
          if (file.id) {
            saveAs(file.url, `${file.title}${file.extname}`);
          }
        }
      },
      [fileList, pendingList],
    );

    const onDelete = useCallback(
      (file) => {
        if (file.id) {
          if (multiple) {
            onChange(value.filter((item) => item.id !== file.id));
          } else {
            onChange(null);
          }
        } else {
          setPendingList((prevPendingList) => {
            const index = prevPendingList.indexOf(file);
            prevPendingList.splice(index, 1);
            return [...prevPendingList];
          });
        }
      },
      [multiple, onChange, value],
    );

    // const onSelectorRemove = (file) => {
    //   onRemove?.(file);
    //   return true;
    // };
    const onSelectorAdd = useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect?.();
      },
      [onSelect],
    );

    const { mimetype: accept, size } = rules ?? {};
    const sizeHint = useSizeHint(size);
    const selectable = !disabled && (multiple || !(value || pendingList.length));
    const showSelectButton = typeof selectFile === 'undefined' && typeof quickUpload === 'undefined';

    return wrapSSR(
      <div>
        <div className={cls(`${prefixCls}-wrapper`, `${prefixCls}-picture-card-wrapper`, 'nb-upload', hashId)}>
          <div className={cls(`${prefixCls}-list`, `${prefixCls}-list-picture-card`)}>
            {fileList.map((file, index) => (
              <FileListItem
                key={file.id}
                file={file}
                index={index}
                disabled={disabled}
                onPreview={onPreview}
                onDelete={onDelete}
              />
            ))}
            {pendingList.map((file, index) => (
              <FileListItem key={file.uid} file={file} index={index} disabled={disabled} onDelete={onDelete} />
            ))}
            {quickUpload ? (
              <div className={cls(`${prefixCls}-list-picture-card-container`, `${prefixCls}-list-item-container`)}>
                <Tooltip title={sizeHint}>
                  <AntdUpload
                    accept={accept}
                    {...uploadProps}
                    disabled={disabled}
                    multiple={multiple}
                    listType={'picture-card'}
                    fileList={pendingList}
                    beforeUpload={beforeUpload}
                    onChange={onUploadChange}
                    showUploadList={false}
                  >
                    {selectable ? (
                      <span>
                        <PlusOutlined />
                        <br /> {t('Upload')}
                      </span>
                    ) : null}
                  </AntdUpload>
                </Tooltip>
              </div>
            ) : null}
            {selectable && (showSelectButton || selectFile) ? (
              <div className={cls(`${prefixCls}-list-picture-card-container`, `${prefixCls}-list-item-container`)}>
                <AntdUpload
                  disabled={disabled}
                  multiple={multiple}
                  listType={'picture-card'}
                  showUploadList={false}
                  // onRemove={onSelectorRemove}
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
                    onClick={onSelectorAdd}
                  >
                    <PlusOutlined />
                    {t('Select')}
                  </div>
                </AntdUpload>
              </div>
            ) : null}
          </div>
        </div>
        <Previewer index={preview} onSwitchIndex={setPreview} list={fileList} />
      </div>,
    );
  },
  mapReadPretty(ReadPretty.File),
);

Upload.Dragger = connect(
  (props: DraggerProps) => {
    const { tipContent, onChange, ...rest } = props;
    const { wrapSSR, hashId, componentCls: prefixCls } = useStyles();
    const onFileChange = useCallback(
      (info) => {
        onChange?.(toFileList(info.fileList));
      },
      [onChange],
    );
    return wrapSSR(
      <div className={cls(`${prefixCls}-dragger`, hashId)}>
        <AntdUpload.Dragger {...useUploadProps(rest)} onChange={onFileChange}>
          {tipContent}
          {props.children}
        </AntdUpload.Dragger>
      </div>,
    );
  },
  mapProps({
    value: 'fileList',
  }),
);

Upload.DraggerV2 = withDynamicSchemaProps(
  connect(
    ({ rules: propsRules, useRules = useDefaultRules, ...props }: DraggerV2Props) => {
      const { t } = useTranslation();
      const defaultTitle = t('Click or drag file to this area to upload');

      // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
      const { title = defaultTitle, ...extraProps } = useProps(props);

      const [loading, setLoading] = useState(false);
      const { wrapSSR, hashId, componentCls: prefixCls } = useStyles();

      const rules = useRules({ rules: propsRules });
      const beforeUpload = useBeforeUpload(rules);
      const { size, mimetype: accept } = rules ?? {};
      const sizeHint = useSizeHint(size);
      const handleChange = useCallback(
        (fileList: any[] = []) => {
          const { onChange } = extraProps;
          onChange?.(fileList);

          if (fileList.some((file) => file.status === 'uploading')) {
            setLoading(true);
          } else {
            setLoading(false);
          }
        },
        [extraProps],
      );

      return wrapSSR(
        <div className={cls(`${prefixCls}-dragger`, hashId)}>
          {/* @ts-ignore */}
          <AntdUpload.Dragger
            {...useUploadProps({ ...props, ...extraProps, accept, onChange: handleChange, beforeUpload })}
          >
            <p className={`${prefixCls}-drag-icon`}>
              {loading ? <LoadingOutlined style={{ fontSize: 36 }} spin /> : <InboxOutlined />}
            </p>
            <p className={`${prefixCls}-text`}>{title}</p>
            <ul>
              <li className={`${prefixCls}-hint`}>{t('Support for a single or bulk upload.')}</li>
              <li className={`${prefixCls}-hint`}>{sizeHint}</li>
            </ul>
          </AntdUpload.Dragger>
        </div>,
      );
    },
    mapProps({
      value: 'fileList',
    }),
  ),
  { displayName: 'Upload.DraggerV2' },
);

export default Upload;
