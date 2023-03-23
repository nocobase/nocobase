import React, { useEffect, useState } from 'react';
import { Button } from 'antd';
import { DoubleRightOutlined, DoubleLeftOutlined } from '@ant-design/icons';
import ReactDOM from 'react-dom';

export const useTransferAllButton = ({
  onTransferAll,
  onNotTransferAll,
  isRightDisabled = false,
  isLeftDisabled = false,
}) => {
  const [rightButton, setRightButton] = useState(null);
  const [leftButton, setLeftButton] = useState(null);
  // 用于解决闭包问题
  const [state] = useState({ onTransferAll, onNotTransferAll });

  useEffect(() => {
    const transferAllButton = document.querySelector('.nb-transfer .ant-transfer-operation');
    const div = document.createElement('div');
    const Group = () => {
      return (
        <>
          <Button
            onClick={() => state.onTransferAll()}
            style={{ margin: '12px 0', width: 24, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            type="primary"
            size="small"
          >
            <DoubleRightOutlined />
          </Button>
          <Button
            onClick={() => state.onNotTransferAll()}
            style={{ margin: '12px 0', width: 24, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            type="primary"
            size="small"
          >
            <DoubleLeftOutlined />
          </Button>
        </>
      );
    };

    const first = transferAllButton.children[0];
    const second = transferAllButton.children[1];

    ReactDOM.render(<Group />, div, () => {
      setRightButton(div.children[0]);
      setLeftButton(div.children[1]);
      transferAllButton.insertBefore(div.children[0], first);
      transferAllButton.insertBefore(div.children[0], second);
    });
  }, []);

  useEffect(() => {
    if (!rightButton || !leftButton) return;

    rightButton.disabled = isRightDisabled;
    leftButton.disabled = isLeftDisabled;
    state.onTransferAll = onTransferAll;
    state.onNotTransferAll = onNotTransferAll;
  }, [isRightDisabled, isLeftDisabled, rightButton, leftButton, onTransferAll, onNotTransferAll]);
};
