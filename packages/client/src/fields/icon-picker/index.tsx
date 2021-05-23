import React, { useState } from 'react';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { Input, Popover, Button } from 'antd';
import { LoadingOutlined, CloseOutlined } from '@ant-design/icons';
import { icons, hasIcon, Icon } from '../../components/Icon';

function IconField(props: any) {
  const { value, onChange } = props;
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <Input.Group compact>
        <Popover
          placement={'bottom'}
          visible={visible}
          onVisibleChange={(val) => {
            setVisible(val);
          }}
          content={
            <div style={{width: '26em', maxHeight: '20em', overflowY: 'auto'}}>
              {[...icons.keys()].map((key) => (
                <span
                  style={{ fontSize: 18, marginRight: 10, cursor: 'pointer' }}
                  onClick={() => {
                    onChange(key);
                    setVisible(false);
                  }}
                >
                  <Icon type={key} />
                </span>
              ))}
            </div>
          }
          title="图标"
          trigger="click"
        >
          <Button>{hasIcon(value) ? <Icon type={value} /> : '选择图标'}</Button>
        </Popover>
        {value && (
          <Button
            icon={<CloseOutlined />}
            onClick={(e) => {
              onChange(null);
            }}
          ></Button>
        )}
      </Input.Group>
    </div>
  );
}

export const IconPicker = connect(
  IconField,
  mapProps((props, field) => {
    return {
      ...props,
      suffix: (
        <span>
          {field?.['loading'] || field?.['validating'] ? (
            <LoadingOutlined />
          ) : (
            props.suffix
          )}
        </span>
      ),
    };
  }),
  mapReadPretty((props) => {
    return <Icon type={props.value} />;
  }),
);

export default IconPicker;
