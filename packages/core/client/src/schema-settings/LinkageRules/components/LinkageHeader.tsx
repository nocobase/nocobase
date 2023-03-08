import React, { Fragment, useState, useEffect } from 'react';
import { Badge, Card, Collapse, CollapsePanelProps, CollapseProps, Empty, Input } from 'antd';
import { ArrayField } from '@formily/core';
import { RecursionField, useField, useFieldSchema, observer, ISchema } from '@formily/react';
import { toArr } from '@formily/shared';
import cls from 'classnames';
import { ArrayBase, ArrayBaseMixins } from '@formily/antd';

const LinkageRulesTitle = (props) => {
  const array = ArrayBase.useArray();
  const index = ArrayBase.useIndex(props.index);
  const values = array?.field?.value[index];
  const [title, setTitle] = useState<string>(values.title || 'Linkage rules');
  return (
    <Input.TextArea
      value={title}
      onChange={(ev) => {
        ev.stopPropagation();
        array.field.value.splice(index, 1, { ...values, title: ev.target.value });
        setTitle(ev.target.value);
      }}
      onBlur={(ev) => {
        ev.stopPropagation();
        setTitle(ev.target.value);
      }}
      autoSize
      style={{ width: '70%' }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    />
  );
};

export interface IArrayCollapseProps extends CollapseProps {
  defaultOpenPanelCount?: number;
}
type ComposedArrayCollapse = React.FC<IArrayCollapseProps> &
  ArrayBaseMixins & {
    CollapsePanel?: React.FC<CollapsePanelProps>;
  };

const isAdditionComponent = (schema: ISchema) => {
  return schema['x-component']?.indexOf('Addition') > -1;
};

const isIndexComponent = (schema: ISchema) => {
  return schema['x-component']?.indexOf('Index') > -1;
};

const isRemoveComponent = (schema: ISchema) => {
  return schema['x-component']?.indexOf('Remove') > -1;
};

const isMoveUpComponent = (schema: ISchema) => {
  return schema['x-component']?.indexOf('MoveUp') > -1;
};

const isMoveDownComponent = (schema: ISchema) => {
  return schema['x-component']?.indexOf('MoveDown') > -1;
};

const isOperationComponent = (schema: ISchema) => {
  return (
    isAdditionComponent(schema) || isRemoveComponent(schema) || isMoveDownComponent(schema) || isMoveUpComponent(schema)
  );
};

const range = (count: number) => Array.from({ length: count }).map((_, i) => i);

const takeDefaultActiveKeys = (dataSourceLength: number, defaultOpenPanelCount: number) => {
  if (dataSourceLength < defaultOpenPanelCount) return range(dataSourceLength);
  return range(defaultOpenPanelCount);
};

const insertActiveKeys = (activeKeys: number[], index: number) => {
  if (activeKeys.length <= index) return activeKeys.concat(index);
  return activeKeys.reduce((buf, key) => {
    if (key < index) return buf.concat(key);
    if (key === index) return buf.concat([key, key + 1]);
    return buf.concat(key + 1);
  }, []);
};

export const ArrayCollapse: ComposedArrayCollapse = observer((props: IArrayCollapseProps) => {
  const field = useField<ArrayField>();
  const dataSource = Array.isArray(field.value) ? field.value : [];
  const [activeKeys, setActiveKeys] = useState<number[]>(
    takeDefaultActiveKeys(dataSource.length, props.defaultOpenPanelCount),
  );
  const schema = useFieldSchema();
  const prefixCls = 'ant-formily-array-collapse';
  useEffect(() => {
    if (!field.modified && dataSource.length) {
      setActiveKeys(takeDefaultActiveKeys(dataSource.length, props.defaultOpenPanelCount));
    }
  }, [dataSource.length, field]);
  if (!schema) throw new Error('can not found schema object');

  const renderAddition = () => {
    return schema.reduceProperties((addition, schema, key) => {
      if (isAdditionComponent(schema)) {
        return <RecursionField schema={schema} name={key} />;
      }
      return addition;
    }, null);
  };
  const renderEmpty = () => {
    if (dataSource.length) return;
    return (
      <Card className={cls(`${prefixCls}-item`, props.className)}>
        <Empty />
      </Card>
    );
  };

  const renderItems = () => {
    return (
      <Collapse
        {...props}
        activeKey={activeKeys}
        onChange={(keys: string[]) => setActiveKeys(toArr(keys).map(Number))}
        className={cls(`${prefixCls}-item`, props.className)}
      >
        {dataSource.map((item, index) => {
          const items = Array.isArray(schema.items) ? schema.items[index] || schema.items[0] : schema.items;
          const panelProps = field.query(`${field.address}.${index}`).get('componentProps');
          const props: CollapsePanelProps = items['x-component-props'];
          const header = () => {
            const header = panelProps?.header || props.header || field.title;
            const path = field.address.concat(index);
            const errors = field.form.queryFeedbacks({
              type: 'error',
              address: `${path}.**`,
            });
            return (
              <ArrayBase.Item index={index} record={item}>
                <RecursionField
                  schema={items}
                  name={index}
                  filterProperties={(schema) => {
                    if (!isIndexComponent(schema)) return false;
                    return true;
                  }}
                  onlyRenderProperties
                />
                {errors.length ? (
                  <Badge size="small" className="errors-badge" count={errors.length}>
                    {header}
                  </Badge>
                ) : (
                  <LinkageRulesTitle index={index} />
                )}
              </ArrayBase.Item>
            );
          };

          const extra = (
            <ArrayBase.Item index={index} record={item}>
              <RecursionField
                schema={items}
                name={index}
                filterProperties={(schema) => {
                  if (!isOperationComponent(schema)) return false;
                  return true;
                }}
                onlyRenderProperties
              />
              {props?.extra}
            </ArrayBase.Item>
          );

          const content = (
            <RecursionField
              schema={items}
              name={index}
              filterProperties={(schema) => {
                if (isIndexComponent(schema)) return false;
                if (isOperationComponent(schema)) return false;
                return true;
              }}
            />
          );
          return (
            <Collapse.Panel {...props} {...panelProps} forceRender key={index} header={header()} extra={extra}>
              <ArrayBase.Item index={index} key={index} record={item}>
                {content}
              </ArrayBase.Item>
            </Collapse.Panel>
          );
        })}
      </Collapse>
    );
  };
  return (
    <ArrayBase
      onAdd={(index) => {
        setActiveKeys(insertActiveKeys(activeKeys, index));
      }}
    >
      {renderEmpty()}
      {renderItems()}
      {renderAddition()}
    </ArrayBase>
  );
});

const CollapsePanel: React.FC<CollapsePanelProps> = ({ children }) => {
  return <Fragment>{children}</Fragment>;
};

CollapsePanel.displayName = 'CollapsePanel';

ArrayCollapse.defaultProps = {
  defaultOpenPanelCount: 5,
};
ArrayCollapse.displayName = 'ArrayCollapse';
ArrayCollapse.CollapsePanel = CollapsePanel;

ArrayBase.mixin(ArrayCollapse);

export default ArrayCollapse;
