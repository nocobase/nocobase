:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/interface-builder/fields/specific/sub-table-popup) voor nauwkeurige informatie.
:::

# Subtabel (Bewerken in pop-up)

## Introductie

De subtabel (bewerken in pop-up) wordt gebruikt om meervoudige associatiegegevens (zoals één-op-veel of veel-op-veel) binnen een formulier te beheren. De tabel toont alleen de momenteel gekoppelde records. Het toevoegen of bewerken van records gebeurt in een pop-up, en de gegevens worden gezamenlijk in de database opgeslagen wanneer het hoofdformulier wordt ingediend.

## Gebruik

![20260212152204](https://static-docs.nocobase.com/20260212152204.png)

**Toepassingsscenario's:**

- Associatievelden: O2M / M2M / MBM
- Typisch gebruik: orderdetails, subitemlijsten, gekoppelde tags/leden, enz.

## Veldconfiguratie

### Selecteren van bestaande gegevens toestaan (Standaard: Ingeschakeld)

Ondersteunt het selecteren van associaties uit bestaande records.

![20260212152312](https://static-docs.nocobase.com/20260212152312.png)

![20260212152343](https://static-docs.nocobase.com/20260212152343.gif)

### Veldcomponent

[Veldcomponent](/interface-builder/fields/association-field): Schakel over naar andere relatieveldcomponenten, zoals een keuzelijst (Single select), collectieselectie (Collection selector), enz.

### Ontkoppelen van bestaande gegevens toestaan (Standaard: Ingeschakeld)

> Bepaalt of reeds gekoppelde gegevens in het bewerkingsformulier mogen worden ontkoppeld. Nieuw toegevoegde gegevens kunnen altijd worden verwijderd.

![20260212165752](https://static-docs.nocobase.com/20260212165752.gif)

### Toevoegen toestaan (Standaard: Ingeschakeld)

Bepaalt of de knop "Toevoegen" wordt weergegeven. Als de gebruiker geen `create`-rechten heeft voor de doelcollectie, wordt de knop uitgeschakeld met een melding over ontbrekende rechten.

### Snel bewerken toestaan (Standaard: Uitgeschakeld)

Wanneer ingeschakeld, verschijnt er een bewerkingspictogram wanneer u met de muis over een cel beweegt, waardoor de inhoud van de cel snel kan worden gewijzigd.

U kunt snel bewerken inschakelen voor alle velden via de instellingen van de relatieveldcomponent.

![20260212165102](https://static-docs.nocobase.com/20260212165102.png)

Het kan ook worden ingeschakeld voor individuele kolomvelden.

![20260212165025](https://static-docs.nocobase.com/20260212165025.png)

![20260212165201](https://static-docs.nocobase.com/20260212165201.gif)

### Paginagrootte (Standaard: 10)

Stelt het aantal records in dat per pagina in de subtabel wordt weergegeven.

## Gedragsnotities

- Bij het selecteren van bestaande records wordt ontdubbeling uitgevoerd op basis van de primaire sleutel om dubbele koppelingen van hetzelfde record te voorkomen.
- Nieuw toegevoegde records worden direct in de subtabel ingevuld en de weergave springt automatisch naar de pagina die het nieuwe record bevat.
- Bewerken in de rij wijzigt alleen de gegevens van de huidige rij.
- Verwijderen ontkoppelt alleen de associatie binnen het huidige formulier; het verwijdert de brongegevens niet uit de database.
- Gegevens worden pas in de database opgeslagen wanneer het hoofdformulier wordt ingediend.