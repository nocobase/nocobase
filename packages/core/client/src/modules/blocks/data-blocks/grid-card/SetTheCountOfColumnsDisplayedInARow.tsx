import { ISchema, useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { columnCountMarks } from '../../../../schema-component/antd/grid-card/GridCard.Designer';
import {
  defaultColumnCount,
  gridSizes,
  screenSizeMaps,
  screenSizeTitleMaps,
} from '../../../../schema-component/antd/grid-card/options';
import { useDesignable } from '../../../../schema-component/hooks';
import { SchemaSettingsModalItem } from '../../../../schema-settings';

export function SetTheCountOfColumnsDisplayedInARow() {
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const field = useField();
  const { dn } = useDesignable();
  const columnCount = field.decoratorProps.columnCount || defaultColumnCount;

  const columnCountSchema = useMemo(() => {
    return {
      'x-component': 'Slider',
      'x-decorator': 'FormItem',
      'x-component-props': {
        min: 1,
        max: 24,
        marks: columnCountMarks,
        tooltip: {
          formatter: (value) => `${value}${t('Column')}`,
        },
        step: null,
      },
    };
  }, [t]);

  const columnCountProperties = useMemo(() => {
    return gridSizes.reduce((o, k) => {
      o[k] = {
        ...columnCountSchema,
        title: t(screenSizeTitleMaps[k]),
        description: `${t('Screen size')} ${screenSizeMaps[k]} ${t('pixels')}`,
      };
      return o;
    }, {});
  }, [columnCountSchema, t]);

  return (
    <SchemaSettingsModalItem
      title={t('Set the count of columns displayed in a row')}
      initialValues={columnCount}
      schema={
        {
          type: 'object',
          title: t('Set the count of columns displayed in a row'),
          properties: columnCountProperties,
        } as ISchema
      }
      onSubmit={(columnCount) => {
        _.set(fieldSchema, 'x-decorator-props.columnCount', columnCount);
        field.decoratorProps.columnCount = columnCount;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-decorator-props': fieldSchema['x-decorator-props'],
          },
        });
      }}
    />
  );
}
