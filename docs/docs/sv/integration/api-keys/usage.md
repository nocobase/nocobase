:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Använda API-nycklar i NocoBase

Den här guiden visar hur ni använder API-nycklar i NocoBase för att hämta data, med ett praktiskt exempel för "Att göra"-listor. Följ de stegvisa instruktionerna nedan för att förstå hela arbetsflödet.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 Förstå API-nycklar

En API-nyckel är en säker token som autentiserar API-förfrågningar från auktoriserade användare. Den fungerar som en behörighet som validerar identiteten hos den som gör förfrågan när NocoBase-systemet nås via webbapplikationer, mobilappar eller backend-skript.

I HTTP-förfrågans header ser ni ett format som:

```txt
Authorization: Bearer {API-nyckel}
```

Prefixet "Bearer" indikerar att den efterföljande strängen är en autentiserad API-nyckel som används för att verifiera den som gör förfrågans behörigheter.

### Vanliga användningsområden

API-nycklar används vanligtvis i följande scenarier:

1.  **Åtkomst för klientapplikationer**: Webbläsare och mobilappar använder API-nycklar för att autentisera användaridentitet, vilket säkerställer att endast auktoriserade användare kan komma åt data.
2.  **Automatiserad uppgiftskörning**: Bakgrundsprocesser och schemalagda uppgifter använder API-nycklar för att säkert utföra uppdateringar, datasynkronisering och loggningsoperationer.
3.  **Utveckling och testning**: Utvecklare använder API-nycklar under felsökning och testning för att simulera autentiserade förfrågningar och verifiera API-svar.

API-nycklar erbjuder flera säkerhetsfördelar: identitetsverifiering, användningsövervakning, begränsning av förfrågningshastighet och hotförebyggande, vilket säkerställer en stabil och säker drift av NocoBase.

## 2 Skapa API-nycklar i NocoBase

### 2.1 Aktivera pluginet Autentisering: API-nycklar

Se till att det inbyggda [Autentisering: API-nycklar](/plugins/@nocobase/plugin-api-keys/) pluginet är aktiverat. När det är aktiverat kommer en ny konfigurationssida för API-nycklar att visas i systeminställningarna.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Skapa en testsamling

I demonstrationssyfte skapar ni en samling med namnet `todos` som innehåller följande fält:

-   `id`
-   `titel`
-   `slutförd`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

Lägg till några exempelposter i samlingen:

-   äta mat
-   sova
-   spela spel

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Skapa och tilldela en roll

API-nycklar är kopplade till användarroller, och systemet bestämmer förfrågningsbehörigheter baserat på den tilldelade rollen. Innan ni skapar en API-nyckel måste ni skapa en roll och konfigurera lämpliga behörigheter. Skapa en roll med namnet "Att göra API-roll" och ge den full åtkomst till `todos`-samlingen.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

Om "Att göra API-roll" inte är tillgänglig när ni skapar en API-nyckel, se till att den aktuella användaren har tilldelats denna roll:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

Efter att rollen har tilldelats, uppdatera sidan och navigera till sidan för API-nyckelhantering. Klicka på "Lägg till API-nyckel" för att verifiera att "Att göra API-roll" visas i rollvalet.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

För bättre åtkomstkontroll kan ni överväga att skapa ett dedikerat användarkonto (t.ex. "Att göra API-användare") specifikt för API-nyckelhantering och testning. Tilldela "Att göra API-roll" till denna användare.
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 Generera och spara API-nyckeln

Efter att ni har skickat in formuläret kommer systemet att visa ett bekräftelsemeddelande med den nyligen genererade API-nyckeln. **Viktigt**: Kopiera och lagra denna nyckel säkert omedelbart, eftersom den inte kommer att visas igen av säkerhetsskäl.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Exempel på API-nyckel:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Viktiga anmärkningar

-   API-nyckelns giltighetstid bestäms av utgångsinställningen som konfigurerades vid skapandet.
-   Generering och verifiering av API-nycklar beror på miljövariabeln `APP_KEY`. **Ändra inte denna variabel**, eftersom det kommer att ogiltigförklara alla befintliga API-nycklar i systemet.

## 3 Testa API-nyckelautentisering

### 3.1 Använda pluginet API-dokumentation

Öppna [API-dokumentation](/plugins/@nocobase/plugin-api-doc/) pluginet för att se förfrågningsmetoder, URL:er, parametrar och headers för varje API-slutpunkt.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Förstå grundläggande CRUD-operationer

NocoBase tillhandahåller standard-API:er för CRUD (Create, Read, Update, Delete) för datamanipulation:

-   **Lista förfrågan (list API):**

    ```txt
    GET {baseURL}/{collectionName}:list
    Förfrågningsheader:
    - Authorization: Bearer <API-nyckel>

    ```
-   **Skapa post (create API):**

    ```txt
    POST {baseURL}/{collectionName}:create

    Förfrågningsheader:
    - Authorization: Bearer <API-nyckel>

    Förfrågningskropp (i JSON-format), till exempel:
        {
            "title": "123"
        }
    ```
-   **Uppdatera post (update API):**

    ```txt
    POST {baseURL}/{collectionName}:update?filterByTk={id}
    Förfrågningsheader:
    - Authorization: Bearer <API-nyckel>

    Förfrågningskropp (i JSON-format), till exempel:
        {
            "title": "123",
            "completed": true
        }
    ```
-   **Ta bort post (delete API):**

    ```txt
    POST {baseURL}/{collectionName}:destroy?filterByTk={id}
    Förfrågningsheader:
    - Authorization: Bearer <API-nyckel>
    ```

Där:
-   `{baseURL}`: NocoBase-systemets URL
-   `{collectionName}`: Samlingsnamnet

Exempel: För en lokal instans på `localhost:13000` med en samling med namnet `todos`:

```txt
http://localhost:13000/api/todos:list
```

### 3.3 Testa med Postman

Skapa en GET-förfrågan i Postman med följande konfiguration:
-   **URL**: Förfrågningsslutpunkt (t.ex. `http://localhost:13000/api/todos:list`)
-   **Headers**: Lägg till `Authorization`-header med värdet:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)

**Framgångsrikt svar:**

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

**Felsvar (Ogiltig/utgången API-nyckel):**

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

**Felsökning**: Verifiera rollbehörigheter, API-nyckelkoppling och tokenformat om autentiseringen misslyckas.

### 3.4 Exportera förfrågningskod

Postman låter er exportera förfrågan i olika format. Exempel på cURL-kommando:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 Använda API-nycklar i JS-block

NocoBase 2.0 stöder att skriva ren JavaScript-kod direkt på sidor med hjälp av JS-block. Detta exempel visar hur ni hämtar extern API-data med hjälp av API-nycklar.

### 4.1 Skapa ett JS-block

På er NocoBase-sida, lägg till ett JS-block och använd följande kod för att hämta data för 'att göra'-listan:

```javascript
// Hämta data för 'att göra'-listan med API-nyckel
async function fetchTodos() {
  try {
    // Visa laddningsmeddelande
    ctx.message.loading('Hämtar data...');

    // Ladda axios-biblioteket för HTTP-förfrågningar
    const axios = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js');

    if (!axios) {
      ctx.message.error('Misslyckades med att ladda HTTP-biblioteket');
      return;
    }

    // API-nyckel (ersätt med er faktiska API-nyckel)
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M';

    // Gör API-förfrågan
    const response = await axios.get('http://localhost:13000/api/todos:list', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Visa resultat
    console.log('Att göra-lista:', response.data);
    ctx.message.success(`Hämtade ${response.data.data.length} poster framgångsrikt`);

    // Här kan ni bearbeta datan
    // Till exempel: visa i en tabell, uppdatera formulärfält, etc.

  } catch (error) {
    console.error('Fel vid hämtning av data:', error);
    ctx.message.error('Misslyckades med att hämta data: ' + error.message);
  }
}

// Utför funktionen
fetchTodos();
```

### 4.2 Viktiga punkter

-   **ctx.requireAsync()**: Laddar dynamiskt externa bibliotek (som axios) för HTTP-förfrågningar
-   **ctx.message**: Visar användarmeddelanden (laddar, framgång, felmeddelanden)
-   **API-nyckelautentisering**: Skicka API-nyckeln i `Authorization`-headern med `Bearer`-prefix
-   **Svarshantering**: Bearbeta den returnerade datan efter behov (visa, transformera, etc.)

## 5 Sammanfattning

Den här guiden har täckt det kompletta arbetsflödet för att använda API-nycklar i NocoBase:

1.  **Installation**: Aktivera API-nyckel-pluginet och skapa en testsamling
2.  **Konfiguration**: Skapa roller med lämpliga behörigheter och generera API-nycklar
3.  **Testning**: Validera API-nyckelautentisering med Postman och API-dokumentationspluginet
4.  **Integration**: Använda API-nycklar i JS-block

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

**Andra resurser:**
-   [Dokumentation för API-nyckel-pluginet](/plugins/@nocobase/plugin-api-keys/)
-   [API-dokumentationspluginet](/plugins/@nocobase/plugin-api-doc/)