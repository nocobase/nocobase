:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Snel aan de slag

In deze handleiding configureren we een grafiek helemaal vanaf nul, waarbij we de essentiële functies gebruiken. Meer geavanceerde functionaliteiten worden in latere hoofdstukken besproken.

Voorbereiding:
- U heeft een gegevensbron en collectie (tabel) geconfigureerd en beschikt over leesrechten.

## Een grafiekblok toevoegen

Klik in de pagina-ontwerper op 'Blok toevoegen', kies 'Grafiek' en voeg een grafiekblok toe.

![clipboard-image-1761554593](https://static-docs.nocobase.com/clipboard-image-1761554593.png)

Nadat u het blok heeft toegevoegd, klikt u rechtsboven op 'Configureren'.

![clipboard-image-1761554709](https://static-docs.nocobase.com/clipboard-image-1761554709.png)

Het configuratiepaneel voor de grafiek opent aan de rechterkant. Dit paneel bestaat uit drie onderdelen: Gegevensquery, Grafiekopties en Gebeurtenissen.

![clipboard-image-1761554848](https://static-docs.nocobase.com/clipboard-image-1761554848.png)

## Gegevensquery configureren
In het paneel 'Gegevensquery' configureert u de gegevensbron, queryfilters en gerelateerde opties.

- Gegevensbron en collectie selecteren
  - Kies de gegevensbron en collectie als basis voor uw query.
  - Als de collectie niet selecteerbaar of leeg is, controleer dan eerst of deze bestaat en of uw gebruiker de juiste rechten heeft.

- Metingen configureren
  - Selecteer een of meer numerieke velden als metingen.
  - Stel voor elke meting een aggregatie in: Som / Aantal / Gemiddelde / Max / Min.

- Dimensies configureren
  - Selecteer een of meer velden als groeperingsdimensies (datum, categorie, regio, enz.).
  - Voor datum-/tijdvelden kunt u een formaat instellen (bijvoorbeeld `YYYY-MM`, `YYYY-MM-DD`) om de weergave consistent te houden.

![clipboard-image-1761555060](https://static-docs.nocobase.com/clipboard-image-1761555060.png)

Andere opties zoals filteren, sorteren en paginering zijn optioneel.

## Query uitvoeren en gegevens bekijken

- Klik op 'Query uitvoeren' om gegevens op te halen en direct een voorbeelddiagram aan de linkerkant weer te geven.
- Klik op 'Gegevens bekijken' om een voorbeeld van de geretourneerde gegevens te zien; u kunt schakelen tussen tabel- en JSON-formaten. Klik nogmaals om het gegevensvoorbeeld in te klappen.
- Als het resultaat leeg of onverwacht is, gaat u terug naar het querypaneel en controleert u de collectierechten, veldtoewijzingen voor metingen/dimensies en gegevenstypen.

![clipboard-image-1761555228](https://static-docs.nocobase.com/clipboard-image-1761555228.png)

## Grafiekopties configureren

In het paneel 'Grafiekopties' kiest u het grafiektype en configureert u de bijbehorende opties.

- Selecteer eerst een grafiektype (lijn/gebied, kolom/staaf, cirkel/ring, spreiding, enz.).
- Voltooi de kernveldtoewijzingen:
  - Lijn/gebied/kolom/staaf: `xField` (dimensie), `yField` (meting), `seriesField` (reeks, optioneel)
  - Cirkel/ring: `Category` (categorische dimensie), `Value` (meting)
  - Spreiding: `xField`, `yField` (twee metingen of dimensies)
  - Voor meer grafiekinstellingen raadpleegt u de ECharts-documentatie: [Axis](https://echarts.apache.org/handbook/en/concepts/axis)
- Nadat u op 'Query uitvoeren' heeft geklikt, worden veldtoewijzingen standaard automatisch ingevuld. Als u dimensies/metingen wijzigt, controleer dan de toewijzingen opnieuw.

![clipboard-image-1761555586](https://static-docs.nocobase.com/clipboard-image-1761555586.png)

## Voorbeeld en opslaan
Wijzigingen werken het voorbeeld aan de linkerkant automatisch en realtime bij. Let op: de wijzigingen worden pas echt opgeslagen nadat u op de knop 'Opslaan' heeft geklikt.

U kunt ook de knoppen onderaan gebruiken:

- Voorbeeld: Configuratieaanpassingen verversen het voorbeeld automatisch en realtime. U kunt ook handmatig een verversing activeren door op de knop 'Voorbeeld' onderaan te klikken.
- Annuleren: Als u de huidige wijzigingen niet wilt behouden, klikt u onderaan op de knop 'Annuleren' of ververst u de pagina om terug te keren naar de laatst opgeslagen staat.
- Opslaan: Klik op 'Opslaan' om de huidige query- en grafiekconfiguratie definitief in de database op te slaan; deze wordt dan van kracht voor alle gebruikers.

![clipboard-image-1761555803](https://static-docs.nocobase.com/clipboard-image-1761555803.png)

## Veelvoorkomende aandachtspunten

- Minimale configuratie: Selecteer een collectie plus ten minste één meting; het toevoegen van dimensies wordt aanbevolen voor een gegroepeerde weergave.
- Voor datumdimensies is het raadzaam een geschikt formaat in te stellen (bijvoorbeeld maandelijks `YYYY-MM`) om een discontinue of rommelige X-as te voorkomen.
- Als de query leeg is of de grafiek niet wordt weergegeven:
  - Controleer de collectie/rechten en veldtoewijzingen.
  - Gebruik 'Gegevens bekijken' om te controleren of kolomnamen en -typen overeenkomen met de grafiektoewijzing.
- Het voorbeeld is tijdelijk: Het dient alleen ter validatie en aanpassing. Het wordt pas definitief van kracht nadat u op 'Opslaan' heeft geklikt.