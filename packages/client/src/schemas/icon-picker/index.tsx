import React, { useState } from 'react';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { Input, Popover, Button } from 'antd';
import { LoadingOutlined, CloseOutlined } from '@ant-design/icons';
import {
  icons,
  hasIcon,
  IconPicker as Icon,
} from '../../components/icon-picker';
import { isValid } from '@formily/shared';
import { useTranslation } from 'react-i18next';

function IconField(props: any) {
  const { value, onChange } = props;
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
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
            <div
              style={{ width: '26em', maxHeight: '20em', overflowY: 'auto' }}
            >
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
          title={t('Icon')}
          trigger="click"
        >
          <Button>{hasIcon(value) ? <Icon type={value} /> : t('Select an icon')}</Button>
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
    if (!isValid(props.value)) {
      return <div></div>;
    }
    return <Icon type={props.value} />;
  }),
);

export default IconPicker;
