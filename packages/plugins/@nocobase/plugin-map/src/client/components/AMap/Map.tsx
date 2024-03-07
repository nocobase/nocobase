import AMapLoader from '@amap/amap-jsapi-loader';
import '@amap/amap-jsapi-types';
import { SyncOutlined } from '@ant-design/icons';
import { useFieldSchema } from '@formily/react';
import { css, useApp, useCollection_deprecated } from '@nocobase/client';
import { useMemoizedFn } from 'ahooks';
import { Alert, App, Button, Spin } from 'antd';
import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMapConfiguration } from '../../hooks';
import { useMapTranslation } from '../../locale';
import { MapEditorType } from '../../types';
import { Search } from './Search';

export interface AMapComponentProps {
  value?: any;
  onChange?: (value: number[]) => void;
  disabled?: boolean;
  mapType: string;
  /**
   * only ReadPretty
   */
  readonly: string;
  zoom: number;
  type: MapEditorType;
  style?: React.CSSProperties;
  overlayCommonOptions?: AMap.PolylineOptions & AMap.PolygonOptions;
  block?: boolean;
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

export interface AMapForwardedRefProps {
  setOverlay: (t: MapEditorType, v: any, o?: AMap.PolylineOptions & AMap.PolygonOptions & AMap.MarkerOptions) => any;
  getOverlay: (t: MapEditorType, v: any, o?: AMap.PolylineOptions & AMap.PolygonOptions & AMap.MarkerOptions) => any;
  createMouseTool: (type: MapEditorType) => void;
  createEditor: (type: MapEditorType) => void;
  executeMouseTool: (type: MapEditorType) => void;

  aMap: any;
  map: AMap.Map;
  editor: () => {
    getTarget: () => AMap.Polygon;
    setTarget: (o: any) => void;
    close: () => void;
    on: (event: string, callback: (e: any) => void) => void;
  };
  mouseTool: () => {
    close: (clear?: boolean) => void;
  };
  overlay: AMap.Polygon;
  errMessage?: string;
}

export const AMapComponent = React.forwardRef<AMapForwardedRefProps, AMapComponentProps>((props, ref) => {
  const { accessKey, securityJsCode } = useMapConfiguration(props.mapType) || {};
  const { value, onChange, block = false, readonly, disabled = block, zoom = 13, overlayCommonOptions } = props;
  const { t } = useMapTranslation();
  const fieldSchema = useFieldSchema();
  const aMap = useRef<any>();
  const map = useRef<AMap.Map>();
  const mouseTool = useRef<any>();
  const [needUpdateFlag, forceUpdate] = useState([]);
  const [errMessage, setErrMessage] = useState('');
  const { getField } = useCollection_deprecated();
  const type = useMemo<MapEditorType>(() => {
    if (props.type) return props.type;
    const collectionField = getField(fieldSchema?.name);
    return collectionField?.interface;
  }, [props?.type, fieldSchema?.name]);

  const overlay = useRef<AMap.Polygon>();
  const editor = useRef(null);
  const navigate = useNavigate();
  const id = useRef(`nocobase-map-${type || ''}-${Date.now().toString(32)}`);
  const { modal } = App.useApp();

  const [commonOptions] = useState<AMap.PolylineOptions & AMap.PolygonOptions>({
    strokeWeight: 5,
    strokeColor: '#4e9bff',
    fillColor: '#4e9bff',
    strokeOpacity: 1,
    ...overlayCommonOptions,
  });

  const toRemoveOverlay = useMemoizedFn(() => {
    if (overlay.current) {
      overlay.current.remove();
    }
  });

  const setTarget = useMemoizedFn(() => {
    if ((!disabled || block) && type !== 'point' && editor.current) {
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
    onChange?.(nextValue);
  });

  const createEditor = useMemoizedFn((curType = type) => {
    const mapping = methodMapping[curType];
    if (mapping && 'editor' in mapping && !editor.current) {
      editor.current = new aMap.current[mapping.editor](map.current, null, {
        createOptions: commonOptions,
        editOptions: commonOptions,
        controlPoint: {
          ...commonOptions,
          strokeWeight: 3,
        },
        midControlPoint: {
          ...commonOptions,
          strokeWeight: 2,
          fillColor: '#fff',
        },
      });
      editor.current.on('adjust', function ({ target }) {
        onMapChange(target, true);
      });
      editor.current.on('move', function ({ target }) {
        onMapChange(target, true);
      });
      return editor.current;
    }
  });

  const executeMouseTool = useMemoizedFn((curType = type) => {
    if (!mouseTool.current || editor.current?.getTarget()) return;
    const mapping = methodMapping[curType];
    if (!mapping) {
      return;
    }
    mouseTool.current[mapping.mouseTool]({
      ...commonOptions,
    } as AMap.PolylineOptions);
  });

  const createMouseTool = useMemoizedFn((curType: MapEditorType = type) => {
    if (mouseTool.current) return;
    mouseTool.current = new aMap.current.MouseTool(map.current);
    mouseTool.current.on('draw', function ({ obj }) {
      onMapChange(obj);
    });
    executeMouseTool(curType);
  });

  const toCenter = (position, imm?: boolean) => {
    if (map.current) {
      map.current.setZoomAndCenter(18, position, imm);
    }
  };

  const onReset = () => {
    const ok = () => {
      toRemoveOverlay();
      if (editor.current) {
        editor.current.setTarget();
        editor.current.close();
      }
      onChange?.(null);
    };
    modal.confirm({
      title: t('Clear the canvas'),
      content: t('Are you sure to clear the canvas?'),
      okText: t('Confirm'),
      cancelText: t('Cancel'),
      getContainer: () => document.getElementById(id.current),
      onOk() {
        ok();
      },
    });
  };

  const onFocusOverlay = () => {
    if (overlay.current) {
      map.current.setFitView([overlay.current]);
    }
  };

  const getOverlay = useCallback(
    (t = type, v = value, o?: AMap.PolylineOptions & AMap.PolygonOptions) => {
      const mapping = methodMapping[t];
      if (!mapping) {
        return;
      }
      const options = { ...commonOptions, ...o } as AMap.MarkerOptions;
      if ('transformOptions' in mapping) {
        Object.assign(options, mapping.transformOptions(v));
      } else if ('propertyKey' in mapping) {
        options[mapping.propertyKey] = v;
      }

      return new aMap.current[mapping.overlay](options);
    },
    [commonOptions],
  );

  const setOverlay = (t = type, v = value, o?: AMap.PolylineOptions & AMap.PolygonOptions) => {
    if (!aMap.current) return;
    const nextOverlay = getOverlay(t, v, o);
    nextOverlay.setMap(map.current);
    return nextOverlay;
  };

  // 编辑时
  useEffect(() => {
    if (!aMap.current) return;
    if (!value || (!readonly && overlay.current)) {
      return;
    }

    const nextOverlay = setOverlay();
    // 聚焦在编辑的位置
    map.current.setFitView([nextOverlay]);
    overlay.current = nextOverlay;
    if (!disabled) {
      createEditor();
      setTarget();
    }
  }, [value, needUpdateFlag, type, commonOptions, disabled, readonly]);

  // 当在编辑时，关闭 mouseTool
  useEffect(() => {
    if (!mouseTool.current) return;

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

  // 当值变更时，toggle mouseTool
  useEffect(() => {
    if (!value && (mouseTool.current || editor.current)) {
      toRemoveOverlay();
      if (editor.current) {
        editor.current.setTarget();
        editor.current.close();
      }
      onChange?.(null);
    }
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

    const _define = (window as any).define;
    (window as any).define = undefined;
    AMapLoader.load({
      key: accessKey,
      version: '2.0',
      plugins: ['AMap.MouseTool', 'AMap.PolygonEditor', 'AMap.PolylineEditor', 'AMap.CircleEditor'],
    })
      .then((amap) => {
        (window as any).define = _define;
        return requestIdleCallback(() => {
          map.current = new amap.Map(id.current, {
            resizeEnable: true,
            zoom,
          } as AMap.MapOptions);
          aMap.current = amap;
          setErrMessage('');
          forceUpdate([]);
        });
      })
      .catch((err) => {
        if (typeof err === 'string') {
          if (err.includes('多个不一致的 key')) {
            setErrMessage(t('The AccessKey is incorrect, please check it'));
          } else {
            setErrMessage(err);
          }
        } else if (err?.type === 'error') {
          setErrMessage('Something went wrong, please refresh the page and try again');
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

  useImperativeHandle(ref, () => ({
    setOverlay,
    getOverlay,
    createMouseTool,
    createEditor,
    executeMouseTool,
    aMap: aMap.current,
    map: map.current,
    overlay: overlay.current,
    mouseTool: () => mouseTool.current,
    editor: () => editor.current,
    errMessage,
  }));

  const app = useApp();

  if (!accessKey || errMessage) {
    return (
      <Alert
        action={
          <Button type="primary" onClick={() => navigate(app.pluginSettingsManager.getRoutePath('map'))}>
            {t('Go to the configuration page')}
          </Button>
        }
        message={errMessage || t('Please configure the AccessKey and SecurityJsCode first')}
        type="error"
      />
    );
  }

  return (
    <div
      className={css`
        position: relative;
        height: 500px;
      `}
      id={id.current}
      style={props?.style}
    >
      {!aMap.current && (
        <div
          className={css`
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          `}
        >
          <Spin />
        </div>
      )}
      {!disabled ? (
        <>
          <Search toCenter={toCenter} aMap={aMap.current} />
          <div
            className={css`
              position: absolute;
              bottom: 80px;
              right: 20px;
              z-index: 10;
            `}
          >
            <Button
              onClick={onFocusOverlay}
              disabled={!overlay.current}
              type="primary"
              shape="round"
              size="large"
              icon={<SyncOutlined />}
            ></Button>
          </div>
          {type !== 'point' ? (
            <div
              className={css`
                position: absolute;
                bottom: 20px;
                left: 10px;
                z-index: 2;
                pointer-events: none;
              `}
            >
              <Alert
                message={t('Click to select the starting point and double-click to end the drawing')}
                type="info"
              />
            </div>
          ) : null}

          <div
            className={css`
              position: absolute;
              bottom: 20px;
              right: 20px;
              z-index: 2;
            `}
          >
            <Button
              disabled={!value}
              style={{
                height: '40px',
              }}
              onClick={onReset}
              type="primary"
              danger
            >
              {t('Clear')}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
});
AMapComponent.displayName = 'AMapComponent';
