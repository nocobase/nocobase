import { css } from '@emotion/css';
import { observer } from '@formily/react';
import { Tag } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../../../schema-component';
import { useCollectionManager } from '../../hooks';

export const TemplateSummay = observer((props: any) => {
  const { schemaKey } = props;
  const { getTemplate } = useCollectionManager();
  const compile = useCompile();
  const { t } = useTranslation();
  const schema = getTemplate(schemaKey);

  if (!schema) return null;

  return (
    <div
      className={css`
        background: #f6f6f6;
        margin-bottom: 24px;
        padding: 16px;
      `}
    >
      <div className={css``}>
        {t('Collection template')}: <Tag>{compile(schema.title)}</Tag>
      </div>
      {schema.description ? (
        <div
          className={css`
            margin-top: 8px;
            color: rgba(0, 0, 0, 0.45);
          `}
        >
          {compile(schema.description)}
        </div>
      ) : null}
    </div>
  );
});
