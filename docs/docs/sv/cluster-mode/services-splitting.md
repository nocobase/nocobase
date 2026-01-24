:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Tjänstesplittring <Badge>v1.9.0+</Badge>

## Introduktion

Normalt sett körs alla tjänster i en NocoBase-applikation i samma Node.js-instans. När funktionaliteten inom applikationen blir mer komplex i takt med att verksamheten växer, kan vissa tidskrävande tjänster påverka den övergripande prestandan.

För att förbättra applikationens prestanda stöder NocoBase att dela upp applikationens tjänster så att de körs på olika noder i klusterläge. Detta förhindrar att prestandaproblem med en enskild tjänst påverkar hela applikationen och dess förmåga att svara på användarförfrågningar.

Detta möjliggör också riktad horisontell skalning av specifika tjänster, vilket förbättrar klustrets resursutnyttjande.

Vid klusterdistribution av NocoBase kan olika tjänster delas upp och distribueras för att köras på olika noder. Följande diagram illustrerar den uppdelade strukturen:

![20250803214857](https://static-docs.nocobase.com/20250803214857.png)

## Vilka tjänster kan delas upp

### Asynkrona arbetsflöden

**Service KEY**: `workflow:process`

Arbetsflöden i asynkront läge köas för exekvering efter att de har triggats. Dessa arbetsflöden kan betraktas som bakgrundsuppgifter, och användare behöver vanligtvis inte vänta på att resultaten ska returneras. Särskilt för komplexa och tidskrävande processer med stor triggervolym rekommenderas det att dela upp dem för att köras på oberoende noder.

### Andra asynkrona uppgifter på användarnivå

**Service KEY**: `async-task:process`

Detta inkluderar uppgifter som skapats av användaråtgärder som asynkron import och export. Vid stora datavolymer eller hög samtidighet rekommenderas det att dela upp dem för att köras på oberoende noder.

## Hur man delar upp tjänster

Att dela upp olika tjänster till olika noder uppnås genom att konfigurera miljövariabeln `WORKER_MODE`. Denna miljövariabel kan konfigureras enligt följande regler:

- `WORKER_MODE=<tom>`: När den inte är konfigurerad, eller är inställd på tom, är arbetsläget detsamma som det nuvarande eninstansläget; den accepterar alla förfrågningar och behandlar alla uppgifter. Detta är kompatibelt med applikationer som inte tidigare konfigurerats.
- `WORKER_MODE=!`: Arbetsläget är att endast behandla förfrågningar och inga uppgifter.
- `WORKER_MODE=workflow:process,async-task:process`: Konfigurerad med en eller flera tjänsteidentifierare (separerade med kommatecken), är arbetsläget att endast behandla uppgifter för dessa identifierare och inte förfrågningar.
- `WORKER_MODE=*`: Arbetsläget är att behandla alla bakgrundsuppgifter, oavsett modul, men inte förfrågningar.
- `WORKER_MODE=!,workflow:process`: Arbetsläget är att behandla förfrågningar och samtidigt endast behandla uppgifter för en specifik identifierare.
- `WORKER_MODE=-`: Arbetsläget är att inte behandla några förfrågningar eller uppgifter (detta läge krävs inom worker-processen).

I en K8S-miljö kan till exempel noder med samma uppdelningsfunktionalitet använda samma miljövariabelkonfiguration, vilket gör det enkelt att horisontellt skala en specifik typ av tjänst.

## Konfigurationsexempel

### Flera noder med separat bearbetning

Anta att det finns tre noder: `node1`, `node2` och `node3`. De kan konfigureras på följande sätt:

- `node1`: Behandlar endast användarens UI-förfrågningar, konfigurera `WORKER_MODE=!`.
- `node2`: Behandlar endast arbetsflödesuppgifter, konfigurera `WORKER_MODE=workflow:process`.
- `node3`: Behandlar endast asynkrona uppgifter, konfigurera `WORKER_MODE=async-task:process`.

### Flera noder med blandad bearbetning

Anta att det finns fyra noder: `node1`, `node2`, `node3` och `node4`. De kan konfigureras på följande sätt:

- `node1` och `node2`: Behandlar alla vanliga förfrågningar, konfigurera `WORKER_MODE=!`, och låt en lastbalanserare automatiskt distribuera förfrågningarna till dessa två noder.
- `node3` och `node4`: Behandlar alla andra bakgrundsuppgifter, konfigurera `WORKER_MODE=*`.

## Utvecklarreferens

När ni utvecklar affärs-plugins kan ni dela upp tjänster som förbrukar betydande resurser, baserat på scenariots krav. Detta kan uppnås på följande sätt:

1. Definiera en ny tjänsteidentifierare, till exempel `my-plugin:process`, för konfiguration av miljövariabler och tillhandahåll dokumentation för den.
2. I affärslogiken på pluginets serversida, använd gränssnittet `app.serving()` för att kontrollera miljön och avgöra om den aktuella noden ska tillhandahålla en specifik tjänst baserat på miljövariabeln.

```javascript
const MY_PLUGIN_SERVICE_KEY = 'my-plugin:process';
// I pluginets serverside-kod
if (this.app.serving(MY_PLUGIN_SERVICE_KEY)) {
  // Behandla affärslogiken för denna tjänst
} else {
  // Behandla inte affärslogiken för denna tjänst
}
```