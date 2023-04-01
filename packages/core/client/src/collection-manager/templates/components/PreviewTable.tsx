import React, { useEffect, useState } from 'react';
import { Table, Spin } from 'antd';
import { useForm, RecursionField } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../../api-client';
import { useCollectionManager } from '../../hooks/useCollectionManager';
import { useCompile, EllipsisWithTooltip } from '../../../';

export const PreviewTable = (props) => {
  const { name, viewName, schema,fields } = props;
  const [previewColumns, setPreviewColumns] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const compile = useCompile();
  const [loading, setLoading] = useState(false);
  const { getCollection, getCollectionField, getInterface } = useCollectionManager();
  const api = useAPIClient();
  const { t } = useTranslation();
  const form = useForm();
  useEffect(() => {
    if (name) {
      getPreviewData();
    }
  }, [name]);

  useEffect(() => {
    const pColumns = formatPreviewColumns(fields);
    setPreviewColumns(pColumns);
  }, [form.values.fields]);

  const getPreviewData = () => {
    setLoading(true);
    api
      .resource(`dbViews`)
      .query({ filterByTk: viewName, schema })
      .then(({ data }) => {
        if (data) {
          setLoading(false);
          setPreviewData(data?.data || []);
        }
      });
  };

  const formatPreviewColumns = (data) => {
    return data
      .filter((k) => k.source || k.interface)
      ?.map((item) => {
        const fieldSource = typeof item?.source === 'string' ? item?.source?.split('.') : item?.source;
        const sourceField = getCollection(fieldSource?.[0])?.fields.find((v) => v.name === fieldSource?.[1])?.uiSchema
          ?.title;
        const target = sourceField || item?.uiSchema?.title || item.name;
        const schema: any = item.source
          ? getCollectionField(typeof item.source === 'string' ? item.source : item.source.join('.'))?.uiSchema
          : getInterface(item.interface)?.default?.uiSchema;
        return {
          title: compile(target),
          dataIndex: item.name,
          key: item.name,
          width: 200,
          render: (v, record, index) => {
            const content = record[item.name];
            const objSchema: any = {
              type: 'object',
              properties: {
                [item.name]: { ...schema, default: content, 'x-read-pretty': true, title: null },
              },
            };
            return (
              <EllipsisWithTooltip ellipsis={true}>
                <RecursionField schema={objSchema} name={index} onlyRenderProperties />
              </EllipsisWithTooltip>
            );
          },
        };
      });
  };
  return (
    <Spin spinning={loading}>
      {previewColumns?.length > 0 && [
        <h4 style={{ marginTop: 10 }}>{t('Preview')}:</h4>,
        <Table
          pagination={false}
          bordered
          columns={previewColumns}
          dataSource={previewData}
          scroll={{ x: 1000, y: 300 }}
        />,
      ]}
    </Spin>
  );
};
