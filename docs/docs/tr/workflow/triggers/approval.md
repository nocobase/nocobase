---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Onay

## Giriş

Onay, ilgili verilerin durumuna karar vermek için insan tarafından başlatılan ve insan tarafından işlenen özel bir süreç türüdür. Genellikle ofis otomasyonu veya diğer manuel karar alma süreçlerinin yönetiminde kullanılır. Örneğin, "izin talepleri", "masraf iadesi onayları" ve "hammadde tedarik onayları" gibi senaryolar için manuel iş akışları oluşturabilir ve yönetebilirsiniz.

Onay eklentisi, bu süreç için özel bir iş akışı türü (tetikleyici) olan "Onay (olay)" ve özel bir "Onay" düğümü sunar. NocoBase'in benzersiz özel koleksiyonları ve özel bloklarıyla birleştiğinde, çeşitli onay senaryolarını hızlı ve esnek bir şekilde oluşturabilir ve yönetebilirsiniz.

## İş Akışı Oluşturma

Bir iş akışı oluştururken, "Onay" türünü seçerek bir onay iş akışı oluşturabilirsiniz:

![审批触发器_创建审批流程](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Ardından, iş akışı yapılandırma arayüzünde tetikleyiciye tıklayarak daha fazla yapılandırma için bir açılır pencere açın.

## Tetikleyici Yapılandırması

### Koleksiyon Bağlama

NocoBase'in Onay eklentisi esneklik üzerine tasarlanmıştır ve herhangi bir özel koleksiyon ile kullanılabilir. Bu, onay yapılandırmasının veri modelini yeniden yapılandırmasına gerek olmadığı, bunun yerine mevcut bir koleksiyonu doğrudan yeniden kullanabileceği anlamına gelir. Bu nedenle, tetikleyici yapılandırmasına girdikten sonra, bu iş akışının hangi koleksiyonun verileri oluşturulduğunda veya güncellendiğinde tetikleneceğini belirlemek için öncelikle bir koleksiyon seçmeniz gerekir:

![审批触发器_触发器配置_选择数据表](https://static-docs.nocobase.com/8732b4419b1e28d2752b8f601132c82d.png)

Ardından, ilgili koleksiyon için veri oluşturma (veya düzenleme) formunda bu iş akışını gönder düğmesine bağlayın:

![发起审批_绑定工作流](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Bundan sonra, bir kullanıcı bu formu gönderdiğinde, ilgili onay iş akışı tetiklenecektir. Gönderilen veriler, ilgili koleksiyonda kaydedilmesinin yanı sıra, daha sonraki onaylayanların incelemesi ve kullanması için onay akışına da anlık görüntü olarak kaydedilir.

### Geri Çekme

Bir onay iş akışının başlatıcı tarafından geri çekilmesine izin veriliyorsa, başlatıcının arayüz yapılandırmasında "Geri Çek" düğmesini etkinleştirmeniz gerekir:

![审批触发器_触发器配置_允许撤回](https://static-docs.nocobase.com/20251029232544.png)

Etkinleştirildiğinde, bu iş akışı tarafından başlatılan bir onay, herhangi bir onaylayan tarafından işlenmeden önce başlatıcı tarafından geri çekilebilir. Ancak, sonraki herhangi bir onay düğümünde yapılandırılan bir onaylayan tarafından işlendikten sonra artık geri çekilemez.

:::info{title=İpucu}
Geri çekme düğmesini etkinleştirdikten veya sildikten sonra, tetikleyici yapılandırma açılır penceresinde değişikliklerin etkili olması için kaydet ve gönder düğmesine tıklamanız gerekir.
:::

### Onay Başlatma Form Arayüzü Yapılandırması

Son olarak, başlatıcının form arayüzünü yapılandırmanız gerekir. Bu arayüz, onay merkezi bloğundan başlatıldığında ve bir geri çekme işleminden sonra yeniden başlatıldığında gönderme işlemleri için kullanılacaktır. Açılır pencereyi açmak için yapılandır düğmesine tıklayın:

![审批触发器_触发器配置_发起人表单](https://static-docs.nocobase.com/ca8b7e362d912138cf7d73bb60b37ac1.png)

Başlatıcının arayüzüne, bağlı koleksiyona dayalı bir doldurma formu veya ipuçları ve rehberlik için açıklayıcı metin (Markdown) ekleyebilirsiniz. Formun eklenmesi zorunludur; aksi takdirde, başlatıcı bu arayüze girdikten sonra herhangi bir işlem yapamayacaktır.

Bir form bloğu ekledikten sonra, normal bir form yapılandırma arayüzünde olduğu gibi, ilgili koleksiyonun alan bileşenlerini ekleyebilir ve formda doldurulması gereken içeriği düzenlemek için bunları istediğiniz gibi sıralayabilirsiniz:

![审批触发器_触发器配置_发起人表单_字段配置](https://static-docs.nocobase.com/5a1e7f9c9d8de092c7b55585dad7d633.png)

Doğrudan gönder düğmesinden farklı olarak, geçici depolama sürecini desteklemek için bir "Taslak Olarak Kaydet" eylem düğmesi de ekleyebilirsiniz:

![审批触发器_触发器配置_发起人表单_操作配置](https://static-docs.nocobase.com/2f4850d2078e94538995a9df70d3d2d1.png)

## Onay Düğümü

Bir onay iş akışında, onaylayanların başlatılan onayı işlemesi (onaylama, reddetme veya geri gönderme) için operasyonel mantığı yapılandırmak üzere özel "Onay" düğümünü kullanmanız gerekir. "Onay" düğümü yalnızca onay iş akışlarında kullanılabilir. Ayrıntılar için [Onay Düğümü](../nodes/approval.md) bölümüne bakın.

## Onay Başlatma Yapılandırması

Bir onay iş akışını yapılandırıp etkinleştirdikten sonra, kullanıcıların gönderim sırasında onay başlatabilmesi için ilgili koleksiyonun form gönder düğmesine bağlayabilirsiniz:

![发起审批_绑定工作流](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

İş akışını bağladıktan sonra, bir kullanıcı mevcut formu gönderdiğinde, bir onay başlatılır.

:::info{title=İpucu}
Onay başlatma düğmesi şu anda yalnızca yeni oluşturma veya güncelleme formlarındaki "Gönder" (veya "Kaydet") düğmesini desteklemektedir. "İş akışına gönder" düğmesini desteklemez (bu düğme yalnızca "Eylem sonrası olay"a bağlanabilir).
:::

## Yapılacaklar Merkezi

Yapılacaklar Merkezi, kullanıcıların bekleyen görevlerini görüntülemesi ve işlemesi için birleşik bir giriş noktası sağlar. Mevcut kullanıcı tarafından başlatılan onaylara ve bekleyen görevlere üst araç çubuğundaki Yapılacaklar Merkezi aracılığıyla erişilebilir ve farklı türdeki bekleyen görevler sol taraftaki kategori navigasyonu aracılığıyla görüntülenebilir.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Başlattıklarım

#### Başlatılan Onayları Görüntüleme

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Doğrudan Yeni Bir Onay Başlatma

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Yapılacaklarım

#### Yapılacaklar Listesi

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Yapılacaklar Detayları

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### Başlatıcı

#### Koleksiyondan Başlatma

Bir veri bloğundan başlatmak için, aşağıdaki gibi bir çağrı yapabilirsiniz (`posts` koleksiyonunun oluştur düğmesini örnek alarak):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Burada, URL parametresi `triggerWorkflows`, iş akışının anahtarıdır; birden fazla iş akışı anahtarı virgülle ayrılır. Bu anahtar, iş akışı tuvalinin üst kısmındaki iş akışı adının üzerine fareyle gelindiğinde elde edilebilir:

![工作流_key_查看方式](https://static-docs.nocobase.com/20240426135108.png)

Başarılı bir çağrıdan sonra, ilgili `posts` koleksiyonu için onay iş akışı tetiklenecektir.

:::info{title="İpucu"}
Harici çağrıların da kullanıcı kimliğine dayanması gerektiğinden, HTTP API aracılığıyla çağrı yaparken, normal arayüzden gönderilen isteklerle aynı şekilde, kimlik doğrulama bilgileri sağlanmalıdır. Buna `Authorization` istek başlığı veya `token` parametresi (giriş yapıldığında elde edilen token) ve `X-Role` istek başlığı (kullanıcının mevcut rol adı) dahildir.
:::

Bu eylemde bire bir ilişkili veriler için bir olayı tetiklemeniz gerekiyorsa (bire çok henüz desteklenmemektedir), ilişki alanı için tetikleyici veriyi belirtmek üzere parametrede `!` kullanabilirsiniz:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post.",
    "category": {
      "title": "Test category"
    }
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey!category"
```

Yukarıdaki çağrı başarılı olduğunda, ilgili `categories` koleksiyonu için onay olayı tetiklenecektir.

:::info{title="İpucu"}
HTTP API aracılığıyla bir eylem sonrası olayı tetiklerken, iş akışının etkinleştirme durumuna ve koleksiyon yapılandırmasının eşleşip eşleşmediğine de dikkat etmeniz gerekir; aksi takdirde çağrı başarılı olmayabilir veya bir hata oluşabilir.
:::

#### Onay Merkezinden Başlatma

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "collectionName": "<collection name>",
    "workflowId": <workflow id>,
    "data": { "<field>": "<value>" },
    "status": <initial approval status>,
  }'
  "http://localhost:3000/api/approvals:create"
```

**Parametreler**

*   `collectionName`: Onay başlatılacak hedef koleksiyonun adı. Zorunlu.
*   `workflowId`: Onay başlatmak için kullanılan iş akışı ID'si. Zorunlu.
*   `data`: Onay başlatılırken oluşturulan koleksiyon kaydının alanları. Zorunlu.
*   `status`: Onay başlatılırken oluşturulan kaydın durumu. Zorunlu. Olası değerler şunlardır:
    *   `0`: Taslak, onay için gönderilmeden kaydedildiğini belirtir.
    *   `1`: Onay için gönder, başlatıcının onay talebini gönderdiğini ve onay sürecine girdiğini belirtir.

#### Kaydetme ve Gönderme

Başlatılan (veya geri çekilen) bir onay taslak durumundayken, aşağıdaki API aracılığıyla tekrar kaydedebilir veya gönderebilirsiniz:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### Başlatılan Onayların Listesini Alma

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Geri Çekme

Başlatıcı, şu anda onayda olan bir kaydı aşağıdaki API aracılığıyla geri çekebilir:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Parametreler**

*   `<approval id>`: Geri çekilecek onay kaydının ID'si. Zorunlu.

### Onaylayan

Onay iş akışı bir onay düğümüne girdikten sonra, mevcut onaylayan için bir yapılacaklar görevi oluşturulur. Onaylayan, onay görevini arayüz üzerinden veya HTTP API çağrısı yaparak tamamlayabilir.

#### Onay İşlem Kayıtlarını Alma

Yapılacaklar görevleri, onay işlem kayıtlarıdır. Mevcut kullanıcının tüm onay işlem kayıtlarını aşağıdaki API aracılığıyla alabilirsiniz:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Burada, `approvalRecords` bir koleksiyon kaynağı olarak, `filter`, `sort`, `pageSize` ve `page` gibi genel sorgu koşullarını da kullanabilir.

#### Tek Bir Onay İşlem Kaydını Alma

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<record id>"
```

#### Onaylama ve Reddetme

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "status": 2,
    "comment": "Looks good to me.",
    "data": { "<field to modify>": "<value>" }
  }'
  "http://localhost:3000/api/approvalRecords:submit/<record id>"
```

**Parametreler**

*   `<record id>`: Onaylanacak kaydın ID'si. Zorunlu.
*   `status`: Onay işleminin durumunu belirten alan. `2` "Onaylandı", `-1` "Reddedildi" anlamına gelir. Zorunlu.
*   `comment`: Onay işlemi için notlar. İsteğe bağlı.
*   `data`: Onaylandıktan sonra mevcut onay düğümündeki koleksiyon kaydında yapılacak değişiklikleri belirtir. İsteğe bağlı (yalnızca onaylandığında geçerlidir).

#### Geri Gönderme <Badge>v1.9.0+</Badge>

v1.9.0 sürümünden önce, geri gönderme işlemi "Onaylama" ve "Reddetme" ile aynı API'yi kullanıyordu; `"status": 1` geri göndermeyi temsil ediyordu.

v1.9.0 sürümünden itibaren, geri gönderme için ayrı bir API bulunmaktadır:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Parametreler**

*   `<record id>`: Onaylanacak kaydın ID'si. Zorunlu.
*   `returnToNodeKey`: Geri dönülecek hedef düğüm anahtarı. İsteğe bağlı. Düğümde geri dönülebilir düğüm aralığı yapılandırıldığında, bu parametre hangi düğüme geri dönüleceğini belirtmek için kullanılabilir. Yapılandırılmadığında, bu parametrenin değeri geçirilmesine gerek yoktur ve varsayılan olarak başlangıç noktasına geri dönülür, böylece başlatıcı tarafından yeniden gönderilir.

#### Devretme

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Parametreler**

*   `<record id>`: Onaylanacak kaydın ID'si. Zorunlu.
*   `assignee`: Devredilecek kullanıcının ID'si. Zorunlu.

#### Ek İmza Ekleme

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**Parametreler**

*   `<record id>`: Onaylanacak kaydın ID'si. Zorunlu.
*   `assignees`: Ek imza atacak kullanıcı ID'lerinin listesi. Zorunlu.
*   `order`: Ek imzanın sırası. `-1` "ben"den önce, `1` "ben"den sonra anlamına gelir.