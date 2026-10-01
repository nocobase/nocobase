---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
---

`RouteChildPage` covers the page it is rendered in even when it is rendered inside another child page, as a covering page under a tab of a record's page is. It was one element that both positioned and scrolled, so a layer inside it scrolled out of sight once that page had been scrolled. It is now two elements, the way the layout's content area is: the outer one positions and never scrolls, the inner one scrolls and stops scrolling at the layer instead of carrying on into the page beneath. Inside another child page it also switches off everything of that page around it — its header and tab bar — not only its own siblings.

`AGENTS.md` states that on a page with tabs an overlay the page's header opens is declared under every tab and linked through the current tab. An application generated earlier can copy `client/components/route-child-page.tsx` from the template; its API is unchanged, and the layer now carries `data-slot='route-child-page'`.
