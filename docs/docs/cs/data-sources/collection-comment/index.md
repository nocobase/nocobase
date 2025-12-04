---
pkg: "@nocobase/plugin-comments"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Kolekce komentářů

## Úvod

Kolekce komentářů je specializovaná šablona datové tabulky, která slouží k ukládání uživatelských komentářů a zpětné vazby. Díky funkci komentářů můžete přidat možnost komentování k jakékoli datové tabulce, což uživatelům umožní diskutovat, poskytovat zpětnou vazbu nebo anotovat konkrétní záznamy. Kolekce komentářů podporuje úpravy bohatého textu a nabízí tak flexibilní možnosti pro tvorbu obsahu.

![comment-collection-2025-11-01-00-39-01](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## Funkce

- **Úpravy bohatého textu**: Standardně obsahuje editor Markdown (vditor), který podporuje tvorbu obsahu s bohatým textem.
- **Propojení s libovolnou datovou tabulkou**: Komentáře lze propojit se záznamy v jakékoli datové tabulce pomocí relačních polí.
- **Víceúrovňové komentáře**: Podporuje odpovídání na komentáře a vytváření stromové struktury komentářů.
- **Sledování uživatelů**: Automaticky zaznamenává tvůrce komentáře a čas vytvoření.

## Uživatelská příručka

### Vytvoření kolekce komentářů

![comment-collection-2025-11-01-00-37-10](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

1. Přejděte na stránku správy datových tabulek.
2. Klikněte na tlačítko „Vytvořit kolekci“.
3. Vyberte šablonu „Kolekce komentářů“.
4. Zadejte název tabulky (např. „Komentáře k úkolům“, „Komentáře k článkům“ atd.).
5. Systém automaticky vytvoří tabulku komentářů s následujícími výchozími poli:
   - Obsah komentáře (typ Markdown vditor)
   - Vytvořil (propojeno s tabulkou uživatelů)
   - Vytvořeno (typ datum a čas)

### Konfigurace vztahů

Abyste mohli komentáře propojit s cílovou datovou tabulkou, je potřeba nakonfigurovat relační pole:

![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

1. V tabulce komentářů přidejte relační pole „Mnoho k jednomu“.
2. Vyberte cílovou datovou tabulku, se kterou chcete propojit (např. tabulka úkolů, tabulka článků atd.).
3. Nastavte název pole (např. „Patří k úkolu“, „Patří k článku“ atd.).

### Použití bloku komentářů na stránkách

![Enable Comments Collection](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

1. Přejděte na stránku, kam chcete přidat funkci komentářů.
2. V detailech nebo vyskakovacím okně cílového záznamu přidejte blok.
3. Vyberte typ bloku „Komentáře“.
4. Vyberte kolekci komentářů, kterou jste právě vytvořili.

### Typické případy použití

- **Systémy pro správu úkolů**: Členové týmu diskutují o úkolech a poskytují zpětnou vazbu.
- **Systémy pro správu obsahu**: Čtenáři komentují články a interagují s nimi.
- **Schvalovací pracovní postupy**: Schvalovatelé anotují a poskytují své názory k žádostem.
- **Zpětná vazba od zákazníků**: Shromažďování hodnocení zákazníků k produktům nebo službám.

## Poznámky

- Kolekce komentářů je funkce komerčního pluginu a pro její použití je nutné mít povolený plugin komentářů.
- Doporučujeme nastavit vhodné oprávnění pro tabulku komentářů, abyste kontrolovali, kdo může komentáře prohlížet, vytvářet a mazat.
- V případě velkého počtu komentářů doporučujeme povolit stránkování pro zlepšení výkonu.