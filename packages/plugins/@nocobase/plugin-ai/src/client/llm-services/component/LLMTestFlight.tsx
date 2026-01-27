/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useForm } from '@formily/react';
import { SchemaComponent, useActionContext, useAPIClient, useRequest } from '@nocobase/client';
import React, { useEffect, useState } from 'react';
import { Alert, AutoComplete, Collapse, Spin } from 'antd';
import { namespace, useT } from '../../locale';
import { tval } from '@nocobase/utils/client';
import { Field, LifeCycleTypes } from '@formily/core';

export const LLMTestFlight: React.FC = () => {
  const t = useT();
  const form = useForm();
  const api = useAPIClient();
  const [failureMessage, setFailureMessage] = useState('');
  const [successful, setSuccessful] = useState(false);
  const [loading, setLoading] = useState(false);

  const useTestActionProps = () => {
    return {
      type: 'primary',
      loading,
      async onClick() {
        await form.validate();
        const values = { ...form.values };
        setSuccessful(false);
        setFailureMessage(null);
        setLoading(true);

        api
          .resource('ai')
          .testFlight({
            values,
          })
          .then((res) => {
            if (res.data.data.code !== 0) {
              setFailureMessage(res.data.data.message);
            } else {
              setSuccessful(true);
            }
          })
          .finally(() => setLoading(false))
          .catch(console.error);
      },
    };
  };

  const NotifyMessage: React.FC = () => {
    return successful ? (
      <div style={{ marginBottom: 16 }}>
        <Alert message={t('Successful')} type="success" closable />
      </div>
    ) : (
      failureMessage && (
        <div style={{ marginBottom: 16 }}>
          <Alert message={t('Failure')} description={failureMessage} type="warning" closable />
        </div>
      )
    );
  };

  return (
    <div
      style={{
        marginBottom: 24,
      }}
    >
      <Collapse
        bordered={false}
        size="small"
        items={[
          {
            key: 'testFlight',
            label: t('Test flight'),
            forceRender: true,
            children: (
              <SchemaComponent
                components={{ ModelSelect, NotifyMessage }}
                scope={{ useTestActionProps }}
                schema={{
                  type: 'void',
                  properties: {
                    testFlightGroup: {
                      type: 'void',
                      'x-component': 'div',
                      'x-component-props': {
                        style: {
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        },
                      },
                      properties: {
                        model: {
                          title: tval('Model', { ns: namespace }),
                          type: 'string',
                          required: true,
                          'x-decorator': 'FormItem',
                          'x-decorator-props': {
                            layout: 'horizontal',
                            style: {
                              marginBottom: 0,
                            },
                          },
                          'x-component': 'ModelSelect',
                          'x-component-props': {
                            style: {
                              width: 240,
                            },
                          },
                        },
                        runTest: {
                          title: '{{ t("Run") }}',
                          'x-component': 'Action',
                          'x-component-props': {
                            type: 'primary',
                          },
                          'x-use-component-props': 'useTestActionProps',
                        },
                      },
                    },
                    notifyMessage: {
                      type: 'void',
                      'x-component': 'NotifyMessage',
                    },
                  },
                }}
              />
            ),
          },
        ]}
      ></Collapse>
    </div>
  );
};

const ModelSelect: React.FC = (props) => {
  const api = useAPIClient();
  const [options, setOptions] = useState([]);
  const [models, setModels] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const field = useField<Field>();
  const form = useForm();

  const requestModels = async (values: any) => {
    try {
      await form.validate();
    } catch (e) {
      return;
    } finally {
      form.clearErrors();
    }

    try {
      setLoading(true);
      const res = await api.resource('ai').testFlightModels(
        {
          values,
        },
        { skipNotify: true },
      );
      const items = res?.data?.data?.map(({ id }) => ({
        label: id,
        value: id,
      }));
      setModels(items);
      setOptions(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestModels(form.values);
    const unsubscribe = form.subscribe((event) => {
      if (event.type === LifeCycleTypes.ON_FORM_VALUES_CHANGE) {
        setModels([]);
        setOptions([]);
        requestModels(event.payload.values);
      }
    });
    return () => {
      form.unsubscribe(unsubscribe);
    };
  }, [api, form]);

  const handleSearch = (value: string) => {
    if (!models) {
      setOptions([]);
      return;
    }
    if (!value) {
      setOptions(models);
      return;
    }
    const searchOptions = models.filter((option) => {
      return option.label.toLowerCase().includes(value.toLowerCase());
    });
    setOptions(searchOptions);
  };

  return (
    <AutoComplete
      {...props}
      onSearch={handleSearch}
      options={options}
      notFoundContent={loading ? <Spin size="small" /> : null}
      value={field.value}
      onChange={(val) => (field.value = val)}
    />
  );
};
