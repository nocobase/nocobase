/**
 * Shared key for the person's explicit, durable language choice. The browser's language switcher writes it and the
 * server reads it, and plugins that store preferences differently, such as Demo Mode, import it instead of repeating it.
 */
export const USER_LOCALE_PREFERENCE_KEY = 'i18n.locale';
