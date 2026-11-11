import {defineSeed} from '@nocobase/db';
export default defineSeed({name:'202611040201_lab_settings',async run(context){const repo=context.repository('labSettings');if(!await repo.exists({filter:{id:'default'}}))await repo.createOne({values:{id:'default',manager:'',location:'',revision:0}});}});
