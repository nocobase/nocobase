import { appendToBuiltInPlugins } from '@nocobase/server';

export async function staticImport() {
  await appendToBuiltInPlugins('@nocobase/plugin-async-task-manager');
}
