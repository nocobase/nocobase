import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { PreviewApi } from './api.js';
import type { PreviewService } from './service.js';

/** Pull request previews (`service.ts`), bound by `StudioPreviewsProvider`. */
export const studioPreviewsToken: ServiceToken<PreviewService> =
  createServiceToken<PreviewService>('studio/previews');

/** Previews through the issues their pull requests are linked to (`api.ts`), for the routes and the CLI. */
export const studioPreviewApiToken: ServiceToken<PreviewApi> =
  createServiceToken<PreviewApi>('studio/previews/api');
