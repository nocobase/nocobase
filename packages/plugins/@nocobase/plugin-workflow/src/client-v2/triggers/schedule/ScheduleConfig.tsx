/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { DatePicker, Form, InputNumber, Radio } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useRef } from 'react';
import { useT } from '../../locale';
import { AppendsSelect } from './AppendsSelect';
import { CollectionCascader } from './CollectionCascader';
import { EndsByField } from './EndsByField';
import { OnField } from './OnField';
import { RepeatField } from './RepeatField';
import { ScheduleModeFields } from './ScheduleModes';
import { SCHEDULE_MODE, scheduleModeOptions } from './constants';

type DateTimePickerProps = {
  value?: string | Date;
  onChange?: (value?: Date | null) => void;
  placeholder?: string;
};

function DateTimePicker({ value, onChange, placeholder }: DateTimePickerProps) {
  return (
    <DatePicker
      showTime
      value={value ? dayjs(value) : null}
      placeholder={placeholder}
      onChange={(nextValue) => onChange?.(nextValue ? nextValue.toDate() : null)}
    />
  );
}

export function TriggerModeField({ disabled }: { disabled?: boolean }) {
  const t = useT();
  const form = Form.useFormInstance();
  const options = useMemo(() => scheduleModeOptions.map((item) => ({ value: item.value, label: t(item.label) })), [t]);

  return (
    <Form.Item
      name={['config', 'mode']}
      label={t('Trigger mode')}
      rules={[{ required: true }]}
      initialValue={SCHEDULE_MODE.STATIC}
    >
      <Radio.Group
        disabled={disabled}
        options={options}
        onChange={(event) => {
          form.setFieldValue(['config', 'mode'], event.target.value);
          form.setFieldValue(['config', 'collection'], undefined);
          form.setFieldValue(['config', 'startsOn'], undefined);
          form.setFieldValue(['config', 'repeat'], undefined);
          form.setFieldValue(['config', 'endsOn'], undefined);
          form.setFieldValue(['config', 'limit'], undefined);
        }}
      />
    </Form.Item>
  );
}

function StaticScheduleFields() {
  const t = useT();
  const repeat = Form.useWatch(['config', 'repeat']);
  const fields = ScheduleModeFields[SCHEDULE_MODE.STATIC];
  return (
    <>
      <Form.Item
        name={['config', 'startsOn']}
        label={t(fields.startsOn.title)}
        rules={fields.startsOn.required ? [{ required: true }] : undefined}
      >
        <DateTimePicker />
      </Form.Item>
      <Form.Item name={['config', 'repeat']} label={t(fields.repeat.title)}>
        <RepeatField />
      </Form.Item>
      {repeat ? (
        <>
          <Form.Item name={['config', 'endsOn']} label={t(fields.endsOn.title)}>
            <DateTimePicker />
          </Form.Item>
          <Form.Item name={['config', 'limit']} label={t(fields.limit.title)}>
            <InputNumber min={fields.limit.min} placeholder={t(fields.limit.placeholder)} />
          </Form.Item>
        </>
      ) : null}
    </>
  );
}

function hasSelectedScheduleField(value: unknown) {
  return Boolean(value && typeof value === 'object' && 'field' in value && (value as { field?: unknown }).field);
}

function DateFieldScheduleFields() {
  const t = useT();
  const form = Form.useFormInstance();
  const collection = Form.useWatch(['config', 'collection']);
  const repeat = Form.useWatch(['config', 'repeat']);
  const prevCollectionRef = useRef(collection);
  const initializedRef = useRef(false);
  const collectionHydratedRef = useRef(false);
  const fields = ScheduleModeFields[SCHEDULE_MODE.DATE_FIELD];

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      prevCollectionRef.current = collection;
      return;
    }
    if (!collectionHydratedRef.current) {
      prevCollectionRef.current = collection;
      if (collection) {
        collectionHydratedRef.current = true;
      }
      return;
    }
    if (prevCollectionRef.current !== collection && collection) {
      form.setFieldValue(['config', 'startsOn'], undefined);
      form.validateFields([['config', 'startsOn']]).catch(() => undefined);
    }
    prevCollectionRef.current = collection;
  }, [collection, form]);

  return (
    <>
      <Form.Item
        name={['config', 'collection']}
        label={t(fields.collection.title)}
        rules={fields.collection.required ? [{ required: true }] : undefined}
      >
        <CollectionCascader />
      </Form.Item>
      <Form.Item
        name={['config', 'startsOn']}
        label={t(fields.startsOn.title)}
        rules={
          fields.startsOn.required
            ? [
                {
                  validator(_, value) {
                    if (hasSelectedScheduleField(value)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(t('This field is required')));
                  },
                },
              ]
            : undefined
        }
      >
        <OnField collection={collection} />
      </Form.Item>
      <Form.Item name={['config', 'repeat']} label={t(fields.repeat.title)}>
        <RepeatField />
      </Form.Item>
      {repeat ? (
        <>
          <Form.Item name={['config', 'endsOn']} label={t(fields.endsOn.title)}>
            <EndsByField collection={collection} />
          </Form.Item>
          <Form.Item name={['config', 'limit']} label={t(fields.limit.title)}>
            <InputNumber min={fields.limit.min} placeholder={t(fields.limit.placeholder)} />
          </Form.Item>
        </>
      ) : null}
      <Form.Item name={['config', 'appends']} label={t(fields.appends.title)} extra={t(fields.appends.description)}>
        <AppendsSelect collection={collection} />
      </Form.Item>
    </>
  );
}

export function ScheduleConfig({ modeDisabled = true }: { modeDisabled?: boolean }) {
  const mode = Form.useWatch(['config', 'mode']) ?? SCHEDULE_MODE.STATIC;

  return (
    <fieldset
      className={css`
        .ant-input-number {
          width: auto;
          min-width: 6em;
        }

        .ant-picker {
          width: auto;
        }

        .ant-select.auto-width {
          width: auto;
          min-width: 6em;
        }
      `}
    >
      <TriggerModeField disabled={modeDisabled} />
      {mode === SCHEDULE_MODE.DATE_FIELD ? <DateFieldScheduleFields /> : <StaticScheduleFields />}
    </fieldset>
  );
}

export function SchedulePresetConfig() {
  return <TriggerModeField />;
}

export default ScheduleConfig;
