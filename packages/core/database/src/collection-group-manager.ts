import { BaseDumpRules, DumpRules } from './collection';
import Database from './database';

type RequiredGroup = 'required';
type SkippedGroup = 'skipped';

export type BuiltInGroup = RequiredGroup | SkippedGroup;

export type DumpRulesGroupType = BuiltInGroup | string;

// Collection Group is a collection of collections, which can be dumped and restored together.
export interface CollectionGroup {
  collections: string[];
  function: string;
  dataType: DumpRulesGroupType;
  delayRestore?: any;
}

export interface CollectionGroupWithCollectionTitle extends Omit<CollectionGroup, 'collections'> {
  collections: Array<{
    name: string;
    title: string;
  }>;
}

export class CollectionGroupManager {
  constructor(public db: Database) {}

  static unifyDumpRules(dumpRules: DumpRules):
    | (BaseDumpRules & {
        group: DumpRulesGroupType;
      })
    | undefined {
    if (!dumpRules) {
      return undefined;
    }

    if (typeof dumpRules === 'string') {
      return {
        group: dumpRules,
      };
    }

    if ('required' in dumpRules && (dumpRules as { required: true }).required) {
      return {
        ...dumpRules,
        group: 'required',
      };
    }

    if ('skipped' in dumpRules && (dumpRules as { skipped: true }).skipped) {
      return {
        ...dumpRules,
        group: 'skipped',
      };
    }

    return dumpRules as BaseDumpRules & {
      group: DumpRulesGroupType;
    };
  }
}
