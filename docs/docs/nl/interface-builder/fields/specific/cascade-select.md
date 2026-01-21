:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Cascaderende selectie

## Introductie

De cascaderende selector is ontworpen voor relatievelden waarvan de doelcollectie een boomstructuur heeft. Hiermee kunnen gebruikers gegevens selecteren volgens de hiërarchische structuur van de boomcollectie en wordt 'fuzzy search' ondersteund voor snel filteren.

## Gebruiksaanwijzing

- Bij een **één-op-één relatie** is de cascaderende selector **enkelvoudig**.

![20251125214656](https://static-docs.nocobase.com/20251125214656.png)

- Bij een **één-op-veel relatie** is de cascaderende selector **meervoudig**.

![20251125215318](https://static-docs.nocobase.com/20251125215318.png)

## Veldconfiguratie-opties

### Titelveld

Het titelveld bepaalt het label dat voor elke optie wordt weergegeven.

![20251125214923](https://static-docs.nocobase.com/20251125214923.gif)

> Ondersteunt snel zoeken op basis van het titelveld

![20251125215026](https://static-docs.nocobase.com/20251125215026.gif)

Voor meer details, zie: [Titelveld](/interface-builder/fields/field-settings/title-field)

### Gegevensbereik

Bepaalt het gegevensbereik van de hiërarchische lijst (als een onderliggend record aan de voorwaarden voldoet, wordt het bovenliggende record ook opgenomen).

![20251125215111](https://static-docs.nocobase.com/20251125215111.png)

Voor meer details, zie: [Gegevensbereik](/interface-builder/fields/field-settings/data-scope)

Meer veldcomponenten: [Veldcomponenten](/interface-builder/fields/association-field)