:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Gegevens opvragen

Het configuratiepaneel van de grafiek is onderverdeeld in drie secties: Gegevens opvragen, Grafiekopties en Interactie-evenementen, plus de knoppen Annuleren, Voorbeeld en Opslaan onderaan.

Laten we eerst kijken naar het paneel "Gegevens opvragen" om de twee querymodi (Builder/SQL) en hun veelvoorkomende functies te begrijpen.

## Paneelstructuur
![clipboard-image-1761466636](https://static-docs.nocobase.com/clipboard-image-1761466636.png)

> Tip: Om de huidige inhoud gemakkelijker te configureren, kunt u eerst andere panelen inklappen.

Bovenaan vindt u de actiebalk:
- Modus: Builder (grafisch, eenvoudig en handig) / SQL (handmatig geschreven statements, flexibeler).
- Query uitvoeren: Klik om het gegevensqueryverzoek uit te voeren.
- Resultaat bekijken: Opent het gegevensresultaatpaneel, waar u kunt schakelen tussen Tabel/JSON weergaven. Klik nogmaals om het paneel in te klappen.

Van boven naar beneden:
- Gegevensbron en collectie: Verplicht. Selecteer de gegevensbron en de collectie.
- Metingen (Measures): Verplicht. De numerieke velden die moeten worden weergegeven.
- Dimensies (Dimensions): Groeperen op velden (bijv. datum, categorie, regio).
- Filter: Stel filtervoorwaarden in (bijv. =, ≠, >, <, bevat, bereik). Meerdere voorwaarden kunnen worden gecombineerd.
- Sorteren: Selecteer het veld om op te sorteren en de volgorde (oplopend/aflopend).
- Paginering: Bepaal het gegevensbereik en de retourvolgorde.

## Builder-modus

### Gegevensbron en collectie selecteren
- Selecteer in het paneel "Gegevens opvragen" de modus "Builder".
- Selecteer een gegevensbron en collectie (gegevenstabel). Als de collectie niet selecteerbaar of leeg is, controleer dan eerst de rechten en of deze is aangemaakt.

### Metingen (Measures) configureren
- Selecteer een of meer numerieke velden en stel een aggregatie in: `Sum`, `Count`, `Avg`, `Max`, `Min`.
- Veelvoorkomende scenario's: `Count` om records te tellen, `Sum` om een totaal te berekenen.

### Dimensies (Dimensions) configureren
- Selecteer een of meer velden als groeperingsdimensies.
- Datum- en tijdvelden kunnen worden geformatteerd (bijv. `YYYY-MM`, `YYYY-MM-DD`) om groepering per maand of dag te vergemakkelijken.

### Filteren, sorteren en paginering
- Filter: Voeg voorwaarden toe (bijv. =, ≠, bevat, bereik). Meerdere voorwaarden kunnen worden gecombineerd.
- Sorteren: Selecteer een veld en de sorteervolgorde (oplopend/aflopend).
- Paginering: Stel `Limit` en `Offset` in om het aantal geretourneerde rijen te bepalen. Het wordt aanbevolen om tijdens het debuggen een kleine `Limit` in te stellen.

### Query uitvoeren en resultaat bekijken
- Klik op "Query uitvoeren" om de query uit te voeren. Nadat deze is voltooid, schakelt u in "Resultaat bekijken" tussen `Tabel / JSON` om de kolommen en waarden te controleren.
- Voordat u grafiekvelden toewijst, bevestigt u hier de kolomnamen en -typen om te voorkomen dat de grafiek later leeg is of fouten genereert.

![20251026174338](https://static-docs.nocobase.com/20251026174338.png)

### Vervolgveldtoewijzing

Later, bij het configureren van "Grafiekopties", wijst u velden toe op basis van de velden van de geselecteerde gegevensbron en collectie.

## SQL-modus

### Query schrijven
- Schakel over naar de "SQL"-modus, voer uw querystatement in en klik op "Query uitvoeren".
- Voorbeeld (totaal orderbedrag per datum):
```sql
SELECT
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

![20251026175952](https://static-docs.nocobase.com/20251026175952.png)

### Query uitvoeren en resultaat bekijken

- Klik op "Query uitvoeren" om de query uit te voeren. Nadat deze is voltooid, schakelt u in "Resultaat bekijken" tussen `Tabel / JSON` om de kolommen en waarden te controleren.
- Voordat u grafiekvelden toewijst, bevestigt u hier de kolomnamen en -typen om te voorkomen dat de grafiek later leeg is of fouten genereert.

### Vervolgveldtoewijzing

Later, bij het configureren van "Grafiekopties", wijst u velden toe op basis van de kolommen uit het queryresultaat.

> [!TIP]
> Voor meer informatie over de SQL-modus, zie Geavanceerd gebruik — Gegevens opvragen in SQL-modus.