:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Körningsplan (Historik)

När ett arbetsflöde utlöses skapas en motsvarande körningsplan för att spåra hur uppgiften utförs. Varje körningsplan har ett statusvärde som anger den aktuella körningsstatusen, vilken ni kan se i listan och detaljerna för körningshistoriken:

![Körningsplanens status](https://static-docs.nocobase.com/d4440d92ccafac6fac85da4415bb2a26.png)

När alla noder i huvudflödets gren har utförts till slutet av processen med statusen "Slutförd" kommer hela körningsplanen att avslutas med statusen "Slutförd". Om en nod i huvudflödets gren får en slutstatus som "Misslyckad", "Fel", "Avbruten" eller "Nekad" kommer hela körningsplanen att **avbrytas i förtid** med motsvarande status. När en nod i huvudflödets gren har statusen "Väntar" pausas hela körningsplanen, men visar fortfarande statusen "Pågående" tills den väntande noden återupptas. Olika nodtyper hanterar vänteläget på olika sätt. Till exempel måste en manuell nod vänta på manuell hantering, medan en fördröjningsnod måste vänta tills den angivna tiden har passerat innan den fortsätter.

Körningsplanens statusar visas i tabellen nedan:

| Status      | Motsvarande status för den senast utförda noden i huvudflödet | Betydelse                                                              |
| ----------- | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| I kö        | -                                                            | Arbetsflödet har utlösts och en körningsplan har skapats, och väntar i kön på att schemaläggaren ska starta exekveringen. |
| Pågående    | Väntar                                                       | Noden kräver en paus och väntar på ytterligare indata eller en återuppringning för att fortsätta. |
| Slutförd    | Slutförd                                                     | Inga problem uppstod, och alla noder utfördes en efter en som förväntat. |
| Misslyckad  | Misslyckad                                                   | Misslyckades eftersom nodkonfigurationen inte uppfylldes.             |
| Fel         | Fel                                                          | Noden stötte på ett ohanterat programfel och avbröts i förtid.         |
| Avbruten    | Avbruten                                                     | En väntande nod avbröts externt av arbetsflödesadministratören, vilket ledde till ett förtida avslut. |
| Nekad       | Nekad                                                        | I en nod för manuell hantering nekades den manuellt, och den efterföljande processen kommer inte att fortsätta. |

I exemplet [Snabbstart](../getting-started.md) vet vi redan att genom att granska detaljerna i ett arbetsflödes körningshistorik kan vi kontrollera om alla noder utfördes normalt, samt exekveringsstatus och resultatdata för varje utförd nod. I vissa avancerade arbetsflöden och noder kan en nod ha flera resultat, till exempel resultatet av en loop-nod:

![Nodresultat från flera körningar](https://static-docs.nocobase.com/bbda259fa2ddf62b0fc0f982efbedae9.png)

:::info{title=Tips}
Arbetsflöden kan utlösas samtidigt, men de exekveras sekventiellt i en kö. Även om flera arbetsflöden utlöses samtidigt, kommer de att utföras ett i taget, inte parallellt. Därför betyder statusen "I kö" att andra arbetsflöden för närvarande körs och att det måste vänta.

Statusen "Pågående" indikerar endast att körningsplanen har startat och är vanligtvis pausad på grund av en intern nods vänteläge. Det betyder inte att denna körningsplan har företräde till exekveringsresurserna i kön. Därför, när det finns en "Pågående" körningsplan, kan andra "I kö"-körningsplaner fortfarande schemaläggas att starta.
:::

## Nodens exekveringsstatus

Statusen för en körningsplan bestäms av exekveringen av varje nod i den. I en körningsplan efter en utlösning genererar varje nod en exekveringsstatus efter att den har körts, och denna status avgör om den efterföljande processen ska fortsätta. Normalt, efter att en nod har utförts framgångsrikt, kommer nästa nod att utföras, tills alla noder har utförts i sekvens eller processen avbryts. När ni stöter på flödeskontrollrelaterade noder, såsom grenar, loopar, parallella grenar, fördröjningar etc., bestäms exekveringsflödet till nästa nod baserat på de villkor som konfigurerats i noden och körningens kontextdata.

De möjliga statusarna för en nod efter exekvering visas i tabellen nedan:

| Status     | Är slutstatus | Avslutas i förtid | Betydelse                                                              |
| ---------- | :-----------: | :---------------: | ---------------------------------------------------------------------- |
| Väntar     |       Nej     |        Nej        | Noden kräver en paus och väntar på ytterligare indata eller en återuppringning för att fortsätta. |
| Slutförd   |       Ja      |        Nej        | Inga problem uppstod, utfördes framgångsrikt och fortsätter till nästa nod tills slutet. |
| Misslyckad |       Ja      |        Ja         | Misslyckades eftersom nodkonfigurationen inte uppfylldes.             |
| Fel        |       Ja      |        Ja         | Noden stötte på ett ohanterat programfel och avbröts i förtid.         |
| Avbruten   |       Ja      |        Ja         | En väntande nod avbröts externt av arbetsflödesadministratören, vilket ledde till ett förtida avslut. |
| Nekad      |       Ja      |        Ja         | I en nod för manuell hantering nekades den manuellt, och den efterföljande processen kommer inte att fortsätta. |

Förutom statusen "Väntar" är alla andra statusar slutstatusar för nodexekvering. Endast när slutstatusen är "Slutförd" kommer processen att fortsätta; annars kommer hela arbetsflödesexekveringen att avbrytas i förtid. När en nod befinner sig i ett grenflöde (parallell gren, villkor, loop etc.) kommer den slutstatus som nodens exekvering producerar att hanteras av den nod som initierade grenen, och detta avgör flödet för hela arbetsflödet.

Till exempel, när vi använder en villkorsnod i läget "'Ja' för att fortsätta", om resultatet är "Nej" under exekveringen, kommer hela arbetsflödet att avbrytas i förtid med statusen "Misslyckad", och efterföljande noder kommer inte att utföras, som visas i figuren nedan:

![Nodexekvering misslyckades](https://static-docs.nocobase.com/993aecfa1465894bb574444f0a44313e.png)

:::info{title=Tips}
Alla avslutande statusar utom "Slutförd" kan betraktas som misslyckanden, men orsakerna till misslyckandet skiljer sig åt. Ni kan granska nodens exekveringsresultat för att ytterligare förstå orsaken till misslyckandet.
:::