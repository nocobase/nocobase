import { defineMigration, type MigrationDefinition } from '@nocobase/db';
const migration:MigrationDefinition=defineMigration({name:'202611040200_lab',async up({builder}){
 await builder.createCollection('labRecords',c=>{c.string('id',{primaryKey:true,length:64,nullable:false});c.string('name',{length:120,nullable:false});c.string('detail',{length:240,nullable:false});c.string('location',{length:120,nullable:false});c.string('createdAt',{length:32,nullable:false});c.index(['createdAt','id']);});
 await builder.createCollection('labSettings',c=>{c.string('id',{primaryKey:true,length:64,nullable:false});c.string('manager',{length:80,nullable:false});c.string('location',{length:120,nullable:false});c.integer('revision',{nullable:false});});
},async down({builder}){await builder.dropCollection('labSettings');await builder.dropCollection('labRecords');}});
export default migration;
