// A local tool registry with entry-wise dependency resolution, Map registration and execution.
const head = `import {ServiceProvider,createServiceToken} from '@nocobase/service-provider';
import {authorizationToken} from '@nocobase/app-plugin-authorization/server';
import {catalogToken} from './catalog.js';`;
const catalog = `import {createServiceToken} from '@nocobase/service-provider';
import {databaseManagerToken} from '@nocobase/db';
export const catalogToken=createServiceToken('catalog');
export class Catalog { constructor(db){this.db=db;} list(){return this.db.connection().repository('entries').findMany();} }`;
const scope = `const scope=(a,id)=>a.for({principal:{type:'user',id},subjects:[]});`;
// Original NocoHR shape: dynamic token maps + Map dispatch.
export const staticToolRegistry = {
  'server/ai/contracts.js': `export function defineTools(tool){return {...tool,async execute(container,actor,input){
 const deps=Object.fromEntries(Object.entries(tool.dependencies ?? {}).map(([key,token])=>[key,container.resolve(token)]));
 return tool.invoke({actor,deps},input);}};}`,
  'server/ai/tools.js': `import {defineTools} from './contracts.js';import {authorizationToken} from '@nocobase/app-plugin-authorization/server';import {catalogToken} from '../providers/catalog.js';
${scope}
export const getEntries=defineTools({definition:{name:'getEntries'},dependencies:{core:catalogToken,authz:authorizationToken},invoke:async(ctx)=>{scope(ctx.deps.authz,String(ctx.actor.id));return ctx.deps.core.list();}});
export const countEntries=defineTools({definition:{name:'countEntries'},dependencies:{core:catalogToken},invoke:async(ctx)=>(await ctx.deps.core.list()).length});`,
  'server/ai/index.js': `import {getEntries,countEntries} from './tools.js';
export default class AppAIResources{async collect(){const tools=new Map();await this.registerTools({async registerTools(entries){for(const tool of entries){if(tools.has(tool.definition.name))throw new Error('DUPLICATE');tools.set(tool.definition.name,tool);}}});return {tools};}
 async registerTools(manager){await manager.registerTools([getEntries,countEntries]);}}`,
  'server/providers/catalog.js': catalog,
  'server/providers/index.js': `${head}
import AppAIResources from '../ai/index.js';
import {Catalog} from './catalog.js';
export {catalogToken};
const executorToken=createServiceToken('executor');
class ToolExecutor{constructor(container,tools){this.container=container;this.tools=tools;}
 async run(name,actor,input){const tool=this.tools.get(name);if(!tool)throw new Error('TOOL_NOT_AVAILABLE');return tool.execute(this.container,actor,input);}}
class Provider extends ServiceProvider{tools=new Map();
 register(){const container=this.app.container;container.singleton(catalogToken,()=>new Catalog(container.resolve(databaseManagerToken)));container.singleton(executorToken,()=>new ToolExecutor(container,this.tools));}
 async boot(){const resources=await new AppAIResources().collect();for(const [name,tool] of resources.tools)this.tools.set(name,tool);}}
import {databaseManagerToken} from '@nocobase/db';
export default [Provider];`,
};
