import { CalendarClock, ListChecks, Workflow } from 'lucide-react';
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

const routes: readonly AppClientRouteContribution[] = [
  defineAppRoutes([
    {
      name: 'jobsExample',
      navigation: { title: 'navigation.group', icon: Workflow },
      breadcrumb: { title: 'navigation.group' },
      children: [
        {
          name: 'jobsExampleJobs',
          path: '/jobs-example/jobs',
          auth: 'required',
          authz: 'skip',
          navigation: { title: 'navigation.jobs', icon: ListChecks },
          breadcrumb: { title: 'navigation.jobs' },
          componentLoader: () => import('./pages/jobs.js'),
        },
        {
          name: 'jobsExampleSchedules',
          path: '/jobs-example/schedules',
          auth: 'required',
          authz: 'skip',
          navigation: { title: 'navigation.schedules', icon: CalendarClock },
          breadcrumb: { title: 'navigation.schedules' },
          componentLoader: () => import('./pages/schedules.js'),
        },
      ],
    },
  ]),
];

export default routes;
