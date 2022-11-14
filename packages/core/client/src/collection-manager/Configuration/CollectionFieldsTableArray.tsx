import { css } from '@emotion/css';
import { ArrayField, Field } from '@formily/core';
import { observer, RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { Table, TableColumnProps } from 'antd';
import { default as classNames } from 'classnames';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RecordIndexProvider, RecordProvider, useCollectionManager, useRequest, useSchemaInitializer } from '../..';

const isColumnComponent = (schema: Schema) => {
  return schema['x-component']?.endsWith('.Column') > -1;
};

const useTableColumns = () => {
  const field = useField<ArrayField>();
  const schema = useFieldSchema();
  const { exists, render } = useSchemaInitializer(schema['x-initializer']);
  const columns = schema
    .reduceProperties((buf, s) => {
      if (isColumnComponent(s)) {
        return buf.concat([s]);
      }
    }, [])
    .map((s: Schema) => {
      return {
        title: <RecursionField name={s.name} schema={s} onlyRenderSelf />,
        dataIndex: s.name,
        key: s.name,
        render: (v, record) => {
          const index = field.value?.indexOf(record);
          // console.log((Date.now() - start) / 1000);
          return (
            <RecordIndexProvider index={index}>
              <RecordProvider record={record}>
                <RecursionField schema={s} name={index} onlyRenderProperties />
              </RecordProvider>
            </RecordIndexProvider>
          );
        },
      } as TableColumnProps<any>;
    });
  if (!exists) {
    return columns;
  }
  return columns.concat({
    title: render(),
    dataIndex: 'TABLE_COLUMN_INITIALIZER',
    key: 'TABLE_COLUMN_INITIALIZER',
  });
};

export const components = {
  body: {
    row: (props) => {
      return <tr {...props} />;
    },
    cell: (props) => (
      <td
        {...props}
        className={classNames(
          props.className,
          css`
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          `,
        )}
      />
    ),
  },
};

const useDef = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  return [selectedRowKeys, setSelectedRowKeys];
};

const useDefDataSource = (options, props) => {
  const field = useField<Field>();
  return useRequest(() => {
    return Promise.resolve({
      data: field.value,
    });
  }, options);
};

const groupColumns = [
  {
    dataIndex: 'name',
    key: 'name',
  },
];

type CategorizeKey = 'primaryAndForeignKey' | 'relation' | 'systemInfo' | 'basic';
const sortKeyArr: Array<CategorizeKey> = ['primaryAndForeignKey', 'relation', 'basic', 'systemInfo'];
const CategorizeKeyNameMap = new Map<CategorizeKey, string>([
  ['primaryAndForeignKey', 'PK & FK fields'],
  ['relation', 'Association fields'],
  ['systemInfo', 'System fields'],
  ['basic', 'General fields'],
]);

interface CategorizeDataItem {
  key: CategorizeKey;
  name: string;
  data: Array<any>;
}

export const CollectionFieldsTableArray: React.FC<any> = observer((props) => {
  const field = useField<ArrayField>();
  const columns = useTableColumns();
  const { t } = useTranslation();
  const { getInterface } = useCollectionManager();
  const {
    showIndex = true,
    useSelectedRowKeys = useDef,
    useDataSource = useDefDataSource,
    onChange,
    ...others
  } = props;
  const [selectedRowKeys, setSelectedRowKeys] = useSelectedRowKeys();

  const [categorizeData, setCategorizeData] = useState<Array<CategorizeDataItem>>([]);
  useDataSource({
    onSuccess(data) {
      field.value = data?.data || [];
      // categorize field
      const categorizeMap = new Map<CategorizeKey, any>();
      const addCategorizeVal = (categorizeKey: CategorizeKey, val) => {
        let fieldArr = categorizeMap.get(categorizeKey);
        if (!fieldArr) {
          fieldArr = [];
        }
        fieldArr.push(val);
        categorizeMap.set(categorizeKey, fieldArr);
      };
      field.value.forEach((item) => {
        const itemInterface = getInterface(item?.interface);
        if (item?.primaryKey || item.isForeignKey) {
          addCategorizeVal('primaryAndForeignKey', item);
          return;
        }
        const group = itemInterface?.group as CategorizeKey;
        switch (group) {
          case 'systemInfo':
          case 'relation':
            addCategorizeVal(group, item);
            break;
          default:
            addCategorizeVal('basic', item);
        }
      });
      const tmpData: Array<CategorizeDataItem> = [];
      sortKeyArr.forEach((key) => {
        if (categorizeMap.get(key)?.length > 0) {
          tmpData.push({
            key,
            name: t(CategorizeKeyNameMap.get(key)),
            data: categorizeMap.get(key),
          });
        }
      });
      setCategorizeData(tmpData);
    },
  });
  const restProps = {
    rowSelection: props.rowSelection
      ? {
          type: 'checkbox',
          selectedRowKeys,
          onChange(selectedRowKeys: any[]) {
            setSelectedRowKeys(selectedRowKeys);
          },
          ...props.rowSelection,
        }
      : undefined,
  };

  const defaultRowKey = (record: any) => {
    return field.value?.indexOf?.(record);
  };

  const expandedRowRender = (record: CategorizeDataItem, index, indent, expanded) => {
    return (
      <Table
        {...others}
        {...restProps}
        components={components}
        showHeader={true}
        columns={columns}
        dataSource={record.data}
        pagination={false}
      />
    );
  };
  return (
    <div
      className={css`
        .ant-table {
          overflow-x: auto;
          overflow-y: hidden;
        }
      `}
    >
      <Table
        showHeader={false}
        loading={props?.loading}
        columns={groupColumns}
        dataSource={categorizeData}
        pagination={false}
        expandable={{
          expandedRowRender,
          defaultExpandedRowKeys: sortKeyArr,
        }}
      />
    </div>
  );
});
