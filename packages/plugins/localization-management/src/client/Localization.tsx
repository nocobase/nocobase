import { SyncOutlined } from '@ant-design/icons';
import {
  Input,
  locale,
  SchemaComponent,
  useAPIClient,
  useRecord,
  useResourceActionContext,
  useResourceContext,
} from '@nocobase/client';
import { Button, Card, message, Tag, Typography } from 'antd';
import React from 'react';
import { useLocalTranslation } from './locale';
import { localizationSchema } from './schemas/localization';
const { Text } = Typography;

const useDestroyTranslationAction = () => {
  const { refresh } = useResourceActionContext();
  const { resource } = useResourceContext();
  const { translationId: id } = useRecord();
  return {
    async run() {
      await resource.destroyTranslation({ values: { id } });
      refresh();
    },
  };
};

const useBulkDestroyTranslationAction = () => {
  const { state, setState, refresh } = useResourceActionContext();
  const { resource } = useResourceContext();
  const { t } = useLocalTranslation();
  return {
    async run() {
      if (!state?.selectedRowKeys?.length) {
        return message.error(t('Please select the records you want to delete'));
      }
      await resource.destroyTranslation({
        values: {
          id: state?.selectedRowKeys || [],
        },
      });
      setState?.({ selectedRowKeys: [] });
      refresh();
    },
  };
};

const useSyncAction = () => {
  const { refresh } = useResourceActionContext();
  const { resource } = useResourceContext();
  return {
    async run() {
      await resource.sync();
      refresh();
    },
  };
};

const useHasTranslation = () => {
  const { translationId } = useRecord();
  // return !!translationId;
  return true;
};

const Sync = () => {
  const { t } = useLocalTranslation();
  const { refresh } = useResourceActionContext();
  const { resource } = useResourceContext();
  const [loading, setLoading] = React.useState(false);
  return (
    <Button
      icon={<SyncOutlined />}
      type="primary"
      loading={loading}
      onClick={async () => {
        setLoading(true);
        await resource.sync();
        setLoading(false);
        refresh();
      }}
    >
      {t('Sync')}
    </Button>
  );
};

export const Localization = () => {
  const { t } = useLocalTranslation();
  const api = useAPIClient();
  const curLocale = api.auth.getLocale();
  const localeLabel = locale[curLocale]?.label || curLocale;

  const CurrentLang = () => (
    <Typography>
      <Text strong>{t('Current language')}</Text>
      <Tag style={{ marginLeft: '10px' }}>{localeLabel}</Tag>
    </Typography>
  );

  const TranslationField = (props) =>
    props.value !== undefined ? <Input.TextArea {...props} /> : <div>{t('No data')}</div>;
  return (
    <Card bordered={false}>
      <SchemaComponent
        schema={localizationSchema}
        components={{ TranslationField, CurrentLang, Sync }}
        scope={{
          t,
          useDestroyTranslationAction,
          useHasTranslation,
          useBulkDestroyTranslationAction,
          useSyncAction,
        }}
      />
    </Card>
  );
};
