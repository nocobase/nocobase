import type { KnowledgeServerResource } from './en-US.js';

const jaJP: KnowledgeServerResource = {
  access: {
    businessSection: '知識',
    businesses: {
      knowledge: {
        title: '知識',
        description: '各知識空間のドキュメント。',
        actions: {
          read: {
            title: '知識を読む',
            description: 'システム知識とそれに関連する空間の知識を読む',
            related: '知識を読む（それに関連するスペース）',
            relatedLabel: '私に関係のあるスペース',
            relatedHint:
              'どのスペースが誰に関係するかはアプリケーションが決定します',
            all: '知識を読む(全て)',
          },
          propose: {
            title: '知識の提案',
            description:
              '編集者が決定できるように変更を提案します。どのようなエージェントが与えられるか',
            related: '知識の提案（それに関わる空間）',
            relatedLabel: '私に関係のあるスペース',
            relatedHint:
              'どのスペースが誰に関係するかはアプリケーションが決定します',
            all: '提案知識(全て)',
          },
          edit: {
            title: '編集知識',
            description:
              '提案を編集、アーカイブ、検証済みとしてマークし、決定します。システム知識はすべて必要です',
            related: 'ナレッジの編集（関連するスペース）',
            relatedLabel: '私に関係のあるスペース',
            relatedHint:
              'どのスペースが誰に関係するかはアプリケーションが決定します',
            all: '編集知識(全て)',
          },
          manage: {
            title: 'ナレッジアクセスを管理する',
            description:
              '各フォルダーと記事にアクセスできるユーザーを変更し、すべてのフォルダーと記事へのアクセスを維持します。システム知識はすべて必要です',
            related: 'ナレッジアクセス（それに関連するスペース）を管理する',
            relatedLabel: '私に関係のあるスペース',
            relatedHint:
              'どのスペースが誰に関係するかはアプリケーションが決定します',
            all: 'ナレッジアクセスの管理(すべて)',
          },
        },
      },
    },
  },
};

export default jaJP;
