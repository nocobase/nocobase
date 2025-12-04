:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Integracja z Jednokrotnym Logowaniem (SSO)

NocoBase oferuje kompleksowe rozwiązania w zakresie jednokrotnego logowania (SSO), obsługujące wiele popularnych protokołów uwierzytelniania, co umożliwia płynną integrację z istniejącymi systemami tożsamości w Państwa firmie.

## Przegląd

Jednokrotne logowanie (SSO) umożliwia użytkownikom dostęp do wielu powiązanych, lecz niezależnych systemów za pomocą jednego zestawu danych uwierzytelniających. Wystarczy, że użytkownik zaloguje się raz, aby uzyskać dostęp do wszystkich autoryzowanych aplikacji, bez konieczności ponownego wprowadzania nazwy użytkownika i hasła. Poprawia to nie tylko komfort użytkowania, ale także zwiększa bezpieczeństwo systemu i efektywność zarządzania.

## Obsługiwane protokoły uwierzytelniania

NocoBase obsługuje następujące protokoły i metody uwierzytelniania za pośrednictwem **wtyczek**:

### Protokoły SSO dla przedsiębiorstw

- **[SAML 2.0](/auth-verification/auth-saml/)**: Otwarty standard oparty na XML, szeroko stosowany do uwierzytelniania tożsamości w przedsiębiorstwach. Idealny do integracji z korporacyjnymi dostawcami tożsamości (IdP).

- **[OIDC (OpenID Connect)](/auth-verification/auth-oidc/)**: Nowoczesna warstwa uwierzytelniania zbudowana na protokole OAuth 2.0, zapewniająca mechanizmy uwierzytelniania i autoryzacji. Obsługuje integrację z głównymi dostawcami tożsamości (takimi jak Google, Azure AD itp.).

- **[CAS (Central Authentication Service)](/auth-verification/auth-cas/)**: Protokół SSO opracowany przez Uniwersytet Yale, szeroko stosowany w instytucjach szkolnictwa wyższego i edukacji.

- **[LDAP](/auth-verification/auth-ldap/)**: Lekki protokół dostępu do katalogów, służący do dostępu i utrzymywania rozproszonych usług informacyjnych katalogów. Odpowiedni do integracji z Active Directory lub innymi serwerami LDAP.

### Uwierzytelnianie za pośrednictwem platform zewnętrznych

- **[WeCom (WeChat Work)](/auth-verification/auth-wecom/)**: Obsługuje logowanie za pomocą kodu QR WeCom oraz bezproblemowe uwierzytelnianie w aplikacji.

- **[DingTalk](/auth-verification/auth-dingtalk/)**: Obsługuje logowanie za pomocą kodu QR DingTalk oraz bezproblemowe uwierzytelnianie w aplikacji.

### Inne metody uwierzytelniania

- **[Weryfikacja SMS](/auth-verification/auth-sms/)**: Uwierzytelnianie za pomocą kodu weryfikacyjnego wysyłanego SMS-em na telefon komórkowy.

- **[Nazwa użytkownika/Hasło](/auth-verification/auth/)**: Wbudowana podstawowa metoda uwierzytelniania NocoBase.

## Kroki integracji

### 1. Instalacja **wtyczki** uwierzytelniającej

Zgodnie z Państwa wymaganiami, proszę znaleźć i zainstalować odpowiednią **wtyczkę** uwierzytelniającą w menedżerze **wtyczek**. Większość **wtyczek** uwierzytelniających SSO wymaga osobnego zakupu lub subskrypcji.

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

Na przykład, instalacja **wtyczki** uwierzytelniającej SAML 2.0:

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

Lub instalacja **wtyczki** uwierzytelniającej OIDC:

![](https://static-docs.nocobase.com/202411122358790.png)

### 2. Konfiguracja metody uwierzytelniania

1. Proszę przejść do strony **Ustawienia systemu > Uwierzytelnianie użytkownika**

![](https://static-docs.nocobase.com/202411130004459.png)

2. Proszę kliknąć **Dodaj metodę uwierzytelniania**
3. Proszę wybrać zainstalowany typ uwierzytelniania (np. SAML)

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

Lub wybrać OIDC:

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

4. Proszę skonfigurować wymagane parametry zgodnie z wyświetlonymi instrukcjami.

### 3. Konfiguracja dostawcy tożsamości

Każdy protokół uwierzytelniania wymaga konfiguracji odpowiedniego dostawcy tożsamości:

- **SAML**: Proszę skonfigurować metadane IdP, certyfikaty itp.

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- **OIDC**: Proszę skonfigurować Client ID, Client Secret, punkt końcowy wykrywania itp.

![](https://static-docs.nocobase.com/202411130006341.png)

- **CAS**: Proszę skonfigurować adres serwera CAS.
- **LDAP**: Proszę skonfigurować adres serwera LDAP, Bind DN itp.
- **WeCom/DingTalk**: Proszę skonfigurować poświadczenia aplikacji, Corp ID itp.

### 4. Testowanie uwierzytelniania

Po zakończeniu konfiguracji zalecamy przeprowadzenie testowego logowania:

1. Proszę wylogować się z bieżącej sesji.
2. Na stronie logowania proszę wybrać skonfigurowaną metodę SSO.

![](https://static-docs.nocobase.com/74963865c9d36a2949486adeb5b24bc.png)

3. Proszę ukończyć proces uwierzytelniania u dostawcy tożsamości.
4. Proszę zweryfikować, czy logowanie do NocoBase zakończyło się sukcesem.

## Mapowanie użytkowników i przypisywanie ról

Po pomyślnym uwierzytelnieniu SSO, NocoBase automatycznie zarządza kontami użytkowników:

- **Pierwsze logowanie**: Automatycznie tworzy nowe konto użytkownika i synchronizuje podstawowe informacje (pseudonim, e-mail itp.) od dostawcy tożsamości.
- **Kolejne logowania**: Używa istniejącego konta; opcjonalnie synchronizuje zaktualizowane informacje o użytkowniku.
- **Przypisywanie ról**: Można skonfigurować role domyślne lub automatycznie przypisywać role na podstawie atrybutów użytkownika z dostawcy tożsamości.

## Zalecenia dotyczące bezpieczeństwa

1. **Używaj HTTPS**: Proszę upewnić się, że NocoBase jest wdrożony w środowisku HTTPS, aby chronić transmisję danych uwierzytelniających.
2. **Regularne aktualizacje certyfikatów**: Proszę terminowo aktualizować i rotować poświadczenia bezpieczeństwa, takie jak certyfikaty SAML.
3. **Konfiguracja białej listy adresów URL zwrotnych**: Proszę prawidłowo skonfigurować adresy URL zwrotne NocoBase u dostawcy tożsamości.
4. **Zasada najmniejszych uprawnień**: Proszę przypisać użytkownikom SSO odpowiednie role i uprawnienia.
5. **Włączanie logowania audytu**: Proszę rejestrować i monitorować działania logowania SSO.

## Rozwiązywanie problemów

### Problem z logowaniem SSO?

1. Proszę sprawdzić, czy konfiguracja dostawcy tożsamości jest poprawna.
2. Proszę upewnić się, że adresy URL zwrotne są prawidłowo skonfigurowane.
3. Proszę sprawdzić logi NocoBase w poszukiwaniu szczegółowych komunikatów o błędach.
4. Proszę potwierdzić, czy certyfikaty i klucze są ważne.

### Informacje o użytkowniku nie są synchronizowane?

1. Proszę sprawdzić atrybuty użytkownika zwracane przez dostawcę tożsamości.
2. Proszę zweryfikować, czy konfiguracja mapowania pól jest poprawna.
3. Proszę potwierdzić, czy opcja synchronizacji informacji o użytkowniku jest włączona.

### Jak obsługiwać wiele metod uwierzytelniania jednocześnie?

NocoBase umożliwia jednoczesną konfigurację wielu metod uwierzytelniania. Użytkownicy mogą wybrać preferowaną metodę na stronie logowania.

## Powiązane zasoby

- [Dokumentacja uwierzytelniania](/auth-verification/auth/)
- [Uwierzytelnianie za pomocą kluczy API](/integration/api-keys/)
- [Zarządzanie użytkownikami i uprawnieniami](/plugins/@nocobase/plugin-users/)