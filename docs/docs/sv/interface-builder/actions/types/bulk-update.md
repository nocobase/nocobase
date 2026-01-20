---
pkg: "@nocobase/plugin-action-bulk-update"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Massuppdatering

## Introduktion

Massuppdateringsåtgärden används när ni behöver tillämpa samma uppdatering på en grupp poster. Innan ni utför en massuppdatering behöver ni fördefiniera logiken för fältvärdestilldelning för uppdateringen. Denna logik kommer att tillämpas på alla valda poster när ni klickar på uppdateringsknappen.

![20251029195320](https://static-docs.nocobase.com/20251029195320.png)

## Konfiguration av åtgärd

![20251029195729](https://static-docs.nocobase.com/20251029195729.png)

### Data att uppdatera

Valda/Alla, standard är Valda.

![20251029200034](https://static-docs.nocobase.com/20251029200034.png)

### Fältvärdestilldelning

Ange fälten för massuppdatering. Endast de fält som ni anger kommer att uppdateras.

Som visas i bilden kan ni konfigurera massuppdateringsåtgärden i ordertabellen för att massuppdatera de valda uppgifterna till "Väntar på godkännande".

![20251029200109](https://static-docs.nocobase.com/20251029200109.png)

- [Redigera knapp](/interface-builder/actions/action-settings/edit-button): Redigera knappens titel, typ och ikon;
- [Kopplingsregel](/interface-builder/actions/action-settings/linkage-rule): Visa/dölj knappen dynamiskt;
- [Dubbelkontroll](/interface-builder/actions/action-settings/double-check)