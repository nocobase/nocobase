import { useCollection, useProps, ActionContext, RecordProvider, useRecord } from '@nocobase/client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import AMap, { AMapForwardedRefProps } from '../components/AMap';
import { RecursionField, useFieldSchema, Schema } from '@formily/react';

export const MapBlock = (props) => {
  const { fieldNames, dataSource = [], fixedBlock, zoom } = useProps(props);
  const { getField, getPrimaryKey } = useCollection();
  const field = getField(fieldNames?.field);
  const [isMapInitialization, setIsMapInitialization] = useState(false);
  const mapRef = useRef<AMapForwardedRefProps>();
  const [record, setRecord] = useState();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!field) return;
    const overlays = dataSource
      .map((item) => {
        const data = item[fieldNames?.field];
        if (!data) return;
        const overlay = mapRef.current.setOverlay(field.type, data, {
          extData: {
            id: item[getPrimaryKey()],
          },
        });
        return overlay;
      })
      .filter(Boolean);
    mapRef.current.map?.setFitView(overlays);

    const events = overlays.map((o: AMap.Marker) => {
      const onClick = (e) => {
        const extData = e.target.getOptions()?.extData;
        if (!extData) return;
        const data = dataSource?.find((item) => {
          return extData.id === item[getPrimaryKey()];
        });
        if (data) {
          setVisible(true);
          setRecord(data);
        }
      };
      o.on('click', onClick);
      return () => o.off('click', onClick);
    });

    return () => {
      overlays.map((ov) => {
        ov.remove();
      });
      events.map((e) => e());
    };
  }, [dataSource, isMapInitialization, fieldNames?.field, field, getPrimaryKey]);

  const mapRefCallback = (instance: AMapForwardedRefProps) => {
    mapRef.current = instance;
    setIsMapInitialization(!!instance?.aMap);
  };

  return (
    <>
      <RecordProvider record={record}>
        <MapBlockDrawer visible={visible} setVisible={setVisible} record={null} />
      </RecordProvider>
      <AMap
        {...field?.uiSchema?.['x-component-props']}
        ref={mapRefCallback}
        style={{ height: fixedBlock ? '100%' : null }}
        type={field?.type}
        zoom={zoom}
        disabled
      ></AMap>
    </>
  );
};

const MapBlockDrawer = (props) => {
  const { visible, setVisible } = props;
  const fieldSchema = useFieldSchema();
  const schema: Schema = useMemo(
    () =>
      fieldSchema.reduceProperties((buf, current) => {
        if (current.name === 'drawer') {
          return current;
        }
        return buf;
      }, null),
    [fieldSchema],
  );

  return (
    schema && (
      <ActionContext.Provider value={{ visible, setVisible }}>
        <RecursionField schema={schema} name={schema.name} />
      </ActionContext.Provider>
    )
  );
};
