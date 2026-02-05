---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Bijlagen exporteren

## Introductie

Met de exportfunctie voor bijlagen kunt u velden die gerelateerd zijn aan bijlagen exporteren als een gecomprimeerd bestand.

#### Configuratie voor het exporteren van bijlagen

![20251029173251](https://static-docs.nocobase.com/20251029173251.png)

![20251029173425](https://static-docs.nocobase.com/20251029173425.png)

![20251029173345](https://static-docs.nocobase.com/20251029173345.png)

- Configureer de bijlagevelden die u wilt exporteren; u kunt meerdere velden selecteren.
- U kunt kiezen of u voor elke record een aparte map wilt genereren.

Naamgevingsregels voor bestanden:

- Als u ervoor kiest om voor elke record een map te genereren, is de naamgevingsregel voor het bestand: `{Waarde van het titelveld van de record}/{Naam van het bijlageveld}[-{Bestandsvolgnummer}].{Bestandsextensie}`.
- Als u ervoor kiest geen map te genereren, is de naamgevingsregel voor het bestand: `{Waarde van het titelveld van de record}-{Naam van het bijlageveld}[-{Bestandsvolgnummer}].{Bestandsextensie}`.

Het bestandsvolgnummer wordt automatisch gegenereerd wanneer een bijlageveld meerdere bijlagen bevat.

- [Koppelingsregel](/interface-builder/actions/action-settings/linkage-rule): Dynamisch de knop tonen/verbergen;
- [Knop bewerken](/interface-builder/actions/action-settings/edit-button): Bewerk de titel, het type en het pictogram van de knop;