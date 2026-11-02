---
'@nocobase/app-plugin-agents': patch
'@nocobase/app-plugin-projects': patch
---

Initialize the project manager's name and description once in the installation's default language and allow administrators to edit them, including clearing the description. Restarts and unrelated settings saves preserve the identity. Later changes to the installation language do not rename an initialized manager.

An upgrade seed preserves valid explicit settings, custom legacy agent values, empty descriptions, and unknown settings. Legacy agent values identical to the former built-in English defaults cannot be distinguished from manual writes and are initialized in the upgrade language when no valid explicit setting exists. A damaged `studioSettings.projectManager.value` stops initialization with a repair instruction instead of overwriting it.

Resolve historical run inputs, notifications, delegation cards, plans, and consultation identity labels from stable agent IDs without rewriting historical text or execution snapshots. Legacy limit notices and plans whose identity cannot be recovered use neutral labels, and unresolved consultations mark the originally requested subject. Refresh identity caches when the manager is renamed.

Mount application query effects inside the projects plugin's cache using its optional `queryEffects` composition point. Keep completed consultation labels current after renames and distinguish loading, inaccessible agents, and historical request snapshots.
