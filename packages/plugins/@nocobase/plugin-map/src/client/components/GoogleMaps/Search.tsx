import { css } from '@nocobase/client';
import { useDebounceFn } from 'ahooks';
import { message, Select } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useMapTranslation } from '../../locale';

interface SearchProps {
  toCenter: (p: any) => void;
  mapRef: React.RefObject<google.maps.Map>;
}

export const Search = (props: SearchProps) => {
  const { toCenter, mapRef } = props;
  const { t } = useMapTranslation();
  const placeSearchRef = useRef<google.maps.places.AutocompleteService>();
  const [options, setOptions] = useState([]);

  useEffect(() => {
    google.maps
      .importLibrary('places')
      .then((places: google.maps.PlacesLibrary) => {
        placeSearchRef.current = new places.AutocompleteService();
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
      placeSearchRef.current.getPlacePredictions(
        {
          input: keyword || ' ',
        },
        (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            setOptions(
              result.map((item: any) => {
                const structured = item.structured_formatting;
                return {
                  ...item,
                  label: `${structured.main_text}${structured.secondary_text ? ' ' + structured.secondary_text : ''}`,
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
    const service = new google.maps.places.PlacesService(mapRef.current);
    service.getDetails(
      {
        placeId: place.place_id,
        fields: ['geometry'],
      },
      (result, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          toCenter(result.geometry.location);
        }
      },
    );
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
        data-testid="antd-select"
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
