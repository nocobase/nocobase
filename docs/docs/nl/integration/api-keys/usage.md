:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# API-sleutels gebruiken in NocoBase

Deze handleiding laat u aan de hand van een praktisch "To-Do's" voorbeeld zien hoe u API-sleutels gebruikt in NocoBase om gegevens op te halen. Volg de onderstaande stapsgewijze instructies om de volledige workflow te begrijpen.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 API-sleutels begrijpen

Een API-sleutel is een veilig token dat API-verzoeken van geautoriseerde gebruikers authenticeert. Het dient als een legitimatiebewijs dat de identiteit van de aanvrager valideert bij toegang tot het NocoBase-systeem via webapplicaties, mobiele apps of backend-scripts.

In de HTTP-aanvraagheader ziet u een formaat zoals:

```txt
Authorization: Bearer {API-sleutel}
```

Het voorvoegsel "Bearer" geeft aan dat de daaropvolgende tekenreeks een geauthenticeerde API-sleutel is die wordt gebruikt om de rechten van de aanvrager te verifiëren.

### Veelvoorkomende gebruiksscenario's

API-sleutels worden doorgaans gebruikt in de volgende scenario's:

1.  **Toegang tot clientapplicaties**: Webbrowsers en mobiele apps gebruiken API-sleutels om de identiteit van gebruikers te authenticeren, zodat alleen geautoriseerde gebruikers toegang hebben tot gegevens.
2.  **Uitvoering van geautomatiseerde taken**: Achtergrondprocessen en geplande taken gebruiken API-sleutels om updates, gegevenssynchronisatie en logboekregistratie veilig uit te voeren.
3.  **Ontwikkeling en testen**: Ontwikkelaars gebruiken API-sleutels tijdens het debuggen en testen om geauthenticeerde verzoeken te simuleren en API-responsen te verifiëren.

API-sleutels bieden meerdere beveiligingsvoordelen: identiteitsverificatie, gebruiksmonitoring, beperking van de aanvraagsnelheid en preventie van bedreigingen, wat de stabiele en veilige werking van NocoBase waarborgt.

## 2 API-sleutels aanmaken in NocoBase

### 2.1 Activeer de Auth: API-sleutels plugin

Zorg ervoor dat de ingebouwde [Auth: API-sleutels](/plugins/@nocobase/plugin-api-keys/) plugin is geactiveerd. Zodra deze is ingeschakeld, verschijnt er een nieuwe configuratiepagina voor API-sleutels in de systeeminstellingen.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Maak een testcollectie

Maak voor demonstratiedoeleinden een collectie met de naam `todos` aan, met de volgende velden:

-   `id`
-   `title`
-   `completed`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

Voeg enkele voorbeeldrecords toe aan de collectie:

-   eten
-   slapen
-   games spelen

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Een rol aanmaken en toewijzen

API-sleutels zijn gekoppeld aan gebruikersrollen, en het systeem bepaalt de aanvraagrechten op basis van de toegewezen rol. Voordat u een API-sleutel aanmaakt, moet u een rol creëren en de juiste rechten configureren. Maak een rol aan met de naam "To Dos API Rol" en verleen deze volledige toegang tot de `todos` collectie.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

Als de "To Dos API Rol" niet beschikbaar is bij het aanmaken van een API-sleutel, zorg er dan voor dat de huidige gebruiker deze rol is toegewezen:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

Nadat de rol is toegewezen, vernieuwt u de pagina en navigeert u naar de API-sleutelbeheerpagina. Klik op "API-sleutel toevoegen" om te controleren of de "To Dos API Rol" verschijnt in de rolselectie.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

Voor een betere toegangscontrole kunt u overwegen een speciaal gebruikersaccount (bijv. "To Dos API Gebruiker") aan te maken, specifiek voor het beheer en testen van API-sleutels. Wijs de "To Dos API Rol" toe aan deze gebruiker.
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 Genereer en bewaar de API-sleutel

Nadat u het formulier hebt ingediend, toont het systeem een bevestigingsbericht met de nieuw gegenereerde API-sleutel. **Belangrijk**: Kopieer en bewaar deze sleutel onmiddellijk op een veilige plaats, aangezien deze om veiligheidsredenen niet opnieuw zal worden weergegeven.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Voorbeeld API-sleutel:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Belangrijke opmerkingen

-   De geldigheidsduur van de API-sleutel wordt bepaald door de vervaldatuminstelling die tijdens het aanmaken is geconfigureerd.
-   Het genereren en verifiëren van API-sleutels is afhankelijk van de omgevingsvariabele `APP_KEY`. **Wijzig deze variabele niet**, aangezien dit alle bestaande API-sleutels in het systeem ongeldig maakt.

## 3 API-sleutelauthenticatie testen

### 3.1 De API-documentatie plugin gebruiken

Open de [API-documentatie](/plugins/@nocobase/plugin-api-doc/) plugin om de aanvraagmethoden, URL's, parameters en headers voor elk API-eindpunt te bekijken.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Basis CRUD-bewerkingen begrijpen

NocoBase biedt standaard CRUD (Create, Read, Update, Delete) API's voor gegevensmanipulatie:

-   **Lijst opvragen (list API):**

    ```txt
    GET {baseURL}/{collectionName}:list
    Aanvraagheader:
    - Authorization: Bearer <API-sleutel>

    ```
-   **Record aanmaken (create API):**

    ```txt
    POST {baseURL}/{collectionName}:create

    Aanvraagheader:
    - Authorization: Bearer <API-sleutel>

    Aanvraagbody (in JSON-formaat), bijvoorbeeld:
        {
            "title": "123"
        }
    ```
-   **Record bijwerken (update API):**

    ```txt
    POST {baseURL}/{collectionName}:update?filterByTk={id}
    Aanvraagheader:
    - Authorization: Bearer <API-sleutel>

    Aanvraagbody (in JSON-formaat), bijvoorbeeld:
        {
            "title": "123",
            "completed": true
        }
    ```
-   **Record verwijderen (delete API):**

    ```txt
    POST {baseURL}/{collectionName}:destroy?filterByTk={id}
    Aanvraagheader:
    - Authorization: Bearer <API-sleutel>
    ```

Waarbij:
-   `{baseURL}`: Uw NocoBase systeem-URL
-   `{collectionName}`: De collectienaam

Voorbeeld: Voor een lokale instantie op `localhost:13000` met een collectie genaamd `todos`:

```txt
http://localhost:13000/api/todos:list
```

### 3.3 Testen met Postman

Maak een GET-verzoek aan in Postman met de volgende configuratie:
-   **URL**: Het aanvraageindpunt (bijv. `http://localhost:13000/api/todos:list`)
-   **Headers**: Voeg de `Authorization` header toe met de waarde:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)

**Succesvolle respons:**

```json
{
    "data": [
        {
            "createdAt": "2025-03-03T09:57:36.728Z",
            "updatedAt": "2025-03-03T09:57:36.728Z",
            "completed": null,
            "createdById": 1,
            "id": 1,
            "title": "eat food",
            "updatedById": 1
        }
    ],
    "meta": {
        "count": 1,
        "page": 1,
        "pageSize": 20,
        "totalPage": 1
    }
}
```

**Foutrespons (ongeldige/verlopen API-sleutel):**

```json
{
    "errors": [
        {
            "message": "Your session has expired. Please sign in again.",
            "code": "INVALID_TOKEN"
        }
    ]
}
```

**Probleemoplossing**: Controleer de rolrechten, de API-sleutelkoppeling en het tokenformaat als de authenticatie mislukt.

### 3.4 Aanvraagcode exporteren

Postman stelt u in staat om de aanvraag in verschillende formaten te exporteren. Voorbeeld cURL-commando:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 API-sleutels gebruiken in een JS-blok

NocoBase 2.0 ondersteunt het direct schrijven van native JavaScript-code op pagina's met behulp van JS-blokken. Dit voorbeeld laat zien hoe u externe API-gegevens ophaalt met API-sleutels.

### Een JS-blok aanmaken

Voeg op uw NocoBase-pagina een JS-blok toe en gebruik de volgende code om takenlijstgegevens op te halen:

```javascript
// Takenlijstgegevens ophalen met API-sleutel
async function fetchTodos() {
  try {
    // Laadbericht weergeven
    ctx.message.loading('Gegevens ophalen...');

    // Laad de axios-bibliotheek voor HTTP-verzoeken
    const axios = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js');

    if (!axios) {
      ctx.message.error('Laden van HTTP-bibliotheek mislukt');
      return;
    }

    // API-sleutel (vervang door uw daadwerkelijke API-sleutel)
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M';

    // API-verzoek indienen
    const response = await axios.get('http://localhost:13000/api/todos:list', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Resultaten weergeven
    console.log('Takenlijst:', response.data);
    ctx.message.success(`Succesvol ${response.data.data.length} items opgehaald`);

    // U kunt de gegevens hier verwerken
    // Bijvoorbeeld: weergeven in een tabel, formuliervelden bijwerken, etc.

  } catch (error) {
    console.error('Fout bij ophalen gegevens:', error);
    ctx.message.error('Ophalen van gegevens mislukt: ' + error.message);
  }
}

// Functie uitvoeren
fetchTodos();
```

### Belangrijkste punten

-   **ctx.requireAsync()**: Laadt dynamisch externe bibliotheken (zoals axios) voor HTTP-verzoeken
-   **ctx.message**: Toont gebruikersmeldingen (laden, succes, foutmeldingen)
-   **API-sleutelauthenticatie**: Geef de API-sleutel door in de `Authorization` header met het `Bearer` voorvoegsel
-   **Responsafhandeling**: Verwerk de geretourneerde gegevens naar behoefte (weergeven, transformeren, etc.)

## 5 Samenvatting

Deze handleiding heeft de volledige workflow voor het gebruik van API-sleutels in NocoBase behandeld:

1.  **Installatie**: De API-sleutels plugin activeren en een testcollectie aanmaken
2.  **Configuratie**: Rollen aanmaken met de juiste rechten en API-sleutels genereren
3.  **Testen**: API-sleutelauthenticatie valideren met Postman en de API-documentatie plugin
4.  **Integratie**: API-sleutels gebruiken in JS-blokken

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

**Aanvullende bronnen:**
-   [Documentatie API-sleutels plugin](/plugins/@nocobase/plugin-api-keys/)
-   [API-documentatie plugin](/plugins/@nocobase/plugin-api-doc/)