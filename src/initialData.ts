import { FamilyMember } from './types';

export const INITIAL_FAMILIES: FamilyMember[] = [
  // Generasi 1 (Kakek & Nenek Luhur)
  {
    id: "m1",
    name: "Raden Mas Soedjatmiko Wijaya",
    gender: "Laki-laki",
    birthDate: "1942-08-17",
    birthPlace: "Yogyakarta",
    isDeceased: true,
    deathDate: "2018-05-12",
    address: "Jl. kraton No. 12, Yogyakarta",
    notes: "Sesepuh keluarga besar Wijaya, perintis tradisi kumpul keluarga tahunan.",
    spouseId: "m2"
  },
  {
    id: "m2",
    name: "Siti Rahayu Kartika",
    gender: "Perempuan",
    birthDate: "1946-11-10",
    birthPlace: "Solo",
    isDeceased: false,
    phone: "081234567890",
    address: "Jl. Kraton No. 12, Yogyakarta",
    notes: "Ibu suri keluarga Wijaya yang hobi memasak gudeg legendaris.",
    spouseId: "m1"
  },

  // Generasi 2 (Anak-anak Raden Soedjatmiko & Siti Rahayu)
  // Anak 1: Budi Wijaya
  {
    id: "m3",
    name: "Ir. Budi Santoso Wijaya",
    gender: "Laki-laki",
    birthDate: "1968-04-21",
    birthPlace: "Yogyakarta",
    isDeceased: false,
    phone: "081398765432",
    email: "budi.wijaya@mail.com",
    address: "Cilandak, Jakarta Selatan",
    fatherId: "m1",
    motherId: "m2",
    spouseId: "m4",
    notes: "Putra sulung yang menetap di Jakarta. Bekerja sebagai arsitek senior."
  },
  {
    id: "m4",
    name: "Siti Aminah Malik",
    gender: "Perempuan",
    birthDate: "1972-09-15",
    birthPlace: "Bandung",
    isDeceased: false,
    phone: "081377889900",
    email: "siti.aminah@mail.com",
    address: "Cilandak, Jakarta Selatan",
    spouseId: "m3",
    notes: "Istri Ir. Budi Santoso, berprofesi sebagai dosen Sastra Indonesia."
  },

  // Anak 2: Rina Hartati Wijaya (Married to Hendra Pratama)
  {
    id: "m5",
    name: "Rina Hartati Wijaya",
    gender: "Perempuan",
    birthDate: "1971-12-05",
    birthPlace: "Yogyakarta",
    isDeceased: false,
    phone: "085611223344",
    email: "rina.hartati@mail.com",
    address: "Rungkut, Surabaya",
    fatherId: "m1",
    motherId: "m2",
    spouseId: "m6",
    notes: "Putri kedua, seorang dokter anak yang aktif dalam kegiatan sosial kesehatan."
  },
  {
    id: "m6",
    name: "dr. Hendra Pratama",
    gender: "Laki-laki",
    birthDate: "1969-07-28",
    birthPlace: "Surabaya",
    isDeceased: false,
    phone: "085699887766",
    email: "hendra.pratama@mail.com",
    address: "Rungkut, Surabaya",
    spouseId: "m5",
    notes: "Suami dr. Rina, spesialis bedah syaraf senior di Surabaya."
  },

  // Anak 3: Ronny Setiawan Wijaya
  {
    id: "m7",
    name: "Ronny Setiawan Wijaya",
    gender: "Laki-laki",
    birthDate: "1976-03-30",
    birthPlace: "Yogyakarta",
    isDeceased: false,
    phone: "089855443322",
    email: "ronny.wijaya@mail.com",
    address: "Sleman, Yogyakarta",
    fatherId: "m1",
    motherId: "m2",
    spouseId: "m8",
    notes: "Putra bungsu yang mengelola usaha perkebunan organik keluarga di Sleman."
  },
  {
    id: "m8",
    name: "Dewi Lestari",
    gender: "Perempuan",
    birthDate: "1980-05-18",
    birthPlace: "Semarang",
    isDeceased: false,
    phone: "089811224455",
    email: "dewi.lestari@mail.com",
    address: "Sleman, Yogyakarta",
    spouseId: "m7",
    notes: "Istri Ronny, seorang kreator konten kuliner dan berkebun tradisional."
  },

  // Generasi 3 (Cucu-Cucu)
  // Anak dari Budi Wijaya (m3) & Siti Aminah (m4)
  {
    id: "m9",
    name: "Aditya Pratama Wijaya",
    gender: "Laki-laki",
    birthDate: "1995-10-12",
    birthPlace: "Jakarta",
    isDeceased: false,
    phone: "081211112222",
    email: "adit.wijaya@mail.com",
    address: "Tangerang Selatan",
    fatherId: "m3",
    motherId: "m4",
    spouseId: "m10",
    notes: "Cucu tertua, bekerja sebagai software engineer di startup teknologi."
  },
  {
    id: "m10",
    name: "Rina Putri Amanda",
    gender: "Perempuan",
    birthDate: "1997-02-25",
    birthPlace: "Bogor",
    isDeceased: false,
    phone: "081233334444",
    email: "rina.putri@mail.com",
    address: "Tangerang Selatan",
    spouseId: "m9",
    notes: "Istri Aditya, berprofesi sebagai psikolog anak."
  },
  {
    id: "m11",
    name: "Citra Lestari Wijaya",
    gender: "Perempuan",
    birthDate: "1999-08-30",
    birthPlace: "Jakarta",
    isDeceased: false,
    phone: "081255556666",
    email: "citra.wijaya@mail.com",
    address: "Cilandak, Jakarta Selatan",
    fatherId: "m3",
    motherId: "m4",
    notes: "Lulusan Seni Rupa ITB, aktif sebagai desainer grafis lepas."
  },

  // Anak dari Rina Hartati (m5) & dr. Hendra (m6)
  {
    id: "m12",
    name: "Dimas Pratama Putra",
    gender: "Laki-laki",
    birthDate: "2001-01-15",
    birthPlace: "Surabaya",
    isDeceased: false,
    phone: "085644445555",
    email: "dimas.pratama@mail.com",
    address: "Rungkut, Surabaya",
    fatherId: "m6",
    motherId: "m5",
    notes: "Mahasiswa tingkat akhir Fakultas Kedokteran Universitas Airlangga."
  },
  {
    id: "m13",
    name: "Larasati Putri Pratama",
    gender: "Perempuan",
    birthDate: "2005-06-22",
    birthPlace: "Surabaya",
    isDeceased: false,
    phone: "085677778888",
    address: "Rungkut, Surabaya",
    fatherId: "m6",
    motherId: "m5",
    notes: "Sedang menempuh pendidikan sekolah menengah atas di Surabaya."
  },

  // Anak dari Ronny Setiawan (m7) & Dewi Lestari (m8)
  {
    id: "m14",
    name: "Keysha Olivia Wijaya",
    gender: "Perempuan",
    birthDate: "2010-09-09",
    birthPlace: "Yogyakarta",
    isDeceased: false,
    fatherId: "m7",
    motherId: "m8",
    notes: "Cucu termuda, hobi melukis dan menari tarian tradisional Jawa."
  }
];
