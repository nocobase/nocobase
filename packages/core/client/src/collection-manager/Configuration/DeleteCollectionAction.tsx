/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useForm } from '@formily/react';
import { Button, message } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useActionContext,
  useCollectionManager_deprecated,
  useResourceActionContext,
  useResourceContext,
} from '../../';
import { RecordProvider, useRecord } from '../../record-provider';
import { ActionContextProvider, SchemaComponent } from '../../schema-component';
import { useCancelAction } from '../action-hooks';
import * as components from './components';

export const DeleteCollection = (props) => {
  const record = useRecord();
  return <DeleteCollectionAction item={record} {...props} />;
};

export const useDestroyActionAndRefreshCM = () => {
  const { run } = useDestroyAction();
  const { refreshCM } = useCollectionManager_deprecated();
  return {
    async run() {
      await run();
      await refreshCM();
    },
  };
};

/**
 * 是否关闭弹窗
 * @param flag
 * @returns
 */
export const useBulkDestroyActionAndRefreshCM = (flag?) => {
  const { run } = useBulkDestroyAction();
  const { refreshCM } = useCollectionManager_deprecated();
  return {
    async run() {
      await run(flag);
      await refreshCM();
    },
  };
};
export const useDestroyAction = () => {
  const { refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();
  const form = useForm();
  const { cascade } = form?.values || {};
  return {
    async run() {
      await resource.destroy({ filterByTk, cascade });
      refresh();
    },
  };
};

export const useBulkDestroyAction = () => {
  const { state, setState, refresh } = useResourceActionContext();
  const { resource } = useResourceContext();
  const ctx = useActionContext();
  const { t } = useTranslation();
  const form = useForm();
  const { cascade } = form?.values || {};
  const selectedRowKeys = Object.values(state.selectedRowKeys).flat();
  return {
    async run(flag?) {
      if (!selectedRowKeys?.length) {
        return message.error(t('Please select the records you want to delete'));
      }
      await resource.destroy({
        filterByTk: selectedRowKeys || [],
        cascade,
      });
      form.reset();
      !flag && ctx?.setVisible?.(false);
      setState?.({});
      refresh();
    },
  };
};
export const DeleteCollectionAction = (props) => {
  const { scope, getContainer, item: record, children, isBulk, useAction, ...otherProps } = props;
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const getDestroyCollectionAction = () => {
    if (isBulk) {
      return useBulkDestroyActionAndRefreshCM;
    } else {
      if (useAction) {
        return useAction;
      }
      return useDestroyActionAndRefreshCM;
    }
  };
  const Title = () => {
    return (
      <span>
        <ExclamationCircleFilled style={{ color: '#faad14', marginRight: '12px', fontSize: '22px' }} />
        <span style={{ fontSize: '19px' }}>{t('Delete collection')}</span>
      </span>
    );
  };

  return (
    <RecordProvider record={record}>
      <ActionContextProvider value={{ visible, setVisible }}>
        {isBulk ? (
          <Button icon={<DeleteOutlined />} onClick={() => setVisible(true)}>
            {children || t('Delete')}
          </Button>
        ) : (
          <a onClick={() => setVisible(true)} {...otherProps}>
            {children || t('Delete')}
          </a>
        )}
        <SchemaComponent
          schema={{
            type: 'object',
            properties: {
              deleteCollection: {
                type: 'void',
                'x-decorator': 'Form',
                'x-component': 'Action.Modal',
                title: <Title />,
                'x-component-props': {
                  width: 520,
                  getContainer: '{{ getContainer }}',
                  className: css`
                    .ant-modal-body {
                      margin-left: 35px;
                      margin-bottom: 35px;
                      .ant-checkbox-wrapper {
                        height: 25px;
                      }
                    }
                  `,
                },
                properties: {
                  info: {
                    type: 'string',
                    'x-component': 'div',
                    'x-content': "{{t('Are you sure you want to delete it?')}}",
                  },
                  cascade: {
                    type: 'boolean',
                    'x-decorator': 'FormItem',
                    'x-component': 'Checkbox',
                    default: false,
                    'x-content': t(
                      'Automatically drop objects that depend on the collection (such as views), and in turn all objects that depend on those objects',
                    ),
                  },
                  footer: {
                    type: 'void',
                    'x-component': 'Action.Modal.Footer',
                    properties: {
                      action1: {
                        title: '{{ t("Cancel") }}',
                        'x-component': 'Action',
                        'x-component-props': {
                          useAction: '{{ useCancelAction }}',
                        },
                      },
                      action2: {
                        title: '{{ t("Ok") }}',
                        'x-component': 'Action',
                        'x-component-props': {
                          type: 'primary',
                          useAction: '{{ useDestroyCollectionAction }}',
                          style: {
                            marginLeft: '8px',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          }}
          components={{ ...components }}
          scope={{
            getContainer,
            useDestroyCollectionAction: getDestroyCollectionAction(),
            useCancelAction,
            ...scope,
          }}
        />
      </ActionContextProvider>
    </RecordProvider>
  );
};
DeleteCollectionAction.displayName = 'DeleteCollectionAction';
