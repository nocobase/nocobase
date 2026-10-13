import { defineSeed, type SeedDefinition } from '@nocobase/db';

// Studio's preset issue labels, so a new installation can tag issues right away. Their names follow the installation's
// language (`i18n.defaultLocale`): Chinese for a `zh` locale, English otherwise. They are ordinary labels afterwards,
// renamed, recolored or deleted like any other.
//
// Nothing is seeded where the projects plugin's `pmLabels` is missing. A label whose name already exists is left as it
// is, so a replay adds nothing and a label someone created or changed keeps its color.
//
// Self-contained on purpose: a seed is a fixed historical operation, so nothing is imported from server/ or shared/.

interface Preset {
  readonly key: string;
  readonly zh: string;
  readonly en: string;
  readonly color: string;
}

const PRESETS: readonly Preset[] = [
  { key: 'bug', zh: 'Bug', en: 'Bug', color: 'red' },
  { key: 'feature', zh: '功能', en: 'Feature', color: 'blue' },
  { key: 'improvement', zh: '优化', en: 'Improvement', color: 'green' },
  { key: 'docs', zh: '文档', en: 'Docs', color: 'gray' },
  { key: 'ux', zh: '体验', en: 'UX', color: 'purple' },
  { key: 'performance', zh: '性能', en: 'Performance', color: 'orange' },
  { key: 'security', zh: '安全', en: 'Security', color: 'yellow' },
  { key: 'frontend', zh: '前端', en: 'Frontend', color: 'blue' },
  { key: 'backend', zh: '后端', en: 'Backend', color: 'purple' },
];

const seed: SeedDefinition = defineSeed({
  name: '202610010060_studio_preset_labels',
  transaction: true,
  async run(context) {
    const { config } = context;
    // `pmLabels` holds timezone-aware timestamps, whose encoding differs by dialect; the repository writes them.
    const labels = context.repository('pmLabels');
    // A missing Collection is reported before any SQL runs, so probing leaves the transaction usable.
    try {
      await labels.exists();
    } catch (error) {
      if (
        error instanceof Error &&
        Reflect.get(error, 'code') === 'COLLECTION_NOT_FOUND'
      )
        return;
      throw error;
    }
    const chinese = config
      .get<string>('i18n.defaultLocale')
      ?.toLowerCase()
      .startsWith('zh');
    for (const preset of PRESETS) {
      const name = chinese ? preset.zh : preset.en;
      if (await labels.exists({ filter: { name } })) continue;
      const id = `studio-label-${preset.key}`;
      if (await labels.exists({ filter: { id } })) continue;
      const now = new Date();
      await labels.createOne({
        values: {
          id,
          name,
          color: preset.color,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
  },
});

export default seed;
