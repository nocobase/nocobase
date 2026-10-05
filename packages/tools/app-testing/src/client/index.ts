// What a test imports to render a page inside a client application. Nothing here reaches @nocobase/db-testing or a
// database driver, so it loads in a jsdom environment.
export {
  renderWithApp,
  type RenderedApp,
  type RenderWithAppOptions,
  type TestClientServer,
} from './render.js';
export { answerApi, type ApiCall } from './answer-api.js';
export type { TestToast } from './toaster.js';
