import React, { useState, useContext } from 'react';
import { Input, Menu, Popover, Button } from 'antd';
import { css } from '@emotion/css';
import { MenuOutlined } from '@ant-design/icons';
import { useCompile } from '@nocobase/client';
import { getPopupContainer, useGCMTranslation } from '../utils';
import { CollapsedContext } from '../GraphDrawPage';

export const LocateCollectionAction = (props) => {
  const { handleFiterCollections } = props;
  const { handleSearchCollection, collectionList } = useContext(CollapsedContext);
  const [selectedKeys, setSelectKey] = useState([]);
  const { t } = useGCMTranslation();
  const compile = useCompile();

  const content = (
    <div>
      <Input
        style={{ margin: '4px 0' }}
        bordered={false}
        placeholder={t('Collection Search')}
        onChange={handleSearchCollection}
      />
      <Menu
        selectedKeys={selectedKeys}
        selectable={true}
        className={css`
          .ant-menu-item {
            height: 32px;
            line-height: 32px;
          }
        `}
        style={{ maxHeight: '70vh', overflowY: 'auto', border: 'none' }}
        items={[
          { type: 'divider' },
          ...collectionList.map((v) => {
            return {
              key: v.name,
              label: compile(v.title),
              onClick: (e: any) => {
                if (e.key !== selectedKeys[0]) {
                  setSelectKey([e.key]);
                  handleFiterCollections(e.key);
                } else {
                  handleFiterCollections(false);
                  setSelectKey([]);
                }
              },
            };
          }),
        ]}
      />
    </div>
  );
  return (
    <Popover
      content={content}
      autoAdjustOverflow
      placement="bottomRight"
      trigger={['click']}
      getPopupContainer={getPopupContainer}
      overlayClassName={css`
        .ant-popover-inner-content {
          padding: 0;
        }
      `}
    >
      <Button>
        <MenuOutlined />
      </Button>
    </Popover>
  );
};
