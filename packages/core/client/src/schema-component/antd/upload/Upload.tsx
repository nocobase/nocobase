/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, DownloadOutlined, InboxOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Field } from '@formily/core';
import { connect, mapProps, mapReadPretty, useField } from '@formily/react';
import { Alert, Upload as AntdUpload, Button, Modal, Progress, Space, Tooltip } from 'antd';
import { createGlobalStyle } from 'antd-style';
import useUploadStyle from 'antd/es/upload/style';
import cls from 'classnames';
import { saveAs } from 'file-saver';
import filesize from 'filesize';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LightBox from 'react-image-lightbox';
import 'react-image-lightbox/style.css'; // This only needs to be imported once in your app
import { useFlag } from '../../../flag-provider';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { useComponent } from '../../hooks';
import { useProps } from '../../hooks/useProps';
import {
  FILE_SIZE_LIMIT_DEFAULT,
  attachmentFileTypes,
  getThumbnailPlaceholderURL,
  matchMimetype,
  normalizeFile,
  toFileList,
  toValueItem as toValueItemDefault,
  useBeforeUpload,
  useUploadProps,
} from './shared';
import { useStyles } from './style';
import type { ComposedUpload, DraggerProps, DraggerV2Props, UploadProps } from './type';

const LightBoxGlobalStyle = createGlobalStyle`
  .ReactModal__Overlay.ReactModal__Overlay--after-open {
    z-index: 3000 !important; // 避免预览图片时被遮挡
  }
`;

attachmentFileTypes.add({
  match(file) {
    return matchMimetype(file, 'image/*');
  },
  getThumbnailURL(file) {
    if (file.preview) {
      return file.preview;
    }
    if (file.url) {
      return file.url;
    }
    if (file.originFileObj) {
      return URL.createObjectURL(file.originFileObj);
    }
    return null;
  },
  Previewer({ index, list, onSwitchIndex }) {
    const onDownload = useCallback(
      (e) => {
        e.preventDefault();
        const file = list[index];
        saveAs(file.url, `${file.title}${file.extname}`);
      },
      [index, list],
    );
    return (
      <>
        <LightBoxGlobalStyle />
        <LightBox
          // discourageDownloads={true}
          mainSrc={list[index]?.url}
          nextSrc={list[(index + 1) % list.length]?.url}
          prevSrc={list[(index + list.length - 1) % list.length]?.url}
          onCloseRequest={() => onSwitchIndex(null)}
          onMovePrevRequest={() => onSwitchIndex((index + list.length - 1) % list.length)}
          onMoveNextRequest={() => onSwitchIndex((index + 1) % list.length)}
          imageTitle={list[index]?.title}
          toolbarButtons={[
            <button
              key={'preview-img'}
              style={{ fontSize: 22, background: 'none', lineHeight: 1 }}
              type="button"
              aria-label="Download"
              title="Download"
              className="ril-zoom-in ril__toolbarItemChild ril__builtinButton"
              onClick={onDownload}
            >
              <DownloadOutlined />
            </button>,
          ]}
        />
      </>
    );
  },
});

const iframePreviewSupportedTypes = ['application/pdf', 'audio/*', 'image/*', 'video/*', 'text/plain'];

function IframePreviewer({ index, list, onSwitchIndex }) {
  const { t } = useTranslation();
  const file = list[index];
  const url = file.url;
  const onOpen = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(url);
    },
    [url],
  );
  const onDownload = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      saveAs(url, `${file.title}${file.extname}`);
    },
    [file.extname, file.title, url],
  );
  const onClose = useCallback(() => {
    onSwitchIndex(null);
  }, [onSwitchIndex]);
  return (
    <Modal
      open={index != null}
      title={file.title}
      onCancel={onClose}
      footer={[
        <Button key="open" onClick={onOpen}>
          {t('Open in new window')}
        </Button>,
        <Button key="download" onClick={onDownload}>
          {t('Download')}
        </Button>,
        <Button key="close" onClick={onClose}>
          {t('Close')}
        </Button>,
      ]}
      width={'85vw'}
      centered={true}
    >
      <div
        style={{
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 256px)',
          height: '90vh',
          width: '100%',
          background: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          overflowY: 'auto',
        }}
      >
        {iframePreviewSupportedTypes.some((type) => matchMimetype(file, type)) ? (
          <iframe
            src={url}
            style={{
              width: '100%',
              maxHeight: '90vh',
              flex: '1 1 auto',
              border: 'none',
            }}
          />
        ) : (
          <Alert
            type="warning"
            description={t('File type is not supported for previewing, please download it to preview.')}
            showIcon
          />
        )}
      </div>
    </Modal>
  );
}

function InternalUpload(props: UploadProps) {
  const { onChange, ...rest } = props;
  const onFileChange = useCallback(
    (info) => {
      onChange?.(toFileList(info.fileList));
    },
    [onChange],
  );
  return <AntdUpload {...useUploadProps(rest)} onChange={onFileChange} />;
}

function ReadPretty({ value, onChange, disabled, multiple, size, ...others }: UploadProps) {
  const { wrapSSR, hashId, componentCls: prefixCls } = useStyles();
  const useUploadStyleVal = (useUploadStyle as any).default ? (useUploadStyle as any).default : useUploadStyle;
  // 加载 antd 的样式
  useUploadStyleVal(prefixCls);
  const { isInTableCell } = useFlag();

  const resetStyle = useMemo(() => (isInTableCell ? { display: 'inline-block' } : {}), [isInTableCell]);

  return wrapSSR(
    <div
      className={cls(
        `${prefixCls}-wrapper`,
        `${prefixCls}-picture-card-wrapper`,
        `nb-upload`,
        size ? `nb-upload-${size}` : null,
        hashId,
        css`
          .ant-upload-list-picture-card-container {
            width: ${size}px !important;
            height: ${size}px !important;
          }
        `,
      )}
    >
      <div className={cls(`${prefixCls}-list`, `${prefixCls}-list-picture-card`)} style={resetStyle}>
        <AttachmentList
          disabled={disabled}
          readPretty
          multiple={multiple}
          value={value}
          onChange={onChange}
          {...others}
        />
      </div>
    </div>,
  );
}

export const Upload: ComposedUpload = connect(
  InternalUpload,
  mapProps({
    value: 'fileList',
  }),
  mapReadPretty(ReadPretty),
);

Upload.ReadPretty = ReadPretty;

function useSizeHint(size: number) {
  const s = size ?? FILE_SIZE_LIMIT_DEFAULT;
  const { t, i18n } = useTranslation();
  const sizeString = filesize(s, { base: 2, standard: 'jedec', locale: i18n.language });
  return s !== 0 ? t('File size should not exceed {{size}}.', { size: sizeString }) : '';
}

function DefaultThumbnailPreviewer({ file }) {
  const { componentCls: prefixCls } = useStyles();
  const { getThumbnailURL = getThumbnailPlaceholderURL } = attachmentFileTypes.getTypeByFile(file) ?? {};
  const imageUrl = getThumbnailURL(file);
  return <img src={imageUrl} alt={file.title} className={`${prefixCls}-list-item-image`} />;
}

function AttachmentListItem(props) {
  const { file, disabled, onPreview, onDelete: propsOnDelete, readPretty, showFileName } = props;
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
  const onDownload = useCallback(() => {
    saveAs(file.url, `${file.title}${file.extname}`);
  }, [file]);
  const { ThumbnailPreviewer = DefaultThumbnailPreviewer } = attachmentFileTypes.getTypeByFile(file) ?? {};
  const item = [
    <span key="thumbnail" className={`${prefixCls}-list-item-thumbnail`}>
      <ThumbnailPreviewer file={file} />
    </span>,
    showFileName !== false && file.title ? (
      <span key="title" className={`${prefixCls}-list-item-name`} title={file.title}>
        {file.status === 'uploading' ? t('Uploading') : file.title}
      </span>
    ) : null,
  ];
  const wrappedItem = file.url ? (
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
          {!readPretty && file.url && (
            <Button size={'small'} type={'text'} icon={<DownloadOutlined />} onClick={onDownload} />
          )}
          {!readPretty && !disabled && file.status !== 'uploading' && (
            <Button size={'small'} type={'text'} icon={<DeleteOutlined />} onClick={onDelete} />
          )}
        </Space>
      </span>
      {file.status === 'uploading' && (
        <div className={`${prefixCls}-list-item-progress`}>
          <Progress strokeWidth={4} type={'line'} showInfo={false} percent={Number(file.percent)} />
        </div>
      )}
    </div>
  );
  return (
    <div
      style={{
        marginBottom: showFileName !== false && file.title ? '28px' : '0px',
      }}
      className={`${prefixCls}-list-picture-card-container ${prefixCls}-list-item-container`}
    >
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

function Previewer({ index, onSwitchIndex, list }) {
  if (index == null) {
    return null;
  }
  const file = list[index];
  const { Previewer: Component = IframePreviewer } = attachmentFileTypes.getTypeByFile(file) ?? {};
  return <Component index={index} list={list} onSwitchIndex={onSwitchIndex} />;
}

export function AttachmentList(props) {
  const { disabled, multiple, value, onChange, readPretty, showFileName } = props;
  const [fileList, setFileList] = useState<any[]>([]);
  const [preview, setPreview] = useState<number>(null);
  useEffect(() => {
    const list = toFileList(value);
    setFileList(list);
  }, [value]);

  const onPreview = useCallback(
    (file) => {
      const index = fileList.findIndex((item) => item.id === file.id);
      setPreview(index);
    },
    [fileList],
  );

  const onDelete = useCallback(
    (file) => {
      if (multiple) {
        onChange(value.filter((item) => item.id !== file.id));
      } else {
        onChange(null);
      }
    },
    [multiple, onChange, value],
  );
  return (
    <>
      {fileList.map((file, index) => (
        <AttachmentListItem
          key={file.id || file.url}
          file={file}
          index={index}
          disabled={disabled}
          onPreview={onPreview}
          onDelete={onDelete}
          readPretty={readPretty}
          showFileName={showFileName}
        />
      ))}
      <Previewer index={preview} onSwitchIndex={setPreview} list={fileList} />
    </>
  );
}

export function Uploader({ rules, ...props }: UploadProps) {
  const { disabled, multiple, value, onChange, toValueItem = toValueItemDefault } = props;
  const [uploadedList, setUploadedList] = useState<any[]>([]);
  const [pendingList, setPendingList] = useState<any[]>([]);
  const { t } = useTranslation();
  const { componentCls: prefixCls } = useStyles();
  const field = useField<Field>();

  const uploadProps = useUploadProps(props);

  const beforeUpload = useBeforeUpload(rules);

  useEffect(() => {
    if (pendingList.length) {
      const errorFiles = pendingList.filter((item) => item.status === 'error');
      field.setFeedback({
        type: 'error',
        code: 'ValidateError',
        messages: [errorFiles.length ? t('Some files are not uploaded correctly, please check.') : ' '],
      });
    } else {
      field.setFeedback({});
    }
  }, [field, pendingList, t]);

  const onUploadChange = useCallback(
    (info) => {
      const pendingFiles = info.fileList.filter((file) => file.status !== 'done').map(normalizeFile);
      setPendingList(pendingFiles);
      if (multiple) {
        const uploaded = info.fileList.filter((file) => file.status === 'done');
        if (uploaded.length) {
          const valueList = [...uploadedList, ...uploaded.map((v) => toValueItem(v.response?.data))];
          if (pendingFiles.length) {
            setUploadedList(valueList);
          } else {
            onChange?.([...(value || []), ...valueList]);
            setUploadedList([]);
          }
        }
      } else {
        // NOTE: 用 fileList 里的才有附加的验证状态信息，file 没有（不清楚为何）
        const file = info.fileList.find((f) => f.uid === info.file.uid);
        if (file.status === 'done') {
          onChange?.(toValueItem(file.response?.data));
          setPendingList([]);
        }
      }
    },
    [multiple, value, uploadedList, toValueItem, onChange],
  );

  const onDeletePending = useCallback((file) => {
    setPendingList((prevPendingList) => {
      const index = prevPendingList.indexOf(file);
      prevPendingList.splice(index, 1);
      return [...prevPendingList];
    });
  }, []);

  const onDeleteUploaded = useCallback((file) => {
    setUploadedList((prevUploadedList) => {
      const index = prevUploadedList.indexOf(file);
      prevUploadedList.splice(index, 1);
      return [...prevUploadedList];
    });
  }, []);

  const QRCodeUploader = useComponent('QRCodeUploader');

  const { mimetype: accept, size } = rules ?? {};
  const sizeHint = useSizeHint(size);
  const selectable =
    !disabled && (multiple || ((!value || (Array.isArray(value) && !value.length)) && !pendingList.length));
  return (
    <>
      {uploadedList.map((file, index) => (
        <AttachmentListItem key={file.id} file={file} index={index} disabled={disabled} onDelete={onDeleteUploaded} />
      ))}
      {pendingList.map((file, index) => (
        <AttachmentListItem key={file.uid} file={file} index={index} disabled={disabled} onDelete={onDeletePending} />
      ))}
      <div
        className={cls(`${prefixCls}-list-picture-card-container`, `${prefixCls}-list-item-container`)}
        style={
          selectable
            ? {}
            : {
                display: 'none',
              }
        }
      >
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
      {selectable && QRCodeUploader && (
        <QRCodeUploader disabled={disabled} multiple={multiple} value={value} onChange={onChange} />
      )}
    </>
  );
}

function Attachment(props: UploadProps) {
  const { wrapSSR, hashId, componentCls: prefixCls } = useStyles();
  return wrapSSR(
    <div className={cls(`${prefixCls}-wrapper`, `${prefixCls}-picture-card-wrapper`, 'nb-upload', hashId)}>
      <div className={cls(`${prefixCls}-list`, `${prefixCls}-list-picture-card`)}>
        <AttachmentList {...props} />
        <Uploader {...props} />
      </div>
    </div>,
  );
}

Attachment.ReadPretty = ReadPretty;

Upload.Attachment = withDynamicSchemaProps(connect(Attachment, mapReadPretty(Attachment.ReadPretty)), {
  displayName: 'Upload.Attachment',
});

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
    ({ rules, ...props }: DraggerV2Props) => {
      const { t } = useTranslation();
      const defaultTitle = t('Click or drag file to this area to upload');

      // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
      const { title = defaultTitle, ...extraProps } = useProps(props);

      const [loading, setLoading] = useState(false);
      const { wrapSSR, hashId, componentCls: prefixCls } = useStyles();

      const beforeUpload = useBeforeUpload(rules);
      const { size, mimetype: accept } = rules ?? {};
      const sizeHint = useSizeHint(size);
      const handleChange = useCallback(
        ({ fileList }) => {
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
