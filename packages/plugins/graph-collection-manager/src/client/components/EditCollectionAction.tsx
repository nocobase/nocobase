import { EditOutlined } from '@ant-design/icons';
import { css, EditCollection } from '@nocobase/client';
import React from 'react';
import { useCancelAction, useUpdateCollectionActionAndRefreshCM } from '../action-hooks';
import { getPopupContainer } from '../utils';

export const EditCollectionAction = ({ item: record }) => {
  return (
    <EditCollection
      item={record}
      scope={{
        useCancelAction,
        useUpdateCollectionActionAndRefreshCM,
        createOnly: false,
      }}
      getContainer={getPopupContainer}
    >
      <EditOutlined
        className={css`
          border-color: transparent;
          color: rgb(78 89 105);
          height: 20px;
          width: 22px;
          margin: 0px 5px 4px;
          line-height: 25px;
          &:hover {
            background-color: rgb(229 230 235);
          }
        `}
      />
    </EditCollection>
  );
};
