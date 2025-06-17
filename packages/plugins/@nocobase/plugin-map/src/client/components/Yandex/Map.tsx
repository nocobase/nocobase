import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Alert, Button, Spin } from 'antd';
import { useMapConfiguration } from '../../hooks';
import { useMapTranslation } from '../../locale';
import { useMapHeight } from '../hook';
import { Search } from './Search';

export interface YandexMapComponentProps {
  value?: any;
  onChange?: (value: number[]) => void;
  disabled?: boolean;
  mapType: string;
  readonly?: string;
  zoom: number;
  type: string;
  style?: React.CSSProperties;
  overlayCommonOptions?: any;
  block?: boolean;
}

export interface YandexMapForwardedRefProps {
  setOverlay: (t: string, v: any, o?: any) => any;
  getOverlay: (t: string, v: any, o?: any) => any;
  map: any;
  overlay: any;
  errMessage?: string;
}

export const YandexMapComponent = React.forwardRef<YandexMapForwardedRefProps, YandexMapComponentProps>(
  (props, ref) => {
    const { value, onChange, zoom = 13 } = props;
    const { accessKey } = useMapConfiguration(props.mapType) || {};
    const { t } = useMapTranslation();
    const height = useMapHeight();
    const mapRef = useRef<any>();
    const overlayRef = useRef<any>();
    const id = useRef(`yandex-map-${Date.now()}`);
    const [errMessage, setErrMessage] = useState('');

    useEffect(() => {
      if (!accessKey || mapRef.current) return;
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${accessKey}&lang=en_US`;
      script.onload = () => {
        (window as any).ymaps.ready(() => {
          mapRef.current = new (window as any).ymaps.Map(id.current, {
            center: [55.751244, 37.618423],
            zoom,
          });
          setErrMessage('');
        });
      };
      script.onerror = () => {
        setErrMessage(t('Load yandex maps failed, Please check the Api key and refresh the page'));
      };
      document.body.appendChild(script);
      return () => {
        script.remove();
        mapRef.current && mapRef.current.destroy();
        mapRef.current = null;
      };
    }, [accessKey, zoom]);

    useEffect(() => {
      if (mapRef.current && value) {
        const overlay = setOverlay(props.type, value);
        overlay && mapRef.current.geoObjects.add(overlay);
        overlayRef.current = overlay;
      }
    }, [value, props.type]);

    const getOverlay = (t = props.type, v = value, o?: any) => {
      if (!(window as any).ymaps) return null;
      const ymaps = (window as any).ymaps;
      const opts = { draggable: !props.disabled, ...(o || {}) };
      if (t === 'point') {
        return new ymaps.Placemark([v[1], v[0]], {}, opts);
      } else if (t === 'polygon') {
        return new ymaps.Polygon([v.map((p: any) => [p[1], p[0]])], {}, opts);
      } else if (t === 'lineString') {
        return new ymaps.Polyline(v.map((p: any) => [p[1], p[0]]), {}, opts);
      } else if (t === 'circle') {
        return new ymaps.Circle([[v[1], v[0]], v[2]], {}, opts);
      }
      return null;
    };

    const setOverlay = (t = props.type, v = value, o?: any) => {
      const overlay = getOverlay(t, v, o);
      return overlay;
    };

    useImperativeHandle(ref, () => ({
      setOverlay,
      getOverlay,
      map: mapRef.current,
      overlay: overlayRef.current,
      errMessage,
    }));

    if (!accessKey || errMessage) {
      return (
        <Alert message={errMessage || t('Please configure the Api key first')} type="error" />
      );
    }

    return (
      <div id={id.current} style={{ position: 'relative', height: height || 500, ...props.style }}>
        {!mapRef.current && (
          <div
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Spin />
          </div>
        )}
        {!props.disabled && mapRef.current && <Search map={mapRef.current} toCenter={(p) => mapRef.current.setCenter(p)} />}
      </div>
    );
  },
);
YandexMapComponent.displayName = 'YandexMapComponent';
