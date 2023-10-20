import React from 'react';
import { FormOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { SchemaInitializerItem } from '../../application';

export const MarkdownBlockInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation();

  return (
    <SchemaInitializerItem
      {...props}
      icon={<FormOutlined />}
      onClick={() => {
        insert({
          type: 'void',
          'x-designer': 'Markdown.Void.Designer',
          'x-decorator': 'CardItem',
          'x-component': 'Markdown.Void',
          'x-editable': false,
          'x-component-props': {
            content: t('This is a demo text, **supports Markdown syntax**.'),
          },
        });
      }}
    />
  );
};
