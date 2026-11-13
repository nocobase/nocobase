import type { KnowledgeServerResource } from './en-US.js';

const idID: KnowledgeServerResource = {
  access: {
    businessSection: 'Pengetahuan',
    businesses: {
      knowledge: {
        title: 'Pengetahuan',
        description: 'Dokumen dari setiap ruang pengetahuan.',
        actions: {
          read: {
            title: 'Membaca pengetahuan',
            description:
              'Membaca pengetahuan sistem dan ruang yang terkait dengannya',
            related: 'Membaca pengetahuan (ruang yang berhubungan dengannya)',
            relatedLabel: 'Ruang yang berhubungan dengan saya',
            relatedHint:
              'Aplikasi memutuskan ruang mana yang berhubungan dengan siapa',
            all: 'Baca pengetahuan (semua)',
          },
          propose: {
            title: 'Usulkan ilmu',
            description:
              'Usulkan perubahan bagi seseorang yang dapat mengedit untuk memutuskan; agen apa yang dapat diberikan',
            related: 'Usulkan pengetahuan (ruang yang berhubungan dengannya)',
            relatedLabel: 'Ruang yang berhubungan dengan saya',
            relatedHint:
              'Aplikasi memutuskan ruang mana yang berhubungan dengan siapa',
            all: 'Usulkan ilmu (semua)',
          },
          edit: {
            title: 'Edit pengetahuan',
            description:
              'Mengedit, mengarsipkan dan menandai terverifikasi, dan memutuskan proposal; pengetahuan sistem membutuhkan semua',
            related: 'Edit pengetahuan (ruang yang berhubungan dengannya)',
            relatedLabel: 'Ruang yang berhubungan dengan saya',
            relatedHint:
              'Aplikasi memutuskan ruang mana yang berhubungan dengan siapa',
            all: 'Edit pengetahuan (semua)',
          },
          manage: {
            title: 'Kelola akses pengetahuan',
            description:
              'Mengubah siapa yang boleh mengakses setiap folder dan artikel, dan tetap mengakses semuanya; pengetahuan sistem membutuhkan semua',
            related: 'Kelola akses pengetahuan (ruang yang terkait dengannya)',
            relatedLabel: 'Ruang yang berhubungan dengan saya',
            relatedHint:
              'Aplikasi memutuskan ruang mana yang berhubungan dengan siapa',
            all: 'Kelola akses pengetahuan (semua)',
          },
        },
      },
    },
  },
};

export default idID;
