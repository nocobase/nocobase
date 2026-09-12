# Bab 9: Dashboard Tugas dan Chart

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113821700067176&bvid=BV1XVcUeHEDR&cid=27851621217&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Teman-teman, akhirnya kita masuk ke bab visualisasi yang sudah lama kita nantikan! Pada bab ini, kita akan membahas bagaimana dengan cepat fokus pada konten yang benar-benar kita butuhkan di antara informasi yang rumit. Sebagai manajer, kita tidak bisa tersesat dalam tugas-tugas yang kompleks! Mari kita bersama-sama menyelesaikan statistik tugas dan tampilan informasi dengan mudah.

### 9.1 Fokus pada Informasi Kunci

Kita berharap dapat dengan mudah melihat situasi tugas tim sekilas, menemukan tugas yang menjadi tanggung jawab atau yang kita perhatikan, daripada berkeliaran dalam informasi yang membosankan.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200001054.gif)

Pertama, mari kita lihat bagaimana membuat satu [chart](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block) statistik tugas tim.

#### 9.1.1 Membuat [Block Data Chart](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block)

Buat satu halaman baru (misalnya panel pribadi):

1. Buat Block data chart baru. (Perhatikan dalam Block besar ini, kita dapat membuat banyak chart data)
2. Pada Block chart, pilih target kita: tabel tugas. Mari masuk ke konfigurasi chart bersama-sama.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200001737.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200002850.png)

#### 9.1.2 Mengonfigurasi Statistik Status

Jika kita ingin menghitung jumlah tugas dengan status yang berbeda, bagaimana melakukannya? Pertama, kita perlu menangani data:

- Measures: Pilih satu field unik, contohnya field ID untuk count.
- Dimensions: Gunakan status untuk grouping.

Selanjutnya, lakukan konfigurasi chart:

1. Pilih [column chart](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/column) atau [bar chart](https://docs-cn.nocobase.com/handbook/data-visualization/antd-charts/bar).
2. Sumbu X pilih status, sumbu Y pilih ID. Ingat memilih field klasifikasi "Status"! (Jika tidak dipilih, warna chart tidak dapat dibedakan, mungkin tidak mudah dikenali.)

   ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200002203.gif)

#### 9.1.3 Statistik Multi-dimensi: Jumlah Tugas Per Orang

Jika kita ingin menghitung jumlah setiap status setiap orang, mari lakukan statistik dual-dimensi! Kita dapat menambahkan dimensi "Penanggung Jawab/Nickname".

1. Klik "Eksekusi Query" di pojok kiri atas.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200003904.png)

2. Anda akan menemukan chart mungkin agak aneh, sepertinya bukan efek yang diinginkan. Tidak masalah, pilih "Group" untuk membuka perbandingan penanggung jawab yang berbeda.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200003355.gif)

3. Sekaligus, jika ingin menampilkan jumlah keseluruhan secara stacked, dapat memilih "Stack". Dengan demikian, kita dapat melihat proporsi jumlah tugas setiap orang + situasi tugas keseluruhan!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200004277.gif)

### 9.2 Filter Data dan Tampilan Dinamis

#### 9.2.1 Konfigurasi Filter Data

Tentu saja, kita masih dapat lebih lanjut menghapus data "Dibatalkan" dan "Diarsipkan", cukup hapus dua opsi ini di kondisi filter di sebelah kiri, saya yakin Anda sudah sangat familiar dengan penilaian kondisi ini!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200004306.png)

Setelah filter, klik konfirmasi, keluar dari konfigurasi, chart pertama kita di halaman sudah dibuat.

#### 9.2.2 [Duplikasi Chart](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block#%E5%8C%BA%E5%9D%97%E8%AE%BE%E7%BD%AE)

Jika Anda ingin menampilkan chart "Group" dan "Stack" sekaligus, dan tidak ingin konfigurasi ulang, bagaimana?

- Kita di pojok kanan atas Block chart pertama, klik duplikasi
- Geser scroll ke bawah, chart kedua sudah muncul, drag ke sebelah kanan, hapus konfigurasi "Stack", ubah menjadi "Group".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200005923.png)

#### 9.2.3 [Filter](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter) Dinamis

Jika kita ingin secara dinamis [filter](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter) data tugas pada kondisi yang berbeda, dapatkah dilakukan?

Tentu saja! Kita di bawah Block data chart, buka "Filter", di bagian atas sudah muncul kotak filter, kita tampilkan field yang diinginkan, dan atur kondisi filter field. (Misalnya ubah field tanggal menjadi "Antara")

![202412200005784.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200005784.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200006733.gif)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200006599.gif)

#### 9.2.4 Membuat Field Filter Kustom

Jika kita masih ingin pada situasi khusus, mencakup data "Dibatalkan" dan "Diarsipkan" bagaimana, dan harus mendukung filter dinamis, mengatur kondisi filter default?

Mari bersama membuat satu [field filter kustom](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%AD%97%E6%AE%B5)!

> Field Filter Kustom: Anda dapat memilih field di tabel data terkait atau field kustom (hanya tersedia pada chart).
>
> Mendukung edit judul field, deskripsi, operator filter, dan mengatur nilai default (seperti pengguna saat ini atau tanggal), agar filter lebih sesuai dengan kebutuhan aktual Anda.

1. Judul isi "Status".
2. Field sumber kosongkan.
3. Komponen pilih "Checkbox".
4. Opsi diisi sesuai nilai atribut status saat membuat database baru (perhatikan urutan atribut di sini adalah Label Opsi - Nilai Opsi).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200007629.gif)

Pembuatan berhasil, klik "Atur Nilai Default", pilih opsi yang kita butuhkan

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200007565.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008813.gif)

Setelah mengatur nilai default, kembali ke konfigurasi chart, ubah kondisi filter menjadi "Status - Mengandung Salah Satu - Filter Saat Ini/Status", lalu konfirmasi! (Kedua chart harus diubah)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008453.png)

Selesai, kita uji filter, data sudah sempurna ditampilkan.

![202411162003151731758595.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008517.png)

### 9.3 Link Dinamis dan Filter Tugas

Selanjutnya, kita akan mengimplementasikan fitur yang sangat praktis: melalui klik angka statistik, langsung melompat ke filter tugas yang sesuai. Untuk itu, kita pertama menambahkan chart statistik jumlah setiap status, letakkan di paling atas.

#### 9.3.1 Contoh "Belum Dimulai", Membuat [Statistic Chart](https://docs-cn.nocobase.com/handbook/data-visualization/antd/statistic)

1. Atur measures sebagai: Count ID
2. Atur kondisi filter: Status sama dengan "Belum Dimulai"
3. Nama container isi "Belum Dimulai", tipe pilih "Statistic", nama chart di bawah dikosongkan.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200009179.png)

Statistik belum dimulai sudah berhasil ditampilkan. Mari duplikasi lima copy berdasarkan status, dan drag ke paling atas

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200009609.png)

#### 9.3.2 Mengonfigurasi Filter Link

1. Kembali ke halaman tempat Block tabel manajemen tugas berada, lihat format link di bagian atas browser (biasanya mirip dengan `http://xxxxxxxxx/admin/0z9e0um1vcn`).
   ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200011236.png)

   Anggap `xxxxxxxxx` di sini adalah domain situs Anda, `/admin/0z9e0um1vcn` adalah path. (Kita cari /admin terakhir saja)
2. Salin sebagian link

   - Kita perlu melakukan jump link. Untuk melakukan ini, pertama harus mengekstrak satu bagian tertentu dari link.
   - Mulai dari `admin/` (perhatikan jangan termasuk karakter `admin/` itu sendiri), salin sampai akhir link. Misalnya, dalam contoh ini, bagian yang perlu kita salin adalah: `0z9e0um1vcn`

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200015179.png)

Kita arahkan mouse ke "Belum Dimulai", akan ditemukan mouse sudah berubah menjadi bentuk jari, kita klik, jump berhasil.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200016385.gif)

3. Konfigurasi link chart
   Sekarang, mari tambahkan satu parameter filter untuk link. Masih ingat identifier database status tugas? Kita perlu menambahkan parameter ini di akhir link, melakukan ini dapat lebih lanjut memfilter tugas.
   - Tambahkan `?task_status=Not started` di akhir link, dengan demikian link Anda akan menjadi: `0z9e0um1vcn?task_status=Not started`
     ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200021168.png)

> Memahami format passing parameter URL:
> Saat menambahkan parameter di link, ada beberapa aturan format yang perlu diikuti:
>
> - **Tanda Tanya (?)**: Mulai parameter.
> - **Nama Parameter dan Nilai Parameter**: Format adalah `nama_parameter=nilai_parameter`.
> - **Beberapa Parameter**: Jika perlu menambahkan beberapa parameter, dapat dihubungkan dengan simbol `&`, contohnya:
>   `http://xxxxxxxxx/admin/hliu6s5tp9x?status=todo&user=123`
>   Dalam contoh ini, `user` adalah nama parameter lain, `123` adalah nilai yang sesuai.

4. Kembali ke halaman, klik jump, berhasil, URL sudah membawa parameter yang kita inginkan

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200034337.png)

#### 9.3.3 [Mengaitkan Kondisi Filter URL](https://docs-cn.nocobase.com/handbook/ui/variables#url-%E6%9F%A5%E8%AF%A2%E5%8F%82%E6%95%B0)

Mengapa tabel masih belum berubah mengikuti? Jangan khawatir, mari selesaikan langkah terakhir!

- Kembali ke konfigurasi Block tabel, klik "Atur Data Scope".
- Pilih "Status" sama dengan "Parameter Query URL/status".

Klik konfirmasi, filter berhasil!

![2c588303ad88561cd072852ae0e93ab3.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200035431.png)
![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200035362.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200036841.png)

![202411162111151731762675.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200036320.png)

### 9.4 [Visualisasi Data](https://docs-cn.nocobase.com/handbook/data-visualization): Chart Keren

> Visualisasi Data: [ECharts](https://docs-cn.nocobase.com/handbook/data-visualization-echarts) (Plugin komersial, berbayar)
> ECharts menyediakan lebih banyak, lebih personal item konfigurasi, seperti "[Line Chart](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/line) (Multi-dimensi)", "[Radar Chart](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/radar)", "[Word Cloud](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/wordcloud)"...

Jika Anda ingin mendapatkan lebih banyak konfigurasi chart, dapat mengaktifkan Block "Visualisasi Data: ECharts"!

#### 9.4.1 Konfigurasi Cepat Satu [Radar Chart](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/radar) Keren

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037284.png)

Jika ditemukan data tertutup, ingat untuk menyesuaikan ukuran atau radius, memastikan semua informasi dapat ditampilkan dengan jelas!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037077.png)

![202411162121201731763280.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037464.png)

Setelah dikonfigurasi, drag cara tampilan, selesai!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200038221.gif)

#### 9.4.2 Lebih Banyak Container Chart

Di sini ada lebih banyak chart menunggu Anda jelajahi.

##### [Word Cloud](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/wordcloud)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200038880.gif)

##### [Funnel Chart](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/funnel)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039012.gif)

##### [Berbagai Indikator (Dual Axis Chart, Echarts Line Chart)](https://docs-cn.nocobase.com/handbook/data-visualization/antd-charts/dual-axes)

Untuk dual axis chart Anda dapat menambahkan lebih banyak indikator

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039494.gif)

##### [Comparison Bar Chart](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/diverging-bar)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039203.gif)

### 9.5 Tantangan Kecil

Sebelum kita mengakhiri bab ini, mari merilis tantangan kecil:

1. Tambahkan parameter URL untuk **Sedang Berjalan, Menunggu Review, Selesai, Dibatalkan, Diarsipkan** lainnya, agar mereka dapat melompat dan memfilter dengan lancar.
2. Konfigurasi field multi-pilih "Penanggung Jawab", seperti yang kita selesaikan untuk multi-pilih "Status", nilai default diatur sebagai nickname pengguna saat ini.

[Bab berikutnya](https://www.nocobase.com/cn/tutorials/project-tutorial-task-dashboard-part-2) kita akan terus menjelajahi episode dashboard berikutnya, menantikan pertemuan berikutnya dengan Anda!

---

Lanjutkan menjelajah, salurkan kreativitas Anda! Jika menemui masalah, jangan lupa kapan saja Anda dapat mengakses [Dokumentasi Resmi NocoBase](https://docs-cn.nocobase.com/) atau bergabung dengan [Komunitas NocoBase](https://forum.nocobase.com/) untuk berdiskusi.
