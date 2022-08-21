
/**
 * a unit test for the usergroups plugin.
 * which will focus on the data table and datas.
 */
import Database, { BelongsToManyRepository } from '@nocobase/database';
import { default as UserGroupsPlugin } from '..';

import { mockServer, MockServer } from '@nocobase/test';

import { Plugin } from '@nocobase/server';
import PluginUsers from '@nocobase/plugin-users';

let app: MockServer;
let db: Database;

/**
 * create mock server.
 * cleandb.
 * plugining.
 * create data and table.
 */
const init = async () => {
    app = mockServer();

    await app.cleanDb();

    app.plugin(UserGroupsPlugin);
    app.plugin(PluginUsers);

    await app.loadAndInstall();
    await app.db.sync();
}

/**
 * this sections will test wheather the data tables was created.
 * wheather the collections was installed.
 * include usergroups,usergroupsUsers
 */
describe('A.load and install data tables', () => {

    beforeEach(async () => {
        await init();
    });

    afterEach(async () => {
        await app.destroy();
    });

    //test the plugin was loaded.
    it('A.1.collection usergroups was create and loaded.', async () => {
        const Test = app.db.getCollection('userGroups');
        expect(Test).toBeDefined();
    });

    //test the usergroup table was created.
    it('A.2.table usergroups installed', async () => {
        const Test = app.db.getRepository('userGroups');
        expect(Test.model.name).toEqual('userGroups');
    });



    //test the usergroupsUsers table was created.
    //userplugin needed.
    it('A.3.table usergroupsUsers installed', async () => {
        const Test = app.db.getRepository('userGroupsUsers');
        expect(Test.model.name).toEqual('userGroupsUsers');
    });

});

/**
 * this sections descripe the install of the default datas.
 */
describe('B.test the installed default datas', () => {

    beforeEach(async () => {
        await init();
    });

    afterEach(async () => {
        await app.destroy();
    });

    //test the usergroup table has a default usergroup.
    //need userplugin.
    it('B.1.default usergroup', async () => {
        // const Test = app.db.getRepository('usergroups');
        const Test = await app.db.getRepository('userGroups').findOne({
            filter: {
                name: 'default',
            },
        });
        expect(Test.get('name')).toEqual('default');
    });

    //this test will create a new user,without groups seted.
    //then will try to get the user's group.
    //which should be 1 default group.
    it('B.2.create a user, hook it a default usergroup', async () => {
        // const Test = app.db.getRepository('usergroups');
        await app.db.getCollection('users').model.create();
        const Tuser = await app.db.getRepository('users').findOne({
            filter: {
                id: 2,
            },
        });
        // user1._model.getUserGroup();
        let ts = await Tuser['getUserGroups']();
        const groupname = await ts[0]['name'];
        expect(groupname).toEqual('default')
    });
    

});