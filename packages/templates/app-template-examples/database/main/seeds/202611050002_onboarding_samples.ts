import { defineSeed } from '@nocobase/db';
export default defineSeed({name:'202611050002_onboarding_samples',sample:true,async run(context) {
  for (const [id,name,active,allowedUserId] of [
    ['00000000-0000-4000-8000-000000000101','Engineering',true,null],
    ['00000000-0000-4000-8000-000000000102','Retired department',false,null],
    ['00000000-0000-4000-8000-000000000103','Restricted department',true,'onboarding-restricted-example'],
  ] as const) if (!(await context.repository('onboardingDepartments').findOne({filter:{id}})))
    await context.repository('onboardingDepartments').createOne({values:{id,name,active,allowedUserId}});
}});
