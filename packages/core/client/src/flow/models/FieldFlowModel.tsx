import { Field, FlowModel } from '@nocobase/flow-engine';

export class FieldFlowModel extends FlowModel {
  field: Field;
  fieldPath: string;
}