---
pkg: '@nocobase/plugin-workflow-manual'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Manuell hantering

## Introduktion

När en affärsprocess inte helt kan automatiseras för beslutsfattande, kan ni använda en manuell nod för att överlåta en del av beslutsfattandet till manuell hantering.

När en manuell nod exekveras avbryts hela arbetsflödets exekvering och en att-göra-uppgift genereras för den aktuella användaren. Efter att användaren har skickat in uppgiften, kommer arbetsflödet antingen att fortsätta, förbli väntande eller avslutas, beroende på den valda statusen. Detta är mycket användbart i scenarier som till exempel godkännandeprocesser.

## Installation

Inbyggd plugin, ingen installation krävs.

## Skapa nod

I gränssnittet för konfiguration av arbetsflöden klickar ni på plusknappen ("+") i arbetsflödet för att lägga till en "Manuell hantering"-nod:

![创建人工节点](https://static-docs.nocobase.com/4dd259f1aceeaf9b825abb4b257df909.png)

## Konfigurera nod

### Ansvarig

En manuell nod kräver att ni anger en användare som utförare av att-göra-uppgiften. Listan över att-göra-uppgifter kan läggas till som ett block på en sida, och innehållet i uppgiftens popup-fönster för varje nod måste konfigureras i nodens gränssnitt.

Välj en användare, eller välj primärnyckeln eller främmande nyckeln för användardata från sammanhanget via en variabel.

![人工节点_配置_负责人_选择变量](https://static-docs.nocobase.com/22fbca3b8e21fda3a831019037001445.png)

:::info{title=Obs}
För närvarande stöder alternativet för ansvarig för manuella noder inte flera användare. Detta kommer att stödjas i en framtida version.
:::

### Konfigurera användargränssnitt

Gränssnittskonfigurationen för att-göra-uppgiften är kärnan i den manuella noden. Ni kan klicka på knappen "Konfigurera användargränssnitt" för att öppna ett separat popup-fönster för konfiguration, som kan konfigureras WYSIWYG (What You See Is What You Get), precis som en vanlig sida:

![人工节点_节点配置_界面配置](https://static-docs.nocobase.com/fd360168c879743cf22d57440cd2590f.png)

#### Flikar

Flikar kan användas för att skilja på olika innehåll. Till exempel kan en flik användas för godkända formulärinlämningar, en annan för avvisade formulärinlämningar, eller för att visa detaljer om relaterade data. De kan konfigureras fritt.

#### Block

De stödda blocktyperna delas huvudsakligen in i två kategorier: datablock och formulärblock. Dessutom används Markdown främst för statiskt innehåll som informationsmeddelanden.

##### Datablock

Datablock kan visa utlösardata eller bearbetningsresultat från vilken nod som helst, för att ge relevant sammanhangsinformation till den ansvarige för att-göra-uppgiften. Om arbetsflödet till exempel utlöses av en formulärhändelse, kan ni skapa ett detaljblock för utlösardatan. Detta överensstämmer med detaljkonfigurationen för en vanlig sida, vilket gör att ni kan välja vilket fält som helst från utlösardatan för visning:

![人工节点_节点配置_界面配置_数据区块_触发器](https://static-docs.nocobase.com/675c3e58a1a4f45db310a72c2d0a404c.png)

Noddatalblock är liknande; ni kan välja dataresultatet från en uppströmsnod för att visa som detaljer. Till exempel kan resultatet av en uppströms beräkningsnod fungera som sammanhangsreferensinformation för den ansvariges att-göra-uppgift:

![人工节点_节点配置_界面配置_数据区块_节点数据](https://static-docs.nocobase.com/a583e26e508e954b47e5ddff80d998c4.png)

:::info{title=Obs}
Eftersom arbetsflödet inte är i ett exekverat tillstånd under gränssnittskonfigurationen, visas inga specifika data i datablocken. Relevant data för en specifik arbetsflödesinstans kan endast ses i att-göra-popup-fönstret efter att arbetsflödet har utlösts och exekverats.
:::

##### Formulärblock

Minst ett formulärblock måste konfigureras i att-göra-gränssnittet för att hantera det slutgiltiga beslutet om arbetsflödet ska fortsätta. Att inte konfigurera ett formulär kommer att förhindra att arbetsflödet fortsätter efter att det har avbrutits. Det finns tre typer av formulärblock:

- Anpassat formulär
- Formulär för att skapa post
- Formulär för att uppdatera post

![人工节点_节点配置_界面配置_表单类型](https://static-docs.nocobase.com/2d068f3012ab07e32a265405492104a8.png)

Formulär för att skapa post och formulär för att uppdatera post kräver att ni väljer en bas-samling. Efter att den ansvarige för att-göra-uppgiften har skickat in, kommer värdena i formuläret att användas för att skapa eller uppdatera data i den angivna samlingen. Ett anpassat formulär låter er fritt definiera ett tillfälligt formulär som inte är kopplat till en samling. Fältvärdena som skickas in av den ansvarige för att-göra-uppgiften kan användas i efterföljande noder.

Formulärets skicka-knappar kan konfigureras i tre typer:

- Skicka och fortsätt arbetsflödet
- Skicka och avsluta arbetsflödet
- Spara endast formulärvärden

![人工节点_节点配置_界面配置_表单按钮](https://static-docs.nocobase.com/6b4599b14152e832a265405492104a8.png)

De tre knapparna representerar tre nodstatusar i arbetsflödesprocessen. Efter inlämning ändras nodens status till "Slutförd", "Avvisad" eller förblir i ett "Väntande" tillstånd. Ett formulär måste ha minst en av de två första konfigurerade för att bestämma det efterföljande flödet för hela arbetsflödet.

På knappen "Fortsätt arbetsflödet" kan ni konfigurera tilldelningar för formulärfält:

![人工节点_节点配置_界面配置_表单按钮_设置表单值](https://static-docs.nocobase.com/2cec2d4e2957f068877e616dec3b56dd.png)

![人工节点_节点配置_界面配置_表单按钮_设置表单值弹窗](https://static-docs.nocobase.com/5ff51b60c76cdb76e6f1cc95dc3d8640.png)

Efter att ni har öppnat popup-fönstret kan ni tilldela värden till vilket formulärfält som helst. Efter att formuläret har skickats in kommer detta värde att vara fältets slutgiltiga värde. Detta är särskilt användbart vid granskning av data. Ni kan använda flera olika "Fortsätt arbetsflödet"-knappar i ett formulär, där varje knapp ställer in olika uppräkningsvärden för fält som status, för att uppnå effekten av att fortsätta den efterföljande arbetsflödesexekveringen med olika datavärden.

## Att-göra-block

För manuell hantering behöver ni också lägga till en att-göra-lista på en sida för att visa att-göra-uppgifter. Detta gör att relevant personal kan komma åt och hantera de specifika uppgifterna för den manuella noden via denna lista.

### Lägg till block

Ni kan välja "Arbetsflöde Att-göra" från blocken på en sida för att lägga till ett block för att-göra-listan:

![人工节点_添加待办区块](https://static-docs.nocobase.com/198b41754cd73b704267bf30fe5e647.png)

Exempel på att-göra-listblock:

![人工节点_待办列表](https://static-docs.nocobase.com/cfefb053c9dfa550d6b220f34.png)

### Att-göra-detaljer

Därefter kan relevant personal klicka på den motsvarande att-göra-uppgiften för att öppna att-göra-popup-fönstret och utföra den manuella hanteringen:

![人工节点_待办详情](https://static-docs.nocobase.com/ccfd0533deebff6b3f6ef4408066e688.png)

## Exempel

### Artikelgranskning

Anta att en artikel som skickats in av en vanlig användare behöver godkännas av en administratör innan den kan uppdateras till publicerad status. Om arbetsflödet avvisas, kommer artikeln att förbli i utkaststatus (inte offentlig). Denna process kan implementeras med hjälp av ett uppdateringsformulär i en manuell nod.

Skapa ett arbetsflöde som utlöses av "Skapa artikel" och lägg till en manuell nod:

<figure>
  <img alt="人工节点_示例_文章审核_流程编排" src="https://github.com/nocobase/nocobase/assets/525658/2021bf42-f372-4f69-9c84-5a786c061e0e" width="360" />
</figure>

I den manuella noden konfigurerar ni den ansvarige som administratör. I gränssnittskonfigurationen lägger ni till ett block baserat på utlösardatan för att visa detaljerna för den nya artikeln:

<figure>
  <img alt="人工节点_示例_文章审核_节点配置_详情区块" src="https://github.com/nocobase/nocobase/assets/525658/c61d0aac-23cb-4387-b60e-ce3cc7bf1c24" width="680" />
</figure>

I gränssnittskonfigurationen lägger ni till ett block baserat på ett formulär för att uppdatera post, väljer samlingen för artiklar, så att administratören kan besluta om godkännande. Efter godkännande kommer den motsvarande artikeln att uppdateras baserat på andra efterföljande konfigurationer. Efter att ni har lagt till formuläret finns det som standard en knapp "Fortsätt arbetsflödet", som kan betraktas som "Godkänn". Lägg sedan till en "Avsluta arbetsflödet"-knapp för att hantera avslag:

<figure>
  <img alt="人工节点_示例_文章审核_节点配置_表单和操作" src="https://github.com/nocobase/nocobase/assets/525658/4baaf41e-3d81-4ee8-a038-29db05e0d99f" width="673" />
</figure>

När ni fortsätter arbetsflödet behöver vi uppdatera artikelns status. Det finns två sätt att konfigurera detta. Ett är att direkt visa artikelns statusfält i formuläret för att operatören ska kunna välja. Denna metod är mer lämplig för situationer som kräver aktiv formulärifyllning, till exempel för att ge feedback:

<figure>
  <img alt="人工节点_示例_文章审核_节点配置_表单字段" src="https://github.com/nocobase/nocobase/assets/525658/82ea4e0e-25fc-4921-841e-e1a2782a87d1" width="668" />
</figure>

För att förenkla operatörens uppgift är ett annat sätt att konfigurera formulärvärdestilldelning på knappen "Fortsätt arbetsflödet". I tilldelningen lägger ni till ett "Status"-fält med värdet "Publicerad". Detta innebär att när operatören klickar på knappen, kommer artikeln att uppdateras till publicerad status:

<figure>
  <img alt="人工节点_示例_文章审核_节点配置_表单赋值" src="https://github.com/nocobase/nocobase/assets/525658/0340bd9f-8323-4e4f-bc5a-8f81be3d6736" width="711" />
</figure>

Sedan, från konfigurationsmenyn i det övre högra hörnet av formulärblocket, väljer ni filtervillkoret för de data som ska uppdateras. Här väljer ni samlingen "Artiklar", och filtervillkoret är "ID `lika med` Utlösarvariabel / Utlösardata / ID":

<figure>
  <img alt="人工节点_示例_文章审核_节点配置_表单条件" src="https://github.com/nocobase/nocobase/assets/525658/da004055-0262-49ae-88dd-3844f3c92e28" width="1020" />
</figure>

Slutligen kan ni ändra titlarna på varje block, texten på de relevanta knapparna och formulärfältens ledtext för att göra gränssnittet mer användarvänligt:

<figure>
  <img alt="人工节点_示例_文章审核_节点配置_最终表单" src="https://github.com/nocobase/nocobase/assets/525658/21db5f6b-690b-49c1-8259-4f7b8874620d" width="678" />
</figure>

Stäng konfigurationspanelen och klicka på skicka-knappen för att spara nodkonfigurationen. Arbetsflödet är nu konfigurerat. Efter att ni har aktiverat detta arbetsflöde kommer det automatiskt att utlösas när en ny artikel skapas. Administratören kan se att detta arbetsflöde behöver hanteras från att-göra-uppgiftslistan. Genom att klicka för att visa kan ni se detaljerna för att-göra-uppgiften:

<figure>
  <img alt="人工节点_示例_文章审核_待办列表" src="https://github.com/nocobase/nocobase/assets/525658/4e1748cd-6a07-4045-82e5-286826607826" width="1363" />
</figure>

<figure>
  <img alt="人工节点_示例_文章审核_待办详情" src="https://github.com/nocobase/nocobase/assets/525658/65f01fb1-8cb0-45f8-ac21-ec8ab59be449" width="680" />
</figure>

Administratören kan göra en manuell bedömning baserat på artikelns detaljer för att avgöra om artikeln kan publiceras. Om så är fallet, klickar ni på knappen "Godkänn", och artikeln kommer att uppdateras till publicerad status. Om inte, klickar ni på knappen "Avvisa", och artikeln kommer att förbli i utkaststatus.

## Ledighetsansökan

Anta att en anställd behöver ansöka om ledighet, vilket måste godkännas av en chef för att träda i kraft, och den anställdes motsvarande semesterdata behöver dras av. Oavsett godkännande eller avslag kommer en begäransnod att användas för att anropa ett SMS-API för att skicka ett meddelande till den anställde (se avsnittet [HTTP-förfrågan](#_HTTP_请求)). Detta scenario kan implementeras med hjälp av ett anpassat formulär i en manuell nod.

Skapa ett arbetsflöde som utlöses av "Skapa ledighetsansökan" och lägg till en manuell nod. Detta liknar den tidigare artikelgranskningsprocessen, men här är den ansvarige chefen. I gränssnittskonfigurationen lägger ni till ett block baserat på utlösardatan för att visa detaljerna för den nya ledighetsansökan. Lägg sedan till ytterligare ett block baserat på ett anpassat formulär för att chefen ska kunna besluta om godkännande. I det anpassade formuläret lägger ni till ett fält för godkännandestatus och ett fält för avslagsskäl:

<figure>
  <img alt="人工节点_示例_请假审批_节点配置" src="https://github.com/nocobase/nocobase/assets/525658/ef3bc7b8-56e8-4a4e-826e-ffd0b547d1b6" width="675" />
</figure>

Till skillnad från artikelgranskningsprocessen, eftersom vi behöver fortsätta den efterföljande processen baserat på chefens godkännanderesultat, konfigurerar vi här endast en "Fortsätt arbetsflödet"-knapp för inlämning, utan att använda en "Avsluta arbetsflödet"-knapp.

Samtidigt, efter den manuella noden, kan vi använda en villkorsnod för att avgöra om chefen har godkänt ledighetsansökan. I godkännandegrenen lägger ni till databehandling för att dra av ledighet, och efter att grenarna har slagits samman, lägger ni till en begäransnod för att skicka ett SMS-meddelande till den anställde. Detta resulterar i följande kompletta arbetsflöde:

<figure>
  <img alt="人工节点_示例_请假审批_流程编排" src="https://github.com/nocobase/nocobase/assets/525658/733f68da-e44f-4172-9772-a287ac2724f2" width="593" />
</figure>

Villkoret i villkorsnoden är konfigurerat som "Manuell nod / Anpassad formulärdata / Värdet på godkännandefältet är 'Godkänd'":

<figure>
  <img alt="人工节点_示例_请假审批_条件判断" src="https://github.com/nocobase/nocobase/assets/525658/57b972f0-a3ce-4f33-8d40-4272ad205c20" width="678" />
</figure>

Data i begäransnoden kan också använda motsvarande formulärvariabler från den manuella noden för att skilja på SMS-innehållet för godkännande och avslag. Detta slutför hela arbetsflödeskonfigurationen. Efter att arbetsflödet har aktiverats, när en anställd skickar in en ledighetsansökan, kan chefen behandla godkännandet i sina att-göra-uppgifter. Operationen är i princip liknande artikelgranskningsprocessen.