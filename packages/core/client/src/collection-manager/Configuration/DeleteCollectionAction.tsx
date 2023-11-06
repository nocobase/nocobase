import React, { useState } from 'react';
import { css } from '@emotion/css';
import { useTranslation } from 'react-i18next';
import { Button, message } from 'antd';
import { useForm } from '@formily/react';
import { DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { RecordProvider, useRecord } from '../../record-provider';
import { ActionContextProvider, SchemaComponent } from '../../schema-component';
import * as components from './components';
import { useCollectionManager, useResourceActionContext, useResourceContext, useActionContext } from '../../';
import { useCancelAction } from '../action-hooks';

export const DeleteCollection = (props) => {
  const record = useRecord();
  return <DeleteCollectionAction item={record} {...props} />;
};

export const useDestroyActionAndRefreshCM = () => {
  const { run } = useDestroyAction();
  const { refreshCM } = useCollectionManager();
  return {
    async run() {
      await run();
      await refreshCM();
    },
  };
};
export const useBulkDestroyActionAndRefreshCM = () => {
  const { run } = useBulkDestroyAction();
  const { refreshCM } = useCollectionManager();
  return {
    async run() {
      await run();
      await refreshCM();
    },
  };
};
export const useDestroyAction = () => {
  const { refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();
  const ctx = useActionContext();
  const form = useForm();
  const { cascade } = form?.values || {};
  return {
    async run() {
      await resource.destroy({ filterByTk, cascade });
      ctx?.setVisible?.(false);
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
  return {
    async run() {
      if (!state?.selectedRowKeys?.length) {
        return message.error(t('Please select the records you want to delete'));
      }
      await resource.destroy({
        filterByTk: state?.selectedRowKeys || [],
        cascade,
      });
      form.reset();
      ctx?.setVisible?.(false);
      setState?.({ selectedRowKeys: [] });
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
        <span style={{ fontSize: '19px' }}>{t('Delete record')}</span>
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
                  width: 500,
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
