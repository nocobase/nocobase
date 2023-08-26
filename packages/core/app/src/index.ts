import { Gateway } from '@nocobase/server';
import config from './config';

Gateway.getInstance().run({
  mainAppOptions: config,
});
