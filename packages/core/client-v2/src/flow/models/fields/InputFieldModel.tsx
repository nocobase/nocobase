/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditableItemModel, FilterableItemModel, tExpr } from '@nocobase/flow-engine';
import { Input } from 'antd';
import type { InputProps, InputRef } from 'antd';
import React, { useEffect, useRef } from 'react';
import { customAlphabet as Alphabet } from 'nanoid';
import { FieldModel } from '../base/FieldModel';
import { ScanInput } from '../../../components/form/ScanInput';

function IMESafeInput(props: InputProps) {
  const { value, onChange, onCompositionStart, onCompositionEnd, ...rest } = props;
  const inputRef = useRef<InputRef>(null);
  const previousValueRef = useRef(value);
  const defaultValue = typeof value === 'bigint' ? String(value) : value;

  useEffect(() => {
    if (Object.is(previousValueRef.current, value)) {
      return;
    }
    previousValueRef.current = value;

    const input = inputRef.current?.input;
    if (input) {
      const nextValue = value == null ? '' : String(value);
      if (input.value !== nextValue) {
        input.value = nextValue;
      }
    }
  }, [value]);

  const getEventValue = (event: React.ChangeEvent<HTMLInputElement> | React.CompositionEvent<HTMLInputElement>) =>
    event.currentTarget.value;

  return (
    <Input
      {...rest}
      ref={inputRef}
      defaultValue={defaultValue}
      onChange={(event) => {
        previousValueRef.current = getEventValue(event);
        onChange?.(event);
      }}
      onCompositionStart={(event) => {
        previousValueRef.current = getEventValue(event);
        onCompositionStart?.(event);
      }}
      onCompositionEnd={(event) => {
        previousValueRef.current = getEventValue(event);
        onCompositionEnd?.(event);
      }}
    />
  );
}

export class InputFieldModel extends FieldModel {
  render() {
    if (this.props.enableScan) {
      return <ScanInput {...this.props} />;
    }
    const { enableScan, disableManualInput, ...inputProps } = this.props;
    return <IMESafeInput {...inputProps} />;
  }
}

InputFieldModel.registerFlow({
  key: 'defaultValueForNanoid',
  steps: {
    generateNanoid: {
      handler(ctx, params) {
        // 监听表单reset
        ctx.blockModel?.emitter?.on('onFieldReset', () => {
          if (ctx.collectionField.interface === 'nanoid' && ctx.collectionField.options.autoFill !== false) {
            const { size, customAlphabet } = ctx.collectionField.options || { size: 21 };
            ctx.model.props.onChange(Alphabet(customAlphabet, size)());
          }
        });
      },
    },
  },
});

InputFieldModel.registerFlow({
  key: 'scanInputSettings',
  sort: 800,
  title: tExpr('Scan input settings'),
  steps: {
    enableScan: {
      title: tExpr('Enable Scan'),
      uiMode: { type: 'switch', key: 'enableScan' },
      hideInSettings(ctx) {
        return ctx.model.getProps().pattern === 'readPretty' || ctx.model.getProps().disabled;
      },
      defaultParams(ctx) {
        return {
          enableScan: !!ctx.model.props.enableScan,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({
          enableScan: !!params.enableScan,
          disableManualInput: params.enableScan ? ctx.model.props.disableManualInput : false,
        });
      },
    },
    disableManualInput: {
      title: tExpr('Disable manual input'),
      uiMode: { type: 'switch', key: 'disableManualInput' },
      hideInSettings(ctx) {
        const enableScanParams = ctx.model.getStepParams?.('scanInputSettings', 'enableScan') as
          | { enableScan?: boolean }
          | undefined;
        const enableScan = Object.prototype.hasOwnProperty.call(enableScanParams || {}, 'enableScan')
          ? !!enableScanParams?.enableScan
          : !!ctx.model.props.enableScan;

        return !enableScan || ctx.model.getProps().pattern === 'readPretty' || !!ctx.model.getProps().disabled;
      },
      defaultParams(ctx) {
        return {
          disableManualInput: !!ctx.model.props.disableManualInput,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({
          disableManualInput: !!ctx.model.props.enableScan && !!params.disableManualInput,
        });
      },
    },
  },
});

InputFieldModel.define({
  label: tExpr('Input'),
});
EditableItemModel.bindModelToInterface('InputFieldModel', ['input', 'email', 'phone', 'uuid', 'url', 'nanoid'], {
  isDefault: true,
});

FilterableItemModel.bindModelToInterface(
  'InputFieldModel',
  [
    'input',
    'email',
    'phone',
    'uuid',
    'url',
    'nanoid',
    'textarea',
    'markdown',
    'vditor',
    'richText',
    'password',
    'color',
  ],
  {
    isDefault: true,
  },
);
