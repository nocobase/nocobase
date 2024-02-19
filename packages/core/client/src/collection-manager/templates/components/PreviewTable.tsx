import { RecursionField, useForm } from '@formily/react';
import { Spin, Table } from 'antd';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EllipsisWithTooltip, useCompile } from '../../../';
import { useAPIClient } from '../../../api-client';
import { useCollectionManager_deprecated } from '../../hooks/useCollectionManager_deprecated';

const mapFields = ['lineString', 'point', 'circle', 'polygon'];
export const PreviewTable = (props) => {
  const { databaseView, schema, viewName, fields } = props;
  const [previewColumns, setPreviewColumns] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const compile = useCompile();
  const [loading, setLoading] = useState(false);
  const { getInterface, getCollectionFields } = useCollectionManager_deprecated();
  const api = useAPIClient();
  const { t } = useTranslation();
  const form = useForm();
  useEffect(() => {
    if (databaseView) {
      getPreviewData();
    }
  }, [viewName, schema]);

  useEffect(() => {
    const pColumns = formatPreviewColumns(fields);
    setPreviewColumns(pColumns);
  }, [form.values.fields]);

  const getPreviewData = () => {
    const fieldTypes = {};
    form.values.fields.map((v) => {
      if (mapFields.includes(v.type)) {
        fieldTypes[v.name] = v.type;
      }
    });
    setLoading(true);
    api
      .resource(`dbViews`)
      .query({ filterByTk: viewName, schema, fieldTypes })
      .then(({ data }) => {
        if (data) {
          setLoading(false);
          setPreviewData(data?.data || []);
        }
      }).catch;
  };

  const formatPreviewColumns = (data) => {
    return data
      .filter((k) => k.source || k.interface)
      ?.map((item) => {
        const fieldSource = typeof item?.source === 'string' ? item?.source?.split('.') : item?.source;
        const sourceField = getCollectionFields(fieldSource?.[0])?.find((v) => v.name === fieldSource?.[1])?.uiSchema;
        const target = item?.uiSchema?.title || sourceField?.title || item.name;
        const schema: any = item.source ? sourceField : getInterface(item.interface)?.default?.uiSchema;
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
                [item.name]: {
                  name: `${item.name}`,
                  'x-component': schema && fieldSource ? 'CollectionField' : 'Input',
                  'x-read-pretty': true,
                  'x-collection-field': fieldSource?.join('.'),
                  default: item.interface === 'json' ? JSON.stringify(content) : content,
                },
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
    <Spin spinning={loading} key="preview">
      <div
        style={{
          marginBottom: 22,
        }}
      >
        <div
          className="ant-formily-item-label"
          style={{ marginTop: 24, display: 'flex', padding: '0 0 8px' }}
          key={viewName}
        >
          <div className="ant-formily-item-label-content">
            <span>
              <label>{t('Preview')}</label>
            </span>
          </div>
          <span className="ant-formily-item-colon">:</span>
        </div>
        {previewColumns?.length > 0 && (
          <>
            <Table
              size={'middle'}
              pagination={false}
              bordered
              columns={previewColumns}
              dataSource={previewData}
              scroll={{ x: 1000, y: 300 }}
              key={`${viewName}-preview`}
            />
          </>
        )}
      </div>
    </Spin>
  );
};
