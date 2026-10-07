// Step `skills`: the run's skills, fetched once per content hash and placed in the runner's folder in the subject's
// work directory, with the skills the run's CLI ships in its package (found from the CLI the `cli` step installed),
// where the adapter registers them for its tool (src/agent/skills.ts).
import { cliSkills, placeSkills } from '../skills.ts';
import type { PrepareStep } from './types.ts';

export const skillsStep: PrepareStep = {
  name: 'skills',
  failure: 'setupFailed',
  async run(context) {
    const workDir = context.workspace?.workDir;
    if (workDir === undefined) throw new Error('The workspace is not locked.');
    const placed = await placeSkills({
      paths: context.paths,
      appKey: context.registration.key,
      workDir,
      skills: context.payload.skills,
      client: context.client,
      log: context.log,
      builtIn:
        context.cliEntry === undefined
          ? []
          : cliSkills(context.cliEntry, context.payload.cli.name),
    });
    if (placed.placement === undefined) return;
    context.skills = placed.placement;
    context.event({
      type: 'status',
      content: `Skills: ${placed.placement.slugs.join(', ')}`,
      meta: {
        phase: 'skills',
        dir: placed.placement.dir,
        skills: placed.placement.slugs,
        fetched: placed.fetched,
      },
    });
  },
};
