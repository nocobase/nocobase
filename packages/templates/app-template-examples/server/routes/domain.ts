/**
 * The error domain of every route this application owns, such as `/api/articles` and `/api/numericExamples`: one
 * domain for the whole application, as one plugin has one, whatever URL prefixes its routes use. Routes the
 * framework generates, such as Repository data endpoints, report the framework's domain `app` instead.
 */
export const EXAMPLES_APP_DOMAIN = 'examples';
