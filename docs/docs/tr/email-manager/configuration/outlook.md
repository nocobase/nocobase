---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Microsoft Yapılandırması

### Ön Koşullar
Kullanıcıların Outlook e-posta kutularını NocoBase'e bağlayabilmeleri için, NocoBase'i Microsoft hizmetlerine erişebilen bir sunucuya kurmalısınız. Arka uç, Microsoft API'lerini çağıracaktır.

### Hesap Kaydı

1. https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account adresine gidin.
    
2. Microsoft hesabınıza giriş yapın.
    
![](https://static-docs.nocobase.com/mail-1733818625779.png)

### Kiracı Oluşturma

1. https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount adresine gidin ve hesabınıza giriş yapın.
    
2. Temel bilgileri doldurun ve doğrulama kodunu alın.

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. Diğer bilgileri doldurun ve devam edin.

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. Kredi kartı bilgilerinizi doldurun (şimdilik bu adımı atlayabilirsiniz).

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### İstemci Kimliği (Client ID) Alma

1. Üst menüye tıklayın ve "Microsoft Entra ID" seçeneğini belirleyin.

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. Soldaki "App registrations" (Uygulama Kayıtları) seçeneğini belirleyin.

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. Üst kısımdaki "New registration" (Yeni Kayıt) düğmesine tıklayın.

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. Bilgileri doldurun ve gönderin.

Adı istediğiniz gibi olabilir. Hesap türleri için aşağıdaki görselde gösterilen seçeneği belirleyin. Yönlendirme URI'sini (Redirect URI) şimdilik boş bırakabilirsiniz.

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. İstemci Kimliğini (Client ID) alın.

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### API Yetkilendirmesi

1. Soldaki "API permissions" (API İzinleri) menüsünü açın.

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. "Add a permission" (İzin Ekle) düğmesine tıklayın.

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. "Microsoft Graph" seçeneğine tıklayın.

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. Aşağıdaki izinleri arayın ve ekleyin. Nihai sonuç aşağıdaki görselde gösterildiği gibi olmalıdır.
    
    1. `"email"`
    2. `"offline_access"`
    3. `"IMAP.AccessAsUser.All"`
    4. `"SMTP.Send"`
    5. `"offline_access"`
    6. `"User.Read"` (Varsayılan olarak)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### Gizli Anahtar (Secret) Alma

1. Soldaki "Certificates & secrets" (Sertifikalar ve Gizli Anahtarlar) seçeneğine tıklayın.

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. "New client secret" (Yeni istemci gizli anahtarı) düğmesine tıklayın.

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. Açıklamayı ve son kullanma süresini doldurun, ardından Ekle'ye tıklayın.

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. Gizli Anahtar Kimliğini (Secret ID) alın.

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. İstemci Kimliğini (Client ID) ve İstemci Gizli Anahtarını (Client secret) kopyalayın ve e-posta yapılandırma sayfasına yapıştırın.

![](https://static-docs.nocobase.com/mail-1733818630710.png)