# Katkı

- Kaynak kodunu kendi deponuza alın(fork)
- Kaynak kodunu değiştir
- Çekme isteği(pull request) gönderin
- CLA'yı imzalayın

## İndir 

```bash
# Aşağıdaki git adresini kendi deponuzla değiştirin
git clone https://github.com/nocobase/nocobase.git
cd nocobase
yarn install
```

## Geliştirme ve Test

```bash
# Uygulamayı kurun ve başlatın
yarn dev
# Tüm testleri çalıştır
yarn test
# Klasördeki tüm test dosyalarını çalıştırın
yarn test <dir>
# Tek bir test dosyası çalıştırın
yarn test <file>
```

## Belge önizlemesi

```bash
# Belgeleri başlat
yarn doc --lang=zh-CN
yarn doc --lang=en-US
yarn doc --lang=tr-TR
```

Belgeler docs dizinindedir ve Markdown sözdizimini takip eder

```bash
|- /docs/
  |- en-US
  |- tr-TR
  |- zh-CN
```

## Diğerleri

Daha fazla CLI talimatı için lütfen [NocoBase CLI bölümüne bakın](./development/nocobase-cli.md)
