import React from 'react';
import { observer } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '..';
import { Table } from './Table';

export const TableOperation = observer((props: any) => {
  const { designable, schema } = useDesignable();
  const { t } = useTranslation();
  return (
    <div className={'nb-table-column'}>
      {t('Operations')}
      <Table.Operation.DesignableBar path={props.path} />
    </div>
  );
});
