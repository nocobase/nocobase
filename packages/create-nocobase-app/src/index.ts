import { yargs } from '@umijs/utils';
import AppGenerator from './AppGenerator/AppGenerator';

export default async ({
  cwd,
  args,
}: {
  cwd: string;
  args: yargs.Arguments;
}) => {
  const generator = new AppGenerator({
    cwd,
    args,
  });
  await generator.run();
};
