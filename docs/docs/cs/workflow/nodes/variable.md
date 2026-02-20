---
pkg: '@nocobase/plugin-workflow-variable'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Proměnná

## Úvod

V pracovním postupu můžete deklarovat proměnné nebo přiřazovat hodnoty již deklarovaným proměnným. To se obvykle používá k ukládání dočasných dat v rámci pracovního postupu.

## Vytvoření uzlu

V rozhraní konfigurace pracovního postupu klikněte na tlačítko plus („+“) v pracovním postupu a přidejte uzel „Proměnná“:

![Přidat uzel proměnné](https://static-docs.nocobase.com/53b1e48e777bfff7f2a08271526ef3ee.png)

## Konfigurace uzlu

### Režim

Uzel proměnné je podobný proměnným v programování; musí být deklarován, než jej lze použít a přiřadit mu hodnotu. Proto při vytváření uzlu proměnné musíte zvolit jeho režim. Na výběr jsou dva režimy:

![Vybrat režim](https://static-docs.nocobase.com/49d8b7b501de6faef6f303262aa14550.png)

- Deklarovat novou proměnnou: Vytvoří novou proměnnou.
- Přiřadit existující proměnné: Přiřadí hodnotu proměnné, která byla deklarována dříve v pracovním postupu, což je ekvivalentní úpravě hodnoty proměnné.

Pokud je vytvářený uzel prvním uzlem proměnné v pracovním postupu, můžete zvolit pouze režim deklarace, protože zatím nejsou k dispozici žádné proměnné pro přiřazení.

Když zvolíte přiřazení hodnoty deklarované proměnné, musíte také vybrat cílovou proměnnou, tedy uzel, kde byla proměnná deklarována:

![Vyberte proměnnou, které chcete přiřadit hodnotu](https://static-docs.nocobase.com/1ce8911548d7347e693d8cc8ac1953eb.png)

### Hodnota

Hodnota proměnné může být libovolného typu. Může to být konstanta, například řetězec, číslo, logická hodnota nebo datum, nebo to může být jiná proměnná z pracovního postupu.

V režimu deklarace je nastavení hodnoty proměnné ekvivalentní přiřazení počáteční hodnoty.

![Deklarovat počáteční hodnotu](https://static-docs.nocobase.com/4ce2c08271526ef3ee.png)

V režimu přiřazení je nastavení hodnoty proměnné ekvivalentní úpravě hodnoty deklarované cílové proměnné na novou hodnotu. Následné použití získá tuto novou hodnotu.

![Přiřadit proměnnou spouštěče deklarované proměnné](https://static-docs.nocobase.com/858bae180712ad279ae6a964a77a7659.png)

## Použití hodnoty proměnné

V následných uzlech po uzlu proměnné můžete použít hodnotu proměnné výběrem deklarované proměnné ze skupiny „Proměnné uzlu“. Například v uzlu dotazu použijte hodnotu proměnné jako podmínku dotazu:

![Použít hodnotu proměnné jako podmínku filtru dotazu](https://static-docs.nocobase.com/1ca91c295245999a1751499f14bc.png)

## Příklad

Užitečnější scénář pro uzel proměnné je ve větvích, kde se nové hodnoty počítají nebo slučují s předchozími hodnotami (podobně jako `reduce`/`concat` v programování) a poté se použijí po ukončení větve. Následuje příklad použití uzlu cyklické větve a uzlu proměnné k zřetězení řetězce příjemců.

Nejprve vytvořte pracovní postup spouštěný kolekcí, který se spustí při aktualizaci dat „Článku“ a přednačte související data vztahu „Autor“ (pro získání příjemců):

![Konfigurovat spouštěč](https://static-docs.nocobase.com/93327530a93c695c637d74cdfdcd5cde.png)

Poté vytvořte uzel proměnné pro uložení řetězce příjemců:

![Uzel proměnné příjemce](https://static-docs.nocobase.com/d26fa4a7e7ee4f34e0d8392a51c6666e.png)

Dále vytvořte uzel cyklické větve pro iteraci autory článku a zřetězte jejich informace o příjemcích do proměnné příjemce:

![Procházet autory v článku](https://static-docs.nocobase.com/083fe62c943c17a643dc47ec2872e07c.png)

Uvnitř cyklické větve nejprve vytvořte uzel výpočtu pro zřetězení aktuálního autora s již uloženým řetězcem autorů:

![Zřetězit řetězec příjemců](https://static-docs.nocobase.com/5d21a990162f32cb8818d27b16fd1bcd.png)

Po uzlu výpočtu vytvořte další uzel proměnné. Zvolte režim přiřazení, jako cíl přiřazení vyberte uzel proměnné příjemce a jako hodnotu vyberte výsledek uzlu výpočtu:

![Přiřadit zřetězený řetězec příjemců uzlu příjemce](https://static-docs.nocobase.com/fc40ed95dd9b61d924b7ca11b23f9482.png)

Tímto způsobem, po dokončení cyklické větve, bude proměnná příjemce obsahovat řetězec příjemců všech autorů článku. Poté, po cyklu, můžete použít uzel HTTP požadavku k volání API pro odesílání e-mailů a předat hodnotu proměnné příjemce jako parametr příjemce do API:

![Odeslat e-mail příjemcům prostřednictvím uzlu požadavku](https://static-docs.nocobase.com/37f71aa1a63e172bcb2dce10a250947e.png)

V tomto okamžiku byla jednoduchá funkce hromadného odesílání e-mailů implementována pomocí cyklu a uzlu proměnné.