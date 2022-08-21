import Database, { BelongsToManyRepository } from '@nocobase/database';
import { default as UserGroupsPlugin } from '..';

import { mockServer, MockServer } from '@nocobase/test';

import { Plugin } from '@nocobase/server';
import PluginUsers from '@nocobase/plugin-users';

let app: MockServer;
let db: Database;

describe('plugin', () => {

    beforeEach(async () => {
        // app = await prepareApp();
        // db = app.db;
        app = mockServer();
    });

    afterEach(async () => {
        await app.destroy();
    });

    //this test will test wheather the usergroup plugin will be installed.
    describe('define plugin', () => {

        it('plugin name', async () => {
            const plugin = app.plugin(UserGroupsPlugin);
            expect(plugin).toBeInstanceOf(Plugin);
            expect(plugin.getName()).toBe('@nocobase/plugin-user-groups');
        });

    });
});


