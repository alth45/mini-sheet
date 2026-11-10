
<div align="center">

# 📊 MiniSheet

**Spreadsheet sederhana dengan tampilan modern — dibangun dengan Vue 3 + TypeScript**

[![Vue 3](https://img.shields.io/badge/Vue-3.5-42b883?style=flat-square&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](./LICENSE)

![Preview](./docs/preview.png)

</div>

---

## ✨ Fitur

### 📐 Grid & Data

- **26 kolom (A–Z) × 30 baris** — diperluas otomatis dengan bijective base-26
- **Formula engine** lengkap: `SUM`, `AVERAGE`, `MAX`, `MIN`, `COUNT`, `IF`
- **Operator aritmatika** (`+ - * / ^`) & perbandingan (`= <> < > <= >=`)
- **Deteksi referensi melingkar** (`#CIRC!`)
- **Error handling** jelas: `#DIV/0!`, `#VALUE!`, `#REF!`, `#NAME?`, `#ERROR!`

### 🎨 Formatting

- **Bold**, _Italic_, <u>Underline</u>
- **Warna teks** & **warna latar** dengan color picker
- **Rata kiri / tengah / kanan**
- **Font family** (9 pilihan) & **font size** (8–36)
- **Format desimal** (0–10 digit) — tombol `.0` / `.00`
- **Format persentase** — nilai × 100 dengan suffix `%`

### ⚡ Interaksi

- **Selection drag** — kotak ungu mengelilingi seluruh range
- **Fill handle** — drag pojok kanan-bawah untuk copy/auto-fill (formula relatif di-adjust!)
- **Resize kolom** — drag border header, double-click untuk reset
- **Formula bar** — sinkron dua arah dengan sel aktif
- **Inline editor** — klik dua kali atau mulai mengetik untuk edit
- **Navigate** dengan keyboard (panah, Enter, Tab)

### 🎯 UX Modern

- **Design system** dengan CSS variables (Indigo + Slate palette)
- **Ikon Lucide** konsisten di semua tombol
- **Font Inter** + **JetBrains Mono** untuk angka & formula
- **Focus ring**, **transition halus**, **scrollbar tipis**
- **Modal styled** untuk About & konfirmasi reset
- **Status bar** dengan format ribuan (`Intl.NumberFormat`)

---

## 🚀 Quick Start

### Prasyarat

- **Node.js** ≥ 20.19.0
- **npm** ≥ 10

### Instalasi

```bash
# Clone repository
git clone <repo-url> minisheet-vue
cd minisheet-vue

# Install dependencies
npm install

# Jalankan dev server
npm run dev
```
````

Buka [http://localhost:5173](http://localhost:5173) — browser akan terbuka otomatis.

### Build Production

```bash
npm run build      # type-check + build
npm run preview    # preview hasil build
```

---

## 📖 Panduan Penggunaan

### Navigasi

| Aksi              | Shortcut                  |
| ----------------- | ------------------------- |
| Pindah sel        | `↑` `↓` `←` `→`           |
| Perluas selection | `Shift` + panah           |
| Pindah bawah      | `Enter`                   |
| Pindah kanan/kiri | `Tab` / `Shift+Tab`       |
| Lompat ke awal    | `Ctrl+Home` (coming soon) |

### Editing

| Aksi                 | Shortcut                |
| -------------------- | ----------------------- |
| Mode edit            | `F2`                    |
| Mulai edit (replace) | Ketik karakter apa saja |
| Commit               | `Enter`                 |
| Cancel               | `Esc`                   |
| Hapus isi sel        | `Del` / `Backspace`     |

### Formatting

| Aksi        | Shortcut |
| ----------- | -------- |
| Tebal       | `Ctrl+B` |
| Miring      | `Ctrl+I` |
| Garis bawah | `Ctrl+U` |
| Lembar baru | `Ctrl+N` |

### Formula

Mulai input dengan `=` untuk membuat formula:

```
=SUM(A1:A10)          → jumlahkan rentang
=AVERAGE(A1:A10)      → rata-rata
=MAX(A1:A10)          → nilai terbesar
=MIN(A1:A10)          → nilai terkecil
=COUNT(A1:A10)        → hitung sel yang berisi angka
=IF(A1>0, "Positif", "Negatif")   → kondisional
=B2*C2                → perkalian sederhana
=(A1+A2)/2            → operasi dengan kurung
=2^10                 → pangkat
```

**Contoh data seed** — saat pertama dibuka, sheet berisi tabel inventori:

- Kolom A: Barang
- Kolom B: Qty
- Kolom C: Harga
- Kolom D: Total (`=B2*C2`, dst)
- Baris 8–13: Summary dengan `SUM`, `AVERAGE`, `MAX`, `MIN`, `COUNT`

### Fitur Lanjutan

#### 🖐️ Fill Handle

1. Select sel atau range
2. Hover pojok kanan-bawah → cursor berubah jadi `+`
3. Drag ke target
4. Release → data & formula dicopy dengan adjustment relatif

```
D2: =B2*C2     ─[drag down]→   D3: =B3*C3
                                D4: =B4*C4
```

#### 📏 Resize Kolom

1. Hover tepi kanan header kolom (misal `B`) → cursor `↔`
2. Drag kiri/kanan → kolom melebar/menyempit live
3. **Double-click** untuk reset ke lebar default (90px)

Min 40px, max 500px.

#### 🔢 Format Desimal & Persen

- **`.0`** → kurangi 1 desimal
- **`.00`** → tambah 1 desimal
- **`%`** → toggle format persen (nilai × 100)

Kombinasi:
| Value | Decimals | Percent | Display |
|---|---|---|---|
| `0.15` | — | — | `0.15` |
| `0.15` | 1 | — | `0.2` |
| `0.15` | — | ✓ | `15%` |
| `0.1555` | 2 | ✓ | `15.55%` |

---

## 🏗️ Tech Stack

| Layer         | Library                            | Versi        |
| ------------- | ---------------------------------- | ------------ |
| **Framework** | Vue 3 (Composition API)            | 3.5.x        |
| **Language**  | TypeScript                         | 5.7.x        |
| **Build**     | Vite                               | 6.0.x        |
| **Icons**     | lucide-vue-next                    | 0.469.x      |
| **Fonts**     | Inter (UI), JetBrains Mono (angka) | Google Fonts |

**Tidak ada** state management library (Pinia/Vuex) — single-page app dengan satu composable `useSheet` sudah cukup.

**Tidak ada** UI library (Vuetify/PrimeVue) — semua komponen custom dari scratch untuk kontrol design penuh.

---

## 📁 Struktur Project

```
minisheet-vue/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── env.d.ts
└── src/
    ├── main.ts                    # Entry point
    ├── style.css                  # Design tokens & base styles
    ├── constants.ts               # Types, constants, helpers
    ├── App.vue                    # Root + orchestration
    ├── composables/
    │   ├── useFormula.ts          # Formula engine (tokenizer + parser)
    │   └── useSheet.ts            # Sheet state (reactive, actions)
    ├── data/
    │   └── seed.ts                # Data contoh awal
    └── components/
        ├── MenuBar.vue            # Menu bar atas
        ├── Toolbar.vue            # Toolbar formatting
        ├── FormulaBar.vue         # Name box + formula input
        ├── Grid.vue               # Tabel 26×30 (komponen inti)
        ├── CellEditor.vue         # Overlay editor saat edit
        └── StatusBar.vue          # Status bawah + stats
```

### Arsitektur Data Flow

```
┌─────────────────────────────────────────────────────┐
│  App.vue                                            │
│  ┌───────────────────────────────────────────────┐  │
│  │  useSheet()  ←  Single source of truth        │  │
│  │  ├─ data (reactive CellMap)                   │  │
│  │  ├─ styles (reactive StyleMap)                │  │
│  │  ├─ activeRef, selStart, selEnd               │  │
│  │  ├─ colWidths (reactive number[])             │  │
│  │  └─ engine: FormulaEngine (from useFormula)   │  │
│  └───────────────────────────────────────────────┘  │
│           │                                         │
│      ┌────┴─────┬──────┬──────┬──────┐             │
│      ▼          ▼      ▼      ▼      ▼             │
│   MenuBar   Toolbar  Formula  Grid   StatusBar      │
│                       Bar    +Editor                │
└─────────────────────────────────────────────────────┘
```

**Semua komponen** stateless (kecuali local UI state) — menerima props dari `useSheet`, emit event ke App, App dispatch ke `useSheet` method. **One-way data flow**.

---

## 🎨 Design System

### Warna Utama

```css
--primary-500: #6366f1; /* Indigo — warna brand */
--slate-900: #0f172a; /* Teks utama */
--slate-50: #f8fafc; /* Background app */
--success-700: #15803d; /* Nilai summary */
--danger-500: #ef4444; /* Error & hapus */
```

### Radius

`4px` (small), `6px` (default), `10px` (large), `14px` (modal)

### Shadow

Multi-layer subtle (Tailwind-style):

```css
--shadow-sm:
  0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.06);
--shadow-lg:
  0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -4px rgba(15, 23, 42, 0.06);
```

### Typography

- **UI**: Inter, `font-feature-settings` untuk alternate glyphs (`a`, `g`, `1`, `l`)
- **Angka/Formula**: JetBrains Mono — _tabular digits_, rata saat berubah

### Transition

Semua interaksi: `120ms cubic-bezier(0.4, 0, 0.2, 1)` — konsisten, tidak "patah-patah".

---

## 🔍 Formula Engine

Implementasi **recursive descent parser** dengan _precedence_:

```
comparison  → additive ( < > = <> <= >= ) additive
additive    → multiplicative ( + - ) multiplicative
multiplicative → unary ( * / ) unary
unary       → ( - + ) unary | power
power       → primary ( ^ ) power
primary     → number | string | (expr) | id(...) | ref | TRUE | FALSE
```

### Referensi Melingkar

`=A1` di A1 sendiri → `#CIRC!` (di-deteksi via stack saat evaluasi).

`=A1` di A1, `=B1` di B1 (A1→B1→A1) → `#CIRC!`.

### Fungsi Bawaan

| Fungsi                | Deskripsi                               |
| --------------------- | --------------------------------------- |
| `SUM(range, ...)`     | Jumlahkan angka (abaikan teks & kosong) |
| `AVERAGE(range, ...)` | Rata-rata angka (`#DIV/0!` jika kosong) |
| `MAX(range, ...)`     | Nilai terbesar                          |
| `MIN(range, ...)`     | Nilai terkecil                          |
| `COUNT(range, ...)`   | Hitung sel angka                        |
| `IF(cond, a, b)`      | Kondisional (truthy check)              |

### Fill Handle Formula Adjustment

Saat drag fill, referensi sel **relatif** di-shift:

```
D2: =B2*C2
D3: =B3*C3  ← otomatis
D4: =B4*C4  ← otomatis
```

String literal **tidak** di-adjust:

```
=IF(A1>0, "B2", "C3")  →  =IF(A2>0, "B2", "C3")  ✅
```

---

## 🧪 Testing Manual

| Fitur     | Test                                     |
| --------- | ---------------------------------------- |
| Formula   | Ketik `=1+2*3` → `7`                     |
| Error     | `=1/0` → `#DIV/0!` (merah)               |
| Range     | `=SUM(A1:A5)` di kolom angka             |
| Fill down | Select D2, drag ke D6 → formula adjusted |
| Percent   | `0.15` + klik `%` → `15%`                |
| Decimals  | `100.567` + klik `.00` → `100.5670`      |
| Resize    | Drag border header, dblclick reset       |
| Selection | Drag A1:C5 → kotak ungu luas             |
| Keyboard  | Arrow keys, Ctrl+B, Del, F2              |

---

## 🛠️ Development

### Scripts

```bash
npm run dev       # Dev server dengan HMR
npm run build     # Type-check + production build
npm run preview   # Preview build di local
```

### Konvensi Kode

- **Composition API** + `<script setup lang="ts">`
- **Strict TypeScript** (`strict: true`, `noUnusedLocals`, `noUnusedParameters`)
- **Composable pattern** untuk logic reusable
- **Event emission** (bukan mutasi props)
- **CSS variables** untuk design tokens
- **Scoped styles** per komponen

### Menambah Kolom / Baris

**Ubah satu baris** di `src/constants.ts`:

```ts
export const COLS: readonly string[] = generateCols(26); // A..Z
export const NROWS = 30;
```

Untuk kolom lebih banyak:

```ts
generateCols(52); // A..AZ
generateCols(702); // A..ZZ
```

Formula engine & UI otomatis adapt (semua iterasi pakai `COLS.length`).

---

## 🗺️ Roadmap

- [ ] **Multi-sheet** (tab bawah untuk tambah/hapus sheet)
- [ ] **Import/Export** CSV, XLSX
- [ ] **Undo/Redo** dengan history stack
- [ ] **Copy/Paste** (`Ctrl+C` / `Ctrl+V`) — saat ini hanya fill handle
- [ ] **Format mata uang** (`Rp 1.500.000`, `$1,500.00`)
- [ ] **Ribuan separator** (toggle `1.500.000` vs `1500000`)
- [ ] **Format kondisional** (negatif merah, positif hijau)
- [ ] **Auto-fit kolom** (double-click = fit to content)
- [ ] **Freeze pane** (header tetap saat scroll vertikal)
- [ ] **Virtual scrolling** untuk grid besar (1000+ rows)
- [ ] **Dark mode** (swap CSS variables)
- [ ] **Export PNG** untuk share hasil
- [ ] **Multi-select** dengan `Ctrl+Click` (tambah range disjoint)

---

## 📝 Catatan

### Kenapa Vue 3 (bukan React/Svelte)?

- **Reactive primitive** (`reactive`, `computed`, `ref`) cocok untuk spreadsheet
- **`<script setup>`** mengurangi boilerplate drastis
- **`defineModel`** (kalau nanti butuh) — dua arah tanpa ceremony
- **Ekosistem stabil** — Vite + Vue 3 mature

### Kenapa tidak pakai state library?

- Single-page app dengan state terkonsentrasi di `useSheet`
- **Prop drilling** hanya 2 level (App → Grid → Cell)
- Pinia/Vuex menambah kompleksitas tanpa benefit nyata
- Migrasi ke Pinia trivial kalau nanti butuh (pattern `useSheet` sudah sangat Pinia-like)

### Kenapa tidak pakai UI library?

- Design custom lebih **kontrol penuh** (indigo palette, radius, shadow)
- Bundle size jauh lebih kecil (`lucide-vue-next` ~15KB vs Vuetify ~500KB)
- Belajar lebih banyak (dari CSS variables sampai accessibility)

---

## 📄 Lisensi

MIT © 2025

Bebas digunakan, dimodifikasi, dan didistribusikan untuk keperluan pribadi maupun komersial.

---

<div align="center">

**Dibangun dengan ❤️ menggunakan Vue 3 + TypeScript**

⭐ Beri bintang kalau project ini bermanfaat!

</div>
