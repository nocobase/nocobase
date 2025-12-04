:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Pokročilá konfigurace

## Režim spouštění

Pracovní postupy se spouštějí buď „asynchronně“, nebo „synchronně“, v závislosti na typu spouštěče zvoleného při jejich vytváření. Asynchronní režim znamená, že po spuštění konkrétní události se pracovní postup zařadí do fronty a je postupně prováděn plánovačem na pozadí. Synchronní režim naopak po spuštění nevstupuje do plánovací fronty, ale začne se provádět okamžitě a po dokončení ihned poskytne zpětnou vazbu.

Události kolekce, události po akci, události vlastní akce, plánované události a události schvalování se ve výchozím nastavení spouštějí asynchronně. Události před akcí se naopak ve výchozím nastavení spouštějí synchronně. Události kolekce a události formuláře podporují oba režimy, které si můžete vybrat při vytváření pracovního postupu:

![Synchronní režim_Vytvoření synchronního pracovního postupu](https://static-docs.nocobase.com/39bc0821f50c1bde4729c531c6236795.png)

:::info{title=Tip}
Synchronní pracovní postupy nemohou kvůli své povaze používat uzly, které vytvářejí stav „čekání“, například „Ruční zpracování“.
:::

## Automatické mazání historie spouštění

Pokud se pracovní postup spouští často, můžete nakonfigurovat automatické mazání historie spouštění, abyste snížili nepřehlednost a zároveň ulevili úložišti databáze.

Zda se má historie spouštění pracovního postupu automaticky mazat, můžete také nastavit v dialogových oknech pro jeho vytváření a úpravy:

![Konfigurace automatického mazání historie spouštění](https://static-docs.nocobase.com/b2e4c08e7a01e213069912fe04baa7bd.png)

Automatické mazání lze konfigurovat na základě stavu výsledku spouštění. Ve většině případů se doporučuje zaškrtnout pouze stav „Dokončeno“, aby se zachovaly záznamy o neúspěšných spuštěních pro budoucí řešení problémů.

Při ladění pracovního postupu se doporučuje nezapínat automatické mazání historie spouštění, abyste mohli pomocí historie zkontrolovat, zda logika spouštění pracovního postupu odpovídá vašim očekáváním.

:::info{title=Tip}
Mazání historie pracovního postupu nesnižuje jeho celkový počet spuštění.
:::