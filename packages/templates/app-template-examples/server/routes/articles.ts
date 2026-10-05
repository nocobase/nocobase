import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { databaseManagerToken } from '@nocobase/db';
import { ArticlesService } from '../providers/articles-service.js';
import type { Application } from '@nocobase/app-server/application';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  listResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';

import { databaseUnavailable } from './database-unavailable.js';
import {
  EXAMPLES_APP_DOMAIN,
  EXAMPLES_APP_TAGS as tags,
  hideDatabaseUnavailable,
} from './domain.js';
import {
  Article,
  ArticleParams,
  CreateArticleInput,
  ListArticlesQuery,
  UpdateArticleInput,
} from './schemas.js';

const DOMAIN = EXAMPLES_APP_DOMAIN;
const bodyTooLarge = apiErrorResponse(
  413,
  'The article exceeds 512 KiB (`BODY_TOO_LARGE`).',
);

export const articlesRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes((app) => {
    const router = new Hono();
    const routes = new Hono();
    routes.onError(apiErrorHandler);
    if (!app.container.has(databaseManagerToken)) {
      routes.all('*', hideDatabaseUnavailable, (c) =>
        databaseUnavailable(c, DOMAIN),
      );
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
    // Each route declares itself before its validators, which document its input.
    routes.get(
      '/',
      describeRoute({
        tags,
        summary: 'List articles',
        operationId: 'examplesListArticles',
        description:
          'Articles whose title matches `q`, optionally of one `status`, paged by `page` and `pageSize`.',
        responses: {
          200: listResponse(Article),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      }),
      apiValidator('query', ListArticlesQuery),
      async (c) => c.json(await articles.list(c.req.valid('query'))),
    );
    routes.post(
      '/',
      describeRoute({
        tags,
        summary: 'Create an article',
        operationId: 'examplesCreateArticle',
        description: 'A published article records when it was published.',
        responses: {
          201: dataResponse(Article, 'The created article.'),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
          413: bodyTooLarge,
        },
      }),
      apiValidator('json', CreateArticleInput),
      async (c) =>
        c.json({ data: await articles.create(c.req.valid('json')) }, 201),
    );
    routes.patch(
      '/:articleId',
      describeRoute({
        tags,
        summary: 'Update an article',
        operationId: 'examplesUpdateArticle',
        description: 'Changes only the fields the body names.',
        responses: {
          200: dataResponse(Article),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
          404: apiErrorResponse(
            404,
            'The article does not exist (`ARTICLE_NOT_FOUND`).',
          ),
          413: bodyTooLarge,
        },
      }),
      apiValidator('param', ArticleParams),
      apiValidator('json', UpdateArticleInput),
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
