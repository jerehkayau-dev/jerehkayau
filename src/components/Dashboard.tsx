import React from 'react';
import { FamilyMember } from '../types';
import { getStats, getAge, formatIndonesianDate } from '../utils';
import { 
  Users, 
  Layers, 
  Calendar, 
  MapPin, 
  PlusCircle, 
  TrendingUp, 
  GitBranch, 
  Activity, 
  ArrowRight,
  Heart
} from 'lucide-react';

interface DashboardProps {
  members: FamilyMember[];
  onNavigate: (tab: 'tree' | 'admin') => void;
  onQuickAdd: () => void;
}

export default function Dashboard({ members, onNavigate, onQuickAdd }: DashboardProps) {
  const stats = getStats(members);

  // Cari anggota keluarga tertua yang masih hidup
  const livingPresidents = members
    .filter(m => !m.isDeceased && m.birthDate)
    .sort((a, b) => new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime());
  const oldestLiving = livingPresidents[0];

  // Cari anggota keluarga termuda
  const youngest = [...members]
    .filter(m => m.birthDate)
    .sort((a, b) => new Date(b.birthDate).getTime() - new Date(a.birthDate).getTime())[0];

  // Cari 3 Ulang Tahun Terdekat
  const getUpcomingBirthdays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    return [...members]
      .filter(m => m.birthDate && !m.isDeceased)
      .map(m => {
        const birthDate = new Date(m.birthDate);
        let nextBirth = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        
        // Jika sudah kelewat di tahun ini, jadwalkan tahun depan
        if (nextBirth < today) {
          nextBirth.setFullYear(today.getFullYear() + 1);
        }
        
        const diffTime = Math.abs(nextBirth.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          member: m,
          daysLeft: diffDays,
          nextBirthDate: nextBirth,
          ageNext: getAge(m.birthDate) + (nextBirth.getFullYear() - new Date(m.birthDate).getFullYear() > getAge(m.birthDate) ? 1 : 0)
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 3);
  };

  const upcomingBirthdays = getUpcomingBirthdays();

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-linear-to-r from-[#1E293B] to-[#0F172A] border border-slate-800 p-8 md:p-12 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-radial from-[#D4AF37]/10 to-transparent rounded-full -translate-y-24 translate-x-24 pointer-events-none"></div>
        <div className="relative z-10 space-y-4 max-w-2xl">
          <span className="p-1.5 px-3 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-xs font-semibold text-[#FCF6BA] tracking-wider uppercase">
            Silsilah KeluargaKu
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-[#FCF6BA] leading-tight">
            Selamat Datang di Portal Silsilah Besar Keluarga !
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Abadikan, lacak, dan visualisasikan garis keturunan, kisah hidup, dan relasi berharga antar generasi secara dinamis dan modern dari satu tempat praktis.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={() => onNavigate('tree')}
              className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B38728] text-[#1E293B] px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all scale-hover cursor-pointer"
            >
              <GitBranch size={16} />
              Visualisasikan Pohon Keluarga
            </button>
            <button
              onClick={onQuickAdd}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              <PlusCircle size={16} />
              Tambah Anggota Baru
            </button>
          </div>
        </div>
      </div>

      {/* Rangkuman Statistik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Anggota */}
        <div className="bg-white rounded-2xl p-6 border border-[#EFE9DD] shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-4 rounded-2xl bg-amber-50 text-[#D4AF37]">
            <Users size={24} />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Total Anggota</span>
            <span className="text-3xl font-bold text-[#1E293B]">{stats.totalMembers}</span>
            <span className="text-xs text-slate-500 block">Anggota keluarga terdaftar</span>
          </div>
        </div>

        {/* Card 2: Jumlah Generasi */}
        <div className="bg-white rounded-2xl p-6 border border-[#EFE9DD] shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-4 rounded-2xl bg-[#1E293B]/5 text-[#1E293B]">
            <Layers size={24} />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Tingkat Generasi</span>
            <span className="text-3xl font-bold text-[#1E293B]">{stats.totalGenerations}</span>
            <span className="text-xs text-slate-500 block">Tingkat keturunan vertikal</span>
          </div>
        </div>

        {/* Card 3: Hidup & Wafat */}
        <div className="bg-white rounded-2xl p-6 border border-[#EFE9DD] shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-4 rounded-2xl bg-rose-50 text-rose-500">
            <Heart size={24} />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Status Kehidupan</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">{stats.livingCount}</span>
              <span className="text-xs text-slate-400">hidup</span>
              <span className="text-sm font-bold text-slate-400">/</span>
              <span className="text-md font-bold text-slate-400">{stats.deceasedCount} wafat</span>
            </div>
            <span className="text-xs text-slate-500 block">Menjaga memori leluhur</span>
          </div>
        </div>

        {/* Card 4: Rata Usia Hidup */}
        <div className="bg-white rounded-2xl p-6 border border-[#EFE9DD] shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-4 rounded-2xl bg-sky-50 text-sky-500">
            <Activity size={24} />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Rata-rata Usia</span>
            <span className="text-3xl font-bold text-[#1E293B]">{stats.averageAge} <span className="text-sm font-normal text-slate-500">Thn</span></span>
            <span className="text-xs text-slate-500 block">Usia rata-rata orang hidup</span>
          </div>
        </div>

      </div>

      {/* layout Grid Kedua: Info Menarik & Birthday */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Info Menarik & Distribusi Gender (8 Kolom) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EFE9DD]/90 p-6 flex flex-col justify-between shadow-xs">
          <div>
            <h4 className="font-serif font-bold text-[#1E293B] text-lg border-b border-[#EFE9DD] pb-3 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#D4AF37]" /> Berita & Sorotan Keluarga
            </h4>

            {/* Sorotan Orang Tua Hidup Tertua & Bayi Termuda */}
            <div className="space-y-4">
              
              <div className="bg-[#FAF6F0] p-4 rounded-xl border border-[#EFE9DD] flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center text-lg font-serif font-bold text-[#B38728] shrink-0">
                  👴
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Sesepuh Keluarga (Hidup)</span>
                  <h5 className="font-serif font-bold text-slate-800 text-sm mt-0.5">
                    {oldestLiving ? `${oldestLiving.name} (${getAge(oldestLiving.birthDate)} Tahun)` : 'Belum didata'}
                  </h5>
                  <p className="text-xs text-slate-500 mt-1">
                    Lahir di {oldestLiving?.birthPlace || 'Yogyakarta'}, menduduki tempat istimewa sebagai tiang petunjuk generasi saat ini.
                  </p>
                </div>
              </div>

              <div className="bg-[#FAF6F0] p-4 rounded-xl border border-[#EFE9DD] flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-lg font-serif font-bold text-sky-600 shrink-0">
                  👶
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Cucu/Anggota Termuda</span>
                  <h5 className="font-serif font-bold text-slate-800 text-sm mt-0.5">
                    {youngest ? `${youngest.name} (Usia ${getAge(youngest.birthDate)} Thn)` : 'Belum didata'}
                  </h5>
                  <p className="text-xs text-slate-500 mt-1">
                    Lahir pada {formatIndonesianDate(youngest?.birthDate)}, melambangkan masa depan dan tunas baru dalam pohon keluarga kita.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Mini Chart / Visualisasi Gender Ratios */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">Rasio Jenis Kelamin</span>
            <div className="w-full bg-slate-100 h-6 rounded-full overflow-hidden flex relative shadow-inner">
              <div 
                style={{ width: `${(stats.maleCount / stats.totalMembers) * 100}%` }}
                className="bg-sky-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all shadow-xs"
                title={`${stats.maleCount} Laki-laki`}
              >
                {stats.maleCount > 0 && `Pria (${Math.round((stats.maleCount / stats.totalMembers) * 100)}%)`}
              </div>
              <div 
                style={{ width: `${(stats.femaleCount / stats.totalMembers) * 100}%` }}
                className="bg-rose-400 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all shadow-xs"
                title={`${stats.femaleCount} Perempuan`}
              >
                {stats.femaleCount > 0 && `Wanita (${Math.round((stats.femaleCount / stats.totalMembers) * 100)}%)`}
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400 mt-2 font-medium">
              <span>Laki-Laki: {stats.maleCount} orang</span>
              <span>Perempuan: {stats.femaleCount} orang</span>
            </div>
          </div>

        </div>

        {/* Jadwal Ulang Tahun Terdekat (5 Kolom) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#EFE9DD]/90 p-6 shadow-xs">
          <h4 className="font-serif font-bold text-[#1E293B] text-lg border-b border-[#EFE9DD] pb-3 mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-[#D4AF37]" /> Ulang Tahun Mendatang
          </h4>

          {upcomingBirthdays.length > 0 ? (
            <div className="space-y-4">
              {upcomingBirthdays.map(({ member, daysLeft, nextBirthDate, ageNext }, i) => (
                <div 
                  key={member.id} 
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    daysLeft <= 10 
                      ? 'bg-amber-50 border-amber-200 animate-pulse' 
                      : 'bg-[#FAF6F0] border-slate-100 hover:border-amber-200'
                  }`}
                >
                  <div className="space-y-1">
                    <h5 className="font-serif font-bold text-slate-800 text-xs">
                      {member.name}
                    </h5>
                    <p className="text-[10px] text-slate-500">
                      Ulang tahun ke-{ageNext} pada {formatIndonesianDate(member.birthDate)}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <MapPin size={10} className="text-[#D4AF37]" />
                      <span>{member.address || 'Alamat belum diset'}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`p-1.5 px-2.5 rounded-lg text-xs font-bold block ${
                      daysLeft <= 10 ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {daysLeft} Hari Lagi
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400 italic">
              Tidak ada data ulang tahun hidup tersedia saat ini.
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('admin')}
              className="text-[#D4AF37] hover:text-[#B38728] text-xs font-semibold flex items-center gap-1 hover:underline w-full justify-center transition-all cursor-pointer"
            >
              Lihat Seluruh Roster Rincian <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
