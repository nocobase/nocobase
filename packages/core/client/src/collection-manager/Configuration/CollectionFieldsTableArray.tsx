import { css } from '@emotion/css';
import { ArrayField, Field } from '@formily/core';
import { observer, RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { Table, TableColumnProps } from 'antd';
import { default as classNames } from 'classnames';
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { findIndex } from 'lodash';
import {
  RecordIndexProvider,
  RecordProvider,
  useCollectionManager,
  useRequest,
  useSchemaInitializer,
  useRecord,
  useCompile,
  SchemaComponent,
  useCollection,
} from '../..';
import { overridingSchema } from '../Configuration/schemas/collectionFields';

const isColumnComponent = (schema: Schema) => {
  return schema['x-component']?.endsWith('.Column') > -1;
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
  const sortKeyArr: Array<CategorizeKey> = ['primaryAndForeignKey', 'relation', 'basic', 'systemInfo'];
  const field = useField<ArrayField>();
  const { name } = useRecord();
  const { t } = useTranslation();
  const compile = useCompile();
  const { getInterface, getInheritCollections, getCollection, getCurrentCollectionFields, getInheritedFields } =
    useCollectionManager();
  const {
    showIndex = true,
    useSelectedRowKeys = useDef,
    useDataSource = useDefDataSource,
    onChange,
    ...others
  } = props;
  const [selectedRowKeys, setSelectedRowKeys] = useSelectedRowKeys();
  const [categorizeData, setCategorizeData] = useState<Array<CategorizeDataItem>>([]);
  const [expandedKeys, setExpendedKeys] = useState(selectedRowKeys);
  const inherits = getInheritCollections(name);
  const currentFields = getCurrentCollectionFields(name);
  useDataSource({
    onSuccess(data) {
      field.value = data?.data || [];
      const tmpData: Array<CategorizeDataItem> = [];
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
      if (inherits) {
        inherits.forEach((v) => {
          sortKeyArr.push(v);
          const parentCollection = getCollection(v);
          parentCollection.fields.map((k) => {
            if (k.interface) {
              addCategorizeVal(v, new Proxy(k, {}));
              field.value.push(new Proxy(k, {}));
            }
          });
        });
      }
      sortKeyArr.forEach((key) => {
        if (categorizeMap.get(key)?.length > 0) {
          const parentCollection = getCollection(key);
          tmpData.push({
            key,
            name:
              t(CategorizeKeyNameMap.get(key)) ||
              t(`Parent collection fields`) + `(${compile(parentCollection.title)})`,
            data: categorizeMap.get(key),
          });
        }
      });
      setExpendedKeys(sortKeyArr);
      setCategorizeData(tmpData);
    },
  });
  const useTableColumns = () => {
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
            const index = findIndex(field.value, record);
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


  const expandedRowRender = (record: CategorizeDataItem, index, indent, expanded) => {
    if(!props.loading){
      const columns = useTableColumns();
      if (inherits.includes(record.key)) {
        columns.pop();
        columns.push({
          title: <RecursionField name={'column4'} schema={overridingSchema as Schema} onlyRenderSelf />,
          dataIndex: 'column4',
          key: 'column4',
          render: (v, record) => {
            const index = findIndex(field.value, record);
            return (
              <RecordIndexProvider index={index}>
                <RecordProvider record={record}>
                  <SchemaComponent
                    scope={{ currentCollection: name }}
                    schema={overridingSchema as Schema}
                    name={index}
                    onlyRenderProperties
                  />
                </RecordProvider>
              </RecordIndexProvider>
            );
          },
        });
      }
      const restProps = {
        rowSelection:
          props.rowSelection && !inherits.includes(record.key)
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
    }
   
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
          expandedRowKeys: expandedKeys,
        }}
        onExpand={(expanded, record) => {
          let keys = [];
          if (expanded) {
            keys = expandedKeys.concat([record.key]);
          } else {
            keys = expandedKeys.filter((v) => {
              return v !== record.key;
            });
          }
          setExpendedKeys(keys);
        }}
      />
    </div>
  );
});
