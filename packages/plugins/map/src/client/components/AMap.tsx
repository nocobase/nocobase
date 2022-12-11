import React from 'react';
import { useEffect, useRef, useCallback, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import '@amap/amap-jsapi-types';
import { useFieldSchema } from '@formily/react';
import { useCollection } from '@nocobase/client';
import { css } from '@emotion/css';
import { Alert, Button, Modal, Select } from 'antd';
import { useMapTranslation } from '../locales';
import Search from './Search';

interface AMapComponentProps {
  accessKey: string;
  securityJsCode: string;
  value: any;
  onChange: (value: number[]) => void;
  disabled?: boolean;
}

const methodMapping = {
  point: {
    mouseTool: 'marker',
    propertyKey: 'position',
    overlay: 'Marker',
  },
  polygon: {
    mouseTool: 'polygon',
    editor: 'PolygonEditor',
    propertyKey: 'path',
    overlay: 'Polygon',
  },
  lineString: {
    mouseTool: 'polyline',
    editor: 'PolylineEditor',
    propertyKey: 'path',
    overlay: 'Polyline',
  },
};

const AMapComponent: React.FC<AMapComponentProps> = (props) => {
  const { value, onChange, accessKey, securityJsCode, disabled } = props;
  const id = useRef(`nocobase-map-${Date.now().toString(32)}`);
  const { t } = useMapTranslation();
  const fieldSchema = useFieldSchema();
  const aMap = useRef<any>();
  const map = useRef<AMap.Map>();
  const mouseTool = useRef<any>();
  const [needUpdateFlag, forceUpdate] = useState([]);
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema.name);
  const type = collectionField?.interface;
  const overlay = useRef<any>();
  const editor = useRef(null);

  const toRemoveOverlay = () => {
    if (overlay.current) {
      map.current?.remove(overlay.current);
    }
  };

  const createEditor = () => {
    const mapping = methodMapping[type as keyof typeof methodMapping];
    if (mapping && 'editor' in mapping && !editor.current) {
      editor.current = new aMap.current[mapping.editor](map.current);
      editor.current.on('adjust', function ({ target }) {
        onMapChange(target, true);
      });
      editor.current.on('move', function ({ target }) {
        onMapChange(target, true);
      });
    }
  };

  const createMouseTool = () => {
    if (mouseTool.current) return;

    mouseTool.current = new aMap.current.MouseTool(map.current);
    mouseTool.current.on('draw', function ({ obj }) {
      onMapChange(obj);
    });

    const mapping = methodMapping[type as keyof typeof methodMapping];
    if (!mapping) {
      return;
    }
    mouseTool.current[mapping.mouseTool]({
      strokeWeight: 5,
    } as AMap.PolylineOptions);
  };

  const setTarget = useCallback(() => {
    if (type !== 'point' && editor.current) {
      editor.current.setTarget(overlay.current);
      editor.current.open();
    }
  }, [type]);

  const toCenter = (position, imm?: boolean) => {
    if (map.current) {
      map.current.setZoomAndCenter(13, position, imm);
    }
  };

  // 编辑时
  useEffect(() => {
    if (!aMap.current) return;
    if (!value || overlay.current) {
      return;
    }
    const mapping = methodMapping[type as keyof typeof methodMapping];
    if (!mapping) {
      return;
    }
    const nextOverlay = new aMap.current[mapping.overlay]({
      [mapping.propertyKey]: value,
    });

    // 聚焦在编辑的位置
    map.current.setFitView([nextOverlay]);

    nextOverlay.setMap(map.current);
    overlay.current = nextOverlay;

    createEditor();
    setTarget();
  }, [value, needUpdateFlag, type, setTarget]);

  const onMapChange = (prevValue, onlyChange = false) => {
    let nextValue = null;

    if (type === 'point') {
      const { lat, lng } = (prevValue as AMap.Marker).getPosition();
      nextValue = [lng, lat];
    } else if (type === 'polygon' || type === 'lineString') {
      nextValue = (prevValue as AMap.Polygon).getPath().map((item) => [item.lng, item.lat]);
      if (nextValue.length < 2) {
        return;
      }
    }

    if (!onlyChange) {
      toRemoveOverlay();
      overlay.current = prevValue;
      setTarget();
    }
    onChange(nextValue);
  };

  const onReset = () => {
    const ok = () => {
      toRemoveOverlay();
      if (editor.current) {
        editor.current.close();
      }
      onChange(null);
    };
    Modal.confirm({
      title: t('Clear the canvas'),
      content: t('Are you sure to clear the canvas?'),
      okText: t('Confirm'),
      cancelText: t('Cancel'),
      onOk() {
        ok();
      },
    });
  };

  useEffect(() => {
    if (disabled) {
      mouseTool.current?.close();
      editor.current?.close();
    } else {
      mouseTool.current?.open?.();
      editor.current?.open?.();
    }
  }, [disabled]);

  // AMap.MouseTool & AMap.XXXEditor
  useEffect(() => {
    if (!aMap.current || !type || disabled) return;
    createMouseTool();
    createEditor();
  }, [disabled, needUpdateFlag, type]);

  useEffect(() => {
    if (!accessKey) return;
    (window as any)._AMapSecurityConfig = {
      securityJsCode: securityJsCode,
    };
    AMapLoader.load({
      key: accessKey,
      version: '2.0',

      plugins: ['AMap.MouseTool', 'AMap.PolygonEditor', 'AMap.PolylineEditor'],
    }).then((amap) => {
      map.current = new amap.Map(id.current, {
        resizeEnable: true,
        zoom: 13,
      } as AMap.MapOptions);
      aMap.current = amap;
      forceUpdate([]);
    });
  }, [accessKey, type, securityJsCode]);

  return (
    <div
      className={css`
        position: relative;
      `}
      id={id.current}
      style={{
        height: '500px',
      }}
    >
      <Search toCenter={toCenter} aMap={aMap.current}></Search>
      <div
        style={{
          display: disabled ? 'none' : 'block',
        }}
        className={css`
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 2;
          pointer-events: none;
        `}
      >
        <Alert message={t('Click to select the starting point and double-click to end the drawing')} type="info" />
      </div>
      <div
        style={{
          display: disabled ? 'none' : 'block',
        }}
        className={css`
          position: absolute;
          bottom: 20px;
          right: 20px;
          z-index: 2;
        `}
      >
        <Button disabled={!overlay.current} onClick={onReset} type="primary">
          {t('Clear')}
        </Button>
      </div>
    </div>
  );
};

export default AMapComponent;
