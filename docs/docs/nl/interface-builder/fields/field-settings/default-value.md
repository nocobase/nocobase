:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Standaardwaarde

## Introductie

Een standaardwaarde is de initiële waarde van een veld wanneer een nieuw record wordt aangemaakt. U kunt een standaardwaarde instellen voor een veld bij het configureren ervan in een collectie, of u kunt een standaardwaarde toewijzen aan een veld in een 'Nieuw formulier'-blok. Deze kan worden ingesteld als een constante of een variabele.

## Waar u standaardwaarden kunt instellen

### Collectievelden

![20240411095933](https://static-docs.nocobase.com/20240411095933.png)

### Velden in een 'Nieuw formulier'

De meeste velden in een 'Nieuw formulier' ondersteunen het instellen van een standaardwaarde.

![20251028161801](https://static-docs.nocobase.com/20251028161801.png)

### Toevoegen in een subformulier

Subdata die wordt toegevoegd via een subformulierveld in een 'Nieuw formulier' of 'Bewerken formulier' krijgt een standaardwaarde.

Nieuw toevoegen in een subformulier
![20251028163455](https://static-docs.nocobase.com/20251028163455.png)

Bij het bewerken van bestaande gegevens wordt een leeg veld niet gevuld met de standaardwaarde. Alleen nieuw toegevoegde gegevens worden met de standaardwaarde gevuld.

### Standaardwaarden voor relatievelden

Alleen relaties van het type **Vele-op-één** en **Vele-op-vele** hebben standaardwaarden wanneer u selectorcomponenten (Select, RecordPicker) gebruikt.

![20251028164128](https://static-docs.nocobase.com/20251028164128.png)

## Standaardwaarde variabelen

### Welke variabelen zijn beschikbaar

- Huidige gebruiker;
- Huidig record; dit geldt alleen voor bestaande records;
- Huidig formulier, idealiter worden alleen de velden in het formulier weergegeven;
- Huidig object, een concept binnen subformulieren (het data-object voor elke rij in het subformulier);
- URL-parameters
Meer informatie over variabelen vindt u in [Variabelen](/interface-builder/variables)

### Veld standaardwaarde variabelen

Deze worden onderverdeeld in twee categorieën: niet-relatievelden en relatievelden.

#### Relatieveld standaardwaarde variabelen

- Het variabele object moet een collectie record zijn;
- Het moet een collectie zijn in de overervingsketen, dit kan de huidige collectie zijn of een ouder-/kind collectie;
- De variabele "Geselecteerde records in tabel" is alleen beschikbaar voor "Vele-op-vele" en "Eén-op-vele/Vele-op-één" relatievelden;
- **Voor meerlaagse scenario's moet deze worden afgevlakt en ontdubbeld**

```typescript
// Geselecteerde records in tabel:
[{id:1},{id:2},{id:3},{id:4}]

// Geselecteerde records in tabel/naar-één:
[{toOne: {id:2}}, {toOne: {id:3}}, {toOne: {id:3}}]
// Afvlakken en ontdubbelen
[{id: 2}, {id: 3}]

// Geselecteerde records in tabel/naar-vele:
[{toMany: [{id: 1}, {id:2}]}, {toMany: {[id:3}, {id:4}]}]
// Afvlakken
[{id:1},{id:2},{id:3},{id:4}]
```

#### Niet-relatie standaardwaarde variabelen

- Typen moeten consistent of compatibel zijn, bijv. strings zijn compatibel met getallen, en alle objecten die een toString-methode bieden;
- Het JSON-veld is speciaal en kan elk type gegevens opslaan;

### Veldniveau (optionele velden)

![20240411101157](https://static-docs.nocobase.com/20240411101157.png)

- Niet-relatie standaardwaarde variabelen
  - Bij het selecteren van meerlaagse velden is dit beperkt tot één-op-één relaties en worden één-op-vele relaties niet ondersteund;
  - Het JSON-veld is speciaal en kan onbeperkt zijn;

- Relatie standaardwaarde variabelen
  - hasOne, ondersteunt alleen één-op-één relaties;
  - hasMany, zowel één-op-één (interne conversie) als één-op-vele worden ondersteund;
  - belongsToMany, zowel één-op-één (interne conversie) als één-op-vele worden ondersteund;
  - belongsTo, over het algemeen voor één-op-één, maar wanneer de bovenliggende relatie hasMany is, ondersteunt het ook één-op-vele (omdat hasMany/belongsTo in wezen een vele-op-vele relatie is);

## Speciale gevallen

### "Vele-op-vele" is gelijk aan een "Eén-op-vele/Vele-op-één" combinatie

Model

![20240411101558](https://static-docs.nocobase.com/20240411101558.png)

### Waarom hebben één-op-één en één-op-vele relaties geen standaardwaarden?

Stel, in een A.B-relatie is b1 gekoppeld aan a1. Dan kan b1 niet ook gekoppeld worden aan a2. Als b1 wel aan a2 gekoppeld wordt, dan wordt de koppeling met a1 verbroken. In dit geval worden de gegevens niet gedeeld, terwijl een standaardwaarde juist een gedeeld mechanisme is (alles kan gekoppeld worden). Daarom kunnen één-op-één en één-op-vele relaties geen standaardwaarden hebben.

### Waarom kunnen vele-op-één en vele-op-vele subformulieren of subtabellen geen standaardwaarden hebben?

De focus van subformulieren en subtabellen ligt op het direct bewerken van de relatiegegevens (inclusief toevoegen en verwijderen). Een standaardwaarde voor een relatie is echter een gedeeld mechanisme waarbij alles gekoppeld kan worden, maar de relatiegegevens zelf niet gewijzigd kunnen worden. Daarom is het in dit scenario niet geschikt om standaardwaarden aan te bieden.

Bovendien hebben subformulieren of subtabellen subvelden, en het zou onduidelijk zijn of de standaardwaarde voor een subformulier of subtabel een rij-standaardwaarde of een kolom-standaardwaarde is.

Alles overwegende is het passender dat subformulieren of subtabellen, ongeacht het relatietype, geen directe standaardwaarden kunnen hebben.