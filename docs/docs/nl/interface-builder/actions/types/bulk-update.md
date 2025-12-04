---
pkg: "@nocobase/plugin-action-bulk-update"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Bulkupdate

## Introductie

De bulkupdate-actie gebruikt u wanneer u dezelfde update wilt toepassen op een groep records. Voordat u een bulkupdate uitvoert, moet u de logica voor veldtoewijzing vooraf definiëren. Deze logica wordt toegepast op alle geselecteerde records wanneer u op de updateknop klikt.

![20251029195320](https://static-docs.nocobase.com/20251029195320.png)

## Actieconfiguratie

![20251029195729](https://static-docs.nocobase.com/20251029195729.png)

### Te updaten gegevens

Geselecteerd/Alles, standaard is 'Geselecteerd'.

![20251029200034](https://static-docs.nocobase.com/20251029200034.png)

### Veldtoewijzing

Stel de velden in voor de bulkupdate. Alleen de ingestelde velden worden bijgewerkt.

Zoals weergegeven in de afbeelding, configureert u de bulkupdate-actie in de ordertabel om de geselecteerde gegevens in bulk te updaten naar "In afwachting van goedkeuring".

![20251029200109](https://static-docs.nocobase.com/20251029200109.png)

- [Bewerkknop](/interface-builder/actions/action-settings/edit-button): Bewerk de titel, het type en het pictogram van de knop;
- [Koppelingsregel](/interface-builder/actions/action-settings/linkage-rule): Toon/verberg de knop dynamisch;
- [Dubbele controle](/interface-builder/actions/action-settings/double-check)