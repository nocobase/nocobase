:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Plánované úlohy

## Úvod

Plánovaná úloha je událost spouštěná časovou podmínkou a existují dva režimy:

- **Vlastní čas**: Běžné spouštění podle systémového času, podobné cronu.
- **Časové pole kolekce**: Spouštění na základě hodnoty časového pole v **kolekci**, jakmile je dosažen daný čas.

Když systém dosáhne časového bodu (s přesností na sekundy), který splňuje nakonfigurované spouštěcí podmínky, spustí se odpovídající **pracovní postup**.

## Základní použití

### Vytvoření plánované úlohy

Při vytváření **pracovního postupu** v seznamu **pracovních postupů** vyberte typ „Plánovaná úloha“:

![Vytvoření plánované úlohy](https://static-docs.nocobase.com/e09b6c9065167875b2ca7de5f5a799a7.png)

### Režim vlastního času

Pro běžný režim je nejprve nutné nastavit počáteční čas na libovolný časový bod (s přesností na sekundy). Počáteční čas lze nastavit na budoucí nebo minulý čas. Pokud je nastaven na minulý čas, systém zkontroluje, zda nastal čas na základě nakonfigurované podmínky opakování. Pokud není podmínka opakování nakonfigurována a počáteční čas je v minulosti, **pracovní postup** se již nespustí.

Pravidlo opakování lze konfigurovat dvěma způsoby:

- **Podle intervalu**: Spouští se v pevných intervalech po počátečním čase, například každou hodinu, každých 30 minut atd.
- **Pokročilý režim**: Podle pravidel cronu; lze nastavit cyklus, který dosáhne pevně daného data a času podle pravidla.

Po nastavení pravidla opakování můžete také nakonfigurovat podmínku ukončení. Lze ji ukončit v pevně daném časovém bodě nebo omezit počtem již provedených spuštění.

### Režim časového pole kolekce

Použití časového pole **kolekce** k určení počátečního času je režim spouštění, který kombinuje běžné plánované úlohy s časovými poli **kolekcí**. Použití tohoto režimu může zjednodušit uzly v některých specifických procesech a je také intuitivnější z hlediska konfigurace. Například, chcete-li změnit stav nezaplacených objednávek po splatnosti na zrušené, můžete jednoduše nakonfigurovat plánovanou úlohu v režimu časového pole **kolekce** a vybrat počáteční čas jako 30 minut po vytvoření objednávky.

## Související tipy

### Plánované úlohy ve stavu neaktivity nebo vypnutí

Pokud je splněna nakonfigurovaná časová podmínka, ale celá aplikace NocoBase je ve stavu neaktivity nebo vypnutí, plánovaná úloha, která měla být v daném časovém bodě spuštěna, bude zmeškána. Navíc po restartu služby se již zmeškané úlohy nespustí. Proto je při používání nutné zvážit řešení takových situací nebo záložní opatření.

### Počet opakování

Pokud je nakonfigurována podmínka ukončení „podle počtu opakování“, počítá se celkový počet spuštění napříč všemi verzemi téhož **pracovního postupu**. Například, pokud byla plánovaná úloha spuštěna 10krát ve verzi 1 a počet opakování je také nastaven na 10, **pracovní postup** se již nespustí. Ani v případě zkopírování do nové verze se nespustí, pokud nezměníte počet opakování na číslo větší než 10. Pokud je však zkopírován jako nový **pracovní postup**, počet spuštění se resetuje na 0. Bez úpravy související konfigurace lze nový **pracovní postup** spustit dalších 10krát.

### Rozdíl mezi intervalovým a pokročilým režimem v pravidlech opakování

Interval v pravidle opakování je relativní k času posledního spuštění (nebo počátečního času), zatímco pokročilý režim se spouští v pevně daných časových bodech. Například, pokud je nastaveno spouštění každých 30 minut a poslední spuštění bylo 2021-09-01 12:01:23, pak další spuštění bude 2021-09-01 12:31:23. Pokročilý režim, tj. režim cronu, je konfigurován tak, aby se spouštěl v pevně daných časových bodech. Například jej lze nastavit tak, aby se spouštěl v 01 a 31 minutě každé hodiny.

## Příklad

Předpokládejme, že potřebujeme každou minutu kontrolovat objednávky, které nebyly zaplaceny déle než 30 minut po jejich vytvoření, a automaticky změnit jejich stav na zrušený. Ukážeme si, jak to implementovat pomocí obou režimů.

### Režim vlastního času

Vytvořte **pracovní postup** založený na plánované úloze. V konfiguraci spouštěče vyberte režim „Vlastní čas“, nastavte počáteční čas na libovolný časový bod, který není pozdější než aktuální čas, pro pravidlo opakování vyberte „Každou minutu“ a podmínku ukončení ponechte prázdnou:

![Plánovaná úloha_Konfigurace spouštěče_Režim vlastního času](https://static-docs.nocobase.com/71131e3f2034263f883062389b356cbd.png)

Poté nakonfigurujte další uzly podle logiky procesu, vypočítáte čas před 30 minutami a změníte stav nezaplacených objednávek vytvořených před tímto časem na zrušený:

![Plánovaná úloha_Konfigurace spouštěče_Režim vlastního času](https://static-docs.nocobase.com/188bc5287ffa1fb24a4e7baa1de6eb29.png)

Po aktivaci **pracovního postupu** se bude spouštět jednou za minutu od počátečního času, vypočítá čas před 30 minutami a použije jej k aktualizaci stavu objednávek vytvořených před tímto časovým bodem na zrušený.

### Režim časového pole kolekce

Vytvořte **pracovní postup** založený na plánované úloze. V konfiguraci spouštěče vyberte režim „Časové pole **kolekce**“, vyberte **kolekci** „Objednávky“, nastavte počáteční čas na 30 minut po vytvoření objednávky a pro pravidlo opakování vyberte „Bez opakování“:

![Plánovaná úloha_Konfigurace spouštěče_Režim časového pole kolekce_Spouštěč](https://static-docs.nocobase.com/d40d5aef57f42799d31cc5882dd94246.png)

Poté nakonfigurujte další uzly podle logiky procesu, abyste aktualizovali stav objednávky s ID spouštěných dat a stavem „nezaplaceno“ na zrušeno:

![Plánovaná úloha_Konfigurace spouštěče_Režim časového pole kolekce_Uzel aktualizace](https://static-docs.nocobase.com/491dde9df8f773f5b14a4fd8ceac9d3e.png)

Na rozdíl od režimu vlastního času zde není třeba počítat čas před 30 minutami, protože kontext spouštěných dat **pracovního postupu** již obsahuje řádek dat, který splňuje časovou podmínku, takže můžete přímo aktualizovat stav odpovídající objednávky.