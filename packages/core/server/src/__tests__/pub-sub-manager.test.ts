/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';
import { uid } from '@nocobase/utils';
import Plugin from '../plugin';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('pub-sub-manager', () => {
  test('case1', async () => {
    let count = 0;
    class Plugin1 extends Plugin {
      get name() {
        return 'Plugin1';
      }

      async onMessage() {
        ++count;
      }

      async beforeLoad() {
        await this.app.pubSubManager.subscribe(
          'chan1nel',
          (message) => {
            ++count;
            console.log(`Channel1 subscriber collected message: ${message}`);
          },
          { debounce: 500 },
        );
      }
    }
    const appOpts = {
      pubSubManager: {
        basename: 'pubsub1',
      },
      plugins: [Plugin1, 'nocobase'],
    };
    const node1: MockServer = await createMockServer({
      ...appOpts,
      name: 'app1_' + uid(),
    });
    const node2: MockServer = await createMockServer({
      ...appOpts,
      name: 'app1_' + uid(),
    });
    node1.pubSubManager.publish('chan1nel', `channel1_message_1`);
    node1.pubSubManager.publish('chan1nel', `channel1_message_1`);
    node1.pubSubManager.publish('chan1nel', `channel1_message_1`);
    node1.pubSubManager.publish('chan1nel', `channel1_message_1`);
    node1.pubSubManager.publish('chan1nel', `channel1_message_1`);
    node1.pubSubManager.publish('chan1nel', `channel1_message_1`);
    node1.pubSubManager.publish('chan1nel', `channel1_message_1`);
    await sleep(1000);
    expect(count).toBe(1);
    await node1.pm.get(Plugin1).sendMessage('plugin send message');
    expect(count).toBe(2);
    await node1.pm.get(Plugin1).sendMessage('plugin send message');
    expect(count).toBe(3);
    await node1.destroy();
    await node2.destroy();
  });
});
