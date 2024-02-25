import { Processor } from '@nocobase/plugin-workflow';

import ManualInstruction from '../ManualInstruction';

import create from './create';
import update from './update';

export type FormHandler = (this: ManualInstruction, instance, formConfig, processor: Processor) => Promise<void>;

export default function ({ formTypes }) {
  formTypes.register('create', create);
  formTypes.register('update', update);
}
