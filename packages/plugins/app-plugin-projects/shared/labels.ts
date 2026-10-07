import type { Color } from './common.js';

export interface Label {
  readonly id: string;
  readonly name: string;
  readonly color: Color;
}

export interface CreateLabelRequest {
  readonly name: string;
  readonly color?: Color;
}

export type UpdateLabelRequest = Partial<CreateLabelRequest>;

export const LABEL_NAME_MAX = 64;
