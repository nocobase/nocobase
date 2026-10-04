import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { databaseManagerToken } from '@nocobase/db';
import { ArticlesService } from '../providers/articles-service.js';
import type { Application } from '@nocobase/app-server/application';
import {
  ApiError,
  apiErrorHandler,
  defineApiRoutes,
  parseApiInput,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { validator } from 'hono/validator';

import { databaseUnavailable } from './database-unavailable.js';
import { EXAMPLES_APP_DOMAIN } from './domain.js';
import {
  ArticleParams,
  CreateArticleInput,
  ListArticlesQuery,
  UpdateArticleInput,
} from './schemas.js';

const DOMAIN = EXAMPLES_APP_DOMAIN;

export const articlesRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes((app) => {
    const router = new Hono();
    const routes = new Hono();
    routes.onError(apiErrorHandler);
    if (!app.container.has(databaseManagerToken)) {
      routes.all('*', (c) => databaseUnavailable(c, DOMAIN));
      return router.route('/articles', routes);
    }
    const articles = new ArticlesService(
      app.container.resolve(databaseManagerToken),
    );
    const auth = app.container.resolve(authenticationToken);
    routes.use(
      '*',
      auth.required(),
      bodyLimit({
        maxSize: 512 * 1024,
        onError: (c) =>
          apiErrorHandler(
            new ApiError({
              status: 'INVALID_ARGUMENT',
              reason: 'BODY_TOO_LARGE',
              domain: DOMAIN,
              message: 'The article exceeds 512 KiB.',
              httpStatus: 413,
            }),
            c,
          ),
      }),
    );
    routes.get(
      '/',
      validator('query', (value) => parseApiInput(ListArticlesQuery, value)),
      async (c) => c.json(await articles.list(c.req.valid('query'))),
    );
    routes.post(
      '/',
      validator('json', (value) => parseApiInput(CreateArticleInput, value)),
      async (c) =>
        c.json({ data: await articles.create(c.req.valid('json')) }, 201),
    );
    routes.patch(
      '/:articleId',
      validator('param', (value) => parseApiInput(ArticleParams, value)),
      validator('json', (value) => parseApiInput(UpdateArticleInput, value)),
      async (c) => {
        const { articleId } = c.req.valid('param');
        const article = await articles.update(
          Number(articleId),
          c.req.valid('json'),
        );
        if (!article)
          throw new ApiError({
            status: 'NOT_FOUND',
            reason: 'ARTICLE_NOT_FOUND',
            domain: DOMAIN,
            message: `Article ${articleId} was not found.`,
          });
        return c.json({ data: article });
      },
    );
    return router.route('/articles', routes);
  });
