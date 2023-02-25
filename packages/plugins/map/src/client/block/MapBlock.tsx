import { useCollection, useProps, ActionContext, RecordProvider, useRecord } from '@nocobase/client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import AMap, { AMapForwardedRefProps } from '../components/AMap';
import { RecursionField, useFieldSchema, Schema } from '@formily/react';
import { ExpandOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Button } from 'antd';

export const MapBlock = (props) => {
  const { fieldNames, dataSource = [], fixedBlock, zoom, setSelectedRecordKeys } = useProps(props);
  const { getField, getPrimaryKey } = useCollection();
  const field = getField(fieldNames?.field);
  const [isMapInitialization, setIsMapInitialization] = useState(false);
  const mapRef = useRef<AMapForwardedRefProps>();
  const [record, setRecord] = useState();
  const [visible, setVisible] = useState(false);
  const [isSelecting, toggleSelecting] = useState(false);
  const isSelectingRef = useRef(false);
  isSelectingRef.current = isSelecting;

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
        if (isSelectingRef.current) {
          setSelectedRecordKeys((keys) =>
            extData.selected ? keys.filter((key) => key !== extData.id) : [...keys, extData.id],
          );
          if ('setContent' in e.target) {
            if (extData.selected) {
              e.target.setLabel({
                direction: 'bottom',
                content: '',
              });
            } else {
              e.target.setLabel({
                direction: 'bottom',
                content: 'selected',
              });
            }
          }
          e.target.setOptions({
            extData: {
              ...extData,
              selected: !extData.selected,
            },
            ...(extData.selected
              ? { strokeColor: '#4e9bff', fillColor: '#4e9bff' }
              : { strokeColor: '#F18b62', fillColor: '#F18b62' }),
          });
          return;
        }
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
      overlays.forEach((ov) => {
        ov.remove();
      });
      events.forEach((e) => e());
    };
  }, [dataSource, isMapInitialization, fieldNames?.field, field.type]);

  useEffect(() => {
    setTimeout(() => {
      setSelectedRecordKeys([]);
    });
  }, [dataSource]);

  const mapRefCallback = (instance: AMapForwardedRefProps) => {
    mapRef.current = instance;
    setIsMapInitialization(!!instance?.aMap);
  };

  return (
    <div
      className={css`
        position: relative;
      `}
    >
      <div
        className={css`
          position: absolute;
          left: 10px;
          top: 10px;
          z-index: 999;
        `}
      >
        <Button
          style={{
            color: isSelecting ? '#F18b62' : undefined,
            borderColor: 'currentcolor',
          }}
          onClick={() => toggleSelecting((v) => !v)}
          icon={<ExpandOutlined />}
        ></Button>
      </div>
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
    </div>
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
