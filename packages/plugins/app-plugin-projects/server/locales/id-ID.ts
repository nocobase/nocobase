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
      issues: 'Tugas',
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
        title: 'Tugas',
        description:
          'Tugas dan komentarnya, di dalam proyek atau berdiri sendiri.',
        actions: {
          view: {
            title: 'Lihat tugas',
            description: 'Lihat tugas di daftar, papan, dan detailnya',
            related: 'Lihat tugas (yang dapat mereka lihat)',
            relatedLabel: 'Dalam proyek saya bisa melihat',
            relatedHint:
              'Tugas tanpa proyek dan tugas di proyek yang dapat saya lihat',
            all: 'Lihat tugas (semua)',
          },
          create: {
            title: 'Buat tugas',
            description: 'Buat tugas, di dalam proyek atau berdiri sendiri',
            related: 'Buat tugas (di proyek yang dapat mereka lihat)',
            relatedLabel: 'Dalam proyek saya bisa melihat',
            relatedHint:
              'Tugas tanpa proyek atau di proyek yang dapat saya lihat',
            all: 'Buat tugas (semua)',
          },
          edit: {
            title: 'Edit tugas',
            description:
              'Judul, deskripsi, prioritas, tanggal, label, pelaksana dan status terbuka',
            related: 'Edit tugas (yang dapat mereka lihat)',
            relatedLabel: 'Dalam proyek saya bisa melihat',
            relatedHint:
              'Tugas tanpa proyek dan tugas di proyek yang dapat saya lihat',
            all: 'Edit tugas (semua)',
          },
          comment: {
            title: 'Komentari tugas',
            description:
              'Mengomentari, membalas, dan menyelesaikan topik; mengedit dan menghapus komentar mereka sendiri',
            related: 'Komentari tugas (yang dapat mereka lihat)',
            relatedLabel: 'Dalam proyek saya bisa melihat',
            relatedHint:
              'Tugas tanpa proyek dan tugas di proyek yang dapat saya lihat',
            all: 'Komentari tugas (semua)',
          },
          moderateComments: {
            title: 'Komentar moderat',
            description: 'Hapus komentar orang lain',
            related:
              'Moderasi komentar (pada tugas yang mereka pegang atau proyek yang mereka pimpin)',
            relatedLabel:
              'Pada tugas yang saya pegang atau proyek yang saya pimpin',
            relatedHint:
              'Komentar pada tugas yang saya pegang dan pada tugas di proyek yang saya pimpin',
            all: 'Komentar moderat (semua)',
          },
          close: {
            title: 'Tutup tugas',
            description: 'Tandai tugas selesai atau dibatalkan',
            related:
              'Tutup tugas (yang mereka pegang atau di proyek yang mereka pimpin)',
            relatedLabel: 'Yang saya miliki atau proyek yang saya pimpin',
            relatedHint:
              'Tugas yang saya pegang dan tugas di proyek yang saya pimpin',
            all: 'Tutup tugas (semua)',
          },
          changeOwner: {
            title: 'Ganti pemiliknya',
            description:
              'Serahkan tugas kepada orang lain agar ia bertanggung jawab atasnya',
            related:
              'Ganti pemilik (yang mereka miliki atau proyek yang mereka pimpin)',
            relatedLabel: 'Yang saya miliki atau proyek yang saya pimpin',
            relatedHint:
              'Tugas yang saya pegang dan tugas di proyek yang saya pimpin',
            all: 'Ganti pemilik (semua)',
          },
          delete: {
            title: 'Hapus dan pulihkan tugas',
            description: 'Hapus tugas dan pulihkan yang terhapus',
            all: 'Hapus dan pulihkan tugas',
          },
        },
      },
      attachments: {
        title: 'Lampiran',
        description: 'File yang dilampirkan pada tugas dan komentar.',
        actions: {
          upload: {
            title: 'Unggah lampiran',
            description:
              'Lampirkan file ke tugas yang dapat mereka edit dan ke komentar mereka',
            related: 'Unggah lampiran (pada tugas yang dapat mereka lihat)',
            relatedLabel: 'Pada tugas di proyek yang dapat saya lihat',
            relatedHint:
              'File pada tugas tanpa proyek dan pada tugas di proyek yang dapat saya lihat',
            all: 'Unggah lampiran (semua)',
          },
        },
      },
    },
    collections: {
      pmProjects: 'Proyek',
      pmIssues: 'Tugas',
    },
    recordAccess: {
      visible: 'Proyek dan tugas yang dapat mereka lihat',
      managed: 'Proyek yang mereka pimpin dan tugas yang mereka pegang',
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
        title: 'Tugas',
        description:
          'Lihat tugas; buat, edit, komentari, tutup, dan tetapkan ulang; moderasi komentar dan hapus tugas.',
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
    batchDone: 'Semua subtugas {{identifier}} telah selesai',
    batchDoneStage: 'Tahap {{stage}} subtugas {{identifier}} telah selesai',
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
    backlog: 'Backlog',
    blocked: 'Terhambat',
    cancelled: 'Dibatalkan',
    done: 'Selesai',
    in_progress: 'Sedang berlangsung',
    in_review: 'Sedang ditinjau',
  },
};

export default idID;
