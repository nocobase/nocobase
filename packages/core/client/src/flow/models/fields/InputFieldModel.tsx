/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditableItemModel, FilterableItemModel, tExpr } from '@nocobase/flow-engine';
import { FieldModel } from '../base';
import React, { useState, useRef } from 'react';
import { Input, Modal } from 'antd';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ScanOutlined } from '@ant-design/icons';
const ScanInput = ({ disableManualInput, ...props }) => {
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState(false);
  const scannerRef = useRef<any>(null);

  const openScanner = () => {
    setVisible(true);
    setTimeout(() => startScan(), 100); // 等 Modal 打开后再初始化
  };

  const startScan = () => {
    const html5QrCode = new Html5Qrcode('qr-scanner', {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.CODE_39,
      ],
      verbose: false,
    });
    scannerRef.current = html5QrCode;

    html5QrCode.start(
      { facingMode: 'environment' }, // 后置摄像头
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      (decodedText) => {
        console.log('Scanned:', decodedText);
        setValue(decodedText);
        stopScan();
        setVisible(false);
      },
      (err) => {},
    );
  };

  const stopScan = async () => {
    try {
      await scannerRef.current?.stop();
      await scannerRef.current?.clear();
    } catch (e) {
      console.warn(e);
    }
  };

  const closeModal = () => {
    stopScan();
    setVisible(false);
  };
  return (
    <div>
      <Input
        {...props}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        addonAfter={<ScanOutlined onClick={openScanner} />}
        readOnly={disableManualInput}
      />

      <Modal open={visible} onCancel={closeModal} footer={null} destroyOnClose>
        <div id="qr-scanner" style={{ width: '100%', margin: '0 auto', minHeight: 300 }} />
      </Modal>
    </div>
  );
};

export class InputFieldModel extends FieldModel {
  render() {
    return this.props.enableScan ? (
      <ScanInput disableManualInput={this.props.disableManualInput} {...this.props} />
    ) : (
      <Input {...this.props} />
    );
  }
}

InputFieldModel.define({
  label: tExpr('Input'),
});
InputFieldModel.registerFlow({
  key: 'inputFieldSettings',
  title: tExpr('Input Settings'),
  steps: {
    enAbleScan: {
      title: tExpr('Enable Scan'),
      uiSchema: (ctx) => {
        return {
          enableScan: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Switch',
          },
          disableManualInput: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Switch',
            title: "{{t('Disable manual input')}}",
            'x-reactions': [
              (field) => {
                const { enableScan } = field.form.values;
                field.hidden = !enableScan;
              },
            ],
          },
        };
      },
      defaultParams: (ctx) => {
        const { enableScan, disableManualInput } = ctx.model.props;
        return {
          enableScan: enableScan,
          disableManualInput,
        };
      },
      handler(ctx, params) {
        const { enableScan, disableManualInput } = params;
        ctx.model.setProps({
          enableScan: enableScan,
          disableManualInput,
        });
      },
    },
  },
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
