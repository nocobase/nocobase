/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SyncOutlined } from '@ant-design/icons';
import { Form, createForm } from '@formily/core';
import { Field, useField, useForm, Schema } from '@formily/react';
import {
  FormProvider,
  Input,
  Radio,
  SchemaComponent,
  Select,
  StablePopover,
  locale,
  useAPIClient,
  useActionContext,
  useRecord,
  useRequest,
  useResourceActionContext,
  useResourceContext,
} from '@nocobase/client';
import { useMemoizedFn } from 'ahooks';
import { Input as AntdInput, Button, Card, Checkbox, Col, Divider, Row, Tag, Typography, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocalTranslation } from './locale';
import { localizationSchema } from './schemas/localization';
const { Text } = Typography;

const useUpdateTranslationAction = () => {
  const field = useField();
  const form = useForm();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { targetKey } = useResourceContext();
  const { [targetKey]: textId } = useRecord();
  const api = useAPIClient();
  const locale = api.auth.getLocale();
  return {
    async run() {
      await form.submit();
      field.data = field.data || {};
      field.data.loading = true;
      try {
        await api.resource('localizationTranslations').updateOrCreate({
          filterKeys: ['textId', 'locale'],
          values: {
            textId,
            locale,
            translation: form.values.translation,
          },
        });
        ctx.setVisible(false);
        await form.reset();
        refresh();
      } catch (e) {
        console.log(e);
      } finally {
        field.data.loading = false;
      }
    },
  };
};

const useDestroyTranslationAction = () => {
  const { refresh } = useResourceActionContext();
  const api = useAPIClient();
  const { translationId: filterByTk } = useRecord();
  return {
    async run() {
      if (!filterByTk) {
        return;
      }
      await api.resource('localizationTranslations').destroy({ filterByTk });
      refresh();
    },
  };
};

const useBulkDestroyTranslationAction = () => {
  const { state, setState, refresh } = useResourceActionContext();
  const api = useAPIClient();
  const { t } = useLocalTranslation();
  return {
    async run() {
      if (!state?.selectedRowKeys?.length) {
        return message.error(t('Please select the records you want to delete'));
      }
      await api.resource('localizationTranslations').destroy({ filterByTk: state?.selectedRowKeys });
      setState?.({ selectedRowKeys: [] });
      refresh();
    },
  };
};

const usePublishAction = () => {
  const api = useAPIClient();
  return {
    async run() {
      await api.resource('localization').publish();
      window.location.reload();
    },
  };
};

const Sync = () => {
  const { t } = useLocalTranslation();
  const { refresh } = useResourceActionContext();
  const api = useAPIClient();
  const [syncing, setSyncing] = useState(false);
  const [plainOptions, setPlainOptions] = useState([]);
  const [checkedList, setCheckedList] = useState<any[]>([]);
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

  const { data, loading } = useRequest<
    {
      name: string;
      title: string;
    }[]
  >(
    () =>
      api
        .resource('localization')
        .getSources()
        .then((res) => res?.data?.data),
    {
      onSuccess: (data) => {
        const plainOptions = data.map((item: { name: string }) => item.name);
        setPlainOptions(plainOptions);
        setCheckedList(plainOptions);
      },
    },
  );

  if (loading) {
    return null;
  }

  return (
    <StablePopover
      placement="bottomRight"
      content={
        <>
          <Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>
            {t('All')}
          </Checkbox>
          <Divider style={{ margin: '5px 0' }} />
          <Checkbox.Group onChange={onChange} value={checkedList}>
            <Col>
              {(data || []).map((item: { name: string; title: string }) => (
                <Row key={item.name}>
                  <Checkbox value={item.name}>{Schema.compile(item.title, { t })}</Checkbox>
                </Row>
              ))}
            </Col>
          </Checkbox.Group>
        </>
      }
    >
      <Button
        icon={<SyncOutlined />}
        loading={syncing}
        onClick={async () => {
          if (!checkedList.length) {
            return message.error(t('Please select the resources you want to synchronize'));
          }
          setSyncing(true);
          await api.resource('localization').sync({
            values: {
              types: checkedList,
            },
          });
          setSyncing(false);
          refresh();
        }}
      >
        {t('Sync')}
      </Button>
    </StablePopover>
  );
};

const useModules = () => {
  const { t: lang } = useLocalTranslation();
  const t = useMemoizedFn(lang);
  const { data } = useResourceActionContext();
  const modules = useMemo(
    () =>
      data?.meta?.modules?.map((module) => ({
        value: module.value,
        label: Schema.compile(module.label, { t }),
      })) || [],
    [data?.meta?.modules, t],
  );
  return modules;
};

const Filter = () => {
  const { t } = useLocalTranslation();
  const { run } = useResourceActionContext();
  const modules = useModules();
  const form = useMemo<Form>(
    () =>
      createForm({
        initialValues: {
          hasTranslation: true,
        },
      }),
    [],
  );
  const filter = (values?: any) => {
    run({
      ...(values || form.values),
    });
  };
  useEffect(() => {
    const module = form.query('module').take() as any;
    module.dataSource = modules;
  }, [form, modules]);

  return (
    <FormProvider form={form}>
      <div style={{ display: 'flex' }}>
        <Field
          name="module"
          dataSource={modules}
          component={[
            Select,
            {
              allowClear: true,
              placeholder: t('Module'),
              onChange: (module: string) => filter({ ...form.values, module }),
            },
          ]}
        />
        <Field
          name="keyword"
          component={[
            AntdInput.Search,
            {
              placeholder: t('Keyword'),
              allowClear: true,
              style: {
                marginLeft: '8px',
                width: 'fit-content',
              },
              onSearch: (keyword) => filter({ ...form.values, keyword }),
            },
          ]}
        />
        <Field
          name="hasTranslation"
          dataSource={[
            { label: t('All'), value: true },
            { label: t('No translation'), value: false },
          ]}
          component={[
            Radio.Group,
            {
              defaultValue: true,
              style: {
                marginLeft: '8px',
                width: 'fit-content',
              },
              optionType: 'button',
              onChange: () => filter(),
            },
          ]}
        />
      </div>
    </FormProvider>
  );
};

const ModuleTitle = () => {
  const { t } = useLocalTranslation();
  const { moduleTitle } = useRecord();
  return <Tag>{Schema.compile(moduleTitle, { t })}</Tag>;
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

  const TranslationField = (props) => (props.value !== undefined ? <Input.TextArea {...props} /> : <div></div>);
  return (
    <Card bordered={false}>
      <SchemaComponent
        schema={localizationSchema}
        components={{ TranslationField, CurrentLang, Sync, Filter, ModuleTitle }}
        scope={{
          t,
          useDestroyTranslationAction,
          useBulkDestroyTranslationAction,
          useUpdateTranslationAction,
          usePublishAction,
          useModules,
        }}
      />
    </Card>
  );
};
