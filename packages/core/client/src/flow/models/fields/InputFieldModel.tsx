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
import { Input, Button, Modal } from 'antd';
import { Html5Qrcode } from 'html5-qrcode';
import { ScanOutlined } from '@ant-design/icons';
const ScanInput = (props) => {
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState(false);
  const scannerRef = useRef<any>(null);

  const openScanner = () => {
    setVisible(true);
    setTimeout(() => startScan(), 100); // 等 Modal 打开后再初始化
  };

  const startScan = () => {
    const html5QrCode = new Html5Qrcode('qr-scanner');
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
      (err) => {
        console.log(err);
      },
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
    <div style={{ width: 300 }}>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        addonAfter={<ScanOutlined onClick={openScanner} />}
        {...props}
      />

      <Modal open={visible} onCancel={closeModal} footer={null} destroyOnClose>
        <div id="qr-scanner" style={{ width: '100%', margin: '0 auto', minHeight: 300 }} />
      </Modal>
    </div>
  );
};

export class InputFieldModel extends FieldModel {
  render() {
    return <ScanInput {...this.props} />;
  }
}

InputFieldModel.define({
  label: tExpr('Input'),
});
EditableItemModel.bindModelToInterface('InputFieldModel', ['input', 'email', 'phone', 'uuid', 'url', 'nanoid'], {
  isDefault: true,
});

FilterableItemModel.bindModelToInterface(
  'InputFieldModel',
  ['input', 'email', 'phone', 'uuid', 'url', 'nanoid', 'textarea', 'markdown', 'richText', 'password', 'color'],
  {
    isDefault: true,
  },
);
