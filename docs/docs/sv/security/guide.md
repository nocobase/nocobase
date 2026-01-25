:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# NocoBase Säkerhetsguide

NocoBase fokuserar på säkerheten för data och applikationer, från funktionsdesign till systemimplementering. Plattformen har inbyggda säkerhetsfunktioner som användarautentisering, åtkomstkontroll och datakryptering, och tillåter även flexibel konfiguration av säkerhetspolicyer efter faktiska behov. Oavsett om det handlar om att skydda användardata, hantera åtkomstbehörigheter eller isolera utvecklings- och produktionsmiljöer, erbjuder NocoBase praktiska verktyg och lösningar. Denna guide syftar till att ge vägledning för säker användning av NocoBase, hjälpa dig att skydda data, applikationer och miljöer, samt säkerställa effektiv användning av systemfunktionerna under förutsättning att användarsäkerheten är garanterad.

## Användarautentisering

Användarautentisering används för att identifiera användaridentiteter, förhindra obehörig åtkomst till systemet och säkerställa att användaridentiteter inte missbrukas.

### Token-nyckel

Som standard använder NocoBase JWT (JSON Web Token) för autentisering av server-sidans API:er. Ni kan ställa in Token-nyckeln via systemmiljövariabeln `APP_KEY`. Vänligen hantera applikationens Token-nyckel noggrant för att förhindra extern läcka. Observera att om `APP_KEY` ändras, kommer även gamla Token att bli ogiltiga.

### Token-policy

NocoBase stöder följande säkerhetspolicyer för användar-Token:

| Konfigurationsalternativ            | Beskrivning                                                                                                                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sessionsgiltighet                   | Den maximala giltighetstiden för varje användarinloggning. Inom sessionsgiltighetstiden uppdateras Token automatiskt. Efter timeout krävs att användaren loggar in igen.                  |
| Token-giltighet                     | Giltighetstiden för varje utfärdad API Token. Om Token har gått ut, men fortfarande är inom sessionsgiltighetstiden och inte har överskridit förnyelsegränsen, kommer servern automatiskt att utfärda en ny Token för att upprätthålla användarsessionen. Annars krävs att användaren loggar in igen. (Varje Token kan bara förnyas en gång) |
| Gräns för förnyelse av utgången Token | Den maximala tidsgränsen för att förnya en Token efter att den har gått ut.                                                                                                           |

Vanligtvis rekommenderar vi administratörer att:

- Ställa in en kortare Token-giltighetstid för att begränsa Tokenens exponeringstid.
- Ställa in en rimlig sessionsgiltighetstid, som är längre än Token-giltighetstiden men inte för lång, för att balansera användarupplevelse och säkerhet. Använd den automatiska Token-förnyelsemekanismen för att säkerställa att aktiva användarsessioner inte avbryts, samtidigt som risken för missbruk av långvariga sessioner minskar.
- Ställa in en rimlig gräns för förnyelse av utgången Token så att Token naturligt går ut när användaren är inaktiv under en längre tid utan att en ny Token utfärdas, vilket minskar risken för missbruk av inaktiva användarsessioner.

### Token-klientlagring

Som standard lagras användar-Token i webbläsarens LocalStorage. Om ni stänger webbläsarsidan och öppnar den igen, behöver användaren inte logga in igen om Token fortfarande är giltig.

Om ni vill att användare ska logga in igen varje gång de öppnar en sida, kan ni ställa in miljövariabeln `API_CLIENT_STORAGE_TYPE=sessionStorage` för att spara användar-Token i webbläsarens SessionStorage. Detta uppnår syftet att användare loggar in igen varje gång de öppnar sidan.

### Lösenordspolicy

> Proffsutgåva och högre

NocoBase stöder inställning av lösenordsregler och policyer för låsning vid inloggningsförsök för alla användare, för att förbättra säkerheten i NocoBase-applikationer som har lösenordsinloggning aktiverad. Ni kan läsa mer om varje konfigurationsalternativ i [Lösenordspolicy](./password-policy/index.md).

#### Lösenordsregler

| Konfigurationsalternativ                 | Beskrivning                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------ |
| **Lösenordslängd**                       | Minsta längdkrav för lösenordet, maximal längd är 64 tecken.             |
| **Lösenordskomplexitet**                 | Ställer in krav på lösenordets komplexitet, vilka teckentyper som måste ingå. |
| **Kan inte inkludera användarnamn i lösenord** | Ställer in om lösenordet får innehålla den aktuella användarens användarnamn. |
| **Kom ihåg lösenordshistorik**           | Kommer ihåg antalet senast använda lösenord. Användaren kan inte återanvända dem vid lösenordsbyte. |

#### Lösenordsutgångskonfiguration

| Konfigurationsalternativ                         | Beskrivning                                                                                                                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Lösenordsgiltighetstid**                       | Giltighetstiden för användarlösenord. Användare måste byta lösenord innan det går ut för att giltighetstiden ska räknas om. Om lösenordet inte byts innan det går ut, kommer det gamla lösenordet inte att kunna användas för inloggning, och administratörshjälp krävs för att återställa det.<br>Om andra inloggningsmetoder är konfigurerade, kan användaren logga in med dessa. |
| **Meddelandekanal för påminnelse om lösenordsutgång** | Inom 10 dagar innan användarens lösenord går ut skickas en påminnelse varje gång användaren loggar in.                                                                                                                                         |

#### Lösenordsinloggningssäkerhet

| Konfigurationsalternativ                                 | Beskrivning                                                                                                                                                                                                                                               |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Maximalt antal ogiltiga lösenordsförsök**              | Ställer in det maximala antalet inloggningsförsök en användare kan göra inom ett angivet tidsintervall.                                                                                                                                  |
| **Tidsintervall för maximalt antal ogiltiga lösenordsförsök (sekunder)** | Ställer in tidsintervallet för beräkning av användarens maximala antal ogiltiga inloggningsförsök, i sekunder.                                                                                                                               |
| **Låstid (sekunder)**                                    | Ställer in tiden för att låsa användaren efter att användaren har överskridit gränsen för ogiltiga lösenordsförsök (0 betyder ingen gräns).<br>Under perioden då användaren är låst kommer åtkomst till systemet att förbjudas med alla autentiseringsmetoder, inklusive API-nycklar. |

Vanligtvis rekommenderar vi:

- Ställ in starka lösenordsregler för att minska risken för att lösenord gissas genom association eller brute force-attacker.
- Ställ in en rimlig lösenordsgiltighetstid för att tvinga användare att regelbundet byta lösenord.
- Kombinera konfigurationen för antal ogiltiga lösenordsförsök och tid för att begränsa högfrekventa lösenordsinloggningsförsök under en kort tid och förhindra brute force-attacker mot lösenord.
- Om säkerhetskraven är mycket strikta, kan ni ställa in en rimlig tid för att låsa användaren efter att inloggningsgränsen har överskridits. Det bör dock noteras att inställningen för låstid kan missbrukas. Angripare kan avsiktligt ange fel lösenord flera gånger för målkonton, vilket tvingar kontona att låsas och förhindrar normal användning. I praktisk användning kan ni kombinera IP-begränsningar, API-frekvensbegränsningar och andra metoder för att förhindra sådana attacker.
- Ändra NocoBase:s standardanvändarnamn, e-post och lösenord för root-användaren för att undvika missbruk.
- Eftersom både utgångna lösenord och låsta konton förhindrar åtkomst till systemet, inklusive administratörskonton, rekommenderas det att ni ställer in flera konton i systemet som har behörighet att återställa lösenord och låsa upp användare.

![](https://static-docs.nocobase.com/202501031618900.png)

### Användarlåsning

> Proffsutgåva och högre, ingår i pluginen för lösenordspolicy

Hantera användare som är låsta på grund av att de överskridit gränsen för ogiltiga lösenordsförsök. Ni kan aktivt låsa upp dem eller aktivt lägga till avvikande användare i låsningslistan. När en användare är låst kommer åtkomst till systemet att förbjudas med alla autentiseringsmetoder, inklusive API-nycklar.

![](https://static-docs.nocobase.com/202501031618399.png)

### API-nycklar

NocoBase stöder anrop av system-API:er via API-nycklar. Ni kan lägga till API-nycklar i konfigurationen för pluginen för API-nycklar.

- Vänligen koppla rätt roll till API-nyckeln och se till att de behörigheter som är associerade med rollen är korrekt konfigurerade.
- Förhindra att API-nycklar läcker ut under användning.
- Vanligtvis rekommenderar vi att ni ställer in en giltighetstid för API-nycklar och undviker att använda alternativet "Aldrig utgången".
- Om en API-nyckel används på ett avvikande sätt och det finns risk för läcka, kan ni ta bort motsvarande API-nyckel för att ogiltigförklara den.

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

### Enkel inloggning (Single Sign-On)

> Kommersiell plugin

NocoBase erbjuder ett rikt utbud av SSO-autentiserings-plugins som stöder flera vanliga protokoll som OIDC, SAML 2.0, LDAP och CAS. Samtidigt har NocoBase också ett komplett utbud av utökningsgränssnitt för autentiseringsmetoder, vilket möjliggör snabb utveckling och anslutning av andra autentiseringstyper. Ni kan enkelt koppla er befintliga IdP till NocoBase för att centralt hantera användaridentiteter på IdP:n och därmed förbättra säkerheten.
![](https://static-docs.nocobase.com/202501031619427.png)

### Tvåfaktorsautentisering (Two-factor authentication)

> Företagsutgåva

Tvåfaktorsautentisering kräver att användare, vid inloggning med lösenord, tillhandahåller en andra giltig information för att bevisa sin identitet. Detta kan till exempel vara en engångskod som skickas till användarens betrodda enhet, för att verifiera användarens identitet och säkerställa att användaridentiteten inte missbrukas, vilket minskar risken för lösenordsläckage.

### IP-åtkomstkontroll

> Företagsutgåva

NocoBase stöder inställning av svarta eller vita listor för användares åtkomst-IP:er.

- I miljöer med strikta säkerhetskrav kan ni ställa in en IP-vitlista för att endast tillåta specifika IP-adresser eller IP-intervall att komma åt systemet. Detta begränsar obehöriga externa nätverksanslutningar och minskar säkerhetsriskerna vid källan.
- Under offentliga nätverksåtkomstförhållanden, om administratören upptäcker avvikande åtkomst, kan de ställa in en IP-svartlista för att blockera kända skadliga IP-adresser eller åtkomst från misstänkta källor, vilket minskar säkerhetshot som skadlig skanning och brute force-attacker.
- Loggposter sparas för avvisade åtkomstförfrågningar.

## Behörighetskontroll

Genom att ställa in olika roller i systemet och tilldela motsvarande behörigheter till dessa roller, kan ni finjustera användarnas åtkomstbehörigheter till resurser. Administratörer måste konfigurera detta på ett lämpligt sätt, baserat på de faktiska scenarierna, för att minska risken för systemresursläckage.

### Root-användare

Vid första installationen av NocoBase kommer applikationen att initiera en root-användare. Vi rekommenderar att ni ändrar root-användarens information genom att ställa in systemmiljövariabler för att undvika skadligt utnyttjande.

- `INIT_ROOT_USERNAME` - root-användarnamn
- `INIT_ROOT_EMAIL` - root-användarens e-post
- `INIT_ROOT_PASSWORD` - root-användarens lösenord, vänligen ställ in ett starkt lösenord.

Under den fortsatta användningen av systemet rekommenderar vi att ni ställer in och använder andra administratörskonton, och i möjligaste mån undviker att direkt använda root-användaren för att hantera applikationen.

### Roller och behörigheter

NocoBase kontrollerar användarnas åtkomstbehörigheter till resurser genom att ställa in roller i systemet, auktorisera olika roller och koppla användare till motsvarande roller. Varje användare kan ha flera roller, och användare kan växla roller för att hantera resurser från olika perspektiv. Om avdelnings-pluginen är installerad, kan ni även koppla roller och avdelningar, så att användare får de roller som är kopplade till deras respektive avdelningar.

![](https://static-docs.nocobase.com/202501031620965.png)

### Systemkonfigurationsbehörigheter

Systemkonfigurationsbehörigheter inkluderar följande inställningar:

- Om konfigurationsgränssnittet är tillåtet
- Om det är tillåtet att installera, aktivera, och inaktivera plugins
- Om det är tillåtet att konfigurera plugins
- Om det är tillåtet att rensa cache och starta om applikationen
- Konfigurationsbehörigheter för varje plugin

### Menybehörigheter

Menybehörigheter används för att kontrollera användares behörighet att komma åt olika menysidor, både på dator och mobil.
![](https://static-docs.nocobase.com/202501031620717.png)

### Databehörigheter

NocoBase erbjuder finmaskig kontroll över användares behörigheter att komma åt data i systemet, vilket säkerställer att olika användare endast kan komma åt data som är relevanta för deras ansvarsområden, och förhindrar obehörig åtkomst och dataläckage.

#### Global kontroll

![](https://static-docs.nocobase.com/202501031620866.png)

#### Kontroll på tabell- och fältnivå

![](https://static-docs.nocobase.com/202501031621047.png)

#### Dataskopskontroll

Ställ in det dataskop som användare kan hantera. Observera att dataskopet här skiljer sig från det dataskop som konfigureras i blocket. Dataskopet som konfigureras i blocket används vanligtvis endast för frontend-filtrering av data. Om ni behöver strikt kontrollera användares behörighet att komma åt dataresurser, måste ni konfigurera det här, vilket kontrolleras av servern.

![](https://static-docs.nocobase.com/202501031621712.png)

## Datasäkerhet

Under datalagring och säkerhetskopiering tillhandahåller NocoBase effektiva mekanismer för att säkerställa datasäkerhet.

### Lösenordslagring

NocoBase:s användarlösenord krypteras och lagras med scrypt-algoritmen, vilket effektivt kan motstå storskaliga hårdvaruattacker.

### Miljövariabler och nycklar

När ni använder tredjepartstjänster i NocoBase rekommenderar vi att ni konfigurerar tredjepartsnyckelinformationen i miljövariabler och lagrar dem krypterade. Detta är både bekvämt för konfiguration och användning på olika platser, och förbättrar även säkerheten. Ni kan läsa dokumentationen för detaljerade användningsmetoder.

:::warning
Som standard krypteras nyckeln med AES-256-CBC-algoritmen. NocoBase genererar automatiskt en 32-bitars krypteringsnyckel och sparar den i `storage/.data/environment/aes_key.dat`. Ni bör hantera nyckelfilen noggrant för att förhindra att den stjäls. Om ni behöver migrera data, måste nyckelfilen migreras tillsammans.
:::

![](https://static-docs.nocobase.com/202501031622612.png)

### Fillagring

Om ni behöver lagra känsliga filer rekommenderas det att ni använder en molnlagringstjänst som är kompatibel med S3-protokollet, och i kombination med den kommersiella pluginen "File storage: S3 (Pro)", för att möjliggöra privat läsning och skrivning av filer. Om ni behöver använda den i en intern nätverksmiljö, rekommenderas det att ni använder lagringsapplikationer som stöder privat distribution och är kompatibla med S3-protokollet, såsom MinIO.

![](https://static-docs.nocobase.com/202501031623549.png)

### Applikationssäkerhetskopiering

För att säkerställa applikationsdatasäkerhet och undvika dataförlust rekommenderar vi att ni regelbundet säkerhetskopierar databasen.

Användare av öppen källkod kan hänvisa till https://www.nocobase.com/en/blog/nocobase-backup-restore för att säkerhetskopiera med databasverktyg. Vi rekommenderar också att ni hanterar säkerhetskopieringsfilerna noggrant för att förhindra dataläckage.

Användare av proffsutgåvan och högre kan använda säkerhetskopieringshanteraren för säkerhetskopiering. Säkerhetskopieringshanteraren erbjuder följande funktioner:

- Schemalagd automatisk säkerhetskopiering: Periodiska automatiska säkerhetskopieringar sparar tid och manuella åtgärder, och datasäkerheten blir bättre garanterad.
- Synkronisera säkerhetskopieringsfiler till molnlagring: Isolera säkerhetskopieringsfiler från själva applikationstjänsten för att förhindra förlust av säkerhetskopieringsfiler om tjänsten blir otillgänglig på grund av serverfel.
- Kryptering av säkerhetskopieringsfiler: Ställ in ett lösenord för säkerhetskopieringsfiler för att minska risken för dataförlust orsakad av läckage av säkerhetskopieringsfiler.

![](https://static-docs.nocobase.com/202501031623107.png)

## Säkerhet i körmiljön

Korrekt distribution av NocoBase och säkerställande av en säker körmiljö är en av nycklarna för att garantera säkerheten för NocoBase-applikationer.

### HTTPS-distribution

För att förhindra man-in-the-middle-attacker rekommenderar vi att ni lägger till ett SSL/TLS-certifikat till er NocoBase-applikationssida för att säkerställa datasäkerheten under nätverksöverföringen.

### API-överföringskryptering

> Företagsutgåva

I miljöer med strängare krav på datasäkerhet stöder NocoBase aktivering av API-överföringskryptering. Detta krypterar innehållet i API-förfrågningar och svar, undviker klartextöverföring och höjer tröskeln för datakryptering.

### Privat distribution

Som standard behöver NocoBase inte kommunicera med tredjepartstjänster, och NocoBase-teamet samlar inte in någon användarinformation. Det är endast nödvändigt att ansluta till NocoBase-servern vid följande två operationer:

1. Automatisk nedladdning av kommersiella plugins via NocoBase Service-plattformen.
2. Online-verifiering och aktivering av kommersiella applikationsutgåvor.

Om ni är villiga att offra en viss bekvämlighet, stöder båda dessa operationer även offline-utförande och behöver inte anslutas direkt till NocoBase-servern.

NocoBase stöder fullständig intern nätverksdistribution, se:

- https://www.nocobase.com/en/blog/load-docker-image
- [Ladda upp plugins till plugin-katalogen för att installera och uppgradera](/get-started/install-upgrade-plugins#third-party-plugins)

### Isolering av flera miljöer

> Proffsutgåva och högre

I praktisk användning rekommenderar vi företagskunder att isolera test- och produktionsmiljöer för att säkerställa säkerheten för applikationsdata och körmiljön i produktionsmiljön. Med hjälp av pluginen för migreringshantering kan applikationsdata migreras mellan olika miljöer.

![](https://static-docs.nocobase.com/202501031627729.png)

## Granskning och övervakning

### Granskningsloggar

> Företagsutgåva

NocoBase:s granskningsloggfunktion registrerar användarnas aktiviteter i systemet. Genom att registrera användarnas viktiga operationer och åtkomstbeteenden kan administratörer:

- Kontrollera användares åtkomstinformation som IP, enhet och operationstid för att snabbt upptäcka avvikande beteenden.
- Spåra historiken för operationer på dataresurser i systemet.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

### Applikationsloggar

NocoBase tillhandahåller flera loggtyper för att hjälpa användare att förstå systemets driftstatus och beteendeposter, snabbt identifiera och lokalisera systemproblem, och säkerställa systemets säkerhet och kontrollerbarhet från olika dimensioner. De huvudsakliga loggtyperna inkluderar:

- Begärandelogg: API-begärandeloggar, inklusive åtkomna URL:er, HTTP-metoder, begärandeparametrar, svarstider och statuskoder.
- Systemlogg: Registrerar applikationshändelser, inklusive tjänststart, konfigurationsändringar, felmeddelanden och viktiga operationer.
- SQL-logg: Registrerar databasoperationssatser och deras exekveringstider, inklusive frågor, uppdateringar, infogningar och borttagningar.
- Arbetsflödeslogg: Exekveringslogg för arbetsflödet, inklusive exekveringstid, körningsinformation och felinformation.