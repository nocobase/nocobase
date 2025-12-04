:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Úprava vyskakovacího okna

## Úvod

Jakákoli akce nebo pole, které po kliknutí otevře vyskakovací okno, Vám umožňuje nastavit způsob jeho otevření, velikost a další parametry.

![20251027212617](https://static-docs.nocobase.com/20251027212617.png)

![20251027212800](https://static-docs.nocobase.com/20251027212800.png)

## Způsob otevření

- Boční panel

![20251027212832](https://static-docs.nocobase.com/20251027212832.png)

- Dialogové okno

![20251027212905](https://static-docs.nocobase.com/20251027212905.png)

- Podstránka

![20251027212940](https://static-docs.nocobase.com/20251027212940.png)

## Velikost vyskakovacího okna

- Velké
- Střední (výchozí)
- Malé

## UID vyskakovacího okna

„UID vyskakovacího okna“ je UID komponenty, která vyskakovací okno otevírá. Také se objevuje v URL adrese jako segment `viewUid` v `view/:viewUid`. Můžete jej rychle získat z nastavení pole nebo tlačítka, které vyskakovací okno spouští, kliknutím na „Kopírovat UID vyskakovacího okna“. Nastavení UID vyskakovacího okna umožňuje jeho opětovné použití.

![popup-copy-uid-20251102](https://static-docs.nocobase.com/popup-copy-uid-20251102.png)

### Interní vyskakovací okno (výchozí)
- „UID vyskakovacího okna“ se rovná UID aktuálního akčního tlačítka (ve výchozím nastavení se používá UID tohoto tlačítka).

### Externí vyskakovací okno (opětovné použití)
- Do pole „UID vyskakovacího okna“ zadejte UID spouštěcího tlačítka z jiného místa (tj. UID vyskakovacího okna), abyste toto vyskakovací okno mohli znovu použít jinde.
- Typické použití: sdílení stejného uživatelského rozhraní a logiky vyskakovacího okna napříč více stránkami/bloky, čímž se vyhnete duplicitní konfiguraci.
- Při použití externího vyskakovacího okna se některé možnosti stanou pouze pro čtení (viz níže).

## Další související možnosti

- `Data source / Collection`: Pouze pro čtení. Označuje zdroj dat a kolekci, ke které je vyskakovací okno vázáno; ve výchozím nastavení se řídí kolekcí aktuálního bloku. V režimu externího vyskakovacího okna se používá konfigurace cílového vyskakovacího okna a tuto možnost nelze změnit.
- `Association name`: Volitelné. Slouží k otevření vyskakovacího okna z asociačního pole; zobrazí se pouze v případě, že existuje výchozí hodnota. V režimu externího vyskakovacího okna se používá konfigurace cílového vyskakovacího okna a tuto možnost nelze změnit.
- `Source ID`: Zobrazí se pouze v případě, že je nastaveno `Association name`; ve výchozím nastavení používá `sourceId` aktuálního kontextu; lze jej podle potřeby změnit na proměnnou nebo pevnou hodnotu.
- `filterByTk`: Může být prázdné, proměnná nebo pevná hodnota, sloužící k omezení datových záznamů načtených do vyskakovacího okna.

![popup-config-20251102](https://static-docs.nocobase.com/popup-config-20251102.png)