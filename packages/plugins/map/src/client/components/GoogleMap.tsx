import { useFieldSchema } from '@formily/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMapConfiguration } from '../hooks';
import { useMapTranslation } from '../locale';
import { Loader } from '@googlemaps/js-api-loader';
import { css } from '@emotion/css';
import { useCollection } from '@nocobase/client';
import { useHistory } from 'react-router';
import { Alert, Button } from 'antd';
import { getCurrentPosition } from '../utils';

export type MapEditorType = 'point' | 'polygon' | 'lineString' | 'circle';

export interface GoogleMapComponentProps {
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
  // overlayCommonOptions?: GoogleMap.PolylineOptions & GoogleMap.PolygonOptions;
  block?: boolean;
}

export interface GoogleMapForwardedRefProps {
  // setOverlay: (
  //   t: MapEditorType,
  //   v: any,
  //   o?: GoogleMap.PolylineOptions & GoogleMap.PolygonOptions & GoogleMap.MarkerOptions,
  // ) => any;
  // getOverlay: (
  //   t: MapEditorType,
  //   v: any,
  //   o?: GoogleMap.PolylineOptions & GoogleMap.PolygonOptions & GoogleMap.MarkerOptions,
  // ) => any;
  // createMouseTool: (type: MapEditorType) => void;
  // createEditor: (type: MapEditorType) => void;
  // executeMouseTool: (type: MapEditorType) => void;
  // GoogleMap: any;
  // map: GoogleMap.Map;
  // editor: () => {
  //   getTarget: () => GoogleMap.Polygon;
  //   setTarget: (o: any) => void;
  //   close: () => void;
  //   on: (event: string, callback: (e: any) => void) => void;
  // };
  // mouseTool: () => {
  //   close: (clear?: boolean) => void;
  // };
  // overlay: GoogleMap.Polygon;
}

const GoogleMapComponent = React.forwardRef<GoogleMapForwardedRefProps, GoogleMapComponentProps>((props, ref) => {
  const { accessKey } = useMapConfiguration(props.mapType) || {};
  const { value, onChange, block = false, readonly, disabled = block, zoom = 13 } = props;
  const { t } = useMapTranslation();
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const aMap = useRef<any>();
  const map = useRef<google.maps.Map>();
  const [needUpdateFlag, forceUpdate] = useState([]);
  const [errMessage, setErrMessage] = useState('');

  const type = useMemo<MapEditorType>(() => {
    if (props.type) return props.type;
    const collectionField = getField(fieldSchema?.name);
    return collectionField?.interface;
  }, [props?.type, fieldSchema?.name]);

  const history = useHistory();
  const mapContainerRef = useRef<HTMLDivElement>();

  useEffect(() => {
    if (!accessKey || map.current) return;

    const loader = new Loader({
      apiKey: accessKey,
      version: 'weekly',
    });
    loader
      .importLibrary('core')
      .then(async () => {
        const center = await getCurrentPosition();
        map.current = new google.maps.Map(mapContainerRef.current, {
          zoom,
          center,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
        });
        setErrMessage('');
        forceUpdate([]);
      })
      .catch((err) => {
        console.log('🚀 ~ file: GoogleMap.tsx:100 ~ useEffect ~ err:', err);
        // if (typeof err === 'string') {
        //   if (err.includes('多个不一致的 key')) {
        //     setErrMessage(t('The AccessKey is incorrect, please check it'));
        //   } else {
        //     setErrMessage(err);
        //   }
        // } else if (err?.type === 'error') {
        //   setErrMessage('Something went wrong, please refresh the page and try again');
        // }
      });

    return () => {
      map.current.unbindAll();
      aMap.current = null;
      map.current = null;
      // mouseTool.current = null;
      // editor.current = null;
    };
  }, [accessKey, type, zoom]);

  if (!accessKey || errMessage) {
    return (
      <Alert
        action={
          <Button type="primary" onClick={() => history.push('/admin/settings/map-configuration/configuration')}>
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
      ref={mapContainerRef}
      style={props?.style}
    ></div>
  );
});

export default GoogleMapComponent;
