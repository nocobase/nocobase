:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Avancerat

## Introduktion

AI-medarbetare kan kopplas till sidor eller block. Efter att de har kopplats kan ni konfigurera uppgifter för den aktuella verksamheten, vilket gör att användare snabbt kan använda AI-medarbetaren för att hantera uppgifter på sidan eller i blocket.

## Koppla AI-medarbetare till en sida

När sidan är i UI-redigeringsläge kommer ett '+' tecken att visas bredvid snabbåtkomstknappen för AI-medarbetare i det nedre högra hörnet. Håll muspekaren över '+' tecknet, så visas en lista över AI-medarbetare. Välj en AI-medarbetare för att koppla den till den aktuella sidan.

![20251022134656](https://static-docs.nocobase.com/20251022134656.png)

När kopplingen är klar visas den AI-medarbetare som är kopplad till den aktuella sidan i det nedre högra hörnet varje gång ni besöker sidan.

![20251022134903](https://static-docs.nocobase.com/20251022134903.png)

## Koppla AI-medarbetare till ett block

När sidan är i UI-redigeringsläge, på ett block som stöder inställning av `Actions`, väljer ni menyn `AI employees` under `Actions` och sedan en AI-medarbetare för att koppla den till det aktuella blocket.

![20251022135306](https://static-docs.nocobase.com/20251022135306.png)

När kopplingen är klar visas den AI-medarbetare som är kopplad till det aktuella blocket i blockets `Actions`-område varje gång ni besöker sidan.

![20251022135438](https://static-docs.nocobase.com/20251022135438.png)

## Konfigurera uppgifter

När sidan är i UI-redigeringsläge, håll muspekaren över ikonen för den AI-medarbetare som är kopplad till sidan eller blocket. En menyknapp visas. Välj `Edit tasks` för att komma till sidan för uppgiftskonfiguration.

![20251022135710](https://static-docs.nocobase.com/20251022135710.png)

När ni har kommit till sidan för uppgiftskonfiguration kan ni lägga till flera uppgifter för den aktuella AI-medarbetaren.

Varje flik representerar en oberoende uppgift. Klicka på '+' tecknet bredvid för att lägga till en ny uppgift.

![20251022140058](https://static-docs.nocobase.com/20251022140058.png)

Formulär för uppgiftskonfiguration:

- I fältet `Title` anger ni uppgiftstiteln. Beskriv kortfattat uppgiftens innehåll. Denna titel kommer att visas i AI-medarbetarens uppgiftslista.
- I fältet `Background` anger ni uppgiftens huvudsakliga innehåll. Detta innehåll kommer att användas som systemprompt vid konversation med AI-medarbetaren.
- I fältet `Default user message` anger ni standardanvändarmeddelandet som ska skickas. Det fylls automatiskt i användarens inmatningsfält efter att uppgiften valts.
- I `Work context` väljer ni standardinformationen för applikationskontext som ska skickas till AI-medarbetaren. Denna åtgärd är densamma som i dialogrutan.
- Fältet `Skills` visar de färdigheter som den aktuella AI-medarbetaren har tillgång till. Ni kan avmarkera en färdighet för att få AI-medarbetaren att ignorera och inte använda den när den utför denna uppgift.
- Kryssrutan `Send default user message automatically` konfigurerar om standardanvändarmeddelandet ska skickas automatiskt efter att ni klickat för att utföra uppgiften.

![20251022140805](https://static-docs.nocobase.com/20251022140805.png)

## Uppgiftslista

Efter att ni har konfigurerat uppgifter för en AI-medarbetare visas dessa uppgifter i AI-medarbetarens profil-popup och i hälsningsmeddelandet innan en konversation startar. Klicka på en uppgift för att utföra den.

![20251022141231](https://static-docs.nocobase.com/20251022141231.png)