---
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
"@nocobase/app-template-hub": patch
---

Build the App, Settings and Dev sidebars from shadcn's Sidebar primitives, keeping the collapsed-menu tooltips and popovers, permission filtering, shared collapse preference and phone navigation. The shadcn `sidebar.tsx` stays as the CLI writes it: widths follow the spacing scale, the phone sheet has a translated title, and Ctrl/Cmd+B no longer toggles the sidebar. The Sheet close button is translated. The edge rail toggles the icon mode with a translated label, and the footer spaces its slogan, name and version like the menu above it, leaving only the shield with a tooltip in icon mode.
