import Database, { BelongsToManyRepository } from '@nocobase/database';


import { mockServer, MockServer } from '@nocobase/test';

import { Plugin } from '@nocobase/server';
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
        const rep = await app.db.getRepository('userGroups');
        group1 = await rep.create({
            values: {
                name: 'group1',
                status: 1,
            },
        });

        const md = await app.db.getCollection('userGroups').model;
        group2 = await md.create({
            name: 'group2',
            status: 1,
        });


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


});
