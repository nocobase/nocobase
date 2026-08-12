/* eslint-disable @typescript-eslint/no-explicit-any */
import { pluginSass } from '@rsbuild/plugin-sass';
import { defineConfig, type RspressPlugin } from '@rspress/core';
import { pluginLlms } from '@rspress/plugin-llms';
import { pluginSchema } from './plugins/pluginSchema';
import { pluginOgDescription } from './plugins/pluginOgDescription';
import { pluginRemoveGenerator } from './plugins/pluginRemoveGenerator';
import { pluginPreview } from '@rspress/plugin-preview';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';
import {
  pluginCrossRefSidebar,
  crossRefCanonicalMap,
} from './plugins/pluginCrossRef';
import { pluginSearchSections } from './plugins/pluginSearchSections';
import { pluginSearchIndex } from './plugins/pluginSearchIndex';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

const lang = process.env.DOCS_LANG || 'en';
const base = process.env.DOCS_BASE || lang === 'en' ? '/' : `/${lang}/`;
const checkDeadLinks = process.env.CHECK_DEAD_LINKS !== 'false';
const docsAiApiUrl = process.env.DOCS_AI_API_URL || '';
const rspressI18nAliases: Readonly<Record<string, string>> = {
  cn: 'zh',
};

const locales = {
  en: {
    title: 'NocoBase Documentation',
    description: 'Learn and master NocoBase quickly',
  },
  cn: {
    title: 'NocoBase 文档',
    description: '快速学习和掌握 NocoBase',
  },
};

const currentLocale = locales[lang as keyof typeof locales] || locales.en;

const indexLanguages = [
  'en',
  'cn',
  'ja',
  'es',
  'pt',
  'de',
  'fr',
  'ru',
  'id',
  'vi',
];

const langMap = {
  en: 'en-US',
  cn: 'zh-CN',
  ja: 'ja-JP',
  es: 'es-ES',
  pt: 'pt-PT',
  de: 'de-DE',
  fr: 'fr-FR',
  ru: 'ru-RU',
  id: 'id-ID',
  vi: 'vi-VN',
};

/**
 * 搜索结果分组标题里两个固定分组的文案。其余分组的标签由 `pluginSearchSections` 从 `_nav.json` 和
 * 各目录 `index.md` 里读出来，本来就是本地化好的，不需要在这里维护。
 *
 * 缺失语言由 Rspress 自动回落到 `en`，所以只写常用语种即可。
 */
const searchI18nSource: Record<string, Record<string, string>> = {
  searchSectionPlugins: {
    en: 'Plugins',
    zh: '插件',
    ja: 'プラグイン',
    de: 'Plugins',
    es: 'Plugins',
    fr: 'Plugins',
    pt: 'Plugins',
    ru: 'Плагины',
    id: 'Plugin',
    vi: 'Plugin',
  },
  searchSectionOthers: {
    en: 'Others',
    zh: '其他',
    ja: 'その他',
    de: 'Sonstiges',
    es: 'Otros',
    fr: 'Autres',
    pt: 'Outros',
    ru: 'Прочее',
    id: 'Lainnya',
    vi: 'Khác',
  },
};

const docsAiMessages: Record<string, Record<string, string>> = {
  en: {
    docsAiOpen: 'Ask AI',
    docsAiTitle: 'Ask',
    docsAiClose: 'Close documentation assistant',
    docsAiExpand: 'Expand assistant',
    docsAiCollapse: 'Collapse assistant',
    docsAiQuestionPlaceholder: 'Ask a question...',
    docsAiSubmit: 'Ask',
    docsAiQuestionLabel: 'Your question',
    docsAiProgress: 'Progress',
    docsAiLoading: 'Searching the official documentation…',
    docsAiProgressSubmitted:
      'Question submitted; limiting search to docs.nocobase.com',
    docsAiProgressCallingModel: 'Calling DeepSeek',
    docsAiProgressParsingCitations:
      'Response received; parsing official documentation references',
    docsAiProgressVerifyingSources: 'Verifying official documentation pages',
    docsAiProgressSourcesVerified: 'Official documentation sources verified',
    docsAiProgressRetrying: 'The response was incomplete; retrying',
    docsAiSources: 'References',
    docsAiAppliesWhen: 'Notes',
    docsAiSuggestions: 'Common questions',
    docsAiSuggestionOne: 'How do I install and upgrade NocoBase?',
    docsAiSuggestionTwo: 'How do I create collections and pages?',
    docsAiSuggestionThree: 'How do I configure roles and permissions?',
    docsAiError:
      'The AI service is unavailable. Please use documentation search and try again later.',
    docsAiRequestId: 'Request ID',
    docsAiEmptyQuestion: 'Enter a question first.',
  },
  zh: {
    docsAiOpen: '询问 AI',
    docsAiTitle: '询问',
    docsAiClose: '关闭文档 AI 助手',
    docsAiExpand: '展开助手',
    docsAiCollapse: '收起助手',
    docsAiQuestionPlaceholder: '询问一个问题...',
    docsAiSubmit: '提问',
    docsAiQuestionLabel: '你的问题',
    docsAiProgress: '处理进度',
    docsAiLoading: '正在检索官方文档…',
    docsAiProgressSubmitted: '问题已提交，正在限定搜索 docs.nocobase.com',
    docsAiProgressCallingModel: '正在调用 DeepSeek',
    docsAiProgressParsingCitations: '已收到回答，正在解析官方文档引用',
    docsAiProgressVerifyingSources: '正在验证官方文档页面',
    docsAiProgressSourcesVerified: '已验证官方文档来源',
    docsAiProgressRetrying: '本次响应不完整，正在重试',
    docsAiSources: '参考文档',
    docsAiAppliesWhen: '补充说明',
    docsAiSuggestions: '常见问题',
    docsAiSuggestionOne: '如何安装和升级 NocoBase？',
    docsAiSuggestionTwo: '如何创建数据表和页面？',
    docsAiSuggestionThree: '如何配置用户角色与权限？',
    docsAiError: 'AI 服务暂时不可用，请使用文档搜索并稍后重试。',
    docsAiRequestId: '请求编号',
    docsAiEmptyQuestion: '请先输入问题。',
  },
  ja: {
    docsAiOpen: 'AI に質問',
    docsAiTitle: '質問',
    docsAiClose: 'ドキュメント AI アシスタントを閉じる',
    docsAiExpand: 'アシスタントを展開',
    docsAiCollapse: 'アシスタントを折りたたむ',
    docsAiQuestionPlaceholder: '質問を入力...',
    docsAiSubmit: '質問する',
    docsAiQuestionLabel: 'あなたの質問',
    docsAiProgress: '処理状況',
    docsAiLoading: '公式ドキュメントを検索しています…',
    docsAiProgressSubmitted:
      '質問を送信しました。docs.nocobase.com 内を検索しています',
    docsAiProgressCallingModel: 'DeepSeek を呼び出しています',
    docsAiProgressParsingCitations:
      '回答を受信しました。公式ドキュメントの参照を解析しています',
    docsAiProgressVerifyingSources: '公式ドキュメントのページを確認しています',
    docsAiProgressSourcesVerified: '公式ドキュメントの参照元を確認しました',
    docsAiProgressRetrying: '回答が不完全なため、再試行しています',
    docsAiSources: '参考ドキュメント',
    docsAiAppliesWhen: '補足',
    docsAiSuggestions: 'よくある質問',
    docsAiSuggestionOne: 'NocoBase をインストール、アップグレードするには？',
    docsAiSuggestionTwo: 'コレクションとページを作成するには？',
    docsAiSuggestionThree: 'ユーザーロールと権限を設定するには？',
    docsAiError:
      'AI サービスを利用できません。ドキュメント検索を使用し、後でもう一度お試しください。',
    docsAiRequestId: 'リクエスト ID',
    docsAiEmptyQuestion: '先に質問を入力してください。',
  },
  es: {
    docsAiOpen: 'Preguntar a la IA',
    docsAiTitle: 'Preguntar',
    docsAiClose: 'Cerrar el asistente de documentación',
    docsAiExpand: 'Ampliar el asistente',
    docsAiCollapse: 'Contraer el asistente',
    docsAiQuestionPlaceholder: 'Escribe una pregunta...',
    docsAiSubmit: 'Preguntar',
    docsAiQuestionLabel: 'Tu pregunta',
    docsAiProgress: 'Progreso',
    docsAiLoading: 'Buscando en la documentación oficial…',
    docsAiProgressSubmitted:
      'Pregunta enviada; buscando solo en docs.nocobase.com',
    docsAiProgressCallingModel: 'Consultando DeepSeek',
    docsAiProgressParsingCitations:
      'Respuesta recibida; analizando las referencias oficiales',
    docsAiProgressVerifyingSources:
      'Verificando páginas de la documentación oficial',
    docsAiProgressSourcesVerified: 'Fuentes oficiales verificadas',
    docsAiProgressRetrying: 'La respuesta está incompleta; reintentando',
    docsAiSources: 'Referencias',
    docsAiAppliesWhen: 'Notas',
    docsAiSuggestions: 'Preguntas frecuentes',
    docsAiSuggestionOne: '¿Cómo instalo y actualizo NocoBase?',
    docsAiSuggestionTwo: '¿Cómo creo colecciones y páginas?',
    docsAiSuggestionThree: '¿Cómo configuro roles y permisos?',
    docsAiError:
      'El servicio de IA no está disponible. Usa la búsqueda de documentación e inténtalo más tarde.',
    docsAiRequestId: 'ID de solicitud',
    docsAiEmptyQuestion: 'Escribe una pregunta primero.',
  },
  pt: {
    docsAiOpen: 'Perguntar à IA',
    docsAiTitle: 'Perguntar',
    docsAiClose: 'Fechar o assistente de documentação',
    docsAiExpand: 'Expandir o assistente',
    docsAiCollapse: 'Recolher o assistente',
    docsAiQuestionPlaceholder: 'Digite uma pergunta...',
    docsAiSubmit: 'Perguntar',
    docsAiQuestionLabel: 'Sua pergunta',
    docsAiProgress: 'Progresso',
    docsAiLoading: 'Pesquisando na documentação oficial…',
    docsAiProgressSubmitted:
      'Pergunta enviada; pesquisando apenas em docs.nocobase.com',
    docsAiProgressCallingModel: 'Consultando o DeepSeek',
    docsAiProgressParsingCitations:
      'Resposta recebida; analisando as referências oficiais',
    docsAiProgressVerifyingSources:
      'Verificando páginas da documentação oficial',
    docsAiProgressSourcesVerified: 'Fontes oficiais verificadas',
    docsAiProgressRetrying: 'A resposta está incompleta; tentando novamente',
    docsAiSources: 'Referências',
    docsAiAppliesWhen: 'Observações',
    docsAiSuggestions: 'Perguntas frequentes',
    docsAiSuggestionOne: 'Como instalar e atualizar o NocoBase?',
    docsAiSuggestionTwo: 'Como criar coleções e páginas?',
    docsAiSuggestionThree: 'Como configurar funções e permissões?',
    docsAiError:
      'O serviço de IA não está disponível. Use a pesquisa da documentação e tente novamente mais tarde.',
    docsAiRequestId: 'ID da solicitação',
    docsAiEmptyQuestion: 'Digite uma pergunta primeiro.',
  },
  de: {
    docsAiOpen: 'KI fragen',
    docsAiTitle: 'Fragen',
    docsAiClose: 'Dokumentationsassistent schließen',
    docsAiExpand: 'Assistenten erweitern',
    docsAiCollapse: 'Assistenten einklappen',
    docsAiQuestionPlaceholder: 'Frage eingeben...',
    docsAiSubmit: 'Fragen',
    docsAiQuestionLabel: 'Deine Frage',
    docsAiProgress: 'Fortschritt',
    docsAiLoading: 'Offizielle Dokumentation wird durchsucht…',
    docsAiProgressSubmitted:
      'Frage gesendet; Suche auf docs.nocobase.com beschränkt',
    docsAiProgressCallingModel: 'DeepSeek wird aufgerufen',
    docsAiProgressParsingCitations:
      'Antwort erhalten; offizielle Verweise werden ausgewertet',
    docsAiProgressVerifyingSources:
      'Seiten der offiziellen Dokumentation werden geprüft',
    docsAiProgressSourcesVerified: 'Offizielle Quellen wurden geprüft',
    docsAiProgressRetrying: 'Die Antwort ist unvollständig; erneuter Versuch',
    docsAiSources: 'Referenzen',
    docsAiAppliesWhen: 'Hinweise',
    docsAiSuggestions: 'Häufige Fragen',
    docsAiSuggestionOne: 'Wie installiere und aktualisiere ich NocoBase?',
    docsAiSuggestionTwo: 'Wie erstelle ich Collections und Seiten?',
    docsAiSuggestionThree: 'Wie konfiguriere ich Rollen und Berechtigungen?',
    docsAiError:
      'Der KI-Dienst ist nicht verfügbar. Nutze die Dokumentationssuche und versuche es später erneut.',
    docsAiRequestId: 'Anfrage-ID',
    docsAiEmptyQuestion: 'Gib zuerst eine Frage ein.',
  },
  fr: {
    docsAiOpen: 'Interroger l’IA',
    docsAiTitle: 'Interroger',
    docsAiClose: 'Fermer l’assistant de documentation',
    docsAiExpand: 'Agrandir l’assistant',
    docsAiCollapse: 'Réduire l’assistant',
    docsAiQuestionPlaceholder: 'Saisissez une question...',
    docsAiSubmit: 'Interroger',
    docsAiQuestionLabel: 'Votre question',
    docsAiProgress: 'Progression',
    docsAiLoading: 'Recherche dans la documentation officielle…',
    docsAiProgressSubmitted:
      'Question envoyée ; recherche limitée à docs.nocobase.com',
    docsAiProgressCallingModel: 'Interrogation de DeepSeek',
    docsAiProgressParsingCitations:
      'Réponse reçue ; analyse des références officielles',
    docsAiProgressVerifyingSources:
      'Vérification des pages de documentation officielles',
    docsAiProgressSourcesVerified: 'Sources officielles vérifiées',
    docsAiProgressRetrying: 'La réponse est incomplète ; nouvelle tentative',
    docsAiSources: 'Références',
    docsAiAppliesWhen: 'Remarques',
    docsAiSuggestions: 'Questions fréquentes',
    docsAiSuggestionOne: 'Comment installer et mettre à niveau NocoBase ?',
    docsAiSuggestionTwo: 'Comment créer des collections et des pages ?',
    docsAiSuggestionThree:
      'Comment configurer les rôles et les autorisations ?',
    docsAiError:
      'Le service d’IA est indisponible. Utilisez la recherche dans la documentation et réessayez plus tard.',
    docsAiRequestId: 'ID de la requête',
    docsAiEmptyQuestion: 'Saisissez d’abord une question.',
  },
  ru: {
    docsAiOpen: 'Спросить ИИ',
    docsAiTitle: 'Спросить',
    docsAiClose: 'Закрыть помощника по документации',
    docsAiExpand: 'Развернуть помощника',
    docsAiCollapse: 'Свернуть помощника',
    docsAiQuestionPlaceholder: 'Введите вопрос...',
    docsAiSubmit: 'Спросить',
    docsAiQuestionLabel: 'Ваш вопрос',
    docsAiProgress: 'Ход выполнения',
    docsAiLoading: 'Поиск в официальной документации…',
    docsAiProgressSubmitted:
      'Вопрос отправлен; поиск ограничен сайтом docs.nocobase.com',
    docsAiProgressCallingModel: 'Обращение к DeepSeek',
    docsAiProgressParsingCitations:
      'Ответ получен; разбор ссылок на официальную документацию',
    docsAiProgressVerifyingSources: 'Проверка страниц официальной документации',
    docsAiProgressSourcesVerified: 'Официальные источники проверены',
    docsAiProgressRetrying: 'Ответ неполный; повторная попытка',
    docsAiSources: 'Ссылки',
    docsAiAppliesWhen: 'Примечания',
    docsAiSuggestions: 'Частые вопросы',
    docsAiSuggestionOne: 'Как установить и обновить NocoBase?',
    docsAiSuggestionTwo: 'Как создать коллекции и страницы?',
    docsAiSuggestionThree: 'Как настроить роли и разрешения?',
    docsAiError:
      'Сервис ИИ недоступен. Используйте поиск по документации и повторите попытку позже.',
    docsAiRequestId: 'ID запроса',
    docsAiEmptyQuestion: 'Сначала введите вопрос.',
  },
  id: {
    docsAiOpen: 'Tanya AI',
    docsAiTitle: 'Tanya',
    docsAiClose: 'Tutup asisten dokumentasi',
    docsAiExpand: 'Perluas asisten',
    docsAiCollapse: 'Ciutkan asisten',
    docsAiQuestionPlaceholder: 'Masukkan pertanyaan...',
    docsAiSubmit: 'Tanya',
    docsAiQuestionLabel: 'Pertanyaan Anda',
    docsAiProgress: 'Progres',
    docsAiLoading: 'Mencari di dokumentasi resmi…',
    docsAiProgressSubmitted:
      'Pertanyaan dikirim; pencarian dibatasi ke docs.nocobase.com',
    docsAiProgressCallingModel: 'Menghubungi DeepSeek',
    docsAiProgressParsingCitations:
      'Jawaban diterima; mengurai referensi dokumentasi resmi',
    docsAiProgressVerifyingSources: 'Memverifikasi halaman dokumentasi resmi',
    docsAiProgressSourcesVerified:
      'Sumber dokumentasi resmi telah diverifikasi',
    docsAiProgressRetrying: 'Jawaban belum lengkap; mencoba lagi',
    docsAiSources: 'Referensi',
    docsAiAppliesWhen: 'Catatan',
    docsAiSuggestions: 'Pertanyaan umum',
    docsAiSuggestionOne: 'Bagaimana cara memasang dan meningkatkan NocoBase?',
    docsAiSuggestionTwo: 'Bagaimana cara membuat koleksi dan halaman?',
    docsAiSuggestionThree: 'Bagaimana cara mengatur peran dan izin?',
    docsAiError:
      'Layanan AI tidak tersedia. Gunakan pencarian dokumentasi dan coba lagi nanti.',
    docsAiRequestId: 'ID permintaan',
    docsAiEmptyQuestion: 'Masukkan pertanyaan terlebih dahulu.',
  },
  vi: {
    docsAiOpen: 'Hỏi AI',
    docsAiTitle: 'Hỏi',
    docsAiClose: 'Đóng trợ lý tài liệu',
    docsAiExpand: 'Mở rộng trợ lý',
    docsAiCollapse: 'Thu gọn trợ lý',
    docsAiQuestionPlaceholder: 'Nhập câu hỏi...',
    docsAiSubmit: 'Hỏi',
    docsAiQuestionLabel: 'Câu hỏi của bạn',
    docsAiProgress: 'Tiến trình',
    docsAiLoading: 'Đang tìm kiếm trong tài liệu chính thức…',
    docsAiProgressSubmitted:
      'Đã gửi câu hỏi; chỉ tìm kiếm trên docs.nocobase.com',
    docsAiProgressCallingModel: 'Đang gọi DeepSeek',
    docsAiProgressParsingCitations:
      'Đã nhận câu trả lời; đang phân tích nguồn tài liệu chính thức',
    docsAiProgressVerifyingSources:
      'Đang xác minh các trang tài liệu chính thức',
    docsAiProgressSourcesVerified: 'Đã xác minh các nguồn tài liệu chính thức',
    docsAiProgressRetrying: 'Câu trả lời chưa đầy đủ; đang thử lại',
    docsAiSources: 'Tài liệu tham khảo',
    docsAiAppliesWhen: 'Ghi chú',
    docsAiSuggestions: 'Câu hỏi thường gặp',
    docsAiSuggestionOne: 'Làm cách nào để cài đặt và nâng cấp NocoBase?',
    docsAiSuggestionTwo: 'Làm cách nào để tạo collection và trang?',
    docsAiSuggestionThree: 'Làm cách nào để cấu hình vai trò và quyền?',
    docsAiError:
      'Dịch vụ AI hiện không khả dụng. Hãy dùng chức năng tìm kiếm tài liệu và thử lại sau.',
    docsAiRequestId: 'ID yêu cầu',
    docsAiEmptyQuestion: 'Hãy nhập câu hỏi trước.',
  },
};

const docsAiI18nSource = Object.fromEntries(
  Object.entries(docsAiMessages.en).map(([key]) => [
    key,
    Object.fromEntries(
      Object.entries(docsAiMessages).map(([language, messages]) => [
        language,
        messages[key],
      ]),
    ),
  ]),
);

function withRspressI18nAliases(
  source: Record<string, Record<string, string>>,
) {
  return Object.fromEntries(
    Object.entries({
      ...source,
      ...searchI18nSource,
      ...docsAiI18nSource,
    }).map(([key, translations]) => {
      const nextTranslations = { ...translations };

      for (const [alias, original] of Object.entries(rspressI18nAliases)) {
        if (!nextTranslations[alias] && nextTranslations[original]) {
          nextTranslations[alias] = nextTranslations[original];
        }
      }

      return [key, nextTranslations];
    }),
  );
}

function sitemap(): RspressPlugin {
  const routes = new Set<string>();

  return {
    name: '@nocobase/custom-sitemap',

    // Collect all route paths during build
    async extendPageData(pageData: any, isProd: boolean) {
      if (!isProd) {
        return;
      }
      if (lang !== 'en') {
        return;
      }
      if (pageData?.routePath) {
        routes.add(pageData.routePath as string);
      }
    },

    // Generate sitemap.xml after build
    async afterBuild(config: any, isProd: boolean) {
      if (!isProd) {
        return;
      }

      if (lang !== 'en') {
        return;
      }

      const baseDomain = 'https://docs.nocobase.com';

      const urlEntries = Array.from(routes)
        .sort()
        .map((routePath) => {
          const links: string[] = [];

          // <loc> uses the canonical English URL
          const loc = `${baseDomain}${routePath}`;

          // Alternate links for each language (same logic as head canonical/alternate)
          for (const language of indexLanguages) {
            if (language === 'en') {
              links.push(
                `    <xhtml:link rel="alternate" hreflang="en-US" href="${baseDomain}${routePath}" />`,
              );
            } else {
              const hreflang = langMap[language as keyof typeof langMap];
              links.push(
                `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${baseDomain}/${language}${routePath}" />`,
              );
            }
          }

          // x-default points to the English URL
          links.push(
            `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseDomain}${routePath}" />`,
          );

          return [
            '  <url>',
            `    <loc>${loc}</loc>`,
            ...links,
            '  </url>',
          ].join('\n');
        })
        .join('\n');

      const sitemapXml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
        urlEntries,
        '</urlset>',
        '',
      ].join('\n');

      const outDir: string = config.outDir;
      const sitemapPath = path.join(outDir, 'sitemap.xml');

      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(sitemapPath, sitemapXml, 'utf-8');
    },
  };
}
export default defineConfig({
  head: [
    [
      'meta',
      {
        name: 'robots',
        content: indexLanguages.includes(lang)
          ? 'index,follow'
          : 'noindex,nofollow',
      },
    ],
    (route) => {
      // 跨模块虚拟路由通过 frontmatter canonicalPath 指向原始页面
      const canonicalRoute =
        crossRefCanonicalMap?.[route.routePath] || route.routePath;
      if (lang !== 'en') {
        return `<link rel="canonical" href="https://docs.nocobase.com/${lang}${canonicalRoute}" />`;
      }
      return `<link rel="canonical" href="https://docs.nocobase.com${canonicalRoute}" />`;
    },
    (route) => {
      const links = [];
      links.push(
        ...indexLanguages.map((language) => {
          if (language === 'en') {
            return `<link rel="alternate" hreflang="en-US" href="https://docs.nocobase.com${route.routePath}" />`;
          }
          const hreflang = langMap[language as keyof typeof langMap];
          return `<link rel="alternate" hreflang="${hreflang}" href="https://docs.nocobase.com/${language}${route.routePath}" />`;
        }),
      );
      links.push(
        `<link rel="alternate" hreflang="x-default" href="https://docs.nocobase.com${route.routePath}" />`,
      );
      return links.join('\n');
    },
  ],
  root: path.join(__dirname, `docs/${lang}`),
  outDir: path.join(__dirname, lang === 'en' ? 'dist' : `dist/${lang}`),
  themeDir: path.join(__dirname, 'theme'),
  base,
  title: currentLocale.title,
  description: currentLocale.description,
  icon: 'https://www.nocobase.com/images/favicon/apple-touch-icon.png',
  logo: {
    light: 'https://static-docs.nocobase.com/20260119193433.png',
    dark: 'https://static-docs.nocobase.com/20260119193447.png',
  },
  route: {
    cleanUrls: true,
  },
  builderConfig: {
    html: {
      tags: [
        {
          tag: 'script',
          // 通过 window.RSPRESS_THEME 变量来指定默认的主题模式
          children: "window.RSPRESS_THEME = 'light';",
        },
      ],
    },
    source: {
      tsconfigPath: path.join(__dirname, 'tsconfig.json'),
      define: {
        'import.meta.env.DOCS_AI_API_URL': JSON.stringify(docsAiApiUrl),
      },
    },
    plugins: [pluginSass(), pluginNodePolyfill()],
    resolve: {
      aliasStrategy: 'prefer-tsconfig',
    },
  },
  markdown: {
    link: {
      checkDeadLinks,
    },
  },
  // Rspress ships built-in Simplified Chinese strings under `zh`, while this site uses `/cn/`.
  i18nSource: (value) => withRspressI18nAliases(value),
  plugins: [
    pluginPreview(),
    pluginLlms(),
    pluginSchema(),
    pluginOgDescription(),
    pluginRemoveGenerator(),
    pluginCrossRefSidebar(),
    pluginSearchSections(),
    pluginSearchIndex(),
    sitemap(),
  ],
  search: {
    // 自定义搜索：结果按文档区分组，插件元信息页沉底。见 theme/search/searchHooks.ts。
    searchHooks: path.join(__dirname, 'theme/search/searchHooks.ts'),
  },
  lang,
  themeConfig: {
    darkMode: false,
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/nocobase/nocobase',
      },
    ],
  },
});
