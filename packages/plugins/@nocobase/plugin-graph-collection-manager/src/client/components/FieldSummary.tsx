import { observer } from '@formily/react';
import { css, useCollectionManager_deprecated, useCompile } from '@nocobase/client';
import { Tag } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const FieldSummary = observer(
  (props: any) => {
    const { schemaKey } = props;
    const { getInterface } = useCollectionManager_deprecated();
    const compile = useCompile();
    const { t } = useTranslation();
    const schema = getInterface(schemaKey);

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
          {t('Field interface')}: <Tag>{compile(schema.title)}</Tag>
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
  },
  { displayName: 'FieldSummary' },
);
