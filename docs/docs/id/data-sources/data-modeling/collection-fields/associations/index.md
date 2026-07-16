---
title: "Field Relasi"
description: "Field relasi membangun koneksi antar Collection, mendukung One to One, One to Many, Many to One, Many to Many, tanpa perlu field aktual untuk penyimpanan."
keywords: "field relasi,BelongsTo,HasMany,O2O,O2M,M2O,M2M,field terkait,NocoBase"
---

# Field Relasi

Di NocoBase, field relasi bukanlah field aktual, melainkan digunakan untuk membangun koneksi antar Collection. Konsep ini setara dengan relasi pada database relasional.

Dalam database relasional, jenis relasi yang umum terutama meliputi:

- [One to One (O2O)](./o2o/index.md): Setiap entitas dalam dua Collection hanya dapat berkorespondensi dengan satu entitas dalam Collection lain. Relasi ini biasanya digunakan untuk menyimpan aspek berbeda dari suatu entitas dalam Collection berbeda, untuk mengurangi redundansi dan meningkatkan konsistensi data.
- [One to Many (O2M)](./o2m/index.md): Setiap entitas dalam suatu Collection dapat terhubung ke beberapa entitas dalam Collection lain. Ini adalah salah satu jenis relasi yang paling umum, contohnya, seorang penulis dapat menulis banyak artikel, tetapi satu artikel hanya bisa memiliki satu penulis.
- [Many to One (M2O)](./m2o/index.md): Beberapa entitas dalam suatu Collection dapat terhubung ke satu entitas dalam Collection lain. Relasi ini juga sangat umum dalam pemodelan data, contohnya, beberapa siswa dapat berada dalam kelas yang sama.
- [Many to Many (M2M)](./m2m/index.md): Beberapa entitas dalam dua Collection dapat saling terhubung. Relasi ini biasanya membutuhkan tabel perantara untuk mencatat hubungan antar entitas, contohnya, hubungan antara siswa dan mata kuliah, seorang siswa dapat memilih banyak mata kuliah, dan suatu mata kuliah juga dapat dipilih oleh banyak siswa.

Jenis relasi ini memainkan peran penting dalam desain database dan pemodelan data, dapat membantu mendeskripsikan hubungan dan struktur data kompleks di dunia nyata.
