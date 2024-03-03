import React from 'react';
import { Switch, Tooltip, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useCollectionManager_deprecated, useRecord, useAPIClient } from '@nocobase/client';
import { useRemoteCollectionContext } from '../CollectionFields';

export const TitleField = (props) => {
  const { useProps } = props;
  const { t } = useTranslation();
  const { isTitleField } = useCollectionManager_deprecated();
  const [loadingRecord, setLoadingRecord] = React.useState(null);
  const { setTitleField, filterByTk, dataSourceKey } = useProps();
  const record = useRecord();
  const api = useAPIClient();
  const { refreshRM, titleField } = useRemoteCollectionContext();
  const handleChange = async (checked) => {
    setLoadingRecord(record);
    await api.request({
      url: `dataSources/${dataSourceKey}/collections:update?filterByTk=${filterByTk}`,
      method: 'post',
      data: { titleField: checked ? record.name : 'id' },
    });
    message.success(t('Saved successfully'));
    refreshRM();
    setTitleField(checked ? record.name : 'id');
    setLoadingRecord(null);
  };
  return isTitleField(record) ? (
    <Tooltip title={t('Default title for each record')} placement="right" overlayInnerStyle={{ textAlign: 'center' }}>
      <Switch
        aria-label={`switch-title-field-${record?.name}`}
        size="small"
        loading={record?.name === loadingRecord?.name}
        checked={record?.name === (titleField || 'id')}
        onChange={handleChange}
      />
    </Tooltip>
  ) : null;
};
