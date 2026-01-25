---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Godkännande

## Introduktion

I ett godkännandearbetsflöde behöver ni använda en dedikerad "Godkännande"-nod för att konfigurera den logik som godkännare ska använda för att hantera (godkänna, avvisa eller returnera) den initierade godkännandeprocessen. "Godkännande"-noden kan endast användas i godkännandeprocesser.

:::info{title=Tips}
Skillnaden från den vanliga "Manuell hantering"-noden: Den vanliga "Manuell hantering"-noden är avsedd för mer generella scenarier, som manuell datainmatning eller manuella beslut om arbetsflödet ska fortsätta i olika typer av arbetsflöden. "Godkännande"-noden är en specialiserad hanteringsnod exklusivt för godkännandeprocesser. Den hanterar endast data för det initierade godkännandet och kan inte användas i andra arbetsflöden.
:::

## Skapa nod

Klicka på plusknappen ("+") i arbetsflödet för att lägga till en "Godkännande"-nod. Välj sedan ett av godkännandelägena för att skapa godkännandenoden:

![审批节点_创建](https://static-docs.nocobase.com/20251107000938.png)

## Nodkonfiguration

### Godkännandeläge

Det finns två godkännandelägen:

1.  **Direktläge**: Används vanligtvis för enklare processer. Om godkännandenoden godkänns eller inte avgör endast om processen avslutas. Om den inte godkänns avslutas processen direkt.

    ![审批节点_通过模式_直通模式](https://static-docs.nocobase.com/20251107001043.png)

2.  **Grenläge**: Används vanligtvis för mer komplex datalogik. Efter att godkännandenoden har producerat ett resultat kan andra noder fortsätta att exekveras inom dess resultatgren.

    ![审批节点_通过模式_分支模式](https://static-docs.nocobase.com/20251107001234.png)

    När denna nod har "godkänts" kommer, förutom att godkännandegrenen exekveras, även det efterföljande arbetsflödet att fortsätta. Efter en "Avvisa"-åtgärd kan det efterföljande arbetsflödet också fortsätta som standard, eller så kan ni konfigurera noden att avsluta processen efter att grenen har exekverats.

:::info{title=Tips}
Godkännandeläget kan inte ändras efter att noden har skapats.
:::

### Godkännare

Godkännaren är den uppsättning användare som ansvarar för godkännandeåtgärden för denna nod. Det kan vara en eller flera användare. Källan kan vara ett statiskt värde valt från användarlistan, eller ett dynamiskt värde specificerat av en variabel:

![审批节点_审批人](https://static-docs.nocobase.com/20251107001433.png)

När ni väljer en variabel kan ni endast välja primärnyckeln eller främmande nyckeln för användardata från kontexten och nodresultaten. Om den valda variabeln är en array under exekvering (en till-många-relation), kommer varje användare i arrayen att slås samman till den totala godkännargruppen.

Förutom att direkt välja användare eller variabler kan ni också dynamiskt filtrera fram kvalificerade användare som godkännare baserat på sökfrågor från användartabellen:

![20251107001703](https://static-docs.nocobase.com/20251107001703.png)

### Överenskommelseläge

Om det bara finns en godkännare vid den slutliga exekveringen (inklusive efter att flera variabler har avduplicerats), kommer endast den användaren att utföra godkännandeåtgärden, oavsett vilket överenskommelseläge som väljs, och resultatet bestäms enbart av den användaren.

När det finns flera användare i godkännargruppen representerar valet av olika överenskommelselägen olika hanteringssätt:

1.  **Valfri**: Det räcker att en person godkänner för att noden ska godkännas. Noden avvisas endast om alla avvisar.
2.  **Samtycke**: Alla måste godkänna för att noden ska godkännas. Om bara en person avvisar, avvisas noden.
3.  **Omröstning**: Antalet personer som godkänner måste överstiga en inställd andel för att noden ska godkännas; annars avvisas noden.

För åtgärden "Returnera" gäller att om någon användare i godkännargruppen hanterar den som en retur, kommer noden att avsluta processen direkt, oavsett läge.

### Bearbetningsordning

På samma sätt, när det finns flera användare i godkännargruppen, representerar valet av olika bearbetningsordningar olika hanteringssätt:

1.  **Parallellt**: Alla godkännare kan hantera i valfri ordning; ordningen spelar ingen roll.
2.  **Sekventiellt**: Godkännare hanterar i den ordning de står i godkännargruppen. Nästa godkännare kan endast hantera efter att den föregående har skickat in sitt beslut.

Oavsett om det är inställt på "Sekventiell" hantering, följer resultatet som produceras enligt den faktiska bearbetningsordningen även reglerna i det ovan nämnda "Överenskommelseläget". Noden slutför sin exekvering när motsvarande villkor är uppfyllda.

### Avsluta arbetsflödet efter att avvisningsgrenen har slutförts

När "Godkännandeläge" är inställt på "Grenläge" kan ni välja att avsluta arbetsflödet efter att avvisningsgrenen har slutförts. Efter att ni har markerat detta alternativ visas ett "✗" i slutet av avvisningsgrenen, vilket indikerar att efterföljande noder inte kommer att fortsätta efter att denna gren har avslutats:

![审批节点_拒绝后退出](https://static-docs.nocobase.com/20251107001839.png)

### Konfiguration av godkännargränssnitt

Konfigurationen av godkännargränssnittet används för att tillhandahålla ett användargränssnitt för godkännaren när godkännandearbetsflödet exekveras till denna nod. Klicka på konfigurationsknappen för att öppna popup-fönstret:

![审批节点_界面配置_弹窗](https://static-docs.nocobase.com/20251107001958.png)

I konfigurationspopupen kan ni lägga till block som ursprungligt inskickat innehåll, godkännandeinformation, hanteringsformulär och anpassad ledtext:

![审批节点_界面配置_添加区块](https://static-docs.nocobase.com/20251107002604.png)

#### Ursprungligt inskickat innehåll

Blocket för detaljer om godkännandeinnehållet är det datablock som initiativtagaren har skickat in. I likhet med ett vanligt datablock kan ni fritt lägga till fältkomponenter från samlingen och arrangera dem som ni vill, för att organisera det innehåll som godkännaren behöver granska:

![审批节点_界面配置_详情区块](https://static-docs.nocobase.com/20251107002925.png)

#### Hanteringsformulär

I blocket för hanteringsformuläret kan ni lägga till åtgärdsknappar som stöds av denna nod, inklusive "Godkänn", "Avvisa", "Returnera", "Omfördela" och "Lägg till signatär":

![审批节点_界面配置_操作表单区块](https://static-docs.nocobase.com/20251107003015.png)

Dessutom kan fält som kan ändras av godkännaren läggas till i hanteringsformuläret. Dessa fält visas i formuläret när godkännaren hanterar godkännandet. Godkännaren kan ändra värdena för dessa fält, och vid inskickning uppdateras både data för godkännandet och en ögonblicksbild av motsvarande data i godkännandeprocessen samtidigt.

![审批节点_界面配置_操作表单_修改审批内容字段](https://static-docs.nocobase.com/20251107003206.png)

#### "Godkänn" och "Avvisa"

Bland godkännandeåtgärdsknapparna är "Godkänn" och "Avvisa" avgörande åtgärder. Efter inskickning är godkännarens hantering för denna nod slutförd. Ytterligare fält som behöver fyllas i vid inskickning kan läggas till i popup-fönstret "Hanteringskonfiguration" för åtgärdsknappen, till exempel "Kommentar".

![审批节点_界面配置_操作表单_处理配置](https://static-docs.nocobase.com/20251107003314.png)

#### "Returnera"

"Returnera" är också en avgörande åtgärd. Förutom att konfigurera kommentarer kan ni även konfigurera vilka noder som det går att returnera till:

![20251107003555](https://static-docs.nocobase.com/20251107003555.png)

#### "Omfördela" och "Lägg till signatär"

"Omfördela" och "Lägg till signatär" är icke-avgörande åtgärder som används för att dynamiskt justera godkännarna i godkännandeprocessen. "Omfördela" innebär att den aktuella användarens godkännandeuppgift överlämnas till en annan användare för hantering. "Lägg till signatär" innebär att en godkännare läggs till före eller efter den aktuella godkännaren, och den nya godkännaren fortsätter godkännandeprocessen tillsammans.

Efter att ni har aktiverat åtgärdsknapparna "Omfördela" eller "Lägg till signatär" behöver ni välja "Tilldelningsomfång" i knappens konfigurationsmeny för att ställa in vilka användare som kan tilldelas som nya godkännare:

![审批节点_界面配置_操作表单_指派人员范围](https://static-docs.nocobase.com/20241226232321.png)

Precis som nodens ursprungliga godkännarkonfiguration kan tilldelningsomfånget också vara direkt valda godkännare eller baseras på sökfrågor från användarsamlingen. Det kommer slutligen att slås samman till en grupp och kommer inte att inkludera användare som redan finns i godkännargruppen.

:::warning{title=Viktigt}
Om ni har aktiverat eller inaktiverat en åtgärdsknapp, eller ändrat tilldelningsomfånget, måste ni spara nodens konfiguration efter att ni har stängt popup-fönstret för konfiguration av åtgärdsgränssnittet. Annars kommer ändringarna för åtgärdsknappen inte att träda i kraft.
:::

## Nodresultat

Efter att godkännandet har slutförts kommer relevant status och data att registreras i nodresultatet och kan användas som variabler av efterföljande noder.

![20250614095052](https://static-docs.nocobase.com/20250614095052.png)

### Nodens godkännandestatus

Representerar den aktuella godkännandenodens bearbetningsstatus. Resultatet är ett uppräknat värde.

### Data efter godkännande

Om godkännaren ändrar godkännandeinnehållet i hanteringsformuläret, kommer de ändrade uppgifterna att registreras i nodresultatet för användning av efterföljande noder. Om ni behöver använda relationsfält måste ni konfigurera förladdning för relationsfälten i triggern.

### Godkännandeposter

> v1.8.0+

Godkännandeposterna är en array som innehåller hanteringsposter för alla godkännare i denna nod. Varje hanteringspost innehåller följande fält:

| Fält | Typ | Beskrivning |
| --- | --- | --- |
| id | number | Unik identifierare för hanteringsposten |
| userId | number | Användar-ID som hanterade denna post |
| status | number | Hanteringsstatus |
| comment | string | Kommentar vid hanteringstillfället |
| updatedAt | string | Uppdateringstid för hanteringsposten |

Ni kan använda fälten som variabler i efterföljande noder vid behov.