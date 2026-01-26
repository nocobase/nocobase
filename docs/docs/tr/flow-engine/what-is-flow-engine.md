:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# FlowEngine Nedir?

FlowEngine, NocoBase 2.0 ile sunulan yepyeni bir ön uç kodsuz/düşük kodlu geliştirme motorudur. Model'leri ve Flow'ları bir araya getirerek ön uç mantığını basitleştirir, yeniden kullanılabilirliği ve sürdürülebilirliği artırır. Aynı zamanda, Flow'ların yapılandırılabilirliğinden faydalanarak ön uç bileşenlerine ve iş mantığına kodsuz yapılandırma ve düzenleme yetenekleri kazandırır.

## Neden FlowEngine Adını Aldı?

Çünkü FlowEngine'de, bir bileşenin özellikleri ve mantığı artık statik olarak tanımlanmaz; bunun yerine **Flow'lar** aracılığıyla yönlendirilir ve yönetilir.

*   **Flow**, bir veri akışı gibi, mantığı sıralı adımlara (Step) ayırır ve bu adımları bileşene aşamalı olarak uygular.
*   **Engine** ise, bunun ön uç mantığını ve etkileşimlerini yönlendiren bir motor olduğunu ifade eder.

Bu nedenle, **FlowEngine = Flow'lar tarafından yönlendirilen bir ön uç mantık motoru** anlamına gelir.

## Model Nedir?

FlowEngine'de Model, bir bileşenin soyut modelidir ve şu görevlerden sorumludur:

*   Bileşenin **özelliklerini (Props) ve durumunu** yönetmek;
*   Bileşenin **oluşturma (rendering) yöntemini** tanımlamak;
*   **Flow'ları** barındırmak ve yürütmek;
*   **Olay dağıtımını** ve **yaşam döngülerini** tek tip bir şekilde ele almak.

Başka bir deyişle, **Model bir bileşenin mantıksal beynidir**; bileşeni statik bir birimden yapılandırılabilir ve düzenlenebilir dinamik bir birime dönüştürür.

## Flow Nedir?

FlowEngine'de **Flow, bir Model'e hizmet eden bir mantık akışıdır**.
Amacı şunlardır:

*   Özellik veya olay mantığını adımlara (Step) ayırmak ve bunları bir akış içinde sıralı olarak yürütmek;
*   Özellik değişikliklerini ve olay yanıtlarını yönetmek;
*   Mantığı **dinamik, yapılandırılabilir ve yeniden kullanılabilir** hale getirmek.

## Bu Kavramları Nasıl Anlamalıyız?

**Flow'u** bir **su akışı** olarak hayal edebilirsiniz:

*   **Step, su akışının geçtiği bir düğüm gibidir**
    Her Step küçük bir görevi üstlenir (örneğin, bir özellik ayarlamak, bir olayı tetiklemek, bir API çağırmak), tıpkı su akışının bir kapaktan veya su çarkından geçerken ilgili bir etki yaratması gibi.

*   **Flow'lar sıralıdır**
    Bir su akışı, önceden belirlenmiş bir yolda yukarıdan aşağıya doğru ilerler ve tüm Step'lerden sırayla geçer; benzer şekilde, bir Flow'daki mantık da tanımlanan sıraya göre yürütülür.

*   **Flow'lar dallanabilir ve birleştirilebilir**
    Bir su akışı birden fazla küçük akışa ayrılabilir veya bir araya gelebilir; Flow da birden fazla alt akışa bölünebilir veya daha karmaşık mantıksal zincirler halinde birleştirilebilir.

*   **Flow'lar yapılandırılabilir ve kontrol edilebilir**
    Bir su akışının yönü ve hacmi bir su kapağı ile ayarlanabilir; bir Flow'un yürütme yöntemi ve parametreleri de yapılandırma (stepParams) aracılığıyla kontrol edilebilir.

Benzetme Özeti

*   Bir **bileşen**, dönmesi için bir su akışına ihtiyaç duyan bir su çarkı gibidir.
*   Bir **Model** ise bu su çarkının tabanı ve kontrolörüdür; su akışını almaktan ve çalışmasını sağlamaktan sorumludur.
*   Bir **Flow** da o su akışıdır; her Step'ten sırayla geçerek bileşeni sürekli değişmeye ve yanıt vermeye iter.

Dolayısıyla, FlowEngine'de:

*   **Flow'lar, mantığın bir su akışı gibi doğal bir şekilde akmasını sağlar**;
*   **Model'ler ise bileşenlerin bu akışın taşıyıcıları ve yürütücüleri olmasını sağlar**.