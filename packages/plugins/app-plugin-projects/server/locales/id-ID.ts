import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  roles: {
    owner: 'Penanggung jawab',
    admin: 'Admin',
    member: 'Anggota',
  },
  access: {
    sections: {
      projects: 'Proyek',
      issues: 'Isu',
      settings: 'Pengaturan proyek',
      members: 'Anggota dan peran',
    },
    businesses: {
      projects: {
        title: 'Proyek',
        description: 'Proyek, anggotanya, repositori dan kemajuannya.',
        actions: {
          view: {
            title: 'Lihat proyek',
            description: 'Lihat proyek, gambaran umum dan kemajuannya',
            related: 'Lihat proyek (yang dapat mereka lihat)',
            relatedLabel: 'Yang dapat kulihat',
            relatedHint: 'Proyek publik dan swasta yang saya pimpin atau ikuti',
            all: 'Lihat proyek (semua)',
          },
          create: {
            title: 'Buat proyek',
            description: 'Memulai proyek baru dan memimpinnya',
            all: 'Buat proyek',
          },
          manage: {
            title: 'Kelola proyek',
            description:
              'Ganti nama, ubah status, tanggal dan prospek, kelola anggota dan repositori',
            related: 'Kelola proyek (yang mereka pimpin)',
            relatedLabel: 'Yang saya pimpin',
            relatedHint: 'Proyek yang saya pimpin',
            all: 'Kelola proyek (semua)',
          },
          delete: {
            title: 'Hapus proyek',
            description: 'Hapus proyek dan pulihkan proyek yang terhapus',
            all: 'Hapus proyek',
          },
        },
      },
      issues: {
        title: 'Isu',
        description:
          'Masalah dan komentarnya, dalam suatu proyek atau sendiri-sendiri.',
        actions: {
          view: {
            title: 'Lihat masalah',
            description: 'Lihat masalah dalam daftar, papan dan detailnya',
            related: 'Lihat masalah (yang dapat mereka lihat)',
            relatedLabel: 'Dalam proyek saya bisa melihat',
            relatedHint:
              'Masalah tanpa proyek, dan masalah dalam proyek yang dapat saya lihat',
            all: 'Lihat masalah (semua)',
          },
          create: {
            title: 'Ciptakan masalah',
            description: 'Membuat isu, dalam sebuah proyek atau sendiri',
            related: 'Membuat masalah (dalam proyek yang dapat mereka lihat)',
            relatedLabel: 'Dalam proyek saya bisa melihat',
            relatedHint:
              'Masalah tanpa proyek, atau dalam proyek yang dapat saya lihat',
            all: 'Buat masalah (semua)',
          },
          edit: {
            title: 'Edit terbitan',
            description:
              'Judul, deskripsi, prioritas, tanggal, label, pelaksana dan status terbuka',
            related: 'Edit masalah (yang dapat mereka lihat)',
            relatedLabel: 'Dalam proyek saya bisa melihat',
            relatedHint:
              'Masalah tanpa proyek, dan masalah dalam proyek yang dapat saya lihat',
            all: 'Edit terbitan (semua)',
          },
          comment: {
            title: 'Mengomentari masalah',
            description:
              'Mengomentari, membalas, dan menyelesaikan topik; mengedit dan menghapus komentar mereka sendiri',
            related: 'Mengomentari masalah (yang dapat mereka lihat)',
            relatedLabel: 'Dalam proyek saya bisa melihat',
            relatedHint:
              'Masalah tanpa proyek, dan masalah dalam proyek yang dapat saya lihat',
            all: 'Mengomentari masalah (semua)',
          },
          moderateComments: {
            title: 'Komentar moderat',
            description: 'Hapus komentar orang lain',
            related:
              'Komentar moderat (tentang isu yang mereka miliki atau proyek siapa yang mereka pimpin)',
            relatedLabel:
              'Mengenai isu-isu yang saya miliki atau proyek-proyek yang saya pimpin',
            relatedHint:
              'Mengomentari isu-isu yang saya miliki, dan isu-isu dalam proyek yang saya pimpin',
            all: 'Komentar moderat (semua)',
          },
          close: {
            title: 'Tutup masalah',
            description: 'Menandai suatu masalah selesai atau dibatalkan',
            related:
              'Masalah-masalah yang sudah dekat (masalah yang mereka miliki atau proyek yang mereka pimpin)',
            relatedLabel: 'Yang saya miliki atau proyek yang saya pimpin',
            relatedHint:
              'Terbitan yang saya miliki, dan terbitan dalam proyek yang saya pimpin',
            all: 'Tutup masalah (semua)',
          },
          changeOwner: {
            title: 'Ganti pemiliknya',
            description:
              'Serahkan suatu permasalahan kepada orang lain untuk mempertanggungjawabkannya',
            related:
              'Ganti pemilik (yang mereka miliki atau proyek yang mereka pimpin)',
            relatedLabel: 'Yang saya miliki atau proyek yang saya pimpin',
            relatedHint:
              'Terbitan yang saya miliki, dan terbitan dalam proyek yang saya pimpin',
            all: 'Ganti pemilik (semua)',
          },
          delete: {
            title: 'Hapus dan pulihkan masalah',
            description: 'Hapus masalah dan pulihkan masalah yang terhapus',
            all: 'Hapus dan pulihkan masalah',
          },
        },
      },
      attachments: {
        title: 'Lampiran',
        description: 'File terlampir pada terbitan dan komentar.',
        actions: {
          upload: {
            title: 'Unggah lampiran',
            description:
              'Lampirkan file ke terbitan yang dapat mereka edit dan ke komentar mereka',
            related:
              'Unggah lampiran (tentang masalah yang dapat mereka lihat)',
            relatedLabel:
              'Tentang permasalahan dalam proyek yang dapat saya lihat',
            relatedHint:
              'File tentang masalah tanpa proyek, dan masalah dalam proyek yang dapat saya lihat',
            all: 'Unggah lampiran (semua)',
          },
        },
      },
    },
    collections: {
      pmProjects: 'Proyek',
      pmIssues: 'Isu',
    },
    recordAccess: {
      visible: 'Proyek dan masalah yang dapat mereka lihat',
      managed: 'Proyek yang mereka pimpin dan isu yang mereka miliki',
    },
    settings: {
      pm: {
        general: 'Jenderal',
        labels: 'Label',
        members: 'Anggota',
      },
    },
    keyScopes: {
      projects: {
        title: 'Proyek',
        description: 'Lihat proyek; mengelolanya; membuat dan menghapusnya.',
        objects: 'Proyek',
      },
      issues: {
        title: 'Isu',
        description:
          'Lihat masalah; membuat, mengedit, mengomentari, menutup, dan menetapkan ulang; memoderasi komentar dan menghapus masalah.',
      },
      settings: {
        title: 'Pengaturan proyek',
        description: 'Pengaturan umum dan label.',
      },
    },
    actions: {
      view: 'Lihat',
      create: 'Buat',
      manage: 'Kelola',
      edit: 'Edit',
      close: 'Tutup',
      comment: 'Komentar',
      moderateComments: 'Komentar moderat',
      changeOwner: 'Ganti pemilik',
      delete: 'Hapus',
      upload: 'Unggah',
      read: 'Lihat',
      update: 'Edit',
      invite: 'Undang',
      assign: 'Tetapkan peran',
      'define-roles': 'Tentukan peran',
    },
  },
  notifications: {
    batchDone: 'Semua sub-edisi {{identifier}} telah selesai',
    batchDoneStage: 'Tahap {{stage}} dari sub-edisi {{identifier}} selesai',
    commented: '{{actor}} mengomentari {{identifier}}',
    dependencyReleased:
      '{{releasedBy}} selesai, sehingga {{identifier}} dapat dimulai',
    executorAssigned: '{{actor}} menugaskan {{identifier}} kepada Anda',
    mentioned: {
      comment: '{{actor}} menyebut Anda di {{identifier}}',
      description: '{{actor}} menyebut Anda di {{identifier}}',
    },
    ownerAssigned: '{{actor}} menjadikan Anda pemilik {{identifier}}',
    someone: 'Seseorang',
    statusChanged: '{{identifier}} dipindahkan ke {{status}}',
    ownerNotified: '{{identifier}} sekarang menjadi {{status}}',
  },
  status: {
    backlog: 'Tunggakan',
    blocked: 'Terhambat',
    cancelled: 'Dibatalkan',
    done: 'Selesai',
    in_progress: 'Sedang berlangsung',
    in_review: 'Sedang ditinjau',
  },
};

export default idID;
