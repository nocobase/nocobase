:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Bezpečnostní příručka NocoBase

NocoBase klade důraz na bezpečnost dat a aplikací od návrhu funkcí až po implementaci systému. Platforma má vestavěné bezpečnostní funkce, jako je ověřování uživatelů, řízení přístupu a šifrování dat, a zároveň umožňuje flexibilní konfiguraci bezpečnostních zásad podle skutečných potřeb. Ať už jde o ochranu uživatelských dat, správu přístupových oprávnění nebo izolaci vývojového a produkčního prostředí, NocoBase poskytuje praktické nástroje a řešení. Cílem této příručky je poskytnout návod pro bezpečné používání NocoBase, pomoci uživatelům chránit bezpečnost dat, aplikací a prostředí a zajistit efektivní využívání systémových funkcí při zachování bezpečnosti uživatelů.

## Ověřování uživatelů

Ověřování uživatelů slouží k identifikaci identity uživatelů, zabraňuje neoprávněnému vstupu do systému a zajišťuje, aby identity uživatelů nebyly zneužity.

### Klíč tokenu

Ve výchozím nastavení používá NocoBase pro ověřování API na straně serveru JWT (JSON Web Token). Uživatelé mohou nastavit klíč tokenu pomocí systémové proměnné prostředí `APP_KEY`. Klíč tokenu vaší aplikace spravujte pečlivě, abyste zabránili jeho úniku. Upozorňujeme, že pokud se `APP_KEY` změní, staré tokeny se stanou neplatnými.

### Zásady tokenu

NocoBase podporuje nastavení následujících bezpečnostních zásad pro uživatelské tokeny:

| Položka konfigurace       | Popis                                                                                                                                                                                                                                                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Platnost relace           | Maximální platnost každého přihlášení uživatele. Během platnosti relace se token automaticky obnovuje. Po vypršení platnosti je uživatel vyzván k opětovnému přihlášení.                                                                                                                                                      |
| Platnost tokenu           | Doba platnosti každého vydaného API tokenu. Po vypršení platnosti tokenu, pokud je stále v rámci platnosti relace a nepřekročil limit pro obnovení, server automaticky vydá nový token pro udržení uživatelské relace, jinak je uživatel vyzván k opětovnému přihlášení. (Každý token lze obnovit pouze jednou) |
| Limit pro obnovení vypršeného tokenu | Maximální časový limit povolený pro obnovení tokenu po jeho vypršení.                                                                                                                                                                                                                                                |

Obvykle doporučujeme administrátorům:

- Nastavit kratší dobu platnosti tokenu, aby se omezila doba jeho expozice.
- Nastavit přiměřenou dobu platnosti relace, která je delší než platnost tokenu, ale neměla by být příliš dlouhá, aby se vyvážil uživatelský komfort a bezpečnost. Využijte mechanismus automatického obnovování tokenu k zajištění nepřerušených relací aktivních uživatelů a zároveň snižte riziko zneužití dlouhodobých relací.
- Nastavit přiměřený limit pro obnovení vypršeného tokenu, aby token přirozeně vypršel, když je uživatel delší dobu neaktivní, aniž by byl vydán nový token, což snižuje riziko zneužití nečinných uživatelských relací.

### Ukládání tokenu na straně klienta

Ve výchozím nastavení jsou uživatelské tokeny uloženy v LocalStorage prohlížeče. Po zavření a opětovném otevření stránky prohlížeče, pokud je token stále platný, se uživatel nemusí znovu přihlašovat.

Pokud chcete, aby se uživatelé museli znovu přihlásit při každém vstupu na stránku, můžete nastavit proměnnou prostředí `API_CLIENT_STORAGE_TYPE=sessionStorage`. Tím se uživatelský token uloží do SessionStorage prohlížeče a dosáhne se tak cíle, aby se uživatelé při každém otevření stránky znovu přihlašovali.

### Zásady hesel

> Profesionální edice a vyšší

NocoBase podporuje nastavení pravidel pro hesla a zásad zamykání účtu po neúspěšných pokusech o přihlášení pro všechny uživatele, aby se zvýšila bezpečnost aplikací NocoBase, které mají povolené přihlašování heslem. Pro pochopení jednotlivých položek konfigurace se můžete podívat na [Zásady hesel](./password-policy/index.md).

#### Pravidla pro hesla

| Položka konfigurace                     | Popis                                                                                                      |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Délka hesla**                        | Minimální požadovaná délka hesla, maximální délka je 64.                                                   |
| **Složitost hesla**                    | Nastavuje požadavky na složitost hesla, tedy typy znaků, které musí obsahovat.                             |
| **Nesmí obsahovat uživatelské jméno**  | Nastavuje, zda heslo může obsahovat uživatelské jméno aktuálního uživatele.                                |
| **Pamatovat si historii hesel**        | Pamatuje si počet naposledy použitých hesel uživatele. Uživatel je nemůže znovu použít při změně hesla.      |

#### Konfigurace vypršení platnosti hesla

| Položka konfigurace                               | Popis                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Doba platnosti hesla**                          | Doba platnosti uživatelských hesel. Uživatelé si musí změnit heslo před jeho vypršením, aby se doba platnosti přepočítala. Pokud si heslo před vypršením nezmění, nebudou se moci přihlásit starým heslem a budou potřebovat pomoc administrátora s jeho resetováním. <br>Pokud jsou nakonfigurovány jiné způsoby přihlášení, uživatel se může přihlásit jinými metodami. |
| **Kanál pro upozornění na vypršení platnosti hesla** | Během 10 dnů před vypršením platnosti hesla uživatele bude při každém přihlášení odesláno upozornění.                                                                                                                                                                                                                                                                                       |

#### Zabezpečení přihlášení heslem

| Položka konfigurace                                       | Popis                                                                                                                                                                                                                                                        |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Maximální počet neplatných pokusů o přihlášení**        | Nastavuje maximální počet pokusů o přihlášení, které může uživatel provést v zadaném časovém intervalu.                                                                                                                                                        |
| **Časový interval pro neplatné pokusy o přihlášení (s)**  | Nastavuje časový interval v sekundách pro výpočet maximálního počtu neplatných pokusů o přihlášení uživatele.                                                                                                                                                   |
| **Doba uzamčení (s)**                                     | Nastavuje dobu, po kterou bude uživatel uzamčen po překročení limitu neplatných pokusů o přihlášení (0 znamená bez omezení). <br>Během doby, kdy je uživatel uzamčen, bude zakázán přístup do systému jakoukoli metodou ověření, včetně API klíčů. |

Obvykle doporučujeme:

- Nastavit silná pravidla pro hesla, aby se snížilo riziko jejich uhodnutí asociací nebo útokem hrubou silou.
- Nastavit přiměřenou dobu platnosti hesla, aby byli uživatelé nuceni hesla pravidelně měnit.
- Kombinovat počet neplatných pokusů o přihlášení s časovou konfigurací, aby se omezily vysokofrekvenční pokusy o přihlášení v krátkém čase a zabránilo se tak útokům hrubou silou.
- Pokud jsou bezpečnostní požadavky přísné, můžete nastavit přiměřenou dobu uzamčení uživatele po překročení limitu přihlášení. Je však třeba poznamenat, že nastavení doby uzamčení může být zneužito. Útočníci mohou úmyslně zadávat špatné heslo pro cílové účty, což donutí účty k uzamčení a znemožní jejich normální používání. V praxi můžete kombinovat omezení IP, omezení frekvence API a další prostředky k prevenci takových útoků.
- Změnit výchozí uživatelské jméno, e-mail a heslo root uživatele NocoBase, aby se zabránilo zneužití.
- Jelikož vypršení platnosti hesla nebo uzamčení účtu znemožní přístup do systému, včetně administrátorských účtů, doporučuje se v systému nastavit více účtů s oprávněním resetovat hesla a odemykat uživatele.


![](https://static-docs.nocobase.com/202501031618900.png)


### Uzamčení uživatele

> Profesionální edice a vyšší, zahrnuto v pluginu pro zásady hesel

Spravujte uživatele, kteří jsou uzamčeni kvůli překročení limitu neplatných pokusů o přihlášení. Můžete je aktivně odemknout nebo aktivně přidat podezřelé uživatele na seznam uzamčených. Po uzamčení bude uživateli zakázán přístup do systému jakoukoli metodou ověření, včetně API klíčů.


![](https://static-docs.nocobase.com/202501031618399.png)


### API klíče

NocoBase podporuje volání systémových API pomocí API klíčů. Uživatelé mohou přidávat API klíče v konfiguraci pluginu API klíčů.

- Přiřaďte API klíči správnou roli a ujistěte se, že oprávnění spojená s touto rolí jsou správně nakonfigurována.
- Během používání API klíčů zabraňte jejich úniku.
- Obecně doporučujeme uživatelům nastavit pro API klíče dobu platnosti a vyhnout se možnosti „Nikdy nevyprší“.
- Pokud zjistíte, že je API klíč používán neobvyklým způsobem a může hrozit jeho únik, můžete příslušný API klíč smazat, aby se stal neplatným.


![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)


### Single Sign-On (SSO)

> Komerční plugin

NocoBase poskytuje bohatou sadu SSO ověřovacích pluginů, které podporují několik hlavních protokolů, jako jsou OIDC, SAML 2.0, LDAP a CAS. Zároveň má NocoBase také kompletní sadu rozšiřujících rozhraní pro metody ověřování, která podporují rychlý vývoj a připojení dalších typů ověřování. Můžete snadno propojit svůj stávající IdP s NocoBase a centrálně spravovat identity uživatelů na IdP, čímž zvýšíte bezpečnost.

![](https://static-docs.nocobase.com/202501031619427.png)


### Dvoufaktorové ověřování (Two-factor authentication)

> Enterprise edice

Dvoufaktorové ověřování vyžaduje, aby uživatelé při přihlašování heslem poskytli druhý platný údaj k prokázání své identity, například zasláním jednorázového dynamického ověřovacího kódu na důvěryhodné zařízení uživatele. Tím se ověří identita uživatele, zajistí se, že nebude zneužita, a sníží se riziko spojené s únikem hesla.

### Řízení přístupu podle IP

> Enterprise edice

NocoBase podporuje nastavení blacklistů nebo whitelistů pro IP adresy, ze kterých uživatelé přistupují.

- V prostředí s přísnými bezpečnostními požadavky můžete nastavit IP whitelist, který povolí přístup do systému pouze konkrétním IP adresám nebo rozsahům IP. Tím omezíte neoprávněná externí síťová připojení a snížíte bezpečnostní rizika již u zdroje.
- V podmínkách veřejného síťového přístupu, pokud administrátor zjistí neobvyklý přístup, může nastavit IP blacklist, aby zablokoval známé škodlivé IP adresy nebo přístupy z podezřelých zdrojů, čímž se sníží bezpečnostní hrozby jako škodlivé skenování a útoky hrubou silou.
- Pro zamítnuté požadavky o přístup jsou uchovávány záznamy v protokolech.

## Řízení oprávnění

Nastavením různých rolí v systému a přidělením odpovídajících oprávnění těmto rolím můžete jemně řídit přístup uživatelů k prostředkům. Administrátoři musí provést rozumnou konfiguraci podle potřeb skutečných scénářů, aby se snížilo riziko úniku systémových prostředků.

### Uživatel root

Při první instalaci NocoBase aplikace inicializuje uživatele `root`. Doporučuje se, aby uživatelé změnili informace o uživateli `root` nastavením systémových proměnných prostředí, aby se zabránilo zneužití.

- `INIT_ROOT_USERNAME` - uživatelské jméno root
- `INIT_ROOT_EMAIL` - e-mail uživatele root
- `INIT_ROOT_PASSWORD` - heslo uživatele root, nastavte prosím silné heslo.

Během dalšího používání systému se doporučuje, aby uživatelé nastavili a používali jiné administrátorské účty a vyhýbali se přímému používání uživatele `root` k ovládání aplikace.

### Role a oprávnění

NocoBase řídí přístup uživatelů k prostředkům nastavením rolí v systému, autorizací různých rolí a přiřazením uživatelů k odpovídajícím rolím. Každý uživatel může mít více rolí a může mezi nimi přepínat, aby mohl pracovat s prostředky z různých perspektiv. Pokud je nainstalován plugin pro oddělení, můžete také propojit role s odděleními, takže uživatelé mohou mít role přiřazené k jejich oddělením.


![](https://static-docs.nocobase.com/202501031620965.png)


### Oprávnění ke konfiguraci systému

Oprávnění ke konfiguraci systému zahrnují následující nastavení:

- Zda povolit konfigurační rozhraní
- Zda povolit instalaci, povolení a zakázání pluginů
- Zda povolit konfiguraci pluginů
- Zda povolit vymazání mezipaměti a restartování aplikace
- Konfigurační oprávnění pro každý plugin

### Oprávnění k menu

Oprávnění k menu slouží k řízení přístupu uživatelů na různé stránky menu, včetně desktopové a mobilní verze.

![](https://static-docs.nocobase.com/202501031620717.png)


### Oprávnění k datům

NocoBase poskytuje jemně zrnité řízení přístupu uživatelů k datům v systému, což zajišťuje, že různí uživatelé mohou přistupovat pouze k datům souvisejícím s jejich povinnostmi, a zabraňuje tak překročení oprávnění a úniku dat.

#### Globální řízení


![](https://static-docs.nocobase.com/202501031620866.png)


#### Řízení na úrovni tabulky a pole


![](https://static-docs.nocobase.com/202501031621047.png)


#### Řízení rozsahu dat

Nastavte rozsah dat, se kterými mohou uživatelé pracovat. Všimněte si, že rozsah dat zde je odlišný od rozsahu dat nakonfigurovaného v bloku. Rozsah dat nakonfigurovaný v bloku se obvykle používá pouze pro filtrování dat na straně klienta. Pokud potřebujete přísně kontrolovat přístup uživatelů k datovým zdrojům, musíte jej nakonfigurovat zde, kde je řízen serverem.


![](https://static-docs.nocobase.com/202501031621712.png)


## Zabezpečení dat

Během procesu ukládání a zálohování dat poskytuje NocoBase účinné mechanismy pro zajištění bezpečnosti dat.

### Ukládání hesel

Hesla uživatelů NocoBase jsou šifrována a uložena pomocí algoritmu scrypt, který účinně odolává rozsáhlým hardwarovým útokům.

### Proměnné prostředí a klíče

Při používání služeb třetích stran v NocoBase doporučujeme nakonfigurovat klíčové informace třetích stran do proměnných prostředí a uložit je zašifrovaně. Je to pohodlné pro konfiguraci a použití na různých místech a zároveň to zvyšuje bezpečnost. Podrobné pokyny k použití naleznete v dokumentaci.

:::warning
Ve výchozím nastavení je klíč šifrován pomocí algoritmu AES-256-CBC. NocoBase automaticky vygeneruje 32bitový šifrovací klíč a uloží jej do `storage/.data/environment/aes_key.dat`. Uživatelé by měli soubor s klíčem řádně uchovávat, aby se zabránilo jeho odcizení. Pokud potřebujete migrovat data, soubor s klíčem je třeba migrovat společně.
:::


![](https://static-docs.nocobase.com/202501031622612.png)


### Ukládání souborů

Pokud potřebujete ukládat citlivé soubory, doporučuje se použít cloudové úložiště kompatibilní s protokolem S3 a komerční plugin `File storage: S3 (Pro)`, který umožňuje soukromé čtení a zápis souborů. Pokud potřebujete použít úložiště v interní síti, doporučuje se použít aplikace jako MinIO, které podporují privátní nasazení a jsou kompatibilní s protokolem S3.


![](https://static-docs.nocobase.com/202501031623549.png)


### Zálohování aplikace

Pro zajištění bezpečnosti dat aplikace a předejití ztrátě dat doporučujeme pravidelně zálohovat databázi.

Uživatelé open-source verze se mohou řídit návodem na https://www.nocobase.com/en/blog/nocobase-backup-restore a zálohovat pomocí databázových nástrojů. Doporučujeme také řádně uchovávat záložní soubory, aby se zabránilo úniku dat.

Uživatelé profesionální a vyšší edice mohou pro zálohování použít správce záloh. Správce záloh poskytuje následující funkce:

- Plánované automatické zálohování: Periodické automatické zálohování šetří čas a manuální práci a zajišťuje vyšší bezpečnost dat.
- Synchronizace záložních souborů do cloudového úložiště: Izoluje záložní soubory od samotné aplikační služby, aby se zabránilo ztrátě záložních souborů v případě, že služba není dostupná kvůli selhání serveru.
- Šifrování záložních souborů: Nastavte heslo pro záložní soubory, abyste snížili riziko úniku dat způsobeného únikem záložního souboru.


![](https://static-docs.nocobase.com/202501031623107.png)


## Zabezpečení běhového prostředí

Správné nasazení NocoBase a zajištění bezpečnosti běhového prostředí je jedním z klíčů k zajištění bezpečnosti aplikací NocoBase.

### Nasazení s HTTPS

Aby se předešlo útokům typu man-in-the-middle, doporučujeme přidat na stránky vaší aplikace NocoBase certifikát SSL/TLS, aby byla zajištěna bezpečnost dat během přenosu po síti.

### Šifrování přenosu API

> Enterprise edice

V prostředích s přísnějšími požadavky na bezpečnost dat NocoBase podporuje zapnutí šifrování přenosu API. Tím se šifruje obsah požadavků a odpovědí API, zabraňuje se přenosu v otevřeném textu a zvyšuje se obtížnost prolomení dat.

### Privátní nasazení

Ve výchozím nastavení NocoBase nemusí komunikovat se službami třetích stran a tým NocoBase neshromažďuje žádné informace o uživatelích. Připojení k serveru NocoBase je nutné pouze při provádění následujících dvou operací:

1. Automatické stahování komerčních pluginů prostřednictvím platformy NocoBase Service.
2. Online ověření identity a aktivace aplikace pro komerční edici.

Pokud jste ochotni obětovat určitou míru pohodlí, obě tyto operace podporují i offline dokončení a nevyžadují přímé připojení k serveru NocoBase.

NocoBase podporuje kompletní nasazení v intranetu, viz

- https://www.nocobase.com/en/blog/load-docker-image
- [Nahrání pluginů do adresáře pluginů pro instalaci a upgrade](/get-started/install-upgrade-plugins#third-party-plugins)

### Izolace více prostředí

> Profesionální edice a vyšší

V praxi doporučujeme podnikovým uživatelům izolovat testovací a produkční prostředí, aby byla zajištěna bezpečnost dat aplikací a běhového prostředí v produkčním prostředí. Pomocí pluginu pro správu migrací můžete migrovat data aplikací mezi různými prostředími.


![](https://static-docs.nocobase.com/202501031627729.png)


## Auditování a monitorování

### Auditní protokoly

> Enterprise edice

Funkce auditních protokolů v NocoBase zaznamenává aktivity uživatelů v systému. Záznamem klíčových operací a chování uživatelů mohou administrátoři:

- Kontrolovat informace o přístupu uživatelů, jako je IP, zařízení a čas operace, a včas odhalit neobvyklé chování.
- Sledovat historii operací s datovými zdroji v systému.


![](https://static-docs.nocobase.com/202501031627719.png)



![](https://static-docs.nocobase.com/202501031627922.png)


### Protokoly aplikace

NocoBase poskytuje několik typů protokolů, které uživatelům pomáhají porozumět stavu běhu systému a záznamům o chování, včas identifikovat a lokalizovat problémy systému a zajistit bezpečnost a ovladatelnost systému z různých dimenzí. Hlavní typy protokolů zahrnují:

- Protokol požadavků: Protokoly API požadavků, včetně navštívených URL, HTTP metod, parametrů požadavků, doby odezvy a stavových kódů.
- Systémový protokol: Zaznamenává události běhu aplikace, včetně spuštění služby, změn konfigurace, chybových zpráv a klíčových operací.
- SQL protokol: Zaznamenává příkazy pro operace s databází a dobu jejich provedení, pokrývá operace jako dotazování, aktualizace, vkládání a mazání.
- Protokol pracovních postupů: Protokol o provádění pracovních postupů, včetně doby provedení, informací o běhu a chybových zpráv.