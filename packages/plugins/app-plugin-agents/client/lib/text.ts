import { VARIABLE_VALUE_MAX_BYTES } from '../../shared/variables.js';

/** Whether a variable value is over the size limit, in UTF-8 bytes. */
export function valueTooLong(value: string): boolean {
  return new TextEncoder().encode(value).length > VARIABLE_VALUE_MAX_BYTES;
}
