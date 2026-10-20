import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  access: {
    section: 'Rilis',
    pages: {
      'rel-apps': 'Aplikasi',
    },
    businessSection: 'Rilis',
    businesses: {
      apps: {
        title: 'Aplikasi',
        description: 'Aplikasi, rilisnya, penerapannya, dan waktu prosesnya.',
        actions: {
          view: {
            title: 'Lihat Aplikasi',
            description:
              'Lihat Aplikasi, rilis, penerapan, dan status runtimenya',
            related: 'Lihat Aplikasi (yang terkait dengannya)',
            relatedLabel: 'Yang aku buat',
            relatedHint:
              'Aplikasi yang saya buat, dan aplikasi apa pun yang berhubungan dengan saya',
            all: 'Lihat Aplikasi (semua)',
          },
          readLogs: {
            title: 'Baca log',
            description: 'Membaca log Aplikasi dan penerapan',
            related: 'Baca log (yang terkait dengannya)',
            relatedLabel: 'Yang aku buat',
            relatedHint:
              'Aplikasi yang saya buat, dan aplikasi apa pun yang berhubungan dengan saya',
            all: 'Baca log (semua)',
          },
          create: {
            title: 'Buat Aplikasi',
            description: 'Membuat Aplikasi di suatu lingkungan',
            all: 'Buat Aplikasi',
          },
          configure: {
            title: 'Konfigurasikan Aplikasi',
            description:
              'Membaca dan mengubah konfigurasi Aplikasi, yang mungkin menyimpan rahasia',
            related: 'Konfigurasikan Aplikasi (yang terkait dengannya)',
            relatedLabel: 'Yang aku buat',
            relatedHint:
              'Aplikasi yang saya buat, dan aplikasi apa pun yang berhubungan dengan saya',
            all: 'Konfigurasikan Aplikasi (semua)',
          },
          upload: {
            title: 'Unggah rilis',
            description: 'Unggah dan promosikan rilis',
            related: 'Unggah rilis (yang terkait dengannya)',
            relatedLabel: 'Yang aku buat',
            relatedHint:
              'Aplikasi yang saya buat, dan aplikasi apa pun yang berhubungan dengan saya',
            all: 'Unggah rilis (semua)',
          },
          deploy: {
            title: 'Sebarkan',
            description:
              'Menyebarkan dan memutar kembali pada lingkungan yang tidak dilindungi, meminta penerapan ke lingkungan yang dilindungi',
            related: 'Deploy (yang terkait dengannya)',
            relatedLabel: 'Yang aku buat',
            relatedHint:
              'Aplikasi yang saya buat, dan aplikasi apa pun yang berhubungan dengan saya',
            all: 'Terapkan (semua)',
          },
          deployProtected: {
            title: 'Menyetujui penerapan yang dilindungi',
            description:
              'Menyetujui penerapan pada lingkungan yang dilindungi tanpa menyebutkan nama pemberi persetujuan; hanya orang',
            related:
              'Menyetujui penerapan yang dilindungi (yang terkait dengannya)',
            relatedLabel: 'Yang aku buat',
            relatedHint:
              'Aplikasi yang saya buat, dan aplikasi apa pun yang berhubungan dengan saya',
            all: 'Menyetujui penerapan yang dilindungi (semua)',
          },
          operate: {
            title: 'Mulai dan berhenti',
            description: 'Mulai, hentikan, dan mulai ulang Aplikasi',
            related: 'Mulai dan berhenti (yang berhubungan dengannya)',
            relatedLabel: 'Yang aku buat',
            relatedHint:
              'Aplikasi yang saya buat, dan aplikasi apa pun yang berhubungan dengan saya',
            all: 'Mulai dan hentikan (semua)',
          },
          delete: {
            title: 'Hapus Aplikasi',
            description: 'Hapus Aplikasi beserta datanya',
            related: 'Hapus Aplikasi (yang terkait dengannya)',
            relatedLabel: 'Yang aku buat',
            relatedHint:
              'Aplikasi yang saya buat, dan aplikasi apa pun yang berhubungan dengan saya',
            all: 'Hapus Aplikasi (semua)',
          },
        },
      },
    },
    recordAccess: {
      owned: 'Aplikasi yang mereka buat',
    },
    settings: {
      rel: {
        environments: 'Menyebarkan lingkungan',
      },
    },
    keyScopes: {
      apps: {
        title: 'Aplikasi dan penerapan',
        description:
          'Baca: lihat aplikasi, rilis, penerapan, dan log. Membaca dan menulis: juga mengunggah rilis. Admin: juga menerapkan dan memulai atau menghentikan aplikasi.',
        objects: 'Aplikasi',
      },
      environments: {
        title: 'Menyebarkan lingkungan',
        description:
          'Baca: daftar lingkungan. Membaca dan menulis: mengelolanya.',
      },
      presets: {
        ciDeploy: {
          title: 'Penerapan CI',
          description:
            'Unggah rilis ke aplikasi yang dipilih dan terapkan, selama 90 hari.',
        },
        ciUpload: {
          title: 'Unggahan CI',
          description:
            'Unggah rilis ke aplikasi yang dipilih tanpa menerapkannya, selama 90 hari.',
        },
      },
    },
    actions: {
      read: 'Lihat',
      manage: 'Kelola',
      view: 'Lihat',
      'read-logs': 'Baca log',
      create: 'Buat',
      configure: 'Konfigurasi',
      upload: 'Unggah rilis',
      deploy: 'Sebarkan',
      'deploy-protected': 'Menyetujui penerapan yang dilindungi',
      operate: 'Mulai dan berhenti',
      delete: 'Hapus',
    },
  },
  drivers: {
    host: 'Server ini',
  },
};

export default idID;
