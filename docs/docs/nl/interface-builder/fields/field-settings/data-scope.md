:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Het gegevensbereik instellen

## Introductie

Het instellen van het gegevensbereik voor een relatieveld is vergelijkbaar met het instellen van het gegevensbereik voor een blok. U stelt hiermee standaard filtervoorwaarden in voor de gerelateerde gegevens.

## Gebruiksaanwijzing

![20251028211328](https://static-docs.nocobase.com/20251028211328.png)

### Statische waarde

Voorbeeld: Alleen niet-verwijderde producten kunnen worden geselecteerd voor koppeling.

> De veldenlijst bevat velden uit de doel-collectie van het relatieveld.

![20251028211434](https://static-docs.nocobase.com/20251028211434.png)

### Variabele waarde

Voorbeeld: Alleen producten waarvan de servicedatum later is dan de besteldatum, kunnen worden geselecteerd voor koppeling.

![20251028211727](https://static-docs.nocobase.com/20251028211727.png)

Meer informatie over variabelen vindt u in [Variabelen](/interface-builder/variables).

### Koppeling van relatievelden

Koppeling tussen relatievelden wordt gerealiseerd door het instellen van het gegevensbereik.

Voorbeeld: De collectie 'Bestellingen' heeft een een-op-veel relatieveld 'Kansproduct' en een veel-op-een relatieveld 'Kans'. De collectie 'Kansproduct' heeft een veel-op-een relatieveld 'Kans'. In het bestelformulierblok worden de selecteerbare gegevens voor 'Kansproduct' gefilterd om alleen de kansproducten te tonen die zijn gekoppeld aan de momenteel geselecteerde 'Kans' in het formulier.

![20251028212943](https://static-docs.nocobase.com/20251028212943.png)

![20240422154145](https://static-docs.nocobase.com/20240422154145.png)

![20251028213408](https://static-docs.nocobase.com/20251028213408.gif)