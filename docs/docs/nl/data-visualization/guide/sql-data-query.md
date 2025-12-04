:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Gegevens opvragen in SQL-modus

Schakel in het paneel "Gegevens opvragen" over naar de SQL-modus. Hier kunt u query's schrijven en uitvoeren, en de resultaten direct gebruiken voor het toewijzen en weergeven van grafieken.

![20251027075805](https://static-docs.nocobase.com/20251027075805.png)

## SQL-instructies schrijven
- Selecteer de "SQL"-modus in het paneel "Gegevens opvragen".
- Voer de SQL in en klik op "Query uitvoeren" om deze uit te voeren.
- Complexe SQL-instructies, inclusief JOINs over meerdere tabellen en VIEWs, worden ondersteund.

Voorbeeld: Orderbedrag per maand
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

## Resultaten bekijken
- Klik op "Gegevens bekijken" om het voorbeeldpaneel met de gegevensresultaten te openen.

![20251027080014](https://static-docs.nocobase.com/20251027080014.png)

De gegevens ondersteunen paginering; u kunt schakelen tussen "Tabel" en "JSON" om kolomnamen en -typen te controleren.
![20251027080100](https://static-docs.nocobase.com/20251027080100.png)

## Veldtoewijzing
- Voltooi de toewijzing van velden in de "Grafiekopties", gebaseerd op de kolommen van de queryresultaten.
- Standaard wordt de eerste kolom automatisch gebruikt als dimensie (X-as of categorie) en de tweede kolom als meetwaarde (Y-as of waarde). Let daarom goed op de volgorde van de velden in uw SQL-query:

```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon, -- dimensieveld in de eerste kolom
  SUM(total_amount) AS total -- meetwaardeveld erna
```

![clipboard-image-1761524022](https://static-docs.nocobase.com/clipboard-image-1761524022.png)

## Contextvariabelen gebruiken
Klik op de x-knop rechtsboven in de SQL-editor om contextvariabelen te selecteren.

![20251027081752](https://static-docs.nocobase.com/20251027081752.png)

Na bevestiging wordt de variabele-expressie ingevoegd op de cursorpositie in de SQL-tekst (of vervangt deze de geselecteerde inhoud).

Bijvoorbeeld `{{ ctx.user.createdAt }}`. Let op: voeg zelf geen extra aanhalingstekens toe.

![20251027081957](https://static-docs.nocobase.com/20251027081957.png)

## Meer voorbeelden
Voor meer voorbeelden kunt u de [Demo-app](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) van NocoBase raadplegen.

**Aanbevelingen:**
- Zorg dat kolomnamen stabiel zijn voordat u ze aan grafieken toewijst, om latere fouten te voorkomen.
- Stel tijdens het debuggen `LIMIT` in om het aantal geretourneerde rijen te verminderen en het voorbeeld te versnellen.

## Voorbeeld, opslaan en terugdraaien
- Klik op "Query uitvoeren" om gegevens op te vragen en het grafiekvoorbeeld te vernieuwen.
- Klik op "Opslaan" om de huidige SQL-tekst en gerelateerde configuratie in de database op te slaan.
- Klik op "Annuleren" om terug te keren naar de laatst opgeslagen status en onopgeslagen wijzigingen te negeren.