# Documentation Site

## Sidebar Groups

Sidebar groups must be collapsed by default to keep navigation compact. Set `"collapsed": true` on every collapsible group in `_meta.json`, including nested directory groups, and apply the same setting across all language versions. Follow this convention when adding or updating sidebar groups.

A group that contains the current page always renders expanded, and a group a reader opens or closes stays that way for the rest of the visit, so readers can locate the page in the sidebar.

## Capability Module Navigation

Capability modules listed as directories in `docs/<lang>/capabilities/_meta.json` use their own `_meta.json` as the sidebar root. Maintain each module's order and nested groups there; do not duplicate its menu in the site code. `src/lib/sidebar.ts` builds the module sidebar with a localized link back to the capabilities overview. Module overview pages are hand-built and have no sidebar, while their documentation subpages retain it.

For everything else about the site — layouts, adding a page, SEO and llms outputs, checks — read `.agents/rules/docs-site.md` at the repository root.
