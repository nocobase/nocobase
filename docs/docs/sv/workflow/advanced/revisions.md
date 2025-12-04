:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Versionshantering

När ett konfigurerat arbetsflöde har triggats minst en gång och ni vill ändra dess konfiguration eller noder, måste ni skapa en ny version innan ni gör ändringar. Detta säkerställer att exekveringshistoriken för tidigare triggade arbetsflöden inte påverkas av framtida modifieringar.

På arbetsflödets konfigurationssida kan ni se befintliga arbetsflödesversioner via versionsmenyn i det övre högra hörnet:

![Visa arbetsflödesversioner](https://static-docs.nocobase.com/ad93d2c08166b0e3e643fb148713a63f.png)

I menyn för fler åtgärder ("...") till höger om den kan ni välja att kopiera den aktuella versionen till en ny version:

![Kopiera arbetsflöde till en ny version](https://static-docs.nocobase.com/2805798e6caca2af004893390a744256.png)

Efter att ha kopierat till en ny version, klickar ni på växlingsknappen "Aktivera"/"Avaktivera" för att växla den motsvarande versionen till aktiverat läge, och den nya arbetsflödesversionen kommer då att träda i kraft.

Om ni behöver välja en gammal version igen, växlar ni till den från versionsmenyn och klickar sedan på växlingsknappen "Aktivera"/"Avaktivera" igen för att växla den till aktiverat läge. Den aktuella versionen kommer då att träda i kraft, och efterföljande triggningar kommer att exekvera processen för den versionen.

När ni behöver avaktivera arbetsflödet, klickar ni på växlingsknappen "Aktivera"/"Avaktivera" för att växla det till avaktiverat läge, och arbetsflödet kommer då inte längre att triggas.

:::info{title=Tips}
Till skillnad från att "Kopiera" ett arbetsflöde från arbetsflödeshanteringslistan, är ett arbetsflöde som "kopieras till en ny version" fortfarande grupperat under samma arbetsflödesuppsättning, men särskiljs endast genom sin version. Att kopiera ett arbetsflöde behandlas dock som ett helt nytt arbetsflöde, orelaterat till versionerna av det tidigare arbetsflödet, och dess exekveringsantal kommer också att återställas till noll.
:::