---
pkg: "@nocobase/plugin-action-bulk-edit"
---

:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/interface-builder/actions/types/bulk-edit).
:::

# Massredigering

## Introduktion

Massredigering är lämplig för scenarier som kräver flexibla gruppuppdateringar av data. När ni klickar på knappen för massredigering kan ni konfigurera ett formulär för massredigering i ett popup-fönster och ställa in olika uppdateringsstrategier för varje fält.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_13_AM.png)


## Konfiguration av åtgärd

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_13_AM%20(1).png)


## Användarmanual

### Konfiguration av formulär för massredigering

1. Lägg till en knapp för massredigering.

2. Ställ in omfattningen för massredigeringen: Valda / Alla, förvalt är Valda.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_14_AM.png)

3. Lägg till ett formulär för massredigering.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_14_AM.png)

4. Konfigurera de fält som ska redigeras och lägg till en skicka-knapp.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_15_AM%20(1).png)

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_15_AM.png)

### Skicka formulär

1. Markera de rader med data som ska redigeras.

2. Välj redigeringsläge för fälten och fyll i de värden som ska skickas.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_10_33_AM.png)

:::info{title=Tillgängliga redigeringslägen}
* **Uppdatera inte**: Fältet förblir oförändrat.
* **Ändra till**: Uppdatera fältet till det angivna värdet.
* **Rensa**: Rensa datan i fältet.

:::

3. Skicka formuläret.