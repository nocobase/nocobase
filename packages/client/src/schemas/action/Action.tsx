import React, { useState } from 'react';
import { observer, RecursionField, useField } from '@formily/react';
import { useDesignable, useDefaultAction } from '..';
import { Button, Modal as AntdModal, Tooltip } from 'antd';
import IconPicker from '../../components/icon-picker';
import { getSchemaPath } from '../../components/schema-renderer';
import { VisibleContext } from '../../context';
import { ActionBar } from './ActionBar';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../../hooks/useCompile';
import { Link } from './Link';
import { URL } from './URL';
import { Group } from './Group';
import { Modal } from './Modal';
import { Drawer } from './Drawer';
import { DesignableBar } from './DesignableBar';
import { Popover } from './Popover';
import { Dropdown } from './Dropdown';
import { ButtonComponentContext } from './context';

import './style.less';

function getTooltipProps(tooltip) {
  const { t } = useTranslation();
  const compile = useCompile();
  if (typeof tooltip === 'string') {
    return { title: compile(tooltip) };
  }
  return tooltip;
}

export const Action: any = observer((props: any) => {
  const { tooltip, confirm, useAction = useDefaultAction, icon, ...others } = props;
  const { t } = useTranslation();
  const compile = useCompile();
  const { run } = useAction();
  const field = useField();
  const { schema, DesignableBar } = useDesignable();
  const [visible, setVisible] = useState(false);
  const child = Object.values(schema.properties || {}).shift();
  const isDropdownOrPopover = child && ['Action.Dropdown', 'Action.Popover'].includes(child['x-component']);
  let button = (
    <Button
      {...others}
      icon={<IconPicker type={icon} />}
      onClick={async () => {
        setVisible(true);
        if (confirm) {
          AntdModal.confirm({
            ...confirm,
            async onOk() {
              await run();
            },
          });
        } else {
          await run();
        }
      }}
    >
      {compile(schema.title)}
      <DesignableBar path={getSchemaPath(schema)} />
    </Button>
  );
  console.log('tooltip', tooltip);
  if (tooltip) {
    button = <Tooltip {...getTooltipProps(tooltip)}>{button}</Tooltip>;
  }
  return (
    <ButtonComponentContext.Provider value={button}>
      <VisibleContext.Provider value={[visible, setVisible]}>
        {!isDropdownOrPopover && button}
        <RecursionField schema={schema} onlyRenderProperties />
      </VisibleContext.Provider>
    </ButtonComponentContext.Provider>
  );
});

Action.Link = Link;

Action.URL = URL;

Action.Group = Group;

Action.Modal = Modal;

Action.Drawer = Drawer;

Action.DesignableBar = DesignableBar;

Action.Popover = Popover;

Action.Dropdown = Dropdown;

Action.Bar = ActionBar;
