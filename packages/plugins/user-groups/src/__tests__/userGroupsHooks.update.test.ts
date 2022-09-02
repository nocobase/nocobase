import Database, { BelongsToManyRepository } from '@nocobase/database';


import { mockServer, MockServer } from '@nocobase/test';

import PluginUsers from '@nocobase/plugin-users';
import PluginAcl from '@nocobase/plugin-acl';
import { default as UserGroupsPlugin } from '..';

import supertest from 'supertest';

describe('test the usergroups actions.', () => {

    let app: MockServer;
    let db: Database;
    let agent;
    let pluginUser;

    let adminAgent;

    let group1;
    let group2;
    let group3;

    beforeEach(async () => {

        app = mockServer({
            registerActions: true,
        });
        await app.cleanDb();

        //插入用户，角色，用户组
        app.plugin(PluginAcl);
        app.plugin(UserGroupsPlugin);
        app.plugin(PluginUsers);

        await app.loadAndInstall();
        db = app.db;

        //登录admin用户
        const userPlugin = app.getPlugin('@nocobase/plugin-users') as PluginUsers;
        adminAgent = await app.agent().auth(userPlugin.jwtService.sign({
            userId: 1,
        }), { type: 'bearer' });

        agent = supertest.agent(app.callback());

    });

    afterEach(async () => {
        // await db.close();
        await app.destroy();
    });


    it('group2 should have a tree path include the group1.', async () => {

        //group2 属于group1
        group1 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group1',
                status: 1,
            },
        });
        group2 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group2',
                parent: group1,
                status: 1,
            },
        });

        const requestdata = { filter: { gid: group2.gid } };
        const response = await adminAgent.resource('userGroups').get(requestdata);

        expect(response.statusCode).toEqual(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.ptree).toEqual(group1.gid + ',' + group2.gid + ',');//the ptree is united by the gids.

        console.log(response.body.data.msg);

    });

    it('group3 is a child of group1,then move to group2,ptree should change.', async () => {

        const groupCollection = await app.db.getCollection('userGroups');

        //group2 属于group1
        group1 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group1',
                status: 1,
            },
        });
        group2 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group2',
                status: 1,
            },
        });

        group3 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group3',
                parent: group1,
                status: 1,
            },
        });

        let requestdata = { filter: { gid: group3.gid } };
        let response = await adminAgent.resource('userGroups').get(requestdata);

        expect(response.statusCode).toEqual(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.ptree).toEqual(group1.gid + ',' + group3.gid + ',');//the ptree is united by the gids.

        //change the group3's parent to group2.
        // await group3.setParent(group2);

        groupCollection.model.update(
            {
                parent: group2,
                status:2,
            },
            {
                where: {
                    gid: group3.gid,
                },
                hooks: true,
            },
        );
        // group3.parent = group2;
        // group3.status=2;
        // await group3.save();
        // await app.db.getRepository('userGroups').update(group3);

        requestdata = { filter: { gid: group3.gid } };
        response = await adminAgent.resource('userGroups').get(requestdata);

        expect(response.statusCode).toEqual(200);
        expect(response.body.data).toBeDefined();
        // expect(response.body.data.ptree).toEqual(group2.gid + ',' + group3.gid + ',');//the ptree is united by the gids.

        console.log(response.body.data.msg);

    });

});
