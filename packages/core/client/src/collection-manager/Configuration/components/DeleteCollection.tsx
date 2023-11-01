import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from 'antd';

export const DeleteCollection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div>
      <div>{t('Are you sure you want to delete it?')}</div>
      <Checkbox
        style={{ marginRight: '5px' }}
        onChange={(e) => {
          console.log(e.target.checked);
        }}
      />
      {t('Automatically delete objects relying on this collection, and objects relying on those objects')}
    </div>
  );
};
DeleteCollection.displayName = 'DeleteCollection';
