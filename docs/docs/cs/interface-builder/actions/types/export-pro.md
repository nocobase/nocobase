---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Export Pro

## Úvod

Plugin Export Pro rozšiřuje standardní funkci exportu o pokročilé možnosti.

## Instalace

Tento plugin závisí na pluginu pro správu asynchronních úloh. Před jeho použitím je nutné nejprve povolit plugin pro správu asynchronních úloh.

## Rozšířené funkce

- Podpora asynchronních exportních operací, které se provádějí v samostatném vlákně a umožňují export velkého množství dat.
- Podpora exportu příloh.

## Uživatelská příručka

### Konfigurace režimu exportu

![20251029172829](https://static-docs.nocobase.com/20251029172829.png)

![20251029172914](https://static-docs.nocobase.com/20251029172914.png)

Na tlačítku exportu můžete nastavit režim exportu. K dispozici jsou tři volitelné režimy:

- **Automaticky**: Režim exportu se určí na základě objemu dat. Pokud je počet záznamů menší než 1000 (nebo 100 pro export příloh), použije se synchronní export. Pokud je počet záznamů větší než 1000 (nebo 100 pro export příloh), použije se asynchronní export.
- **Synchronně**: Používá synchronní export, který běží v hlavním vlákně. Je vhodný pro menší objemy dat. Export velkého množství dat v synchronním režimu může způsobit zablokování systému, zpomalení a neschopnost zpracovávat požadavky ostatních uživatelů.
- **Asynchronně**: Používá asynchronní export, který se provádí v samostatném vlákně na pozadí a neblokuje aktuální provoz systému.

### Asynchronní export

Po spuštění exportu se proces provede v samostatném vlákně na pozadí, aniž by vyžadoval ruční konfiguraci uživatelem. V uživatelském rozhraní se po zahájení exportní operace v pravém horním rohu zobrazí aktuálně probíhající exportní úloha a její průběh v reálném čase.

![20251029173028](https://static-docs.nocobase.com/20251029173028.png)

Po dokončení exportu si můžete exportovaný soubor stáhnout ze seznamu exportních úloh.

#### Souběžné exporty
Velký počet souběžných exportních úloh může být ovlivněn konfigurací serveru, což vede ke zpomalení odezvy systému. Proto se doporučuje, aby vývojáři systému nakonfigurovali maximální počet souběžných exportních úloh (výchozí hodnota je 3). Pokud počet souběžných úloh překročí nakonfigurovaný limit, nové úlohy se zařadí do fronty.
![20250505171706](https://static-docs.nocobase.com/20250505171706.png)

Způsob konfigurace souběžnosti: Proměnná prostředí `ASYNC_TASK_MAX_CONCURRENCY=počet_souběžných_úloh`

Na základě komplexního testování s různými konfiguracemi a složitostí dat jsou doporučené počty souběžných úloh:
- 2jádrový CPU, souběžnost 3.
- 4jádrový CPU, souběžnost 5.

#### K výkonu
Pokud zjistíte, že proces exportu je neobvykle pomalý (viz níže), může to být problém s výkonem způsobený strukturou kolekce.

| Charakteristika dat | Typ indexu | Objem dat | Doba exportu |
|---------------------|-------------|-----------|--------------|
| Bez relačních polí  | Primární klíč / Unikátní omezení | 1 milion | 3～6 minut |
| Bez relačních polí  | Běžný index | 1 milion | 6～10 minut |
| Bez relačních polí  | Složený index (neunikátní) | 1 milion | 30 minut |
| Relační pole<br>(1:1, 1:N,<br>N:1, N:N) | Primární klíč / Unikátní omezení | 500 tisíc | 15～30 minut | Relační pole snižují výkon |

Pro zajištění efektivního exportu doporučujeme:
1. Kolekce musí splňovat následující podmínky:

| Typ podmínky | Požadovaná podmínka | Další poznámky |
|--------------|--------------------------------|---------------|
| Struktura kolekce (splnit alespoň jednu) | Má primární klíč<br>Má unikátní omezení<br>Má index (unikátní, běžný, složený) | Priorita: Primární klíč > Unikátní omezení > Index |
| Charakteristika pole | Primární klíč / Unikátní omezení / Index (jedno z nich) musí mít vlastnosti umožňující řazení, jako jsou: auto-inkrementační ID, Snowflake ID, UUID v1, časové razítko, číslo atd.<br>(Poznámka: Pole, která nelze řadit, jako jsou UUID v3/v4/v5, běžné řetězce atd., ovlivní výkon) | Žádné |

2. Snižte počet zbytečných polí k exportu, zejména relačních polí (problémy s výkonem způsobené relačními poli jsou stále optimalizovány).
![20250506215940](https://static-docs.nocobase.com/20250506215940.png)
3. Pokud export zůstává pomalý i po splnění výše uvedených podmínek, můžete analyzovat protokoly nebo poskytnout zpětnou vazbu oficiálnímu týmu.
![20250505182122](https://static-docs.nocobase.com/20250505182122.png)

- [Pravidlo propojení](/interface-builder/actions/action-settings/linkage-rule): Dynamicky zobrazuje/skrývá tlačítko;
- [Upravit tlačítko](/interface-builder/actions/action-settings/edit-button): Upravte název, typ a ikonu tlačítka;