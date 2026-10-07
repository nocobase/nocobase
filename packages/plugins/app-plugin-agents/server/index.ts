export { default } from './plugin.js';
/** What the plugin registers with the authorization plugin at boot, for an application or a test assembling it by hand. */
export {
  registerBusinesses,
  registerSettings,
} from './providers/authorization.js';
