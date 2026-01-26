:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Plán spuštění (Historie)

Po spuštění pracovního postupu se vytvoří odpovídající plán spuštění pro sledování průběhu této úlohy. Každý plán spuštění má stavovou hodnotu, která udává jeho aktuální stav. Tento stav si můžete prohlédnout v seznamu i v detailech historie spuštění:

![Stav plánu spuštění](https://static-docs.nocobase.com/d4440d92ccafac6fac85da4415bb2a26.png)

Pokud jsou všechny uzly v hlavní větvi procesu provedeny až do konce se stavem „Dokončeno“, celý plán spuštění skončí se stavem „Dokončeno“. Pokud se v hlavní větvi procesu objeví uzel s konečným stavem jako „Selhalo“, „Chyba“, „Zrušeno“ nebo „Odmítnuto“, celý plán spuštění bude **předčasně ukončen** s odpovídajícím stavem. Pokud se v hlavní větvi procesu objeví uzel se stavem „Čeká“, celý plán spuštění se pozastaví, ale stále bude zobrazovat stav „Probíhá“, dokud nebude čekající uzel obnoven a nebude pokračovat v provádění. Různé typy uzlů zpracovávají stav čekání odlišně. Například manuální uzel vyžaduje manuální zpracování, zatímco uzel zpoždění musí čekat, dokud neuplyne stanovený čas, než bude pokračovat.

Stavy plánu spuštění jsou uvedeny v následující tabulce:

| Stav      | Stav posledního uzlu v hlavní větvi | Význam                                                              |
| --------- | ----------------------------------- | ------------------------------------------------------------------- |
| Ve frontě | -                                   | Pracovní postup byl spuštěn a plán spuštění byl vygenerován, čeká ve frontě na přidělení provedení plánovačem. |
| Probíhá   | Čeká                                | Uzel vyžaduje pozastavení, čeká na další vstup nebo zpětné volání pro pokračování. |
| Dokončeno | Dokončeno                           | Nebyly zjištěny žádné problémy, všechny uzly byly provedeny jeden po druhém podle očekávání. |
| Selhalo   | Selhalo                             | Selhalo, protože konfigurace uzlu nebyla splněna.                   |
| Chyba     | Chyba                               | Uzel narazil na neošetřenou programovou chybu a byl předčasně ukončen. |
| Zrušeno   | Zrušeno                             | Čekající uzel byl externě zrušen administrátorem pracovního postupu, což vedlo k předčasnému ukončení. |
| Odmítnuto | Odmítnuto                           | V uzlu pro manuální zpracování bylo ručně odmítnuto, a následný proces nebude pokračovat. |

V příkladu [Rychlý start](../getting-started.md) již víme, že prohlížením detailů historie spuštění pracovního postupu můžeme zkontrolovat, zda byly všechny uzly provedeny normálně, a také stav provedení a výsledná data každého provedeného uzlu. V některých pokročilých pracovních postupech a uzlech může mít uzel více výsledků, například výsledek cyklického uzlu:

![Výsledky uzlů z vícenásobného spuštění](https://static-docs.nocobase.com/bbda259fa2ddf62b0fc0f982efbedae9.png)

:::info{title=Tip}
Pracovní postupy mohou být spouštěny souběžně, ale jsou prováděny postupně ve frontě. I když je spuštěno více pracovních postupů současně, budou provedeny jeden po druhém, nikoli paralelně. Stav „Ve frontě“ proto znamená, že jiné pracovní postupy právě běží a je třeba počkat.

Stav „Probíhá“ pouze naznačuje, že plán spuštění začal a je obvykle pozastaven kvůli čekajícímu stavu interního uzlu. Neznamená to, že tento plán spuštění předběhl zdroje provedení na začátku fronty. Proto, když existuje plán spuštění ve stavu „Probíhá“, mohou být ostatní plány spuštění „Ve frontě“ stále naplánovány ke spuštění.
:::

## Stav provedení uzlu

Stav plánu spuštění je určen provedením každého z jeho uzlů. V plánu spuštění po spuštění každý uzel po svém provedení vytvoří stav provedení, a tento stav určuje, zda bude následný proces pokračovat. Za normálních okolností, po úspěšném provedení uzlu, bude proveden další uzel, dokud nebudou všechny uzly provedeny postupně nebo dokud nebude proces přerušen. Při setkání s uzly souvisejícími s řízením toku, jako jsou větve, cykly, paralelní větve, zpoždění atd., je tok provedení k dalšímu uzlu určen na základě podmínek nakonfigurovaných v uzlu a dat kontextu za běhu.

Možné stavy uzlu po provedení jsou uvedeny v následující tabulce:

| Stav      | Je konečný stav | Ukončuje předčasně | Význam                                                              |
| --------- | :-------------: | :----------------: | ------------------------------------------------------------------- |
| Čeká      | Ne              | Ne                 | Uzel vyžaduje pozastavení, čeká na další vstup nebo zpětné volání pro pokračování. |
| Dokončeno | Ano             | Ne                 | Nebyly zjištěny žádné problémy, provedeno úspěšně a pokračuje k dalšímu uzlu až do konce. |
| Selhalo   | Ano             | Ano                | Selhalo, protože konfigurace uzlu nebyla splněna.                   |
| Chyba     | Ano             | Ano                | Uzel narazil na neošetřenou programovou chybu a byl předčasně ukončen. |
| Zrušeno   | Ano             | Ano                | Čekající uzel byl externě zrušen administrátorem pracovního postupu, což vedlo k předčasnému ukončení. |
| Odmítnuto | Ano             | Ano                | V uzlu pro manuální zpracování bylo ručně odmítnuto, a následný proces nebude pokračovat. |

S výjimkou stavu „Čeká“ jsou všechny ostatní stavy konečnými stavy provedení uzlu. Pouze pokud je konečný stav „Dokončeno“, bude proces pokračovat; v opačném případě bude celé provedení pracovního postupu předčasně ukončeno. Pokud je uzel v toku větve (paralelní větev, podmínka, cyklus atd.), konečný stav vytvořený provedením uzlu bude převzat uzlem, který větev inicioval, a to následně určí tok celého pracovního postupu.

Například, když použijeme podmíněný uzel v režimu „‚Ano‘ pro pokračování“, pokud je výsledek během provedení „Ne“, celý pracovní postup bude předčasně ukončen se stavem „Selhalo“ a následné uzly nebudou provedeny, jak je znázorněno na obrázku níže:

![Provedení uzlu selhalo](https://static-docs.nocobase.com/993aecfa1465894bb574444f0a44313e.png)

:::info{title=Tip}
Všechny konečné stavy, kromě „Dokončeno“, lze považovat za selhání, ale důvody selhání se liší. Důvod selhání můžete dále prozkoumat prohlédnutím výsledků provedení uzlu.
:::