import { useCollection, useProps, ActionContext, RecordProvider, useRecord } from '@nocobase/client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import AMap, { AMapForwardedRefProps } from '../components/AMap';
import { RecursionField, useFieldSchema, Schema } from '@formily/react';
import { useMemoizedFn } from 'ahooks';
import { ExpandOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Button } from 'antd';
import { useMapTranslation } from '../locale';

export const MapBlock = (props) => {
  const { fieldNames, dataSource = [], fixedBlock, zoom, selectedRecordKeys, setSelectedRecordKeys } = useProps(props);
  const { getField, getPrimaryKey } = useCollection();
  const field = getField(fieldNames?.field);
  const [isMapInitialization, setIsMapInitialization] = useState(false);
  const mapRef = useRef<AMapForwardedRefProps>();
  const geometryUtils: AMap.IGeometryUtil = mapRef.current?.aMap?.GeometryUtil;
  const [record, setRecord] = useState();
  const [visible, setVisible] = useState(false);
  const [isSelecting, setSelecting] = useState(false);
  const { t } = useMapTranslation();

  const isSelectingRef = useRef(false);
  isSelectingRef.current = isSelecting;

  const setOverlayOptions = (overlay: AMap.Polygon | AMap.Marker, state?: boolean) => {
    const extData = overlay.getExtData();
    const selected = typeof state === 'undefined' ? extData.selected : !state;
    extData.selected = !selected;

    if ('setLabel' in overlay) {
      overlay.setLabel({
        direction: 'bottom',
        content: selected ? '' : 'selected',
        offset: [],
      });
    }
    (overlay as AMap.Polygon).setOptions({
      extData,
      ...(selected
        ? { strokeColor: '#4e9bff', fillColor: '#4e9bff' }
        : { strokeColor: '#F18b62', fillColor: '#F18b62' }),
    });
  };

  // When isSelecting is true, the map will be in selecting mode.

  useEffect(() => {
    mapRef.current.map?.getAllOverlays().forEach((o) => {
      if (selectedRecordKeys.includes(o.getExtData().id)) {
        setOverlayOptions(o, true);
      }
    });
    () => {
      mapRef.current.map?.getAllOverlays().forEach((o) => {
        setOverlayOptions(o, false);
      });
    };
  }, [selectedRecordKeys]);

  const removeSelection = () => {
    mapRef.current.mouseTool().close(true);
    mapRef.current.editor().setTarget(null);
    mapRef.current.editor().close();
  };

  useEffect(() => {
    if (!isSelecting) {
      return;
    }
    if (!mapRef.current.editor()) {
      mapRef.current.createEditor('polygon');
      mapRef.current.createMouseTool('polygon');
    } else {
      mapRef.current.executeMouseTool('polygon');
    }
    return () => {
      mapRef.current.map.getAllOverlays().forEach((o) => {
        setOverlayOptions(o, false);
      });
      removeSelection();
    };
  }, [isSelecting]);

  const onSelectingComplete = useMemoizedFn(() => {
    const selectingOverlay = mapRef.current.editor().getTarget();
    const overlays = mapRef.current.map.getAllOverlays();
    const selectedOverlays = overlays.filter((o) => {
      if (o === selectingOverlay || o.getExtData().id === undefined) return;
      if ('getPosition' in o) {
        return geometryUtils.isPointInRing(o.getPosition(), selectingOverlay.getPath() as any);
      }
      return geometryUtils.doesRingRingIntersect(o.getPath(), selectingOverlay.getPath() as any);
    });
    const ids = selectedOverlays.map((o) => {
      setOverlayOptions(o, true);
      return o.getExtData().id;
    });
    setSelectedRecordKeys((lastIds) => ids.concat(lastIds));
    selectingOverlay.remove();
    mapRef.current.editor().close();
  });

  useEffect(() => {
    if (!field || !mapRef.current) return;
    const overlays = dataSource
      .map((item) => {
        const data = item[fieldNames?.field];
        if (!data) return;
        const overlay = mapRef.current.setOverlay(field.type, data, {
          strokeColor: '#4e9bff',
          fillColor: '#4e9bff',
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
        const overlay: AMap.Polygon | AMap.Marker = e.target;
        const extData = overlay.getExtData();
        if (!extData) return;
        if (isSelectingRef.current) {
          // setSelectedRecordKeys((keys) =>
          //   extData.selected ? keys.filter((key) => key !== extData.id) : [...keys, extData.id],
          // );
          // return;
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
        height: 100%;
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
          onClick={(e) => {
            e.stopPropagation();
            setSelecting((v) => !v);
          }}
          icon={<ExpandOutlined />}
        ></Button>
      </div>
      <div
        className={css`
          position: absolute;
          bottom: 10px;
          right: 10px;
          z-index: 999;
        `}
      >
        <Button type="primary" onClick={onSelectingComplete}>
          {t('Confirm Selection')}
        </Button>
      </div>
      <RecordProvider record={record}>
        <MapBlockDrawer visible={visible} setVisible={setVisible} record={null} />
      </RecordProvider>
      <AMap
        {...field?.uiSchema?.['x-component-props']}
        ref={mapRefCallback}
        style={{ height: fixedBlock ? '100%' : null }}
        type={'polygon'}
        zoom={zoom}
        disabled
        block
        overlayCommonOptions={{
          strokeColor: '#F18b62',
          fillColor: '#F18b62',
        }}
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
