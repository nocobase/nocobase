import { SchemaInitializer } from '@nocobase/client';
import { StepsFormName } from '../../constants';
import { tStr } from '../../locale';
import {
  nextActionInitializerItem,
  previousActionInitializerItem,
  submitActionInitializerItem,
  customActionInitializerItem,
} from './items';

export const configureActionsInitializer = new SchemaInitializer({
  name: `${StepsFormName}:configureActions`,
  icon: 'SettingOutlined',
  title: tStr('Configure actions'),
  style: {
    marginLeft: 8,
  },
  items: [
    previousActionInitializerItem,
    nextActionInitializerItem,
    submitActionInitializerItem,
    customActionInitializerItem,
    // {
    //   name: 'customRequest',
    //   title: tStr('Custom request'),
    //   Component: 'CustomRequestInitializer',
    // },
  ],
});
