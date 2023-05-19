import Plugin from '..';
import CollectionTrigger from './collection';
import ScheduleTrigger from './schedule';
import { Trigger } from './trigger';

export default function <T extends Trigger>(plugin, more: { [key: string]: { new (p: Plugin): T } } = {}) {
  const { triggers } = plugin;

  triggers.register('collection', new CollectionTrigger(plugin));
  triggers.register('schedule', new ScheduleTrigger(plugin));

  for (const [name, TClass] of Object.entries(more)) {
    triggers.register(name, new TClass(plugin));
  }
}
