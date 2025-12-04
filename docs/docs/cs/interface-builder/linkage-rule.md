:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Pravidla propojení

## Úvod

V NocoBase jsou pravidla propojení mechanismem, který slouží k řízení interaktivního chování prvků uživatelského rozhraní. Umožňují uživatelům upravovat zobrazení a logiku chování bloků, polí a akcí v rozhraní na základě různých podmínek, čímž dosahují flexibilního interaktivního zážitku s minimem kódu. Tato funkce je neustále vyvíjena a optimalizována.

Konfigurací pravidel propojení můžete dosáhnout například:

- Skrývání/zobrazování určitých bloků na základě role aktuálního uživatele. Různé role vidí bloky s odlišným rozsahem dat; například administrátoři vidí bloky s kompletními informacemi, zatímco běžní uživatelé mohou vidět pouze bloky se základními informacemi.
- Když je ve formuláři vybrána určitá možnost, automaticky vyplnit nebo resetovat hodnoty jiných polí.
- Když je ve formuláři vybrána určitá možnost, zakázat některé vstupní položky.
- Když je ve formuláři vybrána určitá možnost, nastavit některé vstupní položky jako povinné.
- Řídit, zda jsou tlačítka akcí viditelná nebo klikatelná za určitých podmínek.

## Konfigurace podmínek

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

### Proměnná na levé straně

Proměnná na levé straně podmínky slouží k definování „objektu posouzení“ v pravidle propojení. Na základě hodnoty této proměnné se vyhodnocuje podmínka, která následně určí, zda se má spustit akce propojení.

Mezi volitelné proměnné patří:

- Pole v kontextu, jako například `Aktuální formulář/xxx`, `Aktuální záznam/xxx`, `Aktuální záznam ve vyskakovacím okně/xxx` atd.
- Systémové globální proměnné, jako například `Aktuální uživatel`, `Aktuální role` atd., vhodné pro dynamické řízení na základě identity uživatele, oprávnění a dalších informací.
  > ✅ Dostupné možnosti pro proměnnou na levé straně jsou určeny kontextem bloku. Používejte proměnnou na levé straně rozumně podle obchodních potřeb:
  >
  > - `Aktuální uživatel` představuje informace o aktuálně přihlášeném uživateli.
  > - `Aktuální formulář` představuje hodnoty zadávané v reálném čase ve formuláři.
  > - `Aktuální záznam` představuje uloženou hodnotu záznamu, například záznam řádku v tabulce.

### Operátor

Operátor se používá k nastavení logiky pro vyhodnocení podmínky, tj. jak porovnat proměnnou na levé straně s hodnotou na pravé straně. Různé typy proměnných na levé straně podporují různé operátory. Běžné typy operátorů jsou následující:

- **Typ textu**: `$includes`, `$eq`, `$ne`, `$empty`, `$notEmpty` atd.
- **Typ čísla**: `$eq`, `$gt`, `$lt`, `$gte`, `$lte` atd.
- **Typ boolean**: `$isTruly`, `$isFalsy`
- **Typ pole**: `$match`, `$anyOf`, `$empty`, `$notEmpty` atd.

> ✅ Systém automaticky doporučí seznam dostupných operátorů na základě typu proměnné na levé straně, aby zajistil, že konfigurační logika bude rozumná.

### Hodnota na pravé straně

Používá se pro porovnání s proměnnou na levé straně a je referenční hodnotou pro určení, zda je podmínka splněna.

Podporovaný obsah zahrnuje:

- Konstantní hodnoty: Zadejte pevná čísla, text, data atd.
- Kontextové proměnné: například jiná pole v aktuálním formuláři, aktuální záznam atd.
- Systémové proměnné: například aktuální uživatel, aktuální čas, aktuální role atd.

> ✅ Systém automaticky přizpůsobí metodu zadávání pro hodnotu na pravé straně na základě typu proměnné na levé straně, například:
>
> - Když je na levé straně „pole pro výběr“, zobrazí se odpovídající selektor možností.
> - Když je na levé straně „pole pro datum“, zobrazí se výběr data.
> - Když je na levé straně „textové pole“, zobrazí se textové vstupní pole.

> 💡 Flexibilní použití hodnot na pravé straně (zejména dynamických proměnných) Vám umožňuje vytvářet logiku propojení na základě aktuálního uživatele, aktuálního stavu dat a kontextu, čímž dosáhnete výkonnějšího interaktivního zážitku.

## Logika provádění pravidel

### Spuštění podmínky

Když je podmínka v pravidle splněna (nepovinné), akce úpravy vlastnosti pod ní se automaticky provede. Pokud není podmínka nastavena, pravidlo je ve výchozím nastavení považováno za vždy splněné a akce úpravy vlastnosti se provede automaticky.

### Více pravidel

Pro formulář můžete nakonfigurovat více pravidel propojení. Pokud jsou podmínky více pravidel splněny současně, systém provede výsledky v pořadí od prvního k poslednímu, což znamená, že poslední výsledek bude rozhodující.
Příklad: Pravidlo 1 nastaví pole jako „Zakázané“ a Pravidlo 2 nastaví pole jako „Editovatelné“. Pokud jsou podmínky obou pravidel splněny, pole se stane „Editovatelným“.

> Pořadí provádění více pravidel je klíčové. Při navrhování pravidel se ujistěte, že jste si ujasnili jejich priority a vzájemné vztahy, abyste předešli konfliktům.

## Správa pravidel

Na každém pravidle lze provádět následující operace:

- Vlastní pojmenování: Nastavte pravidlu snadno srozumitelný název pro správu a identifikaci.
- Řazení: Upravte pořadí na základě priority provádění pravidel, abyste zajistili, že je systém zpracuje ve správné posloupnosti.
- Smazat: Odstraňte pravidla, která již nejsou potřeba.
- Povolit/Zakázat: Dočasně zakázat pravidlo, aniž byste ho smazali, což je vhodné pro scénáře, kdy je potřeba pravidlo dočasně deaktivovat.
- Duplikovat pravidlo: Vytvořte nové pravidlo zkopírováním existujícího, abyste se vyhnuli opakované konfiguraci.

## O proměnných

Při přiřazování hodnot polím a konfiguraci podmínek jsou podporovány jak konstanty, tak proměnné. Seznam proměnných se bude lišit v závislosti na umístění bloku. Rozumný výběr a použití proměnných může flexibilněji splnit obchodní potřeby. Více informací o proměnných naleznete v části [Proměnné](/interface-builder/variables).

## Pravidla propojení bloků

Pravidla propojení bloků umožňují dynamické řízení zobrazení bloku na základě systémových proměnných (jako je aktuální uživatel, role) nebo kontextových proměnných (jako je aktuální záznam ve vyskakovacím okně). Například administrátor může zobrazit kompletní informace o objednávce, zatímco role zákaznické podpory může zobrazit pouze konkrétní data objednávky. Prostřednictvím pravidel propojení bloků můžete konfigurovat odpovídající bloky na základě rolí a v těchto blocích nastavit různá pole, tlačítka akcí a rozsahy dat. Když je přihlášená role cílovou rolí, systém zobrazí odpovídající blok. Je důležité si uvědomit, že bloky jsou ve výchozím nastavení zobrazeny, takže obvykle musíte definovat logiku pro skrytí bloku.

👉 Podrobnosti naleznete v: [Blok/Pravidla propojení bloků](/interface-builder/blocks/block-settings/block-linkage-rule)

## Pravidla propojení polí

Pravidla propojení polí se používají k dynamické úpravě stavu polí ve formuláři nebo bloku podrobností na základě uživatelských akcí, a to zejména včetně:

- Řízení stavu **Zobrazit/Skrýt** pole
- Nastavení, zda je pole **Povinné**
- **Přiřazení hodnoty**
- Spouštění JavaScriptu pro zpracování vlastní obchodní logiky

👉 Podrobnosti naleznete v: [Blok/Pravidla propojení polí](/interface-builder/blocks/block-settings/field-linkage-rule)

## Pravidla propojení akcí

Pravidla propojení akcí v současné době podporují řízení chování akcí, jako je skrývání/zakazování, na základě kontextových proměnných, jako je hodnota aktuálního záznamu a aktuální formulář, a také globálních proměnných.

👉 Podrobnosti naleznete v: [Akce/Pravidla propojení](/interface-builder/actions/action-settings/linkage-rule)