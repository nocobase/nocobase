import { Readable } from 'node:stream';
import { createDriveManager } from '../../src/index.ts';

const disk = createDriveManager({
  default: 'local',
  disks: {
    local: { driver: 'fs', location: process.argv[2], visibility: 'private' },
  },
}).use();

switch (process.argv[3]) {
  case 'put':
    await disk.put('put', 'new');
    break;
  case 'stream':
    await disk.putStream('stream', Readable.from(['new']));
    break;
  case 'copy':
    await disk.copy('source', 'copy');
    break;
  case 'move':
    await disk.move('move-source', 'move');
    break;
  case 'recreate':
    await disk.delete('recreate');
    await disk.put('recreate', 'new');
    break;
  default:
    throw new Error('Unsupported write for this test.');
}
