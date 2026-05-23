import { FamilyMember, FamilyStats } from './types';

// Hitung umur berdasarkan tanggal lahir dan wafat
export function getAge(birthDate: string, isDeceased?: boolean, deathDate?: string): number {
  if (!birthDate) return 0;
  
  const birth = new Date(birthDate);
  const end = isDeceased && deathDate ? new Date(deathDate) : new Date();
  
  let age = end.getFullYear() - birth.getFullYear();
  const monthDiff = end.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
    age--;
  }
  
  return Math.max(0, age);
}

// Format tanggal Bahasa Indonesia (contoh: 17 Agustus 1945)
export function formatIndonesianDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  try {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateString;
  }
}

// Menghitung struktur tingkat generasi (level silsilah) secara otomatis
export function getGenerationLevels(members: FamilyMember[]): Map<string, number> {
  const levels = new Map<string, number>();
  if (members.length === 0) return levels;

  // Temukan leluhur tertua (yaitu yang tidak memiliki ayah/ibu terdaftar dalam dataset)
  // Atau yang paling sedikit hubungannya ke atas
  const isParentInSystem = (parentId: string | undefined) => {
    if (!parentId) return false;
    return members.some(m => m.id === parentId);
  };

  const roots = members.filter(m => !isParentInSystem(m.fatherId) && !isParentInSystem(m.motherId));
  
  // Jika tidak ada root murni, gunakan yang tertua sebagai fallback
  const finalRoots = roots.length > 0 ? roots : [...members].sort((a, b) => {
    return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
  }).slice(0, 1);

  // BFS untuk penentuan level generasi
  const queue: { id: string; lvl: number }[] = [];
  finalRoots.forEach(r => {
    queue.push({ id: r.id, lvl: 0 });
    levels.set(r.id, 0);
  });

  const visited = new Set<string>();

  while (queue.length > 0) {
    const { id, lvl } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const m = members.find(item => item.id === id);
    if (!m) continue;

    // Set level pasangan agar sejajar
    if (m.spouseId && !levels.has(m.spouseId)) {
      levels.set(m.spouseId, lvl);
      queue.push({ id: m.spouseId, lvl });
    }

    // Temukan semua anak (yang mendefinisikan m.id sebagai ayah atau ibu)
    const children = members.filter(item => item.fatherId === id || item.motherId === id);
    children.forEach(c => {
      // Level anak adalah level orang tua tertua + 1
      const currentLvl = levels.get(c.id);
      if (currentLvl === undefined || currentLvl < lvl + 1) {
        levels.set(c.id, lvl + 1);
        queue.push({ id: c.id, lvl: lvl + 1 });
      }
    });
  }

  // Isi data yang belum terproses (opsional jika ada silsilah terputus)
  members.forEach(m => {
    if (!levels.has(m.id)) {
      // Check if they has any kids level
      const children = members.filter(item => item.fatherId === m.id || item.motherId === m.id);
      const childLevels = children.map(c => levels.get(c.id)).filter(l => l !== undefined) as number[];
      if (childLevels.length > 0) {
        levels.set(m.id, Math.max(0, Math.min(...childLevels) - 1));
      } else {
        levels.set(m.id, 0);
      }
    }
  });

  return levels;
}

// Dapatkan statistik keluarga lengkap
export function getStats(members: FamilyMember[]): FamilyStats {
  const totalMembers = members.length;
  if (totalMembers === 0) {
    return {
      totalMembers: 0,
      totalGenerations: 0,
      maleCount: 0,
      femaleCount: 0,
      averageAge: 0,
      livingCount: 0,
      deceasedCount: 0
    };
  }

  const maleCount = members.filter(m => m.gender === 'Laki-laki').length;
  const femaleCount = members.filter(m => m.gender === 'Perempuan').length;
  const livingCount = members.filter(m => !m.isDeceased).length;
  const deceasedCount = totalMembers - livingCount;

  // Hitung level generasi
  const levels = getGenerationLevels(members);
  const generatorLevelsValue = Array.from(levels.values());
  const maxLvl = generatorLevelsValue.length > 0 ? Math.max(...generatorLevelsValue) : 0;
  const totalGenerations = maxLvl + 1;

  // Rata-rata umur orang hidup
  const livingPeople = members.filter(m => !m.isDeceased);
  const totalAge = livingPeople.reduce((sum, m) => sum + getAge(m.birthDate), 0);
  const averageAge = livingPeople.length > 0 ? Math.round(totalAge / livingPeople.length) : 0;

  return {
    totalMembers,
    totalGenerations,
    maleCount,
    femaleCount,
    averageAge,
    livingCount,
    deceasedCount
  };
}

// Fungsi export CSV agar bisa disalin ke Google Sheets dengan mudah
export function exportToCSV(members: FamilyMember[]) {
  const headers = ['ID', 'Nama', 'Jenis Kelamin', 'Tanggal Lahir', 'Tempat Lahir', 'Wafat', 'Tanggal Wafat', 'Alamat', 'E-mail', 'No Telepon', 'ID Ayah', 'ID Ibu', 'ID Pasangan', 'Catatan'];
  
  const rows = members.map(m => [
    m.id,
    m.name,
    m.gender,
    m.birthDate || '',
    m.birthPlace || '',
    m.isDeceased ? 'Ya' : 'Tidak',
    m.deathDate || '',
    m.address || '',
    m.email || '',
    m.phone || '',
    m.fatherId || '',
    m.motherId || '',
    m.spouseId || '',
    m.notes || ''
  ]);

  const csvContent = "data:text/csv;charset=utf-8," 
    + [headers.join(','), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))].join('\n');
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `silsilah_keluarga_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
