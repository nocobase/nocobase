import {
  SnowflakeIdGenerator,
  type IdGeneratorService,
} from '@nocobase/snowflake';

let standalone: IdGeneratorService | undefined;

/**
 * The generator node runs and resume requests take their ids from.
 *
 * An application passes the one it registers for the whole process, whose
 * worker id is unique per instance. Without one — a test, or an engine built by
 * hand — a single process-wide generator on worker 0 stands in, which is only
 * safe while one process writes to the database.
 */
export function resolveIdGenerator(
  provided?: IdGeneratorService,
): IdGeneratorService {
  if (provided) return provided;
  standalone ??= new SnowflakeIdGenerator({ workerId: 0 });
  return standalone;
}
