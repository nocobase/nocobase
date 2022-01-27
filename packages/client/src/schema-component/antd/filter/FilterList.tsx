import { onFormReset } from '@formily/core';
import { useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { useMap } from 'ahooks';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterGroup } from './FilterGroup';
import { FilterItem } from './FilterItem';

export function FilterList(props) {
  const { initialValue = [] } = props;
  const form = useForm();
  const { t } = useTranslation();

  const [map, { set, setAll, remove, reset }] = useMap<string, any>(
    initialValue.map((item, index) => {
      return [`index-${index}`, item];
    }),
  );
  debugger;
  useEffect(() => {
    const id = uid();
    form.addEffects(id, () => {
      onFormReset((form) => {
        setAll([]);
        setTimeout(() => {
          reset();
        }, 0);
      });
      return () => {
        form.removeEffects(id);
      };
    });
  }, []);
  useEffect(() => {
    props.onChange?.([...map.values()]);
  }, [map]);

  return (
    <div className={'nb-filter-list'}>
      <div>
        {[...map.entries()].map(([index, item]) => {
          if (item.and || item.or) {
            return (
              <FilterGroup
                key={index}
                value={item}
                onChange={(value: any) => set(index, value)}
                onRemove={() => remove(index)}
              />
            );
          }
          return (
            <FilterItem
              key={index}
              value={item}
              onChange={(value: any) => set(index, value)}
              onRemove={() => remove(index)}
            />
          );
        })}
      </div>
      <div style={{ marginTop: 16 }}>
        <a
          onClick={() => {
            set(uid(), {});
          }}
        >
          {t('Add filter')}
        </a>
        <a
          style={{ marginLeft: 16 }}
          onClick={() => {
            set(uid(), {
              and: [{}],
            });
          }}
        >
          {t('Add filter group')}
        </a>
      </div>
    </div>
  );
}
