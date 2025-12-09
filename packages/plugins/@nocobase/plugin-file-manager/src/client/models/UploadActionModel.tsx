/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { InboxOutlined, LoadingOutlined } from '@ant-design/icons';
import { ActionModel, ActionSceneEnum, Icon, usePlugin, useRequest } from '@nocobase/client';
import { escapeT, useFlowContext } from '@nocobase/flow-engine';
import { Button, Upload } from 'antd';
import { UploadFile } from 'antd/es/upload/interface';
import { filesize } from 'filesize';
import match from 'mime-match';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FileManagerPlugin from '../';

const FILE_SIZE_LIMIT_DEFAULT = 1024 * 1024 * 20;

function useSizeHint(size: number) {
  const s = size ?? FILE_SIZE_LIMIT_DEFAULT;
  const { t, i18n } = useTranslation();
  const sizeString = filesize(s, { base: 2, standard: 'jedec', locale: i18n.language });

  return s !== 0 ? t('File size should not exceed {{size}}.', { size: sizeString }) : '';
}

function useUploadProps(props) {
  const ctx = useFlowContext();

  return {
    // in customRequest method can't modify form's status(e.g: form.disabled=true )
    // that will be trigger Upload component（actual Underlying is AjaxUploader component ）'s  componentWillUnmount method
    // which will cause multiple files upload fail
    customRequest({ action, data, file, filename, headers, onError, onProgress, onSuccess, withCredentials }) {
      const formData = new FormData();
      if (data) {
        Object.keys(data).forEach((key) => {
          formData.append(key, data[key]);
        });
      }
      formData.append(filename, file);
      // eslint-disable-next-line promise/catch-or-return
      ctx.api.axios
        .post(action, formData, {
          withCredentials,
          headers,
          onUploadProgress: ({ total, loaded }) => {
            onProgress({ percent: Math.round((loaded / total) * 100).toFixed(2) }, file);
          },
        })
        .then(({ data }) => {
          onSuccess(data, file);
        })
        .catch(onError)
        .finally(() => {});

      return {
        abort() {
          console.log('upload progress is aborted.');
        },
      };
    },
    ...props,
  };
}

const useUploadFiles = (model) => {
  const ctx = useFlowContext();
  const action = useMemo(() => {
    let action = `${model.context.collection.name}:create`;
    if (ctx.view?.inputArgs?.sourceId) {
      const [s, t] = model.context.blockModel.association.resourceName.split('.');
      action = `${s}/${ctx.view?.inputArgs.sourceId}/${t}:create`;
    }
    return action;
  }, [model.context.collection.name, ctx.view?.inputArgs?.sourceId]);
  const uploadingFiles = {};

  let pendingNumber = 0;

  const uploadProps = {
    action,
    onChange({ fileList }) {
      fileList.forEach((file) => {
        if (file.status === 'uploading' && !uploadingFiles[file.uid]) {
          pendingNumber++;
          uploadingFiles[file.uid] = true;
        }
        if (file.status !== 'uploading' && uploadingFiles[file.uid]) {
          delete uploadingFiles[file.uid];
          if (--pendingNumber === 0) {
            model.context.blockModel.resource.refresh?.();
            // model.setSelectedRows?.((preRows) => [
            //   ...preRows,
            //   ...fileList.filter((file) => file.status === 'done').map((file) => file.response.data),
            // ]);
          }
        }
      });

      if (fileList.every((file) => file.status === 'done')) {
        ctx.view.close();
      }
    },
  };

  const storageUploadProps = useStorageUploadProps(uploadProps, model);
  return {
    ...uploadProps,
    ...storageUploadProps,
  };
};

export function useStorage(storage) {
  const name = storage ?? '';
  const url = `storages:getBasicInfo/${name}`;
  const { loading, data, run } = useRequest<any>(
    {
      url,
    },
    {
      manual: true,
      refreshDeps: [name],
      cacheKey: url,
    },
  );
  useEffect(() => {
    run();
  }, [run]);
  return (!loading && data?.data) || null;
}

export function useStorageCfg(model) {
  const ctx = useFlowContext();
  const field = ctx.collectionField;
  const targetCollection = ctx.collectionField?.targetCollection;
  const plugin = usePlugin(FileManagerPlugin);
  const collection = model.context.blockModel.collection;
  const storage = useStorage(field?.storage || collection.storage || targetCollection.storage);
  const storageType = plugin.getStorageType(storage?.type);
  return {
    storage,
    storageType,
  };
}

export function useStorageUploadProps(props, model) {
  const { storage, storageType } = useStorageCfg(model);
  const useStorageTypeUploadProps = storageType?.useUploadProps;
  const storageTypeUploadProps = useStorageTypeUploadProps?.({ storage, rules: storage.rules, ...props }) || {};
  return {
    rules: storage?.rules,
    ...storageTypeUploadProps,
  };
}
type RuleFunction = (file: UploadFile, options: any) => string | null;

const Rules: Record<string, RuleFunction> = {
  size(file, options: number): null | string {
    const size = options ?? FILE_SIZE_LIMIT_DEFAULT;
    if (size === 0) {
      return null;
    }
    return file.size <= size ? null : 'File size exceeds the limit';
  },
  mimetype(file, options: string | string[] = '*'): null | string {
    const pattern = options.toString().trim();
    if (!pattern || pattern === '*') {
      return null;
    }
    return pattern.split(',').filter(Boolean).some(match(file.type)) ? null : 'File type is not allowed';
  },
};

export function validate(file, rules: Record<string, any>) {
  if (!rules) {
    return null;
  }
  const ruleKeys = Object.keys(rules);
  if (!ruleKeys.length) {
    return null;
  }
  for (const key of ruleKeys) {
    const error = Rules[key](file, rules[key]);
    if (error) {
      return error;
    }
  }
  return null;
}

export function useBeforeUpload(rules) {
  const { t } = useTranslation();

  return useCallback(
    (file, fileList) => {
      const proxiedFile = file;
      const error = validate(proxiedFile, rules);

      if (error) {
        file.status = 'error';
        file.response = t(error);
      } else {
        if (file.status === 'error') {
          delete proxiedFile.status;
          delete proxiedFile.response;
        }
      }
      return error ? false : Promise.resolve(proxiedFile);
    },
    [rules],
  );
}

function UploadContent({ model }) {
  const ctx = useFlowContext();
  const props = useUploadFiles(model);
  const { rules } = props;
  const { size, mimetype: accept } = rules ?? {};
  const sizeHint = useSizeHint(size);
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback(({ fileList }) => {
    if (fileList.some((file) => file.status === 'uploading')) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, []);

  const { Header } = ctx.view;
  const beforeUpload = useBeforeUpload(rules);

  return (
    <div>
      <Header title={ctx.t('Upload file')} />
      <div style={{ height: '50vh' }} onClick={(e) => e.stopPropagation()}>
        <Upload.Dragger
          multiple={true}
          listType={'picture'}
          {...useUploadProps({
            ...props,
            handleChange,
            beforeUpload,
          })}
        >
          <p className={`ant-upload-drag-icon`}>
            {loading ? <LoadingOutlined style={{ fontSize: 36 }} spin /> : <InboxOutlined />}
          </p>
          <p className={`ant-upload-text`}>{ctx.t('Click or drag file to this area to upload')}</p>
          <ul style={{ listStyleType: 'none' }}>
            <li className={`ant-upload-hint`}>{ctx.t('Support for a single or bulk upload.')}</li>
            <li className={`ant-upload-hint`}>{sizeHint}</li>
          </ul>
        </Upload.Dragger>
      </div>
    </div>
  );
}

export class UploadActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;
  declare props: any;

  defaultProps: any = {
    type: 'primary',
    title: escapeT('Upload'),
    icon: 'UploadOutlined',
  };

  getAclActionName() {
    return 'create';
  }

  onInit(options: any): void {
    super.onInit(options);

    this.onUploadClick = (e) => {
      this.dispatchEvent('openView', {
        event: e,
      });
    };
  }
  set onUploadClick(fn) {
    this.setProps({ onUploadClick: fn });
  }

  render() {
    const props = this.props;
    const icon = props.icon ? <Icon type={props.icon as any} /> : undefined;
    return (
      <Button {...props} onClick={this.props.onUploadClick} icon={icon}>
        {props.children || props.title}
      </Button>
    );
  }
}

UploadActionModel.define({
  label: escapeT('Upload'),
  hide(ctx) {
    return ctx.collection?.template !== 'file';
  },
});

UploadActionModel.registerFlow({
  key: 'selectExitRecordSettings',
  title: escapeT('Selector setting'),
  on: {
    eventName: 'openView',
  },
  steps: {
    openView: {
      title: escapeT('Edit popup'),
      uiSchema(ctx) {
        return {
          mode: {
            type: 'string',
            title: escapeT('Open mode'),
            enum: [
              { label: escapeT('Drawer'), value: 'drawer' },
              { label: escapeT('Dialog'), value: 'dialog' },
            ],
            'x-decorator': 'FormItem',
            'x-component': 'Radio.Group',
          },
          size: {
            type: 'string',
            title: escapeT('Popup size'),
            enum: [
              { label: escapeT('Small'), value: 'small' },
              { label: escapeT('Medium'), value: 'medium' },
              { label: escapeT('Large'), value: 'large' },
            ],
            'x-decorator': 'FormItem',
            'x-component': 'Radio.Group',
          },
        };
      },
      defaultParams: {
        mode: 'drawer',
        size: 'medium',
      },
      handler(ctx, params) {
        const sizeToWidthMap: Record<string, any> = {
          drawer: {
            small: '30%',
            medium: '50%',
            large: '70%',
          },
          dialog: {
            small: '40%',
            medium: '50%',
            large: '80%',
          },
          embed: {},
        };
        const openMode = ctx.inputArgs.mode || params.mode || 'drawer';
        const size = ctx.inputArgs.size || params.size || 'medium';
        ctx.viewer.open({
          type: openMode,
          width: sizeToWidthMap[openMode][size],
          inheritContext: false,
          target: ctx.layoutContentElement,
          inputArgs: {
            sourceId: ctx.resource?.getSourceId(),
          },
          // inputArgs: {
          //   parentId: ctx.model.uid,
          //   scene: 'select',
          //   dataSourceKey: ctx.collection.dataSourceKey,
          //   collectionName: ctx.collectionField?.target,
          //   collectionField: ctx.collectionField,
          //   rowSelectionProps: {
          //     type: toOne ? 'radio' : 'checkbox',
          //     defaultSelectedRows: () => {
          //       return ctx.model.props.value;
          //     },
          //     renderCell: undefined,
          //     selectedRowKeys: undefined,
          //     onChange: (_, selectedRows) => {
          //       if (toOne) {
          //         // 单选
          //         ctx.model.selectedRows.value = selectedRows?.[0];
          //         ctx.model.change();
          //         ctx.model._closeView?.();
          //       } else {
          //         // 多选：追加
          //         const prev = ctx.model.props.value || [];
          //         const merged = [...prev, ...selectedRows];

          //         // 去重，防止同一个值重复
          //         const unique = merged.filter(
          //           (row, index, self) =>
          //             index ===
          //             self.findIndex((r) => r[ctx.collection.filterTargetKey] === row[ctx.collection.filterTargetKey]),
          //         );

          //         ctx.model.selectedRows.value = unique;
          //       }
          //     },
          //   },
          // },
          content: () => <UploadContent model={ctx.model} />,
          styles: {
            content: {
              padding: 0,
              backgroundColor: ctx.model.flowEngine.context.themeToken.colorBgLayout,
              ...(openMode === 'embed' ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } : {}),
            },
          },
        });
      },
    },
  },
});
