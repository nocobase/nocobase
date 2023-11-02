import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { App, Checkbox, Button, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

import { RecordProvider, useRecord } from '../../record-provider';
import { useResourceActionContext, useResourceContext } from '../ResourceActionProvider';
import { useCollectionManager } from '../hooks';

export const DeleteCollection = (props) => {
  const record = useRecord();
  return <DeleteCollectionAction item={record} {...props} />;
};

export const DeleteCollectionAction = (props) => {
  const { scope, getContainer, item: record, children, isBulk, ...otherProps } = props;
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const cascadeRef = useRef(false);
  const { refreshCM } = useCollectionManager();
  const { state, setState, refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();

  const handleDestroyActionAndRefreshCM = async () => {
    await resource.destroy({ filterByTk, cascade: cascadeRef.current });
    refresh();
    await refreshCM();
  };
  const handleBulkDestroyActionAndRefreshCM = async () => {
    if (!state?.selectedRowKeys?.length) {
      return message.error(t('Please select the records you want to delete'));
    }
    await resource.destroy({
      filterByTk: state?.selectedRowKeys || [],
      cascade: cascadeRef.current,
    });
    setState?.({ selectedRowKeys: [] });
    refresh();
  };
  const showPropsConfirm = () => {
    modal.confirm({
      title: t('Are you sure you want to delete it?'),
      content: (
        <div>
          <Checkbox
            style={{ marginRight: '5px' }}
            onChange={(e) => {
              cascadeRef.current = e.target.checked;
            }}
          />
          {t('Automatically delete objects relying on this collection, and objects relying on those objects')}
        </div>
      ),
      onOk() {
        if (isBulk) {
          handleBulkDestroyActionAndRefreshCM();
        } else {
          handleDestroyActionAndRefreshCM();
        }
      },
    });
  };
  return (
    <RecordProvider record={record}>
      {isBulk ? (
        <Button icon={<DeleteOutlined />} onClick={showPropsConfirm}>
          {children || t('Delete')}
        </Button>
      ) : (
        <a {...otherProps} onClick={showPropsConfirm} className={'nb-action-link'}>
          {children || t('Delete')}
        </a>
      )}
    </RecordProvider>
  );
};
DeleteCollectionAction.displayName = 'DeleteCollectionAction';
