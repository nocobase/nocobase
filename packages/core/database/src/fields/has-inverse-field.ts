import type { Field } from './field';

export interface HasInverseField {
  inverseField: () => Field;
}
