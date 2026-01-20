---
pkg: "@nocobase/plugin-calendar"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Kalenderblok

## Introductie

Het Kalenderblok biedt een gestroomlijnde manier om evenementen en datumgerelateerde gegevens in een kalenderweergave te bekijken en te beheren. Dit maakt het ideaal voor het plannen van vergaderingen, het organiseren van evenementen en het efficiënt indelen van uw tijd.

## Installatie

Deze plugin is vooraf geïnstalleerd, dus er is geen aanvullende installatie vereist.

## Blokken toevoegen

![20250403220300](https://static-docs.nocobase.com/20250403220300.png)

1.  **Titelveld**: Wordt gebruikt om informatie op de kalenderbalken weer te geven. Momenteel worden veldtypes zoals `input` (tekstveld), `select` (enkele selectie), `phone` (telefoonnummer), `email` (e-mailadres), `radioGroup` (keuzerondjes) en `sequence` (reeks) ondersteund. De ondersteunde titelveldtypes kunnen via plugins worden uitgebreid.
2.  **Starttijd**: Geeft aan wanneer de taak begint.
3.  **Eindtijd**: Geeft aan wanneer de taak eindigt.

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419201640.mp4" type="video/mp4">
</video>

Als u op een taakbalk klikt, wordt de selectie gemarkeerd en verschijnt er een gedetailleerd pop-upvenster.

![20240408171928](https://static-docs.nocobase.com/20240408171928.png)

## Blokinstellingen

![20240419203321](https://static-docs.nocobase.com/20240419203321.png)

### Maankalender weergeven

![20240419203603](https://static-docs.nocobase.com/20240419203603.png)

- 
- 

### Gegevensbereik instellen

![20240419203751](https://static-docs.nocobase.com/20240419203751.png)

Voor meer informatie, zie 

### Blokhoogte instellen

Voorbeeld: Pas de hoogte van het kalenderblok voor bestellingen aan. Er verschijnt geen schuifbalk in het kalenderblok.

![20240605215742](https://static-docs.nocobase.com/20240605215742.gif)

Voor meer informatie, raadpleeg 

### Achtergrondkleurveld

:::info{title=Tip}
De NocoBase-versie moet v1.4.0-beta of hoger zijn.
:::

Deze optie kunt u gebruiken om de achtergrondkleur van kalendergebeurtenissen te configureren. Hier leest u hoe u dit doet:

1.  De kalendergegevensbron moet een veld van het type **Enkele selectie (Single select)** of **Keuzerondjes (Radio group)** bevatten, en dit veld moet geconfigureerd zijn met kleuren.
2.  Ga vervolgens terug naar de configuratie-interface van het kalenderblok en selecteer in het **Achtergrondkleurveld** het veld dat u zojuist met kleuren hebt geconfigureerd.
3.  Tot slot kunt u proberen een kleur te selecteren voor een kalendergebeurtenis en op 'Verzenden' te klikken. U zult zien dat de kleur is toegepast.

![20240914192017_rec_](https://static-docs.nocobase.com/20240914192017_rec_.gif)

### Startdag van de week

> Ondersteund in versie v1.7.7 en hoger

Het kalenderblok ondersteunt het instellen van de startdag van de week, waarbij u kunt kiezen voor **Zondag** of **Maandag** als de eerste dag van de week.
De standaard startdag is **Maandag**, wat het voor gebruikers gemakkelijker maakt om de kalenderweergave aan te passen aan regionale gewoonten voor een betere gebruikerservaring.

![20250707165958](https://static-docs.nocobase.com/20250707165958.png)

## Acties configureren

![20240419203424](https://static-docs.nocobase.com/20240419203424.png)

### Vandaag

De knop 'Vandaag' in het Kalenderblok biedt snelle navigatie, zodat u direct kunt terugkeren naar de huidige datum nadat u andere datums hebt verkend.

![20240419203514](https://static-docs.nocobase.com/20240419203514.png)

### Weergave wisselen

De standaardweergave is Maand.

![20240419203349](https://static-docs.nocobase.com/20240419203349.png)