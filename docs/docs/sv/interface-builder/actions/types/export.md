---
pkg: "@nocobase/plugin-action-export"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Exportera

## Introduktion

Exportfunktionen gör det möjligt att exportera filtrerade poster i **Excel**-format, och ni kan konfigurera vilka fält som ska exporteras. Ni kan välja de fält ni behöver exportera för efterföljande dataanalys, bearbetning eller arkivering. Denna funktion ökar flexibiliteten i datahanteringen, särskilt när data behöver överföras till andra plattformar eller bearbetas vidare.

### Funktionens höjdpunkter:
- **Fältval**: Ni kan konfigurera och välja vilka fält som ska exporteras, vilket säkerställer att den exporterade datan är korrekt och koncis.
- **Stöd för Excel-format**: Den exporterade datan sparas som en standard Excel-fil, vilket gör det enkelt att integrera och analysera den med annan data.

Med den här funktionen kan ni enkelt exportera viktig data från ert arbete för extern användning, vilket förbättrar arbetseffektiviteten.

![20251029170811](https://static-docs.nocobase.com/20251029170811.png)

## Konfiguration av åtgärd

![20251029171452](https://static-docs.nocobase.com/20251029171452.png)

### Exporterbara fält

- Första nivån: Alla fält i den aktuella samlingen;
- Andra nivån: Om det är ett relationsfält behöver ni välja fält från den relaterade samlingen;
- Tredje nivån: Endast tre nivåer hanteras; relationsfälten på den sista nivån visas inte;

![20251029171557](https://static-docs.nocobase.com/20251029171557.png)

- [Kopplingsregel](/interface-builder/actions/action-settings/linkage-rule): Visar/döljer knappen dynamiskt;
- [Redigera knapp](/interface-builder/actions/action-settings/edit-button): Redigera knappens titel, typ och ikon;