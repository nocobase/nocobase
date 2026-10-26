import { defineSeed } from '@nocobase/db';
import { encodeAuthorizationTitle } from '@nocobase/authorization/core';
import { equipmentManager, equipmentStaff } from '../../seed-data/equipment-roles.ts';
export default defineSeed({name:'202611020002_equipment_roles',transaction:true,async run(context){
 for(const role of [equipmentManager,equipmentStaff]){
 const repo=context.repository('authorizationPermissionSets');
 if(await repo.findOne({filter:{key:role.key}}))continue;
 await repo.createOne({values:{id:role.key,key:role.key,title:encodeAuthorizationTitle(role.title),grants:JSON.stringify(role.grants),createdAt:new Date(),updatedAt:new Date()}});
 }
}});
