import { FilterOutlined, SyncOutlined } from '@ant-design/icons';
import { Form, createForm } from '@formily/core';
import {
  FormProvider,
  Input,
  SchemaComponent,
  locale,
  useAPIClient,
  useRecord,
  useResourceActionContext,
  useResourceContext,
} from '@nocobase/client';
import { Button, Card, Checkbox, Col, Divider, Popover, Row, Tag, Typography, message } from 'antd';
import React, { useMemo, useState } from 'react';
import { useLocalTranslation } from './locale';
import { filterSchema, localizationSchema } from './schemas/localization';
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
  const [loading, setLoading] = useState(false);
  const plainOptions = ['local', 'menu', 'db'];
  const [checkedList, setCheckedList] = useState<any[]>(plainOptions);
  const [indeterminate, setIndeterminate] = useState(false);
  const [checkAll, setCheckAll] = useState(true);
  const onChange = (list: any[]) => {
    setCheckedList(list);
    setIndeterminate(!!list.length && list.length < plainOptions.length);
    setCheckAll(list.length === plainOptions.length);
  };

  const onCheckAllChange = (e) => {
    setCheckedList(e.target.checked ? plainOptions : []);
    setIndeterminate(false);
    setCheckAll(e.target.checked);
  };

  return (
    <Popover
      placement="bottomRight"
      content={
        <>
          <Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>
            {t('All')}
          </Checkbox>
          <Divider style={{ margin: '5px 0' }} />
          <Checkbox.Group onChange={onChange} value={checkedList}>
            <Col>
              <Row>
                <Checkbox value="local">{t('Built-in files')}</Checkbox>
              </Row>
              <Row>
                <Checkbox value="db">{t('Collections & fields')}</Checkbox>
              </Row>
              <Row>
                <Checkbox value="menu">{t('Menu')}</Checkbox>
              </Row>
            </Col>
          </Checkbox.Group>
        </>
      }
    >
      <Button
        icon={<SyncOutlined />}
        type="primary"
        loading={loading}
        onClick={async () => {
          if (!checkedList.length) {
            return message.error(t('Please select the resources you want to synchronize'));
          }
          setLoading(true);
          await resource.sync({
            values: {
              type: checkedList,
            },
          });
          setLoading(false);
          refresh();
        }}
      >
        {t('Sync')}
      </Button>
    </Popover>
  );
};

const Filter = () => {
  const { t } = useLocalTranslation();
  const { run, refresh } = useResourceActionContext();
  const form = useMemo<Form>(
    () =>
      createForm({
        initialValues: {
          hasTranslation: true,
        },
      }),
    [],
  );
  const useSearch = () => {
    return {
      run: () =>
        run({
          ...form.values,
        }),
    };
  };
  const useReset = () => {
    return {
      run: () => {
        form.reset();
        run();
      },
    };
  };
  return (
    <Popover
      placement="right"
      content={
        <FormProvider form={form}>
          <SchemaComponent schema={filterSchema} scope={{ t, useSearch, useReset }} />
        </FormProvider>
      }
    >
      <Button icon={<FilterOutlined />}>{t('Filter')}</Button>
    </Popover>
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
        components={{ TranslationField, CurrentLang, Sync, Filter }}
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
