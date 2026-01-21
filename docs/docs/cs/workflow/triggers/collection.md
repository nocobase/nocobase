:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Události kolekce

## Úvod

Spouštěče typu události kolekce naslouchají událostem vytvoření, aktualizace a smazání dat v kolekci. Když dojde k datové operaci s danou kolekcí a jsou splněny nakonfigurované podmínky, spustí se odpovídající pracovní postup. Například scénáře jako odečtení skladových zásob produktu po vytvoření nové objednávky, nebo čekání na ruční schválení po přidání nového komentáře.

## Základní použití

Existuje několik typů změn v kolekci:

1. Po vytvoření dat.
2. Po aktualizaci dat.
3. Po vytvoření nebo aktualizaci dat.
4. Po smazání dat.

![Událost kolekce_Výběr času spuštění](https://static-docs.nocobase.com/81275602742deb71e0c830eb97aa612c.png)

Čas spuštění můžete vybrat podle různých obchodních potřeb. Pokud vybraná změna zahrnuje aktualizaci kolekce, můžete také specifikovat pole, která se změnila. Podmínka spuštění je splněna pouze tehdy, když se změní vybraná pole. Pokud nejsou vybrána žádná pole, znamená to, že změna v jakémkoli poli může spustit pracovní postup.

![Událost kolekce_Výběr změněných polí](https://static-docs.nocobase.com/874a1475f01298b3c00267b2b4674611.png)

Konkrétněji, můžete nakonfigurovat pravidla podmínek pro každé pole spouštěného datového řádku. Spouštěč se aktivuje pouze tehdy, když pole splňují odpovídající podmínky.

![Událost kolekce_Konfigurace datových podmínek](https://static-docs.nocobase.com/264ae3835dcd75cee0eef7812c11fe0c.png)

Po spuštění události kolekce bude do plánu spuštění vložena datová řádka, která událost vygenerovala, jako data kontextu spouštění, aby ji mohly následné uzly v pracovním postupu použít jako proměnné. Pokud však následné uzly potřebují použít relační pole těchto dat, musíte nejprve nakonfigurovat přednačítání relačních dat. Vybraná relační data budou po spuštění vložena do kontextu a mohou být hierarchicky vybírána a používána.

## Související tipy

### Spouštění hromadnými datovými operacemi není v současné době podporováno

Události kolekce v současné době nepodporují spouštění hromadnými datovými operacemi. Například při vytváření článku a současném přidávání více štítků k tomuto článku (data vztahu jedna k mnoha) se spustí pouze pracovní postup pro vytvoření článku. Současně vytvořené štítky nespustí pracovní postup pro vytvoření štítků. Při asociaci nebo přidávání dat vztahu mnoho k mnoha se nespustí ani pracovní postup pro mezilehlou kolekci.

### Datové operace mimo aplikaci nespustí události

Operace s kolekcemi prostřednictvím volání HTTP API rozhraní aplikace mohou také spouštět odpovídající události. Pokud však změny dat probíhají přímo prostřednictvím databázových operací namísto aplikace NocoBase, nelze odpovídající události spustit. Například nativní databázové spouštěče nebudou spojeny s pracovními postupy v aplikaci.

Kromě toho, použití uzlu SQL operace k manipulaci s databází je ekvivalentní přímým databázovým operacím a nespustí události kolekce.

### Externí zdroje dat

Pracovní postupy podporují externí zdroje dat od verze `0.20`. Pokud používáte plugin externího zdroje dat a událost kolekce je nakonfigurována pro externí zdroj dat, pak dokud jsou datové operace s tímto zdrojem dat prováděny v rámci aplikace (např. uživatelské vytvoření, aktualizace a datové operace pracovního postupu), mohou být spuštěny odpovídající události kolekce. Pokud však změny dat probíhají prostřednictvím jiných systémů nebo přímo v externí databázi, události kolekce nelze spustit.

## Příklad

Uveďme si příklad scénáře, kdy se po vytvoření nové objednávky vypočítá celková cena a odečte se skladová zásoba.

Nejprve vytvoříme kolekci Produktů a kolekci Objednávek s následujícími datovými modely:

| Název pole      | Typ pole        |
| --------------- | --------------- |
| Název produktu  | Jednořádkový text |
| Cena            | Číslo           |
| Skladová zásoba | Celé číslo      |

| Název pole          | Typ pole            |
| ------------------- | ------------------- |
| ID objednávky       | Sekvence            |
| Produkt objednávky  | Mnoho k jedné (Produkty) |
| Celková cena objednávky | Číslo               |

A přidáme základní data produktů:

| Název produktu  | Cena | Skladová zásoba |
| --------------- | ---- | --------------- |
| iPhone 14 Pro   | 7999 | 10              |
| iPhone 13 Pro   | 5999 | 0               |

Poté vytvoříme pracovní postup založený na události kolekce Objednávky:

![Událost kolekce_Příklad_Spuštění nové objednávky](https://static-docs.nocobase.com/094392a870dddc65aeb20357f62ddc08.png)

Zde jsou některé z možností konfigurace:

- Kolekce: Vyberte kolekci „Objednávky“.
- Čas spuštění: Vyberte „Po vytvoření dat“.
- Podmínky spuštění: Ponechte prázdné.
- Přednačíst relační data: Zaškrtněte „Produkty“.

Poté nakonfigurujte další uzly podle logiky pracovního postupu: zkontrolujte, zda je skladová zásoba produktu větší než 0. Pokud ano, odečtěte skladovou zásobu; jinak je objednávka neplatná a měla by být smazána:

![Událost kolekce_Příklad_Orchestrace pracovního postupu nové objednávky](https://static-docs.nocobase.com/7713ea1aaa0f52a0dc3c92aba5e58f05.png)

Konfigurace uzlů bude podrobně popsána v dokumentaci pro konkrétní typy uzlů.

Povolte tento pracovní postup a otestujte jej vytvořením nové objednávky prostřednictvím rozhraní. Po zadání objednávky na „iPhone 14 Pro“ se skladová zásoba odpovídajícího produktu sníží na 9. Pokud však zadáte objednávku na „iPhone 13 Pro“, objednávka bude smazána z důvodu nedostatečné skladové zásoby.

![Událost kolekce_Příklad_Výsledek spuštění nové objednávky](https://static-docs.nocobase.com/24cbe51e24ba4804b3bd48d99415c54f.png)