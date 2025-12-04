---
pkg: "@nocobase/plugin-action-import-pro"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Import Pro

## Úvod

Plugin Import Pro rozšiřuje standardní funkci importu o vylepšené možnosti.

## Instalace

Tento plugin závisí na pluginu pro správu asynchronních úloh. Před jeho použitím je nutné nejprve povolit plugin pro správu asynchronních úloh.

## Vylepšení funkcí

![20251029172052](https://static-docs.nocobase.com/20251029172052.png)

- Podporuje asynchronní importní operace, které se provádějí v samostatném vlákně a umožňují import velkého množství dat.

![20251029172129](https://static-docs.nocobase.com/20251029172129.png)

- Podporuje pokročilé možnosti importu.

## Uživatelská příručka

### Asynchronní import

Po spuštění importu se proces provede v samostatném vlákně na pozadí, aniž by vyžadoval ruční konfiguraci uživatelem. V uživatelském rozhraní se po zahájení importní operace v pravém horním rohu zobrazí aktuálně probíhající importní úloha a její průběh v reálném čase.

![index-2024-12-30-09-21-05](https://static-docs.nocobase.com/index-2024-12-30-09-21-05.png)

Po dokončení importu si můžete prohlédnout výsledky v přehledu importních úloh.

#### O výkonu

Pro vyhodnocení výkonu importu velkého objemu dat jsme provedli srovnávací testy v různých scénářích, s různými typy polí a konfiguracemi spouštění (výsledky se mohou lišit v závislosti na konfiguraci serveru a databáze a slouží pouze pro referenci):

| Objem dat | Typy polí | Konfigurace importu | Doba zpracování |
|------|---------|---------|---------|
| 1 milion záznamů | Řetězec, Číslo, Datum, E-mail, Dlouhý text | • Spustit pracovní postup: Ne<br>• Identifikátor duplicit: Žádný | Přibližně 1 minuta |
| 500 000 záznamů | Řetězec, Číslo, Datum, E-mail, Dlouhý text, Mnoho k mnoha | • Spustit pracovní postup: Ne<br>• Identifikátor duplicit: Žádný | Přibližně 16 minut|
| 500 000 záznamů | Řetězec, Číslo, Datum, E-mail, Dlouhý text, Mnoho k mnoha, Mnoho k jednomu | • Spustit pracovní postup: Ne<br>• Identifikátor duplicit: Žádný | Přibližně 22 minut |
| 500 000 záznamů | Řetězec, Číslo, Datum, E-mail, Dlouhý text, Mnoho k mnoha, Mnoho k jednomu | • Spustit pracovní postup: Asynchronní spuštění oznámení<br>• Identifikátor duplicit: Žádný | Přibližně 22 minut |
| 500 000 záznamů | Řetězec, Číslo, Datum, E-mail, Dlouhý text, Mnoho k mnoha, Mnoho k jednomu | • Spustit pracovní postup: Asynchronní spuštění oznámení<br>• Identifikátor duplicit: Aktualizovat duplicity, s 50 000 duplicitními záznamy | Přibližně 3 hodiny |

Na základě výše uvedených výsledků výkonnostních testů a stávajících návrhů uvádíme následující vysvětlení a doporučení týkající se ovlivňujících faktorů:

1.  **Mechanismus zpracování duplicitních záznamů**: Při výběru možností **Aktualizovat duplicitní záznamy** nebo **Pouze aktualizovat duplicitní záznamy** systém provádí dotazovací a aktualizační operace řádek po řádku, což výrazně snižuje efektivitu importu. Pokud váš soubor Excel obsahuje zbytečná duplicitní data, bude to mít další významný dopad na rychlost importu. Doporučujeme před importem do systému vyčistit zbytečná duplicitní data v souboru Excel (např. pomocí profesionálních nástrojů pro odstranění duplicit), abyste předešli zbytečné ztrátě času.

2.  **Efektivita zpracování relačních polí**: Systém zpracovává relační pole dotazováním asociací řádek po řádku, což se může stát úzkým hrdlem výkonu ve scénářích s velkým objemem dat. Pro jednoduché relační struktury (například asociace jedna k mnoha mezi dvěma kolekcemi) se doporučuje vícestupňová strategie importu: nejprve importujte základní data hlavní kolekce a poté, co je import dokončen, vytvořte vztahy mezi kolekcemi. Pokud obchodní požadavky vyžadují import relačních dat současně, prostudujte si prosím výsledky výkonnostních testů v tabulce výše a rozumně naplánujte dobu importu.

3.  **Mechanismus spouštění pracovních postupů**: Nedoporučuje se povolovat spouštění pracovních postupů ve scénářích importu velkého objemu dat, a to především z následujících dvou důvodů:
    -   I když stav importní úlohy ukazuje 100 %, úloha se neukončí okamžitě. Systém stále potřebuje dodatečný čas na vytvoření plánů spouštění pracovních postupů. Během této fáze systém generuje odpovídající plán spuštění pracovního postupu pro každý importovaný záznam, což sice zabírá importní vlákno, ale neovlivňuje použití již importovaných dat.
    -   Po úplném dokončení importní úlohy může souběžné spouštění velkého počtu pracovních postupů zatížit systémové zdroje, což ovlivní celkovou rychlost odezvy systému a uživatelskou zkušenost.

Výše uvedené 3 ovlivňující faktory budou v budoucnu zváženy pro další optimalizaci.

### Konfigurace importu

#### Možnosti importu – Spustit pracovní postup

![20251029172235](https://static-docs.nocobase.com/20251029172235.png)

Při importu si můžete zvolit, zda se mají spouštět pracovní postupy. Pokud je tato možnost zaškrtnuta a daná kolekce je vázána na pracovní postup (událost kolekce), import spustí provedení pracovního postupu pro každý řádek.

#### Možnosti importu – Identifikace duplicitních záznamů

![20251029172421](https://static-docs.nocobase.com/20251029172421.png)

Zaškrtněte tuto možnost a vyberte odpovídající režim, aby se při importu identifikovaly a zpracovaly duplicitní záznamy.

Možnosti v konfiguraci importu budou použity jako výchozí hodnoty. Administrátoři mohou řídit, zda povolí nahrávajícímu uživateli tyto možnosti upravovat (s výjimkou možnosti spouštění pracovního postupu).

**Nastavení oprávnění pro nahrávajícího uživatele**

![20251029172516](https://static-docs.nocobase.com/20251029172516.png)

- Povolit nahrávajícímu uživateli upravovat možnosti importu

![20251029172617](https://static-docs.nocobase.com/20251029172617.png)

- Zakázat nahrávajícímu uživateli upravovat možnosti importu

![20251029172655](https://static-docs.nocobase.com/20251029172655.png)

##### Popis režimů

- Přeskočit duplicitní záznamy: Dotazuje se na existující záznamy na základě obsahu „Identifikačního pole“. Pokud záznam již existuje, řádek se přeskočí; pokud neexistuje, importuje se jako nový záznam.
- Aktualizovat duplicitní záznamy: Dotazuje se na existující záznamy na základě obsahu „Identifikačního pole“. Pokud záznam již existuje, aktualizuje se; pokud neexistuje, importuje se jako nový záznam.
- Pouze aktualizovat duplicitní záznamy: Dotazuje se na existující záznamy na základě obsahu „Identifikačního pole“. Pokud záznam již existuje, aktualizuje se; pokud neexistuje, přeskočí se.

##### Identifikační pole

Systém identifikuje, zda je řádek duplicitním záznamem, na základě hodnoty tohoto pole.

- [Pravidlo propojení](/interface-builder/actions/action-settings/linkage-rule): Dynamické zobrazení/skrytí tlačítek;
- [Upravit tlačítko](/interface-builder/actions/action-settings/edit-button): Upravit název, typ a ikonu tlačítka;