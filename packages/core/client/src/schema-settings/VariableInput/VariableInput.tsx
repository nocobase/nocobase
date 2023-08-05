import React, { useMemo } from 'react';
import { CollectionFieldOptions } from '../../collection-manager';
import { useCompile, Variable } from '../../schema-component';
import { useContextAssociationFields, useIsSameOrChildCollection } from './hooks/useContextAssociationFields';
import { useUserVariable } from './hooks/useUserVariable';

type Props = {
  value: any;
  onChange: (value: any) => void;
  collectionName: string;
  renderSchemaComponent?: (props: any) => any;
  schema: any;
  operator: any;
  children?: any;
  className?: string;
  style?: React.CSSProperties;
  collectionField?: CollectionFieldOptions;
  contextCollectionName?: string;
  /**
   * 根据 `onChange` 的第一个参数，判断是否需要触发 `onChange`
   * @param value `onChange` 的第一个参数
   * @returns 返回为 `true` 时，才会触发 `onChange`
   */
  shouldChange?: (value: any) => boolean;
};

export const VariableInput = (props: Props) => {
  const {
    value,
    onChange,
    renderSchemaComponent: RenderSchemaComponent,
    style,
    schema,
    className,
    contextCollectionName,
    shouldChange,
  } = props;
  const compile = useCompile();
  const userVariable = useUserVariable({ schema, maxDepth: 3 });
  const contextVariable = useContextAssociationFields({ schema, maxDepth: 2, contextCollectionName, collectionField });
  const getIsSameOrChildCollection = useIsSameOrChildCollection();
  const isAllowTableContext = getIsSameOrChildCollection(contextCollectionName, collectionField?.target);
  const scope = useMemo(() => {
    const data = [
      userVariable,
      compile({
        label: `{{t("Date variables")}}`,
        value: '$date',
        key: '$date',
        disabled: schema['x-component'] !== 'DatePicker',
        children: [
          {
            key: 'now',
            value: 'now',
            label: `{{t("Now")}}`,
          },
        ],
      }),
    ];
    if (contextCollectionName) {
      data.unshift(contextVariable);
    }
    return data;
  }, [compile, contextCollectionName, contextVariable, schema, userVariable]);

  const handleChange = (value: any) => {
    if (!shouldChange) {
      return onChange(value);
    }
    if (shouldChange(value)) {
      onChange(value);
    }
  };

  return (
    <Variable.Input
      className={className}
      value={value}
      onChange={handleChange}
      scope={scope}
      style={style}
      changeOnSelect={isAllowTableContext}
    >
      <RenderSchemaComponent value={value} onChange={onChange} />
    </Variable.Input>
  );
};
