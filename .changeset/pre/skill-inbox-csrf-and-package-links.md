---
'@nocobase/app-plugin-notification': patch
'@nocobase/app-plugin-notification-in-app': patch
'@nocobase/app-plugin-agents': patch
---

The notification Skill no longer tells an agent that in-app inbox writes need a CSRF token, matching the in-app plugin, whose writes are protected by the authentication plugin's origin check. The in-app Skill's description no longer promises a Client page the plugin does not contribute. The agents and in-app Skills name their package's `docs/` and `README.md` files instead of linking outside the Skill folder, so the links no longer break once the Skills are synchronized into an application's `.agents/skills/`, and the agents extension points table links to `online-agent.md` by its real name.
