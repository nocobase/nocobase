import { stat } from 'fs/promises';

export async function fsExists(path: string) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    return false;
  }
}
