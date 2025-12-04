---
pkg: "@nocobase/plugin-ip-restriction"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::



# Omezení IP adres

## Úvod

NocoBase vám jako administrátorům umožňuje nastavit seznamy povolených (whitelist) nebo zakázaných (blacklist) IP adres pro přístup uživatelů. Tím omezíte neoprávněná externí síťová připojení nebo zablokujete známé škodlivé IP adresy, čímž snížíte bezpečnostní rizika. Zároveň můžete dotazovat protokoly zamítnutých přístupů a identifikovat rizikové IP adresy.

## Pravidla konfigurace

![2025-01-23-10-07-34-20250123100733](https://static-docs.nocobase.com/2025-01-23-10-07-34-20250123100733.png)

### Režimy filtrování IP adres

- **Černá listina (Blacklist)**: Pokud se IP adresa uživatele shoduje s některou IP adresou v seznamu, systém přístup **zamítne**; IP adresy, které se neshodují, jsou standardně **povoleny**.
- **Bílá listina (Whitelist)**: Pokud se IP adresa uživatele shoduje s některou IP adresou v seznamu, systém přístup **povolí**; IP adresy, které se neshodují, jsou standardně **zamítnuty**.

### Seznam IP adres

Slouží k definování IP adres, kterým je povolen nebo zakázán přístup do systému. Jeho konkrétní funkce závisí na zvoleném režimu filtrování IP adres. Můžete zadávat jednotlivé IP adresy nebo síťové segmenty CIDR. Více adres oddělte čárkami nebo zalomením řádku.

## Dotazování protokolů

Poté, co je uživateli zamítnut přístup, je IP adresa přístupu zapsána do systémových protokolů. Odpovídající soubor protokolu si můžete stáhnout k analýze.

![2025-01-17-13-33-51-20250117133351](https://static-docs.nocobase.com/2025-01-17-13-33-51-20250117133351.png)

Příklad protokolu:

![2025-01-14-14-42-06-20250114144205](https://static-docs.nocobase.com/2025-01-14-14-42-06-20250114144205.png)

## Doporučení pro konfiguraci

### Doporučení pro režim černé listiny

- Přidejte známé škodlivé IP adresy, abyste předešli potenciálním síťovým útokům.
- Pravidelně kontrolujte a aktualizujte černou listinu, odstraňujte neplatné nebo již nepotřebné IP adresy.

### Doporučení pro režim bílé listiny

- Přidejte důvěryhodné IP adresy interní sítě (například segmenty kancelářské sítě), abyste zajistili bezpečný přístup k základním systémům.
- Vyhněte se zahrnutí dynamicky přidělovaných IP adres do bílé listiny, abyste předešli přerušení přístupu.

### Obecná doporučení

- Použijte síťové segmenty CIDR pro zjednodušení konfigurace, například použijte 192.168.0.0/24 místo přidávání jednotlivých IP adres.
- Pravidelně zálohujte konfigurace seznamů IP adres, abyste se mohli rychle zotavit z chybných operací nebo selhání systému.
- Pravidelně monitorujte protokoly přístupů, identifikujte neobvyklé IP adresy a včas upravujte černou nebo bílou listinu.