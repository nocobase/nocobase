import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  access: {
    section: 'Tim agen',
    businessSection: 'Tim agen',
    businesses: {
      agents: {
        title: 'Agen dan keterampilan',
        description: 'Agen tim dan keterampilan yang mereka gunakan.',
        actions: {
          edit: {
            title: 'Ubah Agent dan keterampilan',
            description:
              'Mengubah pengaturan Agent, keterampilan dan variabel, mengarsipkan, memulihkan dan menghapusnya, dan mengedit keterampilan. Seorang Agent tidak diberikan kemampuan selain kemampuan editor',
            related:
              'Agent perubahan dan keterampilan (Agent yang mereka miliki dan keterampilan yang mereka ciptakan)',
            relatedLabel:
              'Agen yang saya miliki dan keterampilan yang saya buat',
            relatedHint:
              'Agen yang saya miliki, dan keterampilan yang saya ciptakan',
            all: 'Agent perubahan dan keterampilan (semua)',
          },
        },
      },
    },
    settings: {
      agents: {
        agents: 'Agen',
        runners: 'Lingkungan runtime',
        prices: 'Harga model',
        services: 'Layanan model',
      },
    },
    actions: {
      read: 'Lihat',
      manage: 'Kelola',
    },
    keyScopes: {
      agents: {
        title: 'Agen',
        description:
          'Lihat Agent, keterampilan, dan lari; ubah Agent dan keterampilan, batalkan dan coba lagi.',
      },
      runners: {
        title: 'Lingkungan runtime',
        description: 'Lihat runner dan token pendaftaran; mengelola runner.',
      },
      prices: {
        title: 'Harga model',
        description: 'Lihat model harga perkiraan biaya; ubah mereka.',
      },
      services: {
        title: 'Layanan model',
        description:
          'Lihat layanan model dan model yang mereka tawarkan, bukan kuncinya.',
      },
    },
  },
  runnerConversation: {
    title: 'Percakapan: {{title}}',
    other: 'Percakapan orang lain',
    untitled: 'Percakapan baru',
  },
};

export default idID;
