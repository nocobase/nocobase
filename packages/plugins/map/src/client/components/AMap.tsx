import React from 'react';
import { useEffect, useRef, useCallback, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import '@amap/amap-jsapi-types';
import { useFieldSchema } from '@formily/react';
import { useCollection } from '@nocobase/client';
import { css } from '@emotion/css';
import { Alert, Button, Modal } from 'antd';
import { useMapTranslation } from '../locales';
import Search from './Search';
import { useMemoizedFn } from 'ahooks';

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
  circle: {
    mouseTool: 'circle',
    editor: 'CircleEditor',
    transformOptions(value) {
      return {
        center: value.slice(0, 2),
        radius: value[2],
      };
    },
    overlay: 'Circle',
  },
};

const AMapComponent: React.FC<AMapComponentProps> = (props) => {
  const { value, onChange, accessKey, securityJsCode, disabled } = props;
  const { t } = useMapTranslation();
  const fieldSchema = useFieldSchema();
  const aMap = useRef<any>();
  const map = useRef<AMap.Map>();
  const mouseTool = useRef<any>();
  const [needUpdateFlag, forceUpdate] = useState([]);
  const [errMessage, setErrMessage] = useState('');
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema.name);
  const type = collectionField?.interface;
  const overlay = useRef<any>();
  const editor = useRef(null);
  const id = useRef(`nocobase-map-${type}-${Date.now().toString(32)}`);

  const [commonOptions] = useState<AMap.PolylineOptions & AMap.PolygonOptions>({
    strokeWeight: 5,
    strokeColor: '#4e9bff',
    fillColor: '#4e9bff',
    strokeOpacity: 1,
  });

  const toRemoveOverlay = useMemoizedFn(() => {
    if (overlay.current) {
      map.current?.remove(overlay.current);
    }
  });

  const setTarget = useMemoizedFn(() => {
    if (!disabled && type !== 'point' && editor.current) {
      editor.current.setTarget(overlay.current);
      editor.current.open();
    }
  });

  const onMapChange = useMemoizedFn((target, onlyChange = false) => {
    let nextValue = null;

    if (type === 'point') {
      const { lat, lng } = (target as AMap.Marker).getPosition();
      nextValue = [lng, lat];
    } else if (type === 'polygon' || type === 'lineString') {
      nextValue = (target as AMap.Polygon).getPath().map((item) => [item.lng, item.lat]);
      if (nextValue.length < 2) {
        return;
      }
    } else if (type === 'circle') {
      const center = target.getCenter();
      const radius = target.getRadius();
      nextValue = [center.lng, center.lat, radius];
    }

    if (!onlyChange) {
      toRemoveOverlay();
      overlay.current = target;
      setTarget();
    }
    onChange(nextValue);
  });

  const createEditor = useMemoizedFn(() => {
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
  });

  const executeMouseTool = useMemoizedFn(() => {
    if (!mouseTool.current || editor.current?.getTarget()) return;
    const mapping = methodMapping[type as keyof typeof methodMapping];
    if (!mapping) {
      return;
    }
    mouseTool.current[mapping.mouseTool]({
      ...commonOptions,
    } as AMap.PolylineOptions);
  });

  const createMouseTool = useMemoizedFn(() => {
    if (mouseTool.current) return;

    mouseTool.current = new aMap.current.MouseTool(map.current);
    mouseTool.current.on('draw', function ({ obj }) {
      onMapChange(obj);
    });

    executeMouseTool();
  });

  const toCenter = (position, imm?: boolean) => {
    if (map.current) {
      map.current.setZoomAndCenter(13, position, imm);
    }
  };

  const onReset = () => {
    const ok = () => {
      toRemoveOverlay();
      if (editor.current) {
        editor.current.setTarget();
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
    const options = { ...commonOptions };
    if ('transformOptions' in mapping) {
      Object.assign(options, mapping.transformOptions(value));
    } else if ('propertyKey' in mapping) {
      options[mapping.propertyKey] = value;
    }
    const nextOverlay = new aMap.current[mapping.overlay](options);

    // 聚焦在编辑的位置
    map.current.setFitView([nextOverlay]);

    nextOverlay.setMap(map.current);
    overlay.current = nextOverlay;

    createEditor();
    setTarget();
  }, [value, needUpdateFlag, type, commonOptions]);

  // 当在编辑时，关闭 mouseTool
  useEffect(() => {
    if (!mouseTool.current || !editor.current) return;

    if (disabled) {
      mouseTool.current?.close();
      editor.current?.close();
    } else {
      executeMouseTool();
      editor.current?.open();
    }
  }, [disabled]);

  // AMap.MouseTool & AMap.XXXEditor
  useEffect(() => {
    if (!aMap.current || !type || disabled) return;
    createMouseTool();
    createEditor();
  }, [disabled, needUpdateFlag, type]);

  useEffect(() => {
    if (!mouseTool.current || !editor.current) return;
    const target = editor.current.getTarget();
    if (target) {
      mouseTool.current.close?.();
    } else {
      executeMouseTool();
    }
  }, [type, value]);

  useEffect(() => {
    if (!accessKey || map.current) return;

    if (securityJsCode) {
      (window as any)._AMapSecurityConfig = {
        [securityJsCode.endsWith('_AMapService') ? 'serviceHOST' : 'securityJsCode']: securityJsCode,
      };
    }

    AMapLoader.load({
      key: accessKey,
      version: '2.0',
      plugins: ['AMap.MouseTool', 'AMap.PolygonEditor', 'AMap.PolylineEditor', 'AMap.CircleEditor'],
    })
      .then((amap) => {
        setTimeout(() => {
          map.current = new amap.Map(id.current, {
            resizeEnable: true,
            zoom: 13,
          } as AMap.MapOptions);
          aMap.current = amap;
          forceUpdate([]);
        }, Math.random() * 300);
      })
      .catch((err) => {
        if (err.includes('多个不一致的 key')) {
          setErrMessage(t('The AccessKey is incorrect, please check it'));
        } else {
          setErrMessage(err);
        }
      });

    return () => {
      map.current?.destroy();
      aMap.current = null;
      map.current = null;
      mouseTool.current = null;
      editor.current = null;
    };
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
      {errMessage ? (
        <Alert message={errMessage} type="error" />
      ) : (
        <>
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
            <Button disabled={!value} onClick={onReset} type="primary">
              {t('Clear')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default AMapComponent;
