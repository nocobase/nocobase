import { css } from '@emotion/css';
import { useDebounceFn } from 'ahooks';
import { message, RefSelectProps, Select } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useMapTranslation } from '../../locale';

interface SearchProps {
  toCenter: (p: any) => void;
  mapRef: React.RefObject<google.maps.Map>;
}

const Search = (props: SearchProps) => {
  const { toCenter, mapRef } = props;
  const { t } = useMapTranslation();
  const placeSearchRef = useRef<google.maps.places.PlacesService>();
  const [options, setOptions] = useState([]);

  useEffect(() => {
    google.maps
      .importLibrary('places')
      .then((places: google.maps.PlacesLibrary) => {
        placeSearchRef.current = new places.PlacesService(mapRef.current);
      })
      .catch(() => {
        message.error('Please configure the Google API Key correctly');
      });
  }, [mapRef]);

  const { run: onSearch } = useDebounceFn(
    (keyword) => {
      if (!placeSearchRef.current) {
        return;
      }

      placeSearchRef.current.findPlaceFromQuery(
        {
          query: keyword || ' ',
          fields: ['name', 'geometry', 'formatted_address'],
        },
        (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            setOptions(
              result.map((item) => {
                return {
                  ...item,
                  label: `${item.name}-${item.formatted_address}`,
                  value: item.place_id,
                };
              }),
            );
          } else {
            setOptions([]);
            return;
          }
        },
      );
    },
    {
      wait: 300,
    },
  );

  const onSelect = (value) => {
    const place = options.find((o) => {
      return o.value === value;
    });
    if (place?.geometry) {
      toCenter(place.geometry);
    }
  };

  return (
    <div
      className={css`
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 10;
        width: calc(100% - 20px);
      `}
    >
      <Select
        id="google-map-search"
        showSearch
        allowClear
        style={{
          background: 'rgba(255, 255, 255, 0.8)',
        }}
        placeholder={t('Enter keywords to search')}
        filterOption={false}
        onSearch={onSearch}
        onSelect={onSelect}
        options={options}
      ></Select>
    </div>
  );
};

export default Search;
