---
pkg: '@nocobase/plugin-password-policy'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Zásady hesel

## Úvod

Nastavte pravidla pro hesla, dobu platnosti hesel a bezpečnostní zásady pro přihlašování heslem pro všechny uživatele. Také můžete spravovat uzamčené uživatele.

## Pravidla pro hesla

![](https://static-docs.nocobase.com/202412281329313.png)

### Minimální délka hesla

Nastavte požadavek na minimální délku hesla. Maximální délka je 64 znaků.

### Požadavky na složitost hesla

Podporovány jsou následující možnosti:

- Musí obsahovat písmena a číslice
- Musí obsahovat písmena, číslice a symboly
- Musí obsahovat číslice, velká a malá písmena
- Musí obsahovat číslice, velká a malá písmena a symboly
- Musí obsahovat alespoň 3 z následujících typů znaků: číslice, velká písmena, malá písmena a speciální znaky
- Bez omezení

![](https://static-docs.nocobase.com/202412281331649.png)

### Heslo nesmí obsahovat uživatelské jméno

Nastavte, zda heslo může obsahovat uživatelské jméno aktuálního uživatele.

### Počet hesel v historii

Systém si pamatuje počet nedávno použitých hesel uživatelem. Uživatelé je nemohou znovu použít při změně hesla. Hodnota 0 znamená bez omezení, maximální počet je 24.

## Konfigurace platnosti hesel

![](https://static-docs.nocobase.com/202412281335588.png)

### Doba platnosti hesla

Doba platnosti uživatelského hesla. Uživatelé musí heslo změnit před jeho vypršením, aby se doba platnosti resetovala. Pokud heslo nezměníte včas, nebudete se moci přihlásit starým heslem a budete potřebovat pomoc administrátora s jeho resetováním. Pokud jsou nakonfigurovány jiné metody přihlášení, můžete se přihlásit pomocí nich.

### Kanál pro upozornění na vypršení platnosti hesla

Během 10 dnů před vypršením platnosti hesla uživatele je při každém přihlášení odesláno připomenutí. Ve výchozím nastavení se připomenutí odesílá prostřednictvím interního kanálu zpráv „Upozornění na vypršení platnosti hesla“, který můžete spravovat v sekci správy oznámení.

### Doporučení pro konfiguraci

Vzhledem k tomu, že vypršení platnosti hesla může vést k nemožnosti přihlásit se k účtu (včetně administrátorských účtů), doporučujeme včas změnit hesla a v systému nastavit více účtů, které mají oprávnění měnit uživatelská hesla.

## Zabezpečení přihlašování heslem

Nastavte limity pro neplatné pokusy o přihlášení heslem.

![](https://static-docs.nocobase.com/202412281339724.png)

### Maximální počet neplatných pokusů o přihlášení heslem

Nastavte maximální počet pokusů o přihlášení, které může uživatel provést v rámci určeného časového intervalu.

### Maximální časový interval pro neplatné pokusy o přihlášení heslem (sekundy)

Nastavte časový interval (v sekundách) pro výpočet maximálního počtu neplatných pokusů o přihlášení uživatele.

### Doba uzamčení (sekundy)

Nastavte dobu, po kterou bude uživatel uzamčen poté, co překročí limit neplatných pokusů o přihlášení heslem (0 znamená bez omezení). Během doby uzamčení je uživateli zakázán přístup do systému jakoukoli autentizační metodou, včetně API klíčů. Pokud je vyžadováno ruční odemknutí uživatele, podívejte se na [Uzamčení uživatele](./lockout.md).

### Scénáře

#### Bez omezení

Bez omezení počtu neplatných pokusů o přihlášení heslem uživatelem.

![](https://static-docs.nocobase.com/202412281343226.png)

#### Omezit frekvenci pokusů, ale neuzamykat uživatele

Příklad: Uživatel se může pokusit přihlásit maximálně 5krát každých 5 minut.

![](https://static-docs.nocobase.com/202412281344412.png)

#### Uzamknout uživatele po překročení limitu

Příklad: Pokud uživatel provede 5 po sobě jdoucích neplatných pokusů o přihlášení heslem během 5 minut, bude uzamčen na 2 hodiny.

![](https://static-docs.nocobase.com/202412281344952.png)

### Doporučení pro konfiguraci

- Konfigurace počtu neplatných pokusů o přihlášení heslem a časového intervalu se obvykle používá k omezení vysokofrekvenčních pokusů o přihlášení heslem v krátkém časovém období, čímž se předchází útokům hrubou silou.
- Zda uzamknout uživatele po překročení limitu, by mělo být zváženo na základě skutečných scénářů použití. Nastavení doby uzamčení může být zneužito, protože útočníci mohou záměrně zadávat nesprávná hesla vícekrát pro cílový účet, čímž účet uzamknou a znemožní jeho normální použití. Tomuto typu útoků lze předcházet kombinací omezení IP adres, omezení frekvence API a dalších opatření.
- Vzhledem k tomu, že uzamčení účtu zabrání přístupu do systému (včetně administrátorských účtů), je vhodné v systému nastavit více účtů, které mají oprávnění uživatele odemknout.