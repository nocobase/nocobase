import { i18n } from '@nocobase/client';
import locale from './locale'

Object.keys(locale).forEach((lang) => {
    i18n.addResources(lang, 'plugin-comment', locale[lang]);
});

export * from './CommentBlockInitializer';
export * from './CommentProvider';
export { CommentProvider as default } from './CommentProvider';
