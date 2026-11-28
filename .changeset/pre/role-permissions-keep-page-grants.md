---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Saving a role without touching a menu keeps each of its pages' access as stored, so a menu where only some pages open no longer opens the rest; checking or unchecking the menu still opens or closes all of them. Hidden data scopes of an action the role already has are kept exactly, missing or empty values included, and only an action turned on now gets their initial value. The role editor shows a stored data scope wider than View, or one View does not list, as it is until an administrator changes View, and its three tabs wrap their names and counts on phones.
