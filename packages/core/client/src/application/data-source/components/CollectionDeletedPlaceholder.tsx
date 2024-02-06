import { App, Button, Result } from 'antd';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CardItem, useDesignable } from '../../../schema-component';

export interface CollectionDeletedPlaceholderProps {
  type: 'Collection' | 'Field' | 'DataSource';
  name?: string | number;
  message?: string;
}

export const CollectionDeletedPlaceholder: FC<CollectionDeletedPlaceholderProps> = ({ type, name, message }) => {
  const { designable, dn } = useDesignable();
  const { modal } = App.useApp();
  const { t } = useTranslation();
  const messageValue = useMemo(() => {
    if (message) {
      return message;
    }
    if (!name) {
      return `[nocobase]: ${t(type)} ${'name is required'}`;
    }

    return (
      <div>{t('The collection "{{name}}" might be deleted. If unnecessary, delete the current block.', { name })}</div>
    );
  }, [message, name, type, t]);

  const WrapperComponent = useMemo(() => {
    if (type !== 'Field') {
      return CardItem;
    }
    return React.Fragment;
  }, [type]);

  if (designable || process.env.NODE_ENV === 'development') {
    return (
      <WrapperComponent>
        <Result
          status="404"
          subTitle={messageValue}
          extra={
            <Button
              // type="primary"
              key="Delete"
              onClick={() =>
                modal.confirm({
                  title: t('Delete block'),
                  content: t('Are you sure you want to delete it?'),
                  ...confirm,
                  onOk() {
                    dn.remove();
                  },
                })
              }
            >
              {t('Delete')}
            </Button>
          }
        />
      </WrapperComponent>
    );
  }

  return null;
};
