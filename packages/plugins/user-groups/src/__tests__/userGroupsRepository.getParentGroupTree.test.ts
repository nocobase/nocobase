import Database, { BelongsToManyRepository } from '@nocobase/database';

import { mockServer, MockServer } from '@nocobase/test';

import PluginUsers from '@nocobase/plugin-users';
import PluginAcl from '@nocobase/plugin-acl';

import { default as UserGroupsPlugin } from '..';

import { UserGroupsRepository } from '../repository/userGroupRepository';

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
    let group4;

    let userGroupRepository;

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
        userGroupRepository = db.getCollection('userGroups').repository as UserGroupsRepository;

        //登录admin用户
        const userPlugin = app.getPlugin('@nocobase/plugin-users') as PluginUsers;
        adminAgent = await app.agent().auth(userPlugin.jwtService.sign({
            userId: 1,
        }), { type: 'bearer' });

        //产生初始化测试数据
        group1 = await userGroupRepository.create({
            values: {
                name: 'group1',
                status: 1,
            },
        });
        group2 = await userGroupRepository.create({
            values: {
                name: 'group2',
                parent:group1,
                status: 1,
            },
        });
        group3 = await userGroupRepository.create({
            values: {
                name: 'group3',
                parent:group2,
                status: 1,
            },
        });

        group4 = await userGroupRepository.create({
            values: {
                name: 'group4',
                parent:group3,
                status: 1,
            },
        });

        agent = supertest.agent(app.callback());

    });

    afterEach(async () => {
        // await db.close();
        await app.destroy();
    });

    it('send null id,should get nothing!', async () => {

        const parents = await userGroupRepository.listParentGroupTree(group4.gid);

        expect(parents).toBeDefined();
        expect(parents.length).toBe(4);
        expect(parents[0].name).toBe('group1');
        expect(parents[1].name).toBe('group2');
        expect(parents[2].name).toBe('group3');
        expect(parents[3].name).toBe('group4');

    });



});
