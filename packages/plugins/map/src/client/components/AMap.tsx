import React from 'react';
import { useEffect, useRef, useCallback, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import '@amap/amap-jsapi-types';
import { useFieldSchema } from '@formily/react';
import { useCollection } from '@nocobase/client';
import { css } from '@emotion/css';
import { Alert, Button, Modal, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

interface AMapComponentProps {
  accessKey: string;
  value: any;
  onChange: (value: number[]) => void;
  disabled?: boolean;
}

const AMapComponent: React.FC<AMapComponentProps> = (props) => {
  const { value, onChange, accessKey, disabled } = props;
  const id = useRef(`nocobase-map-${Date.now().toString(32)}`);
  const { t } = useTranslation();
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

  const setTarget = useCallback(() => {
    if (type !== 'point' && editor.current) {
      editor.current.setTarget(overlay.current);
      editor.current.open();
    }
  }, [type]);

  useEffect(() => {
    if (!aMap.current) return;
    if (!value || overlay.current) {
      return;
    }
    let nextOverlay = null;
    switch (type) {
      case 'point':
        nextOverlay = new aMap.current.Marker({
          position: value,
          offset: new AMap.Pixel(-13, -30),
        } as AMap.MarkerOptions);
        break;
      case 'polygon':
        nextOverlay = new aMap.current.Polygon({
          path: value,
        } as AMap.PolygonOptions);
        break;
    }

    if (nextOverlay) {
      nextOverlay.setMap(map.current);
      overlay.current = nextOverlay;
      setTarget();
    }
  }, [value, needUpdateFlag, type, setTarget]);

  const onMapChange = (prevValue) => {
    let nextValue = null;

    if (type === 'point') {
      const { lat, lng } = (prevValue as AMap.Marker).getPosition();
      nextValue = [lng, lat];
    } else if (type === 'polygon') {
      nextValue = (prevValue as AMap.Polygon).getPath().map((item) => [item.lng, item.lat]);
    }

    toRemoveOverlay();
    overlay.current = prevValue;
    setTarget();
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
      okText: t('Reset'),
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

  // AMap.MouseTool
  useEffect(() => {
    if (!aMap.current || !type) return;

    if (disabled || mouseTool.current) {
      return;
    }

    mouseTool.current = new aMap.current.MouseTool(map.current);
    mouseTool.current.on('draw', function ({ obj }) {
      onMapChange(obj);
    });

    switch (type) {
      case 'point':
        mouseTool.current.marker({
          fillColor: '#00b0ff',
          strokeColor: '#80d8ff',
        });
        break;
      case 'polygon':
        mouseTool.current.polygon({
          fillColor: '#00b0ff',
          strokeColor: '#80d8ff',
        });
        editor.current = new aMap.current.PolygonEditor(map.current);
        break;
      default:
        return;
    }
  }, [disabled, needUpdateFlag, type]);

  useEffect(() => {
    if (!accessKey) return;

    AMapLoader.load({
      key: accessKey,
      version: '2.0',
      plugins: ['AMap.MouseTool', 'AMap.PolygonEditor'],
    }).then((amap) => {
      map.current = new amap.Map(id.current, {} as AMap.MapOptions);
      aMap.current = amap;
      forceUpdate([]);
    });
  }, [accessKey, type]);

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
