import { tval } from '@nocobase/client';

const NAMESPACE = 'field-markdown-vditor';

export function generateNTemplate(key: string) {
  return tval(key, { ns: NAMESPACE })
}