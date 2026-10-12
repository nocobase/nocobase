# Documentation Site

## Sidebar Groups

Sidebar groups must be collapsed by default to keep navigation compact. Set `"collapsed": true` on every collapsible group in `_meta.json`, including nested directory groups, and apply the same setting across all language versions. Follow this convention when adding or updating sidebar groups.

Preserve manual expansion and Rspress's automatic expansion of the current page's ancestor groups so readers can locate the page in the sidebar.

## Capability Module Navigation

Capability modules listed as directories in `docs/<lang>/capabilities/_meta.json` use their own `_meta.json` as the sidebar root. Maintain each module's order and nested groups there; do not duplicate its menu in the theme. `pluginCrossRefSidebar` generates the module sidebar with a localized link back to the capabilities overview. Standalone module overview layouts may hide the sidebar, while their documentation subpages retain it.
