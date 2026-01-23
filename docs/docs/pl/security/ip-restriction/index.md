---
pkg: "@nocobase/plugin-ip-restriction"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::



pkg: '@nocobase/plugin-ip-restriction'
---

# Ograniczenia IP

## Wprowadzenie

NocoBase umożliwia administratorom konfigurowanie białych i czarnych list adresów IP użytkowników. Dzięki temu mogą Państwo ograniczyć nieautoryzowane połączenia z sieci zewnętrznych lub zablokować znane złośliwe adresy IP, co znacząco obniża ryzyko bezpieczeństwa. System wspiera również administratorów w przeglądaniu logów odmowy dostępu, co pomaga w identyfikacji potencjalnie niebezpiecznych adresów IP.

## Konfiguracja reguł

![2025-01-23-10-07-34-20250123100733](https://static-docs.nocobase.com/2025-01-23-10-07-34-20250123100733.png)

### Tryby filtrowania IP

- **Czarna lista**: Jeśli adres IP użytkownika pasuje do adresu znajdującego się na liście, system **odmówi** mu dostępu. Adresy IP, które nie są na liście, są domyślnie **dozwolone**.
- **Biała lista**: Jeśli adres IP użytkownika pasuje do adresu znajdującego się na liście, system **zezwoli** mu na dostęp. Adresy IP, które nie są na liście, są domyślnie **zabronione**.

### Lista IP

Służy do definiowania adresów IP, które mają mieć dozwolony lub zabroniony dostęp do systemu. Jego konkretne działanie zależy od wybranego trybu filtrowania IP. Mogą Państwo wprowadzać pojedyncze adresy IP lub całe segmenty sieci CIDR. Wiele adresów należy oddzielić przecinkami lub znakami nowej linii.

## Przeglądanie logów

Gdy użytkownikowi zostanie odmówiony dostęp, jego adres IP zostanie zapisany w logach systemowych. Mogą Państwo pobrać odpowiedni plik logu w celu dalszej analizy.

![2025-01-17-13-33-51-20250117133351](https://static-docs.nocobase.com/2025-01-17-13-33-51-20250117133351.png)

Przykład logu:

![2025-01-14-14-42-06-20250114144205](https://static-docs.nocobase.com/2025-01-14-14-42-06-20250114144205.png)

## Zalecenia konfiguracyjne

### Zalecenia dla trybu czarnej listy

- Dodawaj znane złośliwe adresy IP, aby zapobiegać potencjalnym atakom sieciowym.
- Regularnie sprawdzaj i aktualizuj czarną listę, usuwając nieprawidłowe lub już niepotrzebne adresy IP.

### Zalecenia dla trybu białej listy

- Dodawaj zaufane adresy IP sieci wewnętrznych (np. segmenty sieci biurowej), aby zapewnić bezpieczny dostęp do kluczowych systemów.
- Unikaj umieszczania dynamicznie przydzielanych adresów IP na białej liście, aby zapobiec przerwom w dostępie.

### Ogólne zalecenia

- Używaj segmentów sieci CIDR, aby uprościć konfigurację, na przykład stosując 192.168.0.0/24 zamiast dodawania pojedynczych adresów IP.
- Regularnie twórz kopie zapasowe konfiguracji listy IP, aby móc szybko przywrócić ustawienia w przypadku błędów lub awarii systemu.
- Regularnie monitoruj logi dostępu, aby identyfikować nietypowe adresy IP i na bieżąco dostosowywać czarną lub białą listę.