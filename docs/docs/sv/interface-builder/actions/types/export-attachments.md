---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Exportera bilagor

## Introduktion

Bilageexport stöder export av bilagerelaterade fält som ett komprimerat paket.

#### Konfiguration för bilageexport

![20251029173251](https://static-docs.nocobase.com/20251029173251.png)

![20251029173425](https://static-docs.nocobase.com/20251029173425.png)

![20251029173345](https://static-docs.nocobase.com/20251029173345.png)

- Konfigurera de bilagefält som ska exporteras; flera val stöds.
- Ni kan välja om en mapp ska genereras för varje post.

Filnamnsregler:

- Om ni väljer att generera en mapp för varje post, är filnamnsregeln: `{Postens titelfältvärde}/{Bilagefältets namn}[-{Filens ordningsnummer}].{Filändelse}`.
- Om ni väljer att inte generera en mapp, är filnamnsregeln: `{Postens titelfältvärde}-{Bilagefältets namn}[-{Filens ordningsnummer}].{Filändelse}`.

Filens ordningsnummer genereras automatiskt när ett bilagefält innehåller flera bilagor.

- [Kopplingsregel](/interface-builder/actions/action-settings/linkage-rule): Visar/döljer knappen dynamiskt;
- [Redigera knapp](/interface-builder/actions/action-settings/edit-button): Redigera knappens titel, typ och ikon;