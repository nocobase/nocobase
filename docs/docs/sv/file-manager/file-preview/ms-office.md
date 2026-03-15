---
pkg: '@nocobase/plugin-file-previewer-office'
---

:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/file-manager/file-preview/ms-office).
:::

# Förhandsvisning av Office-filer <Badge>v1.8.11+</Badge>

Pluginet för förhandsvisning av Office-filer används för att förhandsvisa filer i Office-format i NocoBase-applikationer, såsom Word, Excel och PowerPoint.  
Det baseras på en offentlig onlinetjänst från Microsoft, vilket gör det möjligt att bädda in filer som är tillgängliga via en offentlig URL i ett gränssnitt för förhandsvisning. Detta gör att ni kan visa dessa filer direkt i webbläsaren utan att behöva ladda ner dem eller använda Office-program.

## Användarmanual

Som standard är detta plugin **inaktiverat**. Det kan användas efter att det har aktiverats i plugin-hanteraren, och ingen ytterligare konfiguration krävs.

![Gränssnitt för aktivering av plugin](https://static-docs.nocobase.com/20250731140048.png)

När ni har laddat upp en Office-fil (Word / Excel / PowerPoint) i ett filfält i en samling, klickar ni på motsvarande filikon eller länk för att visa filens innehåll i det popup-fönster eller inbäddade gränssnitt som visas.

![Exempel på förhandsvisning](https://static-docs.nocobase.com/20250731143231.png)

## Implementeringsprincip

Förhandsvisningen som bäddas in av detta plugin är beroende av Microsofts offentliga onlinetjänst (Office Web Viewer). Huvudprocessen är följande:

- Frontenden genererar en offentligt tillgänglig URL för filen som användaren har laddat upp (inklusive signerade S3-URL:er);
- Pluginet laddar förhandsvisningen av filen i en iframe med hjälp av följande adress:

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<Offentlig fil-URL>
  ```

- Microsofts tjänst begär filinnehållet från denna URL, renderar det och returnerar en visningsbar sida.

## Observera

- Eftersom detta plugin är beroende av Microsofts onlinetjänst måste ni se till att nätverksanslutningen fungerar och att Microsofts relaterade tjänster är åtkomliga.
- Microsoft kommer att få åtkomst till den fil-URL ni tillhandahåller, och filinnehållet kommer att cachas tillfälligt på deras servrar för att rendera förhandsvisningssidan. Detta innebär en viss integritetsrisk. Om ni har betänkligheter kring detta rekommenderas ni att inte använda förhandsvisningsfunktionen i detta plugin[^1].
- Filen som ska förhandsvisas måste ha en offentligt tillgänglig URL. Under normala omständigheter genererar filer som laddas upp till NocoBase automatiskt åtkomliga offentliga länkar (inklusive signerade URL:er som genereras av S3-Pro-pluginet), men om filen har begränsad åtkomst eller lagras i ett internt nätverk kan den inte förhandsvisas[^2].
- Tjänsten stöder inte inloggningsautentisering eller resurser i privat lagring. Till exempel kan filer som endast är tillgängliga inom ett internt nätverk eller som kräver inloggning inte använda denna förhandsvisningsfunktion.
- Efter att filinnehållet har hämtats av Microsofts tjänst kan det cachas under en kort tid. Även om källfilen raderas kan förhandsvisningen fortfarande vara tillgänglig under en period.
- Det finns rekommenderade storleksgränser för filer: Word- och PowerPoint-filer bör inte överstiga 10 MB, och Excel-filer bör inte överstiga 5 MB för att säkerställa stabilitet i förhandsvisningen[^3].
- För närvarande finns ingen officiell och tydlig beskrivning av licens för kommersiell användning av denna tjänst. Vänligen utvärdera riskerna själva vid användning[^4].

## Filformat som stöds

Pluginet stöder endast förhandsvisning av följande Office-filformat, baserat på filens MIME-typ eller filändelse:

- Word-dokument:
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`) eller `application/msword` (`.doc`)
- Excel-kalkylblad:
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`) eller `application/vnd.ms-excel` (`.xls`)
- PowerPoint-presentationer:
  `application/vnd.openxmlformats-officedocument.presentationml.presentation` (`.pptx`) eller `application/vnd.ms-powerpoint` (`.ppt`)
- OpenDocument-text: `application/vnd.oasis.opendocument.text` (`.odt`)

Filer i andra format kommer inte att aktivera detta plugins förhandsvisningsfunktion.

[^1]: [What is the status of view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Access denied or non-public files cannot be previewed](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - File size limits for Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Commercial use of Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)