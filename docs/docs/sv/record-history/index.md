---
pkg: '@nocobase/plugin-record-history'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Historik

## Introduktion

**Historik**-pluginet spårar dataförändringar genom att automatiskt spara ögonblicksbilder och skillnader från **skapande-**, **uppdaterings-** och **borttagningsoperationer**. Det hjälper användare att snabbt granska dataändringar och granska åtgärder.

![](https://static-docs.nocobase.com/202511011338499.png)

## Aktivera historik

### Lägg till samlingar och fält

Gå först till inställningssidan för Historik-pluginet för att lägga till de **samlingar** och fält som ni vill spåra historik för. För att förbättra inspelningseffektiviteten och undvika dataredundans rekommenderas det att endast spåra viktiga fält. Fält som **unikt ID**, **skapades den**, **uppdaterades den**, **skapades av** och **uppdaterades av** behöver vanligtvis inte registreras.

![](https://static-docs.nocobase.com/202511011315010.png)

![](https://static-docs.nocobase.com/202511011316342.png)

### Synkronisera historiska dataögonblicksbilder

- För poster som skapats innan historikspårning aktiverades kan ändringar endast loggas efter att den första uppdateringen genererar en ögonblicksbild; den första uppdateringen eller borttagningen kommer inte att registreras.
- För att bevara historiken för befintlig data kan ni utföra en engångssynkronisering av ögonblicksbilder.
- Ögonblicksbildens storlek per **samling** beräknas som: antal poster × antal spårade fält.
- För stora datamängder rekommenderas det att filtrera efter dataomfång och endast synkronisera viktiga poster.

![](https://static-docs.nocobase.com/202511011319386.png)

![](https://static-docs.nocobase.com/202511011319284.png)

Klicka på knappen **”Synkronisera historiska ögonblicksbilder”**, konfigurera fälten och dataomfånget, och starta synkroniseringen.

![](https://static-docs.nocobase.com/202511011320958.png)

Synkroniseringsuppgiften kommer att köas och köras i bakgrunden. Ni kan uppdatera listan för att kontrollera dess slutförandestatus.

## Använda historikblocket

### Lägg till ett block

Välj **Historikblocket** och välj en **samling** för att lägga till motsvarande historikblock på er sida.

![](https://static-docs.nocobase.com/202511011323410.png)

![](https://static-docs.nocobase.com/202511011331667.png)

Om ni lägger till ett historikblock i en postdetaljers popup-fönster kan ni välja **”Aktuell post”** för att visa historiken som är specifik för den posten.

![](https://static-docs.nocobase.com/202511011338042.png)

![](https://static-docs.nocobase.com/202511011338499.png)

### Redigera beskrivningsmallar

Klicka på **Redigera mall** i blockinställningarna för att konfigurera beskrivningstexten för åtgärdsloggarna.

![](https://static-docs.nocobase.com/202511011340406.png)

Ni kan konfigurera separata beskrivningsmallar för **skapande-**, **uppdaterings-** och **borttagningsoperationer**. För uppdateringsoperationer kan ni också konfigurera beskrivningsmallen för fältändringar, antingen som en enda mall för alla fält eller för specifika fält individuellt.

![](https://static-docs.nocobase.com/202511011346400.png)

Variabler kan användas när ni konfigurerar texten.

![](https://static-docs.nocobase.com/202511011347163.png)

Efter konfigurationen kan ni välja att tillämpa mallen på **Alla historikblock för den aktuella samlingen** eller **Endast detta historikblock**.

![](https://static-docs.nocobase.com/202511011348885.png)