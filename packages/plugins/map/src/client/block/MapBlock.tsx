import { useCollection, useProps, ActionContext, RecordProvider, useRecord, useCompile } from '@nocobase/client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import AMap, { AMapForwardedRefProps } from '../components/AMap';
import { RecursionField, useFieldSchema, Schema } from '@formily/react';
import { useMemoizedFn } from 'ahooks';
import { css } from '@emotion/css';
import { Button, Space } from 'antd';
import { ExpandOutlined, EnvironmentOutlined, CheckOutlined } from '@ant-design/icons';
import { useMapTranslation } from '../locale';

const selectedImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAA/CAMAAAC7OkrPAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAEJQTFRFAAAA8Yti8Yti8Itj8Iti74tj8Itj8YtiKwADKwADKhw5Kh07KwADKwADKwADKwAD4odn1YBlKwADKwADKwADKwAD/5y7LQAAABZ0Uk5TAP/8/f/B/PYOHjY3CCozLP3XCSkvMhA05K4AAAC4SURBVHic7dXLDoIwEIXhwSsoLSrw/q8qbSAiMy3/oivj2czmS5omnVORdapVJJFKBSEL2mrrUurbpdXa5dTH5dXi9tTsGNtX0TFG1OT+7PdY2YdEGd0FuFmUwXWm5UAZbCTKYA3SUrXZQTHLHbUy2OlsMO0ultLsajLlbEWZMEUZ+ig5E6YKM2GqMBOmGKubW1D3ps6g1nnvA5uGa5Os85E9nmF2ebYkzeKhc9wre4V+GMeh317hDfXgCWigIGJbAAAAAElFTkSuQmCC'
const defaultImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAA/CAYAAACM5Lr9AAAFkklEQVR42s3VaWxUVRjG8ddiEKPRxAQTCVSWLnZaWmjpTgulpYUBExP9Agou4IKAogUKAgItlNJCgUIXINFPfsFoDCjibkQRI0QIICAQWUpZugKtpcv0+DxyYqaTe2/vTLf58Etu7znnPf+0k44opQw5i5qsjIFs2APHoBZatFq+02vZeq94yyKs0dOjsAzOTCtuVtNKWtX0UpeaXqHU07tgt4ZnvuMa93Avz/CsniE2WIQV3iEaCDnQ8F/MTgZ4h2d4ljNgmZ4pFszDpmIRIuFP57YWDMcFu7uHMziLMyEKxJBl2MbbM6DZub2NQ3sUZ3K2vkMMGIdNKbi1ADqcZe1q2i7VKzibd8BCEE8GUQ3PQ4ez3KWcGNCbeAfv0neKm85hWRvqo+Hu1LJ2HuwTvAt3tkAciKbDIDO/7iE4l7X9rpqCA30pa3uLwt3nYRAIuIfV5mcWN6msnapf8G405IGQMGry+prB0DiloqPfwng3G3SLDltXnTt5S6PK3NnRr9jAFhDJyLsZAJcz8SGcjOr+xAa0XGGTpOfeSMrYUKcyKlx+gS1oSkbY9VXpm2+rjHKXX2ALm2TS2qq96duaVHp5u19gC5skbc3V05N23FWT8NIfsIVNkra6siGttE2llbX7h9JWhaZ6mfj+lfaJZW3Kn6DJJRNWXWqbgN+Y39jRqtDUKKkrL15PxfdjammrfyhpVmiqlNQVfx9KwX/cFJT6A7awSVLeu1CeUlinxu9o8QsphbUKTWUyfvn5Wcm511QSXvoDtrBJkpedewzaE/E58wdsYZMopSQ55+z+pKK6fo9KKqpXaDkAIgxLWnomK3H1JZVQ0tyv2ICW6XAvLHHJ6QD4K6GgRsVjQ3/g3WzQLffCKGHJqfHgisOXaNy2f/oU7+TdukGIUW5xJ0vic6+oWGzsS7yTd4NoncPiF594GC7FFlSrcVub+gTv4p36btE6h1Fc9nFn7IpzKmZrY5/gXbwTxI0O8xD77rGPYtZeVtE42Jt4B+8C8WAcNu6dPwZDzVh8PYzdcqdXcDbvgMdBPDHEOG7R0Xkxqy6oKAzpDZzNO0AMmIfFvH1kABwZk1epIotv9yjOxOyj+g4xYB4W/dbvlAAdozGsJ3Gmni0mzMPGLvyN6IMo/NojNt/qEZyFmR+CWLAIW3CYaDDUR+D/TTgGdwdncJaeKRbMw8bM/9XdosjlZ5VjU0O3cAZngXTBPCzqzV/cPQAXHeuqVBgu8IVj/TXFGXqWdME8LHLez55mRSw9qUI31fuEZzFjNogNFmFvHPQUACfC8IUbUlTvlbDcSsWzeobYYB42+vWfjDwbnn3c6zCewdnnQGwyD4t47UcjAXA2JO+qCi6ss4V7eUafFZuswn4wM8ex+LgKwqV2cC/OzAXxgnlY+KvfmxkIVaPyr6tRhbWWuId79RnxgnmYY+53VlaHLj2lRm6stRSSc0ph7xoQL1mEzfnWyhPQNrKgGgE1hrjGPTAExEvmYWGvfNOVPUErz6vhiDDCNez5GMQHVmFfd2Vq6MLD6smCGkNc4x4QH5iHPfXyV125H64NX1eFkOpO+I5reo/4wDws9KUDdhSPxFdNIGLc8R3XQHxkFfalHYnB8w6qYRuqO+E7roH4yDws5MX9dtwHlYF5lQi6qYjPfKfXxEcWYbO/sKtsBP50QxFFI/D/De8qQLrBPCwYizY9M2r+of/D+Mx3ID6zDJv1uaVwGfAIBDqGJsbhZ9eQ/BuK+OwYlhzPNe7hXh9Yhe0zwqBB4IAYouCZn1wIXH5GEZ/d1sjBMzzrBfOwoBf2GWFYBMS4C03JWRA087OaoBmf3uCz5zrP8Kx9lmF7jXiE2RbBs95ghB0MIo8/pS0OeJAzvOBLmKY//BAGURBN+jmMa3qPkLdh/wKOL8SpLbnYFgAAAABJRU5ErkJggg=='

export const MapBlock = (props) => {
  const { fieldNames, dataSource = [], fixedBlock, zoom, selectedRecordKeys, setSelectedRecordKeys } = useProps(props);
  const { getField, getPrimaryKey } = useCollection();
  const field = getField(fieldNames?.field);
  const [isMapInitialization, setIsMapInitialization] = useState(false);
  const mapRef = useRef<AMapForwardedRefProps>();
  const geometryUtils: AMap.IGeometryUtil = mapRef.current?.aMap?.GeometryUtil;
  const [record, setRecord] = useState();
  const [visible, setVisible] = useState(false);
  const [selectingMode, setSelecting] = useState('');
  const { t } = useMapTranslation();
  const compile = useCompile()
  const selectingModeRef = useRef(selectingMode);
  selectingModeRef.current = selectingMode;

  const setOverlayOptions = (overlay: AMap.Polygon | AMap.Marker, state?: boolean) => {
    const extData = overlay.getExtData();
    const selected = typeof state === 'undefined' ? extData.selected : !state;
    extData.selected = !selected;
    if ('setIcon' in overlay) {
      overlay.setIcon(new mapRef.current.aMap.Icon({
        imageSize: [19, 32],
        image: selected ? defaultImage : selectedImage
      } as AMap.IconOpts));
    }
    (overlay as AMap.Polygon).setOptions({
      extData,
      ...(selected
        ? { strokeColor: '#4e9bff', fillColor: '#4e9bff' }
        : { strokeColor: '#F18b62', fillColor: '#F18b62' }),
    });
  };

  const removeSelection = () => {
    mapRef.current.mouseTool().close(true);
    mapRef.current.editor().setTarget(null);
    mapRef.current.editor().close();
  };

  // selection
  useEffect(() => {
    if (selectingMode !== 'selection') {
      return;
    }
    if (!mapRef.current.editor()) {
      mapRef.current.createEditor('polygon');
      mapRef.current.createMouseTool('polygon');
    } else {
      mapRef.current.executeMouseTool('polygon');
    }
    return () => {
      removeSelection();
    };
  }, [selectingMode]);

  useEffect(() => {
    if (selectingMode) {
      return () => {
        if (!selectingModeRef.current) {
          mapRef.current.map.getAllOverlays().forEach((o) => {
            setOverlayOptions(o, false);
          });
        }
      };
    }
  }, [selectingMode]);

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
          label: {
            direction: 'bottom',
            offset: [0, 5],
            content: fieldNames?.marker ? compile(item[fieldNames.marker]) : undefined,
          },
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
        if (selectingModeRef.current) {
          if (selectingModeRef.current === 'click') {
            setSelectedRecordKeys((keys) =>
              extData.selected ? keys.filter((key) => key !== extData.id) : [...keys, extData.id],
            );
            setOverlayOptions(overlay);
          }
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
  }, [dataSource, isMapInitialization, fieldNames, field.type]);

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
        <Space direction="vertical">
          <Button
            style={{
              color: !selectingMode ? '#F18b62' : undefined,
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
              color: selectingMode === 'selection' ? '#F18b62' : undefined,
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
      </div>
      <RecordProvider record={record}>
        <MapBlockDrawer visible={visible} setVisible={setVisible} record={null} />
      </RecordProvider>
      <AMap
        {...field?.uiSchema?.['x-component-props']}
        ref={mapRefCallback}
        style={{ height: fixedBlock ? '100%' : null }}
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
