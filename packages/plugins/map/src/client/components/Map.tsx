import { connect, mapReadPretty, useFieldSchema, ObjectField, FormProvider, Field, useField } from '@formily/react';
import { Editable } from '@formily/antd';
import React from 'react';
import { createForm } from '@formily/core';
import { useCollection } from '@nocobase/client';
import AMapComponent, { AMapComponentProps } from './AMap';
import ReadPretty from './ReadPretty';
import { css } from '@emotion/css';
import Designer from './Designer';

type MapProps = AMapComponentProps;

const MapCom = (props: MapProps) => {
  return (
    <div
      className={css`
        height: 100%;
        border: 1px solid transparent;
        .ant-formily-item-error & {
          border: 1px solid #ff4d4f;
        }
      `}
    >
      {props.mapType ? <AMapComponent {...props} /> : null}
    </div>
  );
};

const InternalMap = connect((props: MapProps) => {
  return <InputMapComponent {...props} />;
}, mapReadPretty(ReadPretty));

const InputMapComponent = React.forwardRef((props: any) => {
  const fieldSchema = useFieldSchema();
  const targetField: any = useField();
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema?.name);
  const isDisplayInTable = fieldSchema.parent?.['x-component'] === 'TableV2.Column';
  const form = createForm();
  const FieldWithEditable = React.useMemo(() => {
    return (
      <div>
        <FormProvider form={form}>
          <ObjectField
            name={fieldSchema.name}
            reactions={(field) => {
              const value = field.value?.map || props?.value;
              field.title = value;
              targetField.value = value;
            }}
            component={[
              Editable.Popover,
              {
                overlayStyle: {
                  width: 400,
                  height: 400,
                },
                overlayClassName: css`
                  .ant-popover-title {
                    display: none;
                  }
                `,
              },
            ]}
          >
            <Field
              component={[MapCom, { ...props, type: collectionField?.interface, style: { height: 400 } }]}
              name="map"
            />
          </ObjectField>
        </FormProvider>
      </div>
    );
  }, []);

  return isDisplayInTable ? FieldWithEditable : <MapCom {...props} />;
});

const Map = InternalMap as typeof InternalMap & {
  Designer: typeof Designer;
};

Map.Designer = Designer;

export default Map;
