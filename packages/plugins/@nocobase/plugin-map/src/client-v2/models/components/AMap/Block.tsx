/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CheckOutlined, EnvironmentOutlined, ExpandOutlined } from '@ant-design/icons';
import { useMemoizedFn } from 'ahooks';
import { Button, Space } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { defaultImage, selectedImage } from '../../../../shared/constants';
import { mapActiveColor, mapSelectedColor } from '../../../../shared/theme';
import { compileTemplate, getLabelFormatValue, getSource } from '../../../../shared/utils';
import { useT } from '../../../locale';
import { AMapCom, AMapForwardedRefProps } from './Map';

export const AMapBlock = (props) => {
  const {
    collectionField,
    marker,
    dataSource,
    fixedBlock,
    zoom,
    setSelectedRecordKeys,
    lineSort,
    fields,
    name,
    primaryKey,
    mapField,
    associationCollectionField,
    onOpenView,
  } = props;
  const [isMapInitialization, setIsMapInitialization] = useState(false);
  const mapRef = useRef<AMapForwardedRefProps>();
  const geometryUtils: AMap.IGeometryUtil = mapRef.current?.aMap?.GeometryUtil;
  const [selectingMode, setSelecting] = useState('');
  const t = useT();
  const compile = (value: any) => compileTemplate(value, t);
  const isConnected = false;
  const doFilter = (..._args: any[]) => {};
  const selectingModeRef = useRef(selectingMode);
  selectingModeRef.current = selectingMode;

  const labelUiSchema = fields.find((v) => v.name === marker)?.uiSchema;
  const geometryType = collectionField.interface || collectionField.type;
  const setOverlayOptions = (overlay: AMap.Polygon | AMap.Marker, state?: boolean) => {
    const extData = overlay.getExtData();
    const selected = typeof state === 'undefined' ? extData.selected : !state;
    extData.selected = !selected;
    if ('setIcon' in overlay) {
      overlay.setIcon(
        new mapRef.current!.aMap.Icon({
          imageSize: [19, 32],
          image: selected ? defaultImage : selectedImage,
        } as AMap.IconOpts),
      );
    }
    (overlay as AMap.Polygon).setOptions({
      extData,
      ...(selected
        ? { strokeColor: mapActiveColor, fillColor: mapActiveColor }
        : { strokeColor: mapSelectedColor, fillColor: mapSelectedColor }),
    });
  };

  const removeSelection = () => {
    if (!mapRef.current) return;
    mapRef.current?.mouseTool().close(true);
    mapRef.current?.editor().setTarget(null);
    mapRef.current?.editor().close();
  };

  // selection
  useEffect(() => {
    if (selectingMode !== 'selection') {
      return;
    }
    if (!mapRef.current?.editor()) {
      mapRef.current?.createEditor('polygon');
      mapRef.current?.createMouseTool('polygon');
    } else {
      mapRef.current?.executeMouseTool('polygon');
    }
    return () => {
      removeSelection();
    };
  }, [selectingMode]);

  useEffect(() => {
    if (selectingMode) {
      return () => {
        if (!selectingModeRef.current) {
          mapRef.current?.map.getAllOverlays().forEach((o) => {
            setOverlayOptions(o, false);
          });
        }
      };
    }
  }, [selectingMode]);

  const onSelectingComplete = useMemoizedFn(() => {
    const selectingOverlay = mapRef.current?.editor().getTarget();
    const overlays = mapRef.current?.map.getAllOverlays();
    const selectedOverlays = overlays?.filter((o) => {
      if (o === selectingOverlay || o.getExtData().id === undefined) return;
      if ('getPosition' in o) {
        return geometryUtils.isPointInRing(o.getPosition(), selectingOverlay?.getPath() as any);
      }
      return geometryUtils.doesRingRingIntersect(o.getPath(), selectingOverlay?.getPath() as any);
    });
    const ids = selectedOverlays?.map((o) => {
      setOverlayOptions(o, true);
      return o.getExtData().id;
    });
    setSelectedRecordKeys(ids);
    selectingOverlay?.remove();
    mapRef.current?.editor().close();
  });

  useEffect(() => {
    if (!collectionField || !mapRef.current || !dataSource) return;
    const overlays = dataSource
      .map((item) => {
        const data = getSource(item, mapField, associationCollectionField?.interface)?.filter(Boolean);
        const title = getLabelFormatValue(labelUiSchema, item[marker]);
        if (!data?.length) return [];
        return data.map((mapItem) => {
          const overlay = mapRef.current?.setOverlay(geometryType, mapItem, {
            strokeColor: mapActiveColor,
            fillColor: mapActiveColor,
            cursor: 'pointer',
            label: {
              direction: 'bottom',
              offset: [0, 5],
              content: marker ? compile(title) : undefined,
            },
            extData: {
              id: item[primaryKey],
            },
          });
          return overlay;
        });
      })
      .flat()
      .filter(Boolean);

    if (overlays.length === 1 && geometryType === 'point') {
      mapRef.current?.map?.setFitView(overlays);
      mapRef.current?.map?.setZoom(zoom || 13);
    } else {
      mapRef.current?.map?.setFitView(overlays);
    }

    const events = overlays.map((o: AMap.Marker) => {
      const onClick = (e) => {
        const overlay: AMap.Polygon | AMap.Marker = e.target;
        const extData = overlay.getExtData();
        if (!extData) return;
        if (selectingModeRef.current) {
          if (selectingModeRef.current === 'click') {
            setSelectedRecordKeys((keys) =>
              extData.selected ? keys.filter((key) => key !== extData.id) : [...keys, extData.id],
            );
            setOverlayOptions(overlay);
          }
          return;
        }
        const data = dataSource.find((item) => {
          return extData.id === item[primaryKey];
        });

        // // 筛选区块模式
        // if (isConnected) {
        //   setPrevSelected((prev) => {
        //     prev && clearSelected(prev);
        //     if (prev === o) {
        //       clearSelected(o);

        //       // 删除过滤参数
        //       doFilter(null);
        //       return null;
        //     } else {
        //       selectMarker(o);
        //       doFilter(data[primaryKey], (target) => target.field || primaryKey, '$eq');
        //     }
        //     return o;
        //   });

        //   return;
        // }

        if (data) {
          onOpenView(data);
          // openPopup({
          //   recordData: data,
          // });
        }
      };
      o.on('click', onClick);
      return () => o.off('click', onClick);
    });

    if (geometryType === 'point' && lineSort?.length && overlays?.length > 1) {
      const positions = overlays.map((o: AMap.Marker) => o.getPosition());

      (overlays[0] as AMap.Marker).setzIndex(13);
      (overlays[overlays.length - 1] as AMap.Marker).setzIndex(13);

      const createText = (start = true) => {
        if (!mapRef.current?.map) return;
        return new AMap.Text({
          label: {
            direction: 'top',
            offset: [0, 0],
            content: start ? t('Start point') : t('End point'),
          },
          position: positions[start ? 0 : positions.length - 1],
          map: mapRef.current?.map,
        });
      };

      overlays.push(
        ...[
          mapRef.current?.setOverlay('lineString', positions, {
            strokeColor: mapActiveColor,
            fillColor: mapActiveColor,
            strokeWeight: 2,
            cursor: 'pointer',
          }),
          createText(),
          createText(false),
        ].filter(Boolean),
      );
    }

    return () => {
      overlays.forEach((ov) => {
        ov.remove();
      });
      events.forEach((e) => e());
    };
  }, [dataSource, isMapInitialization, mapField, marker, name, primaryKey, geometryType, isConnected, lineSort]);

  useEffect(() => {
    setTimeout(() => {
      setSelectedRecordKeys([]);
    });
  }, [dataSource]);

  const mapRefCallback = (instance: AMapForwardedRefProps) => {
    mapRef.current = instance;
    setIsMapInitialization(!!instance?.map && !instance.errMessage);
  };

  const mapStyle = fixedBlock ? { height: '100%' } : undefined;

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div
        style={{
          position: 'absolute',
          left: 10,
          top: 10,
          zIndex: 999,
        }}
      >
        {isMapInitialization && !mapRef.current?.errMessage ? (
          <Space direction="vertical">
            <Button
              style={{
                color: !selectingMode ? mapSelectedColor : undefined,
                borderColor: 'currentcolor',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelecting('');
              }}
              icon={<EnvironmentOutlined />}
            ></Button>
            <Button
              style={{
                color: selectingMode === 'selection' ? mapSelectedColor : undefined,
                borderColor: 'currentcolor',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelecting('selection');
              }}
              icon={<ExpandOutlined />}
            ></Button>
            {selectingMode === 'selection' ? (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                title={t('Confirm selection')}
                onClick={onSelectingComplete}
              ></Button>
            ) : null}
          </Space>
        ) : null}
      </div>
      {/* <RecordProvider record={record} parent={parentRecordData}>
        <MapBlockDrawer />
      </RecordProvider> */}
      <AMapCom
        {...props}
        ref={mapRefCallback}
        style={mapStyle}
        zoom={zoom}
        type={geometryType}
        disabled
        block
        overlayCommonOptions={{
          strokeColor: mapSelectedColor,
          fillColor: mapSelectedColor,
        }}
      ></AMapCom>
    </div>
  );
};

function clearSelected(marker: AMap.Marker | AMap.Polygon | AMap.Polyline | AMap.Circle) {
  if ((marker as AMap.Marker).dom) {
    (marker as AMap.Marker).dom.style.filter = 'none';

    // AMap.Polygon | AMap.Polyline | AMap.Circle 都有 setOptions 方法
  } else if ((marker as AMap.Polygon).setOptions) {
    (marker as AMap.Polygon).setOptions({
      strokeColor: mapActiveColor,
      fillColor: mapActiveColor,
    });
  }
}

function selectMarker(marker: AMap.Marker | AMap.Polygon | AMap.Polyline | AMap.Circle) {
  if ((marker as AMap.Marker).dom) {
    (marker as AMap.Marker).dom.style.filter = 'brightness(1.2) contrast(1.2) hue-rotate(180deg)';

    // AMap.Polygon | AMap.Polyline | AMap.Circle 都有 setOptions 方法
  } else if ((marker as AMap.Polygon).setOptions) {
    (marker as AMap.Polygon).setOptions({
      strokeColor: mapSelectedColor,
      fillColor: mapSelectedColor,
    });
  }
}
