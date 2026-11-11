import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  BarChart3,
  Bold,
  BookOpen,
  Database,
  Eraser,
  FilePlus2,
  FileText,
  Hash,
  HelpCircle,
  Info,
  Italic,
  Minus,
  Paintbrush,
  Pencil,
  Percent,
  Plus,
  Sigma,
  TrendingDown,
  TrendingUp,
  Underline,
  Banknote,
  Sparkles,
  Type,
  Calculator,
  FlaskConical,
  DollarSign,
} from "lucide-vue-next";
import type { MenuGroup } from "./types";

/**
 * Konfigurasi semua menu & dropdown.
 * Data statis — tidak perlu reactive.
 * Kalau nanti mau multi-bahasa / dinamis, tinggal jadi fungsi.
 */
export const MENUS: MenuGroup[] = [
  {
    id: "file",
    label: "File",
    icon: FileText,
    items: [
      {
        label: "Lembar Baru",
        action: "new",
        icon: FilePlus2,
        shortcut: "Ctrl+N",
      },
      { separator: true },
      { label: "Tentang MiniSheet", action: "about", icon: Info },
    ],
  },
  {
    id: "edit",
    label: "Edit",
    icon: Pencil,
    items: [
      {
        label: "Hapus Isi Sel",
        action: "clear",
        icon: Eraser,
        shortcut: "Del",
      },
      { separator: true },
      { label: "Tebal", action: "bold", icon: Bold, shortcut: "Ctrl+B" },
      { label: "Miring", action: "italic", icon: Italic, shortcut: "Ctrl+I" },
      {
        label: "Garis Bawah",
        action: "underline",
        icon: Underline,
        shortcut: "Ctrl+U",
      },
    ],
  },
  {
    id: "insert",
    label: "Sisipkan",
    icon: Plus,
    items: [
      { label: "SUM", action: "f-sum", icon: Sigma },
      { label: "AVERAGE", action: "f-average", icon: BarChart3 },
      { label: "MAX", action: "f-max", icon: TrendingUp },
      { label: "MIN", action: "f-min", icon: TrendingDown },
      { label: "COUNT", action: "f-count", icon: Hash },
    ],
  },
  {
    id: "format",
    label: "Format",
    icon: Paintbrush,
    items: [
      { label: "Rata Kiri", action: "align-left", icon: AlignLeft },
      { label: "Rata Tengah", action: "align-center", icon: AlignCenter },
      { label: "Rata Kanan", action: "align-right", icon: AlignRight },
      { separator: true },
      { label: "Tambah Desimal", action: "increase-decimal", icon: Plus },
      { label: "Kurangi Desimal", action: "decrease-decimal", icon: Minus },
      { label: "Format Persentase", action: "toggle-percent", icon: Percent },
      { label: "Format Rupiah", action: "toggle-currency", icon: Banknote },
      { separator: true },
      { label: "Format Umum", action: "set-format-general", icon: Sparkles },
      { label: "Format Angka", action: "set-format-number", icon: Hash },
      { label: "Format Teks", action: "set-format-text", icon: Type },
      {
        label: "Format Akuntansi",
        action: "set-format-accounting",
        icon: Calculator,
      },
      {
        label: "Format Ilmiah",
        action: "set-format-scientific",
        icon: FlaskConical,
      },
      {
        label: "Format Mata Uang",
        action: "set-format-currency",
        icon: DollarSign,
      },
      {
        label: "Format Keuangan",
        action: "set-format-finance",
        icon: Banknote,
      },
      { separator: true },
      { label: "Hapus Format", action: "clear-format", icon: Eraser },
    ],
  },
  {
    id: "data",
    label: "Data",
    icon: Database,
    items: [
      { label: "Jumlahkan Seleksi", action: "f-sum", icon: Sigma },
      { label: "Rata-rata Seleksi", action: "f-average", icon: BarChart3 },
      { label: "Hitung Angka", action: "f-count", icon: Hash },
    ],
  },
  {
    id: "help",
    label: "Bantuan",
    icon: HelpCircle,
    items: [{ label: "Daftar Rumus", action: "about", icon: BookOpen }],
  },
];
