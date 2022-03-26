import { FormOutlined } from '@ant-design/icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer } from '../..';
import { useCollection } from '../../../collection-manager';
import { createFormBlockSchema } from '../utils';

export const RecordFormBlockInitializer = (props) => {
  const { insert } = props;
  const { name } = useCollection();
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Item
      {...props}
      icon={<FormOutlined />}
      onClick={({ item }) => {
        insert(createFormBlockSchema({ collection: name }));
      }}
    />
  );
};
