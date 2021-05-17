import React, { useState } from 'react';
import { connect } from '@formily/react-schema-renderer';
import { Popover, Button, Input } from 'antd';
import { acceptEnum, mapStyledProps, mapTextComponent } from '../shared';
import { icons, hasIcon, Icon as IconComponent } from '@/components/icons';
import { CloseOutlined } from '@ant-design/icons';

function IconField(props: any) {
  const { value, onChange } = props;
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <Input.Group compact>
        <Popover
          placement={'bottom'}
          visible={visible}
          onVisibleChange={val => {
            setVisible(val);
          }}
          content={
            <div>
              {[...icons.keys()].map(key => (
                <span
                  style={{ fontSize: 18, marginRight: 10, cursor: 'pointer' }}
                  onClick={() => {
                    onChange(key);
                    setVisible(false);
                  }}
                >
                  <IconComponent type={key} />
                </span>
              ))}
            </div>
          }
          title="图标"
          trigger="click"
        >
          <Button>
            {hasIcon(value) ? <IconComponent type={value} /> : '选择图标'}
          </Button>
        </Popover>
        {value && <Button icon={<CloseOutlined/>} onClick={e => {
          onChange(null);
        }}></Button>}
      </Input.Group>
    </div>
  );
}

export const Icon = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent,
})(IconField);

export default Icon;
