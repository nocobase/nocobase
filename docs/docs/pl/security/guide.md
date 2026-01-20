:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Przewodnik po bezpieczeństwie NocoBase

NocoBase, od projektu funkcjonalnego po implementację systemu, kładzie nacisk na bezpieczeństwo danych i aplikacji. Platforma ma wbudowane liczne funkcje bezpieczeństwa, takie jak uwierzytelnianie użytkowników, kontrola dostępu i szyfrowanie danych, a jednocześnie pozwala na elastyczną konfigurację polityk bezpieczeństwa zgodnie z rzeczywistymi potrzebami. Niezależnie od tego, czy chodzi o ochronę danych użytkownika, zarządzanie uprawnieniami dostępu, czy izolowanie środowisk deweloperskich i produkcyjnych, NocoBase dostarcza praktyczne narzędzia i rozwiązania. Ten przewodnik ma na celu dostarczenie wskazówek dotyczących bezpiecznego korzystania z NocoBase, pomagając użytkownikom chronić bezpieczeństwo danych, aplikacji i środowiska, a także zapewnić efektywne wykorzystanie funkcji systemu przy jednoczesnym zachowaniu bezpieczeństwa.

## Uwierzytelnianie użytkownika

Uwierzytelnianie użytkownika służy do identyfikacji tożsamości użytkowników, zapobiegania nieautoryzowanemu dostępowi do systemu oraz zapewnienia, że tożsamość użytkownika nie jest nadużywana.

### Klucz tokena

Domyślnie NocoBase używa JWT (JSON Web Token) do uwierzytelniania API po stronie serwera. Użytkownicy mogą ustawić klucz tokena za pomocą zmiennej środowiskowej systemu `APP_KEY`. Prosimy o odpowiednie zarządzanie kluczem tokena aplikacji, aby zapobiec jego wyciekowi. Należy pamiętać, że jeśli `APP_KEY` zostanie zmieniony, stare tokeny również stracą ważność.

### Polityka tokenów

NocoBase wspiera ustawienie następujących polityk bezpieczeństwa dla tokenów użytkownika:

| Element konfiguracji                | Opis                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ważność sesji                       | Maksymalny czas ważności każdego logowania użytkownika. W okresie ważności sesji token będzie automatycznie odnawiany. Po upływie tego czasu użytkownik będzie musiał zalogować się ponownie.                                                                                                                                                                |
| Ważność tokena                      | Okres ważności każdego wydanego tokena API. Po wygaśnięciu tokena, jeśli sesja jest nadal ważna i nie przekroczono limitu czasu na odświeżenie, serwer automatycznie wyda nowy token, aby utrzymać sesję użytkownika. W przeciwnym razie użytkownik będzie musiał zalogować się ponownie. (Każdy token może być odświeżony tylko raz) |
| Limit czasu na odświeżenie tokena | Maksymalny czas, w którym można odświeżyć token po jego wygaśnięciu.                                                                                                                                                                                                                                                                                       |

Zazwyczaj zalecamy administratorom:

- Ustawienie krótszego okresu ważności tokena, aby ograniczyć czas jego ekspozycji.
- Ustawienie rozsądnego okresu ważności sesji, dłuższego niż ważność tokena, ale nie zbyt długiego, aby zrównoważyć doświadczenie użytkownika i bezpieczeństwo. Wykorzystanie mechanizmu automatycznego odświeżania tokena zapewnia, że aktywne sesje użytkowników nie są przerywane, jednocześnie zmniejszając ryzyko nadużycia długotrwałych sesji.
- Ustawienie rozsądnego limitu czasu na odświeżenie wygasłego tokena, aby token naturalnie wygasał, gdy użytkownik jest nieaktywny przez dłuższy czas, bez wydawania nowego tokena, co zmniejsza ryzyko nadużycia bezczynnych sesji użytkownika.

### Przechowywanie tokena po stronie klienta

Domyślnie tokeny użytkownika są przechowywane w LocalStorage przeglądarki. Po zamknięciu i ponownym otwarciu strony przeglądarki, jeśli token jest nadal ważny, użytkownik nie musi się ponownie logować.

Jeśli chcą Państwo, aby użytkownicy musieli logować się za każdym razem, gdy wchodzą na stronę, można ustawić zmienną środowiskową `API_CLIENT_STORAGE_TYPE=sessionStorage`, aby zapisać token użytkownika w SessionStorage przeglądarki.

### Polityka haseł

> Wersja Professional i wyższe

NocoBase wspiera ustawianie zasad dotyczących haseł oraz polityki blokowania po próbach logowania dla wszystkich użytkowników, aby zwiększyć bezpieczeństwo aplikacji NocoBase z włączonym logowaniem hasłem. Można zapoznać się z dokumentacją [Polityka haseł](./password-policy/index.md), aby zrozumieć każdy element konfiguracji.

#### Zasady dotyczące haseł

| Element konfiguracji                      | Opis                                                                                                           |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| **Długość hasła**                          | Minimalna wymagana długość hasła, maksymalna długość to 64.                                                    |
| **Złożoność hasła**                        | Ustawienie wymagań dotyczących złożoności hasła, czyli rodzajów znaków, które muszą być w nim zawarte.          |
| **Nie może zawierać nazwy użytkownika**    | Ustawienie, czy hasło może zawierać nazwę bieżącego użytkownika.                                               |
| **Pamiętaj historię haseł**                | Zapamiętuje liczbę ostatnio używanych haseł przez użytkownika. Użytkownik nie może ich ponownie użyć przy zmianie hasła. |

#### Konfiguracja wygasania haseł

| Element konfiguracji                               | Opis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Okres ważności hasła**                           | Okres ważności hasła użytkownika. Użytkownik musi zmienić hasło przed jego wygaśnięciem, aby okres ważności został ponownie obliczony. Jeśli hasło nie zostanie zmienione przed wygaśnięciem, logowanie starym hasłem będzie niemożliwe i będzie wymagało pomocy administratora w celu zresetowania.<br>Jeśli skonfigurowano inne metody logowania, użytkownik może z nich skorzystać. |
| **Kanał powiadomień o wygasaniu hasła**            | W ciągu 10 dni przed wygaśnięciem hasła użytkownika, przy każdym logowaniu wysyłane jest przypomnienie.                                                                                                                                                                                                                                                                                                                                                                                                                                             |

#### Bezpieczeństwo logowania hasłem

| Element konfiguracji                                       | Opis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Maksymalna liczba nieudanych prób logowania**            | Ustawia maksymalną liczbę prób logowania, jaką użytkownik może podjąć w określonym przedziale czasowym.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Przedział czasowy dla nieudanych prób logowania (s)**    | Ustawia przedział czasowy, w sekundach, do obliczania maksymalnej liczby nieudanych prób logowania użytkownika.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Czas blokady (s)**                                       | Ustawia czas, na jaki użytkownik zostanie zablokowany po przekroczeniu limitu nieudanych prób logowania (0 oznacza brak limitu).<br>W okresie blokady użytkownik nie będzie mógł uzyskać dostępu do systemu za pomocą żadnej metody uwierzytelniania, w tym kluczy API. |

Zazwyczaj zalecamy:

- Ustawienie silnych zasad dotyczących haseł, aby zmniejszyć ryzyko odgadnięcia hasła przez skojarzenia lub atak typu brute-force.
- Ustawienie rozsądnego okresu ważności hasła, aby zmusić użytkowników do regularnej zmiany haseł.
- Połączenie konfiguracji liczby nieudanych prób logowania i przedziału czasowego, aby ograniczyć próby logowania o wysokiej częstotliwości w krótkim czasie i zapobiec atakom typu brute-force.
- W scenariuszach o wysokich wymaganiach bezpieczeństwa można ustawić rozsądny czas blokady użytkownika po przekroczeniu limitu logowania. Należy jednak pamiętać, że ustawienie czasu blokady może być wykorzystane w złych celach. Atakujący mogą celowo wielokrotnie wprowadzać błędne hasło dla docelowych kont, zmuszając je do zablokowania i uniemożliwiając normalne użytkowanie. W praktyce można stosować środki takie jak ograniczenia IP, limity częstotliwości API, aby zapobiegać tego typu atakom.
- Zmianę domyślnej nazwy użytkownika, adresu e-mail i hasła dla użytkownika `root` w NocoBase, aby uniknąć złośliwego wykorzystania.
- Ponieważ zarówno wygaśnięcie hasła, jak i zablokowanie konta uniemożliwią dostęp do systemu (w tym dla kont administratorów), zaleca się utworzenie w systemie wielu kont z uprawnieniami do resetowania haseł i odblokowywania użytkowników.


![](https://static-docs.nocobase.com/202501031618900.png)


### Blokada użytkownika

> Wersja Professional i wyższe, zawarte we wtyczce polityki haseł

Zarządzanie użytkownikami, którzy zostali zablokowani z powodu przekroczenia limitu nieudanych prób logowania. Można ich aktywnie odblokować lub dodać nietypowych użytkowników do listy zablokowanych. Po zablokowaniu użytkownik nie będzie mógł uzyskać dostępu do systemu za pomocą żadnej metody uwierzytelniania, w tym kluczy API.


![](https://static-docs.nocobase.com/202501031618399.png)


### Klucze API

NocoBase wspiera wywoływanie API systemowych za pomocą kluczy API. Użytkownicy mogą dodawać klucze API w konfiguracji wtyczki Klucze API.

- Prosimy o przypisanie prawidłowej roli do klucza API i upewnienie się, że uprawnienia związane z tą rolą są poprawnie skonfigurowane.
- Podczas korzystania z kluczy API należy zapobiegać ich wyciekowi.
- Zazwyczaj zalecamy użytkownikom ustawienie okresu ważności dla kluczy API i unikanie opcji "Nigdy nie wygasa".
- Jeśli zostanie wykryte nietypowe użycie klucza API, co może wskazywać na ryzyko wycieku, użytkownik może usunąć odpowiedni klucz API, aby go unieważnić.


![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)


### Logowanie jednokrotne (SSO)

> Wtyczka komercyjna

NocoBase oferuje bogaty zestaw wtyczek do uwierzytelniania SSO, wspierających wiele popularnych protokołów, takich jak OIDC, SAML 2.0, LDAP i CAS. Jednocześnie NocoBase posiada kompletny zestaw interfejsów rozszerzeń metod uwierzytelniania, które umożliwiają szybki rozwój i integrację innych typów uwierzytelniania. Można łatwo połączyć istniejący IdP z NocoBase, aby centralnie zarządzać tożsamościami użytkowników w IdP i zwiększyć bezpieczeństwo.

![](https://static-docs.nocobase.com/202501031619427.png)


### Uwierzytelnianie dwuskładnikowe (Two-factor authentication)

> Wersja Enterprise

Uwierzytelnianie dwuskładnikowe wymaga od użytkowników podania drugiego, ważnego dowodu tożsamości podczas logowania hasłem, na przykład poprzez wysłanie jednorazowego dynamicznego kodu weryfikacyjnego na zaufane urządzenie użytkownika. Ma to na celu weryfikację tożsamości użytkownika, zapewnienie, że nie jest ona nadużywana, oraz zmniejszenie ryzyka związanego z wyciekiem hasła.

### Kontrola dostępu po IP

> Wersja Enterprise

NocoBase wspiera ustawianie czarnych lub białych list dla adresów IP, z których użytkownicy uzyskują dostęp.

- W środowiskach o rygorystycznych wymaganiach bezpieczeństwa można ustawić białą listę IP, aby zezwolić na dostęp do systemu tylko z określonych adresów IP lub zakresów IP. Ogranicza to nieautoryzowane połączenia z sieci zewnętrznych i zmniejsza ryzyko bezpieczeństwa u źródła.
- W warunkach publicznego dostępu do sieci, jeśli administrator zauważy nietypowy ruch, może ustawić czarną listę IP, aby zablokować znane złośliwe adresy IP lub dostęp z podejrzanych źródeł, co zmniejsza zagrożenia takie jak złośliwe skanowanie i ataki typu brute-force.
- Dla odrzuconych żądań dostępu prowadzone są zapisy w logach.

## Kontrola uprawnień

Poprzez ustawienie różnych ról w systemie oraz przypisanie im odpowiednich uprawnień, można precyzyjnie kontrolować dostęp użytkowników do zasobów. Administratorzy muszą rozsądnie konfigurować uprawnienia w zależności od potrzeb konkretnego scenariusza, aby zmniejszyć ryzyko wycieku zasobów systemowych.

### Użytkownik root

Podczas pierwszej instalacji NocoBase aplikacja inicjalizuje użytkownika `root`. Zaleca się, aby użytkownicy zmienili dane tego użytkownika, ustawiając zmienne środowiskowe systemu, aby uniknąć złośliwego wykorzystania.

- `INIT_ROOT_USERNAME` - nazwa użytkownika root
- `INIT_ROOT_EMAIL` - adres e-mail użytkownika root
- `INIT_ROOT_PASSWORD` - hasło użytkownika root, prosimy ustawić silne hasło.

Podczas dalszego korzystania z systemu zaleca się, aby użytkownicy tworzyli i używali innych kont administratorów, unikając bezpośredniego operowania na koncie `root`.

### Role i uprawnienia

NocoBase kontroluje dostęp użytkowników do zasobów poprzez ustawienie ról w systemie, nadawanie uprawnień różnym rolom i przypisywanie użytkowników do odpowiednich ról. Każdy użytkownik może mieć wiele ról i może przełączać się między nimi, aby operować na zasobach z różnych perspektyw. Jeśli zainstalowana jest wtyczka działów, można również powiązać role z działami, dzięki czemu użytkownicy mogą posiadać role przypisane do ich działów.


![](https://static-docs.nocobase.com/202501031620965.png)


### Uprawnienia do konfiguracji systemu

Uprawnienia do konfiguracji systemu obejmują następujące ustawienia:

- Czy zezwolić na dostęp do interfejsu konfiguracyjnego
- Czy zezwolić na instalowanie, włączanie i wyłączanie wtyczek
- Czy zezwolić na konfigurowanie wtyczek
- Czy zezwolić na czyszczenie pamięci podręcznej i restartowanie aplikacji
- Uprawnienia do konfiguracji poszczególnych wtyczek

### Uprawnienia do menu

Uprawnienia do menu służą do kontrolowania dostępu użytkowników do różnych stron menu, zarówno na komputerach stacjonarnych, jak i urządzeniach mobilnych.

![](https://static-docs.nocobase.com/202501031620717.png)


### Uprawnienia do danych

NocoBase zapewnia precyzyjną kontrolę nad uprawnieniami użytkowników do dostępu do danych w systemie, zapewniając, że różni użytkownicy mogą uzyskać dostęp tylko do danych związanych z ich obowiązkami, co zapobiega nadużyciom uprawnień i wyciekom danych.

#### Kontrola globalna


![](https://static-docs.nocobase.com/202501031620866.png)


#### Kontrola na poziomie tabeli i pola


![](https://static-docs.nocobase.com/202501031621047.png)


#### Kontrola zakresu danych

Ustawia zakres danych, na których użytkownicy mogą operować. Należy pamiętać, że zakres danych w tym miejscu różni się od zakresu danych skonfigurowanego w bloku. Zakres danych skonfigurowany w bloku jest zazwyczaj używany tylko do filtrowania danych po stronie front-endu. Jeśli potrzebna jest ścisła kontrola dostępu użytkowników do zasobów danych, należy ją skonfigurować tutaj, aby była kontrolowana przez serwer.


![](https://static-docs.nocobase.com/202501031621712.png)


## Bezpieczeństwo danych

Podczas przechowywania i tworzenia kopii zapasowych danych, NocoBase zapewnia skuteczne mechanizmy gwarantujące bezpieczeństwo danych.

### Przechowywanie haseł

Hasła użytkowników NocoBase są szyfrowane i przechowywane przy użyciu algorytmu scrypt, który skutecznie chroni przed atakami sprzętowymi na dużą skalę.

### Zmienne środowiskowe i klucze

Podczas korzystania z usług firm trzecich w NocoBase zalecamy konfigurowanie informacji o kluczach tych usług w zmiennych środowiskowych i przechowywanie ich w postaci zaszyfrowanej. Jest to wygodne do konfiguracji i użycia w różnych miejscach, a także zwiększa bezpieczeństwo. Szczegółowe instrukcje można znaleźć w dokumentacji.

:::warning
Domyślnie klucz jest szyfrowany przy użyciu algorytmu AES-256-CBC. NocoBase automatycznie wygeneruje 32-bitowy klucz szyfrujący i zapisze go w `storage/.data/environment/aes_key.dat`. Użytkownicy powinni odpowiednio chronić plik klucza, aby zapobiec jego kradzieży. W przypadku migracji danych plik klucza musi zostać przeniesiony razem z nimi.
:::


![](https://static-docs.nocobase.com/202501031622612.png)


### Przechowywanie plików

Jeśli istnieje potrzeba przechowywania wrażliwych plików, zaleca się korzystanie z usług przechowywania w chmurze zgodnych z protokołem S3 oraz użycie komercyjnej wtyczki `File storage: S3 (Pro)`, aby umożliwić prywatny odczyt i zapis plików. Jeśli konieczne jest użycie w środowisku sieci wewnętrznej, zaleca się stosowanie aplikacji do przechowywania, które wspierają wdrożenie prywatne i są zgodne z protokołem S3, takich jak MinIO.


![](https://static-docs.nocobase.com/202501031623549.png)


### Kopia zapasowa aplikacji

Aby zapewnić bezpieczeństwo danych aplikacji i uniknąć ich utraty, zalecamy regularne tworzenie kopii zapasowych bazy danych.

Użytkownicy wersji open-source mogą zapoznać się z artykułem https://www.nocobase.com/en/blog/nocobase-backup-restore, aby tworzyć kopie zapasowe za pomocą narzędzi bazodanowych. Zalecamy również odpowiednie przechowywanie plików kopii zapasowych, aby zapobiec wyciekowi danych.

Użytkownicy wersji Professional i wyższych mogą korzystać z menedżera kopii zapasowych. Menedżer ten oferuje następujące funkcje:

- Zaplanowane automatyczne kopie zapasowe: Okresowe automatyczne tworzenie kopii zapasowych oszczędza czas i pracę manualną, a bezpieczeństwo danych jest lepiej zapewnione.
- Synchronizacja plików kopii zapasowych z chmurą: Izolacja plików kopii zapasowych od samej usługi aplikacji zapobiega utracie plików kopii zapasowych w przypadku awarii serwera.
- Szyfrowanie plików kopii zapasowych: Ustawienie hasła dla plików kopii zapasowych zmniejsza ryzyko utraty danych w wyniku wycieku pliku kopii zapasowej.


![](https://static-docs.nocobase.com/202501031623107.png)


## Bezpieczeństwo środowiska uruchomieniowego

Prawidłowe wdrożenie NocoBase i zapewnienie bezpieczeństwa środowiska uruchomieniowego jest jednym z kluczy do zapewnienia bezpieczeństwa aplikacji NocoBase.

### Wdrożenie z HTTPS

Aby zapobiec atakom typu "man-in-the-middle", zalecamy dodanie certyfikatu SSL/TLS do witryny aplikacji NocoBase, aby zapewnić bezpieczeństwo danych podczas transmisji sieciowej.

### Szyfrowanie transportu API

> Wersja Enterprise

W środowiskach o bardziej rygorystycznych wymaganiach dotyczących bezpieczeństwa danych, NocoBase wspiera włączenie szyfrowania transportu API, aby szyfrować treść żądań i odpowiedzi API, unikać transmisji w postaci jawnego tekstu i zwiększyć próg trudności dla złamania danych.

### Wdrożenie prywatne

Domyślnie NocoBase nie musi komunikować się z usługami firm trzecich, a zespół NocoBase nie zbiera żadnych informacji o użytkownikach. Połączenie z serwerem NocoBase jest konieczne tylko podczas wykonywania następujących dwóch operacji:

1. Automatyczne pobieranie wtyczek komercyjnych za pośrednictwem platformy NocoBase Service.
2. Weryfikacja tożsamości online i aktywacja aplikacji w wersji komercyjnej.

Jeśli są Państwo gotowi poświęcić pewien stopień wygody, obie te operacje można również wykonać w trybie offline, bez bezpośredniego połączenia z serwerem NocoBase.

NocoBase wspiera pełne wdrożenie w sieci wewnętrznej, zapoznaj się z:

- https://www.nocobase.com/en/blog/load-docker-image
- [Przesyłanie wtyczek do katalogu wtyczek w celu instalacji i aktualizacji](/get-started/install-upgrade-plugins#wtyczki-zewnętrzne)

### Izolacja wielu środowisk

> Wersja Professional i wyższe

W praktyce zalecamy użytkownikom korporacyjnym izolowanie środowisk testowych i produkcyjnych, aby zapewnić bezpieczeństwo danych aplikacji i środowiska uruchomieniowego w środowisku produkcyjnym. Dzięki wtyczce do zarządzania migracją można przenosić dane aplikacji między różnymi środowiskami.


![](https://static-docs.nocobase.com/202501031627729.png)


## Audyt i monitorowanie

### Dzienniki audytu

> Wersja Enterprise

Funkcja dzienników audytu w NocoBase rejestruje działania użytkowników w systemie. Rejestrując kluczowe operacje i zachowania dostępowe użytkowników, administratorzy mogą:

- Sprawdzać informacje o dostępie użytkowników, takie jak adres IP, urządzenie i czas operacji, aby na czas wykrywać nietypowe zachowania.
- Śledzić historię operacji na zasobach danych w systemie.


![](https://static-docs.nocobase.com/202501031627719.png)



![](https://static-docs.nocobase.com/202501031627922.png)


### Dzienniki aplikacji

NocoBase oferuje wiele typów logów, aby pomóc użytkownikom zrozumieć stan działania systemu i rejestrować zachowania, co pozwala na szybkie identyfikowanie i lokalizowanie problemów systemowych, zapewniając bezpieczeństwo i kontrolę systemu z różnych perspektyw. Główne typy logów obejmują:

- Logi żądań: Logi żądań API, w tym odwiedzane adresy URL, metody HTTP, parametry żądania, czasy odpowiedzi i kody stanu.
- Logi systemowe: Rejestrują zdarzenia działania aplikacji, w tym uruchomienie usługi, zmiany konfiguracji, komunikaty o błędach i kluczowe operacje.
- Logi SQL: Rejestrują polecenia operacji na bazie danych i ich czasy wykonania, obejmując operacje takie jak zapytania, aktualizacje, wstawianie i usuwanie.
- Logi przepływów pracy: Logi wykonania przepływów pracy, w tym czas wykonania, informacje o działaniu i komunikaty o błędach.