import { CopyOutlined } from '@ant-design/icons';
import { ArrayBase } from '@formily/antd-v5';
import { ArrayField } from '@formily/core';
import { ISchema, RecursionField, observer, useField, useFieldSchema } from '@formily/react';
import { toArr, uid } from '@formily/shared';
import { Badge, Card, Collapse, CollapsePanelProps, CollapseProps, Empty, Input } from 'antd';
import cls from 'classnames';
import { clone } from 'lodash';
import React, { Fragment, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStyles } from './DataTemplateTitle.style';

const DataTemplateTitle = observer<{ index: number; item: any }>((props) => {
  const array = ArrayBase.useArray();
  const index = ArrayBase.useIndex(props.index);
  const { t } = useTranslation();
  const value = array?.field?.value[index];
  useEffect(() => {
    if (!value.key) {
      value.key = uid();
    }
    if (!value.title) {
      value.title = `${t('Template name')} ${array?.field?.value?.length}`;
    }
  }, []);

  return (
    <Input.TextArea
      value={value.title}
      placeholder={t('Template name')}
      onChange={(ev) => {
        ev.stopPropagation();
        value.title = ev.target.value;
      }}
      onBlur={(ev) => {
        ev.stopPropagation();
        value.title = ev.target.value;
      }}
      autoSize
      style={{ width: '70%', border: 'none' }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    />
  );
});

export interface IArrayCollapseProps extends CollapseProps {
  defaultOpenPanelCount?: number;
}
type ComposedArrayCollapse = React.FC<React.PropsWithChildren<IArrayCollapseProps>> & {
  CollapsePanel?: React.FC<React.PropsWithChildren<CollapsePanelProps>>;
};

const isAdditionComponent = (schema: ISchema) => {
  return schema['x-component']?.indexOf?.('Addition') > -1;
};

const isIndexComponent = (schema: ISchema) => {
  return schema['x-component']?.indexOf?.('Index') > -1;
};

const isRemoveComponent = (schema: ISchema) => {
  return schema['x-component']?.indexOf?.('Remove') > -1;
};

const isMoveUpComponent = (schema: ISchema) => {
  return schema['x-component']?.indexOf?.('MoveUp') > -1;
};

const isMoveDownComponent = (schema: ISchema) => {
  return schema['x-component']?.indexOf?.('MoveDown') > -1;
};
const isCopyComponent = (schema: ISchema) => {
  return schema['x-component']?.indexOf?.('Copy') > -1;
};
const isOperationComponent = (schema: ISchema) => {
  return (
    isAdditionComponent(schema) ||
    isRemoveComponent(schema) ||
    isMoveDownComponent(schema) ||
    isMoveUpComponent(schema) ||
    isCopyComponent(schema)
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

export const ArrayCollapse: ComposedArrayCollapse = observer(
  (props: IArrayCollapseProps) => {
    const { styles } = useStyles();
    const field = useField<ArrayField>();
    const dataSource = Array.isArray(field.value) ? field.value : [];
    const [activeKeys, setActiveKeys] = useState<number[]>(
      takeDefaultActiveKeys(dataSource.length, props.defaultOpenPanelCount),
    );
    const schema = useFieldSchema();
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
        <Card className={cls(`${styles.arrayCollapseItem}`, props.className)}>
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
          className={cls(`${styles.arrayCollapseItem}`, props.className)}
        >
          {dataSource.map((item, index) => {
            const items = Array.isArray(schema.items) ? schema.items[index] || schema.items[0] : schema.items;

            const panelProps = field.query(`${field.address}.${index}`).get('componentProps');
            const props: CollapsePanelProps = items['x-component-props'];
            const header = () => {
              const header = `${panelProps?.header || props.header || field.title}`;
              const path = field.address.concat(index);
              const errors = field.form.queryFeedbacks({
                type: 'error',
                address: `${path}.**`,
              });
              return (
                <ArrayBase.Item index={index} record={() => field.value?.[index]}>
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
                    <DataTemplateTitle item={item.initialValue || item} index={index} />
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
                {panelProps?.extra}
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
        onRemove={() => {
          field.initialValue = field.value;
        }}
      >
        {renderEmpty()}
        {renderItems()}
        {renderAddition()}
      </ArrayBase>
    );
  },
  { displayName: 'ArrayCollapse' },
);

const CollapsePanel: React.FC<React.PropsWithChildren<CollapsePanelProps>> = ({ children }) => {
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

//@ts-ignore
ArrayCollapse.Copy = React.forwardRef((props: any, ref) => {
  const self = useField();
  const array = ArrayBase.useArray();
  const index = ArrayBase.useIndex(props.index);
  if (!array) return null;
  if (array.field?.pattern !== 'editable') return null;
  return (
    <CopyOutlined
      {...props}
      style={{
        transition: 'all 0.25s ease-in-out',
        color: 'rgba(0, 0, 0, 0.8)',
        fontSize: '16px',
        marginLeft: 6,
      }}
      ref={ref}
      onClick={(e) => {
        if (self?.disabled) return;
        e.stopPropagation();
        if (array.props?.disabled) return;
        const value = clone(array?.field?.value[index]);
        array.field.push(value);
        if (props.onClick) {
          props.onClick(e);
        }
      }}
    />
  );
});
(ArrayCollapse as any).Copy.displayName = 'ArrayCollapse.Copy';
