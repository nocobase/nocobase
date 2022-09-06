import Database, { BelongsToManyRepository } from '@nocobase/database';
import { default as UserGroupsPlugin } from '..';

import { mockServer, MockServer } from '@nocobase/test';

import { Plugin } from '@nocobase/server';
import PluginUsers from '@nocobase/plugin-users';
import PluginUiSchema from '@nocobase/plugin-ui-schema-storage';

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

            await app.cleanDb();

            app.plugin(PluginUiSchema);
            const plugin = app.plugin(UserGroupsPlugin);
            
            await app.loadAndInstall();

            expect(plugin).toBeInstanceOf(Plugin);
            expect(plugin.getName()).toBe('@nocobase/plugin-user-groups');
        });

    });
});


