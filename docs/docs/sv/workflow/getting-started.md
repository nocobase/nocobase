:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Kom igång

## Konfigurera ditt första arbetsflöde

Gå till hanteringssidan för **pluginet** för **arbetsflöden** via **plugin**-konfigurationsmenyn i den övre menyraden:

![Ingång till hantering av arbetsflödesplugin](https://static-docs.nocobase.com/20251027222721.png)

Hanteringsgränssnittet listar alla skapade **arbetsflöden**:

![Hantering av arbetsflöden](https://static-docs.nocobase.com/20251027222900.png)

Klicka på knappen ”Skapa ny” för att skapa ett nytt **arbetsflöde** och välj **samlingshändelse**:

![Skapa arbetsflöde](https://static-docs.nocobase.com/20251027222951.png)

Efter att ni har skickat in, klicka på länken ”Konfigurera” i listan för att komma till konfigurationsgränssnittet för **arbetsflödet**:

![Ett tomt arbetsflöde](https://static-docs.nocobase.com/20251027223131.png)

Klicka sedan på triggerns kort för att öppna konfigurationspanelen för triggern. Välj en tidigare skapad **samling** (t.ex. ”Inlägg”), välj ”Efter att post lagts till” för triggertillfället och klicka på knappen ”Spara” för att slutföra konfigurationen av triggern:

![Konfigurera trigger](https://static-docs.nocobase.com/20251027224735.png)

Därefter kan vi klicka på plusknappen i flödet för att lägga till en nod. Välj till exempel en beräkningsnod för att sammanfoga fälten ”Titel” och ”ID” från triggerdatan:

![Lägg till beräkningsnod](https://static-docs.nocobase.com/20251027224842.png)

Klicka på nodkortet för att öppna konfigurationspanelen för noden. Använd funktionen `CONCATENATE` från Formula.js för att sammanfoga fälten ”Titel” och ”ID”. De två fälten infogas via variabelväljaren:

![Beräkningsnod använder funktioner och variabler](https://static-docs.nocobase.com/20251027224939.png)

Skapa sedan en nod för att uppdatera data, som används för att spara resultatet i fältet ”Titel”:

![Skapa nod för att uppdatera data](https://static-docs.nocobase.com/20251027232654.png)

På samma sätt, klicka på kortet för att öppna konfigurationspanelen för noden för att uppdatera data. Välj **samlingen** ”Inlägg”, välj data-ID från triggern för post-ID:t som ska uppdateras, välj ”Titel” för fältet som ska uppdateras och välj resultatet från beräkningsnoden för värdet:

![Konfigurera nod för att uppdatera data](https://static-docs.nocobase.com/20251027232802.png)

Slutligen, klicka på växlingsknappen ”Aktivera”/”Inaktivera” i verktygsfältet uppe till höger för att ändra **arbetsflödets** status till aktiverat, så att **arbetsflödet** kan triggas och köras.

## Trigga arbetsflödet

Återgå till systemets huvudgränssnitt, skapa ett inlägg via inläggsblocket och fyll i inläggets titel:

![Skapa inläggsdata](https://static-docs.nocobase.com/20251027233004.png)

Efter att ni har skickat in och uppdaterat blocket kan ni se att inläggets titel automatiskt har uppdaterats till formatet ”Inläggstitel + Inläggs-ID”:

![Inläggstitel ändrad av arbetsflödet](https://static-docs.nocobase.com/20251027233043.png)

:::info{title=Tips}
Eftersom **arbetsflöden** som triggas av **samlingshändelser** körs asynkront, kan ni inte se datauppdateringen omedelbart i gränssnittet efter att ni har skickat in datan. Men efter en kort stund kan ni se det uppdaterade innehållet genom att uppdatera sidan eller blocket.
:::

## Visa körhistorik

**Arbetsflödet** har precis triggats och körts en gång. Vi kan gå tillbaka till hanteringsgränssnittet för **arbetsflöden** för att se den tillhörande körhistoriken:

![Visa arbetsflödeslista](https://static-docs.nocobase.com/20251027233246.png)

I **arbetsflödeslistan** kan ni se att detta **arbetsflöde** har genererat en körhistorik. Klicka på länken i kolumnen för antal för att öppna körhistorikposterna för det tillhörande **arbetsflödet**:

![Körhistoriklista för det tillhörande arbetsflödet](https://static-docs.nocobase.com/20251027233341.png)

Klicka sedan på länken ”Visa” för att komma till detaljsidan för den specifika körningen, där ni kan se körstatus och resultatdata för varje nod:

![Detaljer för arbetsflödets körhistorik](https://static-docs.nocobase.com/20251027233615.png)

Triggerns kontextdata och nodkörningens resultatdata kan båda visas genom att klicka på statusknappen i det övre högra hörnet av det tillhörande kortet. Låt oss till exempel titta på resultatdatan för beräkningsnoden:

![Beräkningsnodens resultat](https://static-docs.nocobase.com/20251027233635.png)

Ni kan se att resultatdatan från beräkningsnoden innehåller den beräknade titeln, vilken är den data som används av den efterföljande noden för att uppdatera data.

## Sammanfattning

Genom stegen ovan har vi slutfört konfigurationen och triggningen av ett enkelt **arbetsflöde** och har introducerats till följande grundläggande koncept:

- **Arbetsflöde**: Används för att definiera grundläggande information om ett flöde, inklusive namn, triggertyp och aktiveringsstatus. Ni kan konfigurera valfritt antal noder inom det. Det är den entitet som bär flödet.
- **Trigger**: Varje **arbetsflöde** innehåller en trigger, som kan konfigureras med specifika villkor för att **arbetsflödet** ska triggas. Det är flödets ingångspunkt.
- **Nod**: En nod är en instruktionsenhet inom ett **arbetsflöde** som utför en specifik åtgärd. Flera noder i ett **arbetsflöde** bildar ett komplett körflöde genom uppströms- och nedströmsrelationer.
- **Körning**: En körning är det specifika körningsobjektet efter att ett **arbetsflöde** har triggats, även känt som en körningspost eller körhistorik. Den innehåller information som körstatus och triggerkontextdata. Det finns också tillhörande körresultat för varje nod, som inkluderar nodens körstatus och resultatdata.

För mer djupgående användning kan ni vidare referera till följande innehåll:

- [Triggers](./triggers/index)
- [Noder](./nodes/index)
- [Använda variabler](./advanced/variables)
- [Körningar](./advanced/executions)
- [Versionshantering](./advanced/revisions)
- [Avancerade inställningar](./advanced/options)