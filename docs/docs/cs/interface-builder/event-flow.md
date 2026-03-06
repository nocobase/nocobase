:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/interface-builder/event-flow).
:::

# Tok událostí

## Úvod

Pokud chcete při změně formuláře spustit vlastní akce, můžete k tomu použít tok událostí. Kromě formulářů lze tok událostí použít také ke konfiguraci vlastních operací pro stránky, bloky, tlačítka a pole.

## Jak používat

Níže si na jednoduchém příkladu ukážeme, jak nakonfigurovat tok událostí. Pojďme realizovat propojení mezi dvěma tabulkami: když kliknete na řádek v levé tabulce, automaticky se vyfiltrují data v pravé tabulce.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Postup konfigurace je následující:

1. Klikněte na ikonu „blesku“ v pravém horním rohu bloku levé tabulky pro otevření rozhraní pro konfiguraci toku událostí.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Klikněte na „Přidat tok událostí (Add event flow)“, jako „Spouštěcí událost“ vyberte „Kliknutí na řádek (Row click)“, což znamená, že se tok spustí při kliknutí na řádek tabulky.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. Nakonfigurujte „Načasování provedení (Execution timing)“, které slouží k řízení pořadí tohoto toku událostí vzhledem k vestavěným procesům systému. Obecně ponechte výchozí hodnotu; pokud si přejete zobrazit upozornění nebo provést přesměrování až po provedení vestavěné logiky, můžete zvolit „Po všech tocích (After all flows)“. Další vysvětlení naleznete níže v části [Načasování provedení](#načasování-provedení).
![event-flow-event-flow-20260204](https://static-docs.nocobase.com/event-flow-event-flow-20260204.png)
4. „Spouštěcí podmínka (Trigger condition)“ slouží ke konfiguraci podmínek; tok událostí se spustí pouze při jejich splnění. Zde ji nemusíme konfigurovat, tok se spustí při každém kliknutí na řádek.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
5. Najeďte myší na „Přidat krok (Add step)“, můžete přidat kroky operací. Vybereme „Nastavit rozsah dat (Set data scope)“ pro nastavení rozsahu dat pravé tabulky.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
6. Zkopírujte UID pravé tabulky a vložte jej do pole „UID cílového bloku (Target block UID)“. Ihned se zobrazí rozhraní pro konfiguraci podmínek, kde můžete nastavit rozsah dat pravé tabulky.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
7. Pojďme nakonfigurovat podmínku, jak je znázorněno na obrázku níže:
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
8. Po konfiguraci rozsahu dat je ještě nutné blok obnovit, aby se zobrazily výsledky filtrování. Dále nakonfigurujeme obnovení bloku pravé tabulky. Přidejte krok „Obnovit cílové bloky (Refresh target blocks)“ a poté zadejte UID pravé tabulky.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
9. Nakonec klikněte na tlačítko uložit v pravém dolním rohu a konfigurace je dokončena.

## Události podrobně

### Před vykreslením (Before render)

Univerzální událost, kterou lze použít na stránkách, v blocích, tlačítkách nebo polích. V rámci této události můžete provádět inicializační práce. Například za různých podmínek konfigurovat různé rozsahy dat.

### Kliknutí na řádek (Row click)

Událost specifická pro blok tabulky. Spustí se při kliknutí na řádek tabulky. Při spuštění se do kontextu přidá „Clicked row record“, který lze použít jako proměnnou v podmínkách a krocích.

### Změna hodnot formuláře (Form values change)

Událost specifická pro blok formuláře. Spustí se při změně hodnoty pole formuláře. V podmínkách a krocích můžete získat hodnoty formuláře prostřednictvím proměnné „Current form“.

### Kliknutí (Click)

Událost specifická pro tlačítko. Spustí se při kliknutí na tlačítko.

## Načasování provedení

V konfiguraci toku událostí existují dva snadno zaměnitelné pojmy:

- **Spouštěcí událost:** Kdy se začne provádět (např.: Před vykreslením, Kliknutí na řádek, Kliknutí, Změna hodnot formuláře atd.).
- **Načasování provedení:** Kam se má váš **vlastní tok událostí** vložit v rámci **vestavěného procesu** po výskytu stejné spouštěcí události.

### Co je „vestavěný proces / vestavěný krok“?

Mnoho stránek, bloků nebo operací samo o sobě obsahuje sadu systémem vestavěných procesů zpracování (např.: odeslání, otevření vyskakovacího okna, vyžádání dat atd.). Když pro stejnou událost (např. „Kliknutí“) přidáte vlastní tok událostí, „Načasování provedení“ rozhoduje o tom:

- Zda se má nejdříve provést váš tok událostí, nebo vestavěná logika;
- Nebo zda se má váš tok událostí vložit před nebo po určitém kroku vestavěného procesu.

### Jak rozumět možnostem načasování provedení v UI?

- **Před všemi toky (výchozí):** Provede se jako první. Vhodné pro „zachycení/přípravu“ (např. validace, potvrzení, inicializace proměnných atd.).
- **Po všech tocích:** Provede se po dokončení vestavěné logiky. Vhodné pro „dokončení/zpětnou vazbu“ (např. zobrazení zprávy, obnovení jiných bloků, přesměrování na stránku atd.).
- **Před určeným tokem / Po určeném toku:** Přesnější bod vložení. Po výběru je třeba zvolit konkrétní „Vestavěný proces“.
- **Před krokem určeného toku / Po kroku určeného toku:** Nejpřesnější bod vložení. Po výběru je třeba zvolit „Vestavěný proces“ i „Krok vestavěného procesu“.

> Tip: Pokud si nejste jisti, který vestavěný proces/krok zvolit, prioritně použijte první dvě možnosti („Před / Po“).

## Kroky podrobně

### Vlastní proměnná (Custom variable)

Slouží k definování vlastní proměnné, kterou lze následně použít v kontextu.

#### Rozsah platnosti

Vlastní proměnné mají rozsah platnosti, například proměnná definovaná v toku událostí bloku může být použita pouze v tomto bloku. Pokud ji chcete mít k dispozici ve všech blocích na aktuální stránce, je nutné ji nakonfigurovat v toku událostí stránky.

#### Proměnná formuláře (Form variable)

Použijte hodnotu určitého bloku formuláře jako proměnnou. Konfigurace je následující:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Variable title: Název proměnné
- Variable identifier: Identifikátor proměnné
- Form UID: UID formuláře

#### Ostatní proměnné

Další proměnné budou podporovány postupně, sledujte novinky.

### Nastavit rozsah dat (Set data scope)

Nastaví rozsah dat cílového bloku. Konfigurace je následující:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- Target block UID: UID cílového bloku
- Condition: Podmínka filtru

### Obnovit cílové bloky (Refresh target blocks)

Obnoví cílové bloky, umožňuje konfigurovat více bloků. Konfigurace je následující:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- Target block UID: UID cílového bloku

### Přejít na URL (Navigate to URL)

Přesměrování na určitou URL. Konfigurace je následující:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL: Cílová URL, podporuje použití proměnných
- Search parameters: Parametry dotazu v URL
- Open in new window: Pokud je zaškrtnuto, otevře se při přesměrování nová stránka prohlížeče

### Zobrazit zprávu (Show message)

Globální zobrazení informací o zpětné vazbě operace.

#### Kdy použít

- Může poskytovat informace o úspěchu, varování a chybách.