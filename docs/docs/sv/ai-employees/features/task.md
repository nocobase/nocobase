:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/ai-employees/features/task).
:::

# Snabbvalsuppgifter

För att hjälpa AI-medarbetare att arbeta mer effektivt kan ni binda AI-medarbetare till scenarioblock och förinställa flera vanliga uppgifter.

Detta gör det möjligt för användare att starta uppgiftshantering med ett klick, utan att behöva **välja block** och **ange kommando** varje gång.

## Binda AI-medarbetare till block

När ni har gått in i UI-redigeringsläge, för block som stöder `Actions`, välj menyn `AI employees` under `Actions` och välj sedan en AI-medarbetare. Denna AI-medarbetare kommer då att bindas till det aktuella blocket.

![20251022135306](https://static-docs.nocobase.com/20251022135306.png)

När bindningen är klar kommer blockets Actions-område att visa den AI-medarbetare som är bunden till det aktuella blocket varje gång ni går in på sidan.

![20251022135438](https://static-docs.nocobase.com/20251022135438.png)

## Konfigurera uppgifter

När ni har gått in i UI-redigeringsläge, hovra med musen över ikonen för den AI-medarbetare som är bunden till blocket. En menyknapp visas; välj `Edit tasks` för att komma till inställningssidan för uppgifter.

På inställningssidan för uppgifter kan ni lägga till flera uppgifter för den aktuella AI-medarbetaren.

Varje flik representerar en oberoende uppgift. Klicka på "+"-tecknet bredvid för att lägga till en ny uppgift.

![clipboard-image-1771913187](https://static-docs.nocobase.com/clipboard-image-1771913187.png)

Formulär för uppgiftsinställningar:

- Ange uppgiftens titel i inmatningsfältet `Title`. En kort beskrivning av uppgiften som kommer att visas i AI-medarbetarens uppgiftslista.
- Ange uppgiftens huvudsakliga innehåll i inmatningsfältet `Background`. Detta innehåll kommer att användas som system-prompt vid konversation med AI-medarbetaren.
- Ange ett standardmeddelande från användaren i `Default user message`. Detta fylls i automatiskt i användarens inmatningsfält när uppgiften väljs.
- I `Work context`, välj den standardinformation för applikationskontext som ska skickas till AI-medarbetaren. Detta fungerar på samma sätt som i chattpanelen.
- I väljaren `Skills` visas de färdigheter som den aktuella AI-medarbetaren besitter. Ni kan avaktivera en specifik färdighet så att AI-medarbetaren ignorerar den när just denna uppgift utförs.
- Kryssrutan `Send default user message automatically` konfigurerar om standardmeddelandet ska skickas automatiskt så fort man klickar för att köra uppgiften.


## Uppgiftslista

När ni har konfigurerat uppgifter för en AI-medarbetare kommer dessa att visas i AI-medarbetarens profilfönster och i hälsningsmeddelandet innan konversationen börjar. Klicka på en uppgift för att köra den.

![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)