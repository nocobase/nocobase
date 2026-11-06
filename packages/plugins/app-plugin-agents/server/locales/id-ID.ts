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
            title: 'Ubah agen dan keterampilan',
            description:
              'Mengubah pengaturan agen, keterampilan dan variabel, mengarsipkan, memulihkan dan menghapusnya, dan mengedit keterampilan. Seorang agen tidak diberikan kemampuan selain kemampuan editor',
            related:
              'Agen perubahan dan keterampilan (agen yang mereka miliki dan keterampilan yang mereka ciptakan)',
            relatedLabel:
              'Agen yang saya miliki dan keterampilan yang saya buat',
            relatedHint:
              'Agen yang saya miliki, dan keterampilan yang saya ciptakan',
            all: 'Agen perubahan dan keterampilan (semua)',
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
          'Lihat agen, keterampilan, dan lari; ubah agen dan keterampilan, batalkan dan coba lagi.',
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
