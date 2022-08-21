import { default as UserGroupsPlugin } from '..';

import { mockServer, MockServer } from '@nocobase/test';


let app: MockServer;

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

    await app.loadAndInstall();
    await app.db.sync();
}

/**
 * this sections will test wheather the data tables was created.
 * wheather the collections was installed.
 * include usergroups,usergroupsUsers
 */
describe('A.test usergroups tree data.', () => {

    beforeEach(async () => {
        await init();
    });

    afterEach(async () => {
        await app.destroy();
    });

    //this test will test wheather the usergroup plugin will be installed.
    it('create a group,and set the parent to 1', async () => {

        const group1 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group1',
                status: 1,
            },
        });

        const group2 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group2',
                status: 1,
                parent: group1,
            },
        });

        const tp = await group2['getParent']();
        expect(tp['name']).toEqual('group1');

    });

    //this test will test wheather the usergroup plugin will be installed.
    it('create a group,and set the childer', async () => {

        const group1 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group1',
                status: 1,
            },
        });

        const group2 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group2',
                status: 1,
                children: [group1],
            },
        });

        const tp = await group2['getChildren']();
        expect(tp[0]['name']).toEqual('group1');

    });

    //this test will test wheather the usergroup plugin will be installed.
    it('create a group,and set the parent to 1', async () => {

        const group1 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group1',
                status: 1,
            },
        });

        const group2 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group2',
                status: 1,
            },
        });

        const group3 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group3',
                status: 1,
                children: [group1, group2],
            },
        });

        const tp = await group3['getChildren']();
        expect(tp.length).toBe(2);

    });


});


