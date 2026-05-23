import React, { useState, useEffect } from 'react';
import { FamilyMember } from '../types';
import { getAge, getGenerationLevels } from '../utils';
import { 
  Search, 
  HelpCircle, 
  Eye, 
  Heart, 
  ArrowUp, 
  ChevronDown, 
  User, 
  GitBranch, 
  Network,
  Users
} from 'lucide-react';

interface FamilyTreeViewerProps {
  members: FamilyMember[];
  onSelectMember: (member: FamilyMember) => void;
  focusedMemberId: string | null;
  setFocusedMemberId: (id: string | null) => void;
}

export default function FamilyTreeViewer({
  members,
  onSelectMember,
  focusedMemberId,
  setFocusedMemberId
}: FamilyTreeViewerProps) {
  const [viewMode, setViewMode] = useState<'focused' | 'org'>('focused');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Ambil level-level generasi
  const levelsMap = getGenerationLevels(members);
  
  // Tetapkan fokus awal jika kosong
  useEffect(() => {
    if (!focusedMemberId && members.length > 0) {
      // Prioritaskan sesepuh pertama (level 0 paling awal lahir)
      const oldestRoot = [...members].sort((a, b) => {
        return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
      })[0];
      if (oldestRoot) {
        setFocusedMemberId(oldestRoot.id);
      }
    }
  }, [members, focusedMemberId, setFocusedMemberId]);

  const focusedMember = members.find(m => m.id === focusedMemberId) || members[0];

  // Olah data relasi untuk Fokus Silsilah
  const father = focusedMember ? members.find(m => m.id === focusedMember.fatherId) : null;
  const mother = focusedMember ? members.find(m => m.id === focusedMember.motherId) : null;
  const spouse = focusedMember ? members.find(m => m.id === focusedMember.spouseId) : null;
  const children = focusedMember ? members.filter(m => m.fatherId === focusedMember.id || m.motherId === focusedMember.id) : [];
  const siblings = focusedMember ? members.filter(m => 
    m.id !== focusedMember.id && 
    ((focusedMember.fatherId && m.fatherId === focusedMember.fatherId) || 
     (focusedMember.motherId && m.motherId === focusedMember.motherId))
  ) : [];

  // Filter pencarian
  const searchResults = searchQuery
    ? members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleSearchSelect = (memberId: string) => {
    setFocusedMemberId(memberId);
    setSearchQuery('');
  };

  // Helper render kartu anggota silsilah kecil
  const renderMemberNode = (member: FamilyMember, size: 'sm' | 'md' | 'lg' = 'md', isHighlighted: boolean = false) => {
    const age = getAge(member.birthDate, member.isDeceased, member.deathDate);
    const bgClass = isHighlighted 
      ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/40 bg-amber-50/70 shadow-md' 
      : 'border-[#EFE9DD] bg-white hover:border-[#D4AF37] hover:shadow-md hover:translate-y-[-2px] shadow-xs';
    
    return (
      <div 
        key={member.id}
        onClick={() => setFocusedMemberId(member.id)}
        className={`border p-3.5 rounded-xl transition-all cursor-pointer select-none text-center relative group min-w-[140px] max-w-[200px] ${bgClass}`}
      >
        {/* Gender Badge Color Strip */}
        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
          member.gender === 'Laki-laki' ? 'bg-sky-400' : 'bg-rose-400'
        }`} />

        <div className="flex flex-col items-center">
          {member.photo ? (
            <img 
              src={member.photo} 
              alt={member.name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-lg object-cover bg-slate-50 border border-slate-100 shadow-xs mb-1.5"
            />
          ) : (
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold font-serif mb-1.5 ${
              member.gender === 'Laki-laki' ? 'bg-sky-50 text-sky-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {member.name.split(' ').slice(0,2).map(n => n[0]).join('')}
            </div>
          )}

          <h5 className="font-sans font-semibold text-xs text-[#1E293B] line-clamp-1 leading-tight mb-0.5 group-hover:text-[#D4AF37]" title={member.name}>
            {member.name}
          </h5>
          <p className="text-[10px] text-slate-400">
            {member.isDeceased ? 'Wafat' : `Usia ${age} Thn`}
          </p>
        </div>

        {/* Floating Quick view Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectMember(member);
          }}
          className="absolute -top-2 -right-2 bg-[#1E293B] hover:bg-[#D4AF37] text-white hover:text-slate-900 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-xs text-[10px] cursor-pointer"
          title="Lihat Rincian Lengkap"
        >
          <Eye size={12} />
        </button>
      </div>
    );
  };

  // Render Struktur Organisasi Silsilah
  const renderOrganogramLayout = () => {
    // Kelompokkan anggota keluarga berdasarkan generasi level
    const generations: { [key: number]: FamilyMember[] } = {};
    members.forEach(m => {
      const g = levelsMap.get(m.id) ?? 0;
      if (!generations[g]) generations[g] = [];
      generations[g].push(m);
    });

    const genKeys = Object.keys(generations).map(Number).sort((a, b) => a - b);

    return (
      <div className="overflow-x-auto pb-8 space-y-12 min-w-full">
        {genKeys.map((genderLvl, index) => {
          const genMembers = generations[genderLvl];
          
          // Kelompokkan menjadi Pasangan (Couples) & Single (Jomblo/Duda/Janda sementara)
          const processed = new Set<string>();
          const couples: { husband: FamilyMember; wife: FamilyMember }[] = [];
          const singles: FamilyMember[] = [];

          genMembers.forEach(m => {
            if (processed.has(m.id)) return;
            
            if (m.spouseId) {
              const partner = members.find(p => p.id === m.spouseId);
              if (partner && levelsMap.get(partner.id) === genderLvl) {
                processed.add(m.id);
                processed.add(partner.id);
                
                if (m.gender === 'Laki-laki') {
                  couples.push({ husband: m, wife: partner });
                } else {
                  couples.push({ husband: partner, wife: m });
                }
                return;
              }
            }
            singles.push(m);
            processed.add(m.id);
          });

          return (
            <div key={genderLvl} className="flex flex-col items-center space-y-4">
              
              {/* Header Generasi */}
              <div className="flex items-center gap-2">
                <span className="h-px w-8 bg-[#EFE9DD]" />
                <span className="p-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white border border-[#EFE9DD] rounded-full shadow-xs">
                  Generasi {genderLvl + 1}
                </span>
                <span className="h-px w-8 bg-[#EFE9DD]" />
              </div>

              {/* Box Menampung Grid Anggota Generasi ini */}
              <div className="flex flex-wrap justify-center gap-8 items-stretch max-w-full px-4">
                
                {/* Render Couples */}
                {couples.map((couple, cIdx) => (
                  <div 
                    key={cIdx} 
                    className="p-3 bg-[#FAF8F5] border border-amber-200/60 rounded-2xl flex flex-col items-center shadow-xs hover:shadow-md transition-all relative"
                  >
                    {/* Golden Couple Link Line */}
                    <div className="flex items-center gap-2">
                      {renderMemberNode(couple.husband, 'sm', focusedMemberId === couple.husband.id)}
                      
                      <div className="flex flex-col items-center text-rose-500 bg-white p-1.5 rounded-full border border-rose-100 shadow-xs z-10">
                        <Heart size={14} className="fill-rose-500 animate-pulse text-xs shrink-0" />
                      </div>
                      
                      {renderMemberNode(couple.wife, 'sm', focusedMemberId === couple.wife.id)}
                    </div>
                    
                    {/* Small tag */}
                    <p className="text-[9px] text-[#B38728] font-bold tracking-wider mt-1.5 uppercase">
                      Pasangan Menikah
                    </p>
                  </div>
                ))}

                {/* Render Singles */}
                {singles.map((single) => (
                  <div key={single.id} className="flex items-center h-full">
                    {renderMemberNode(single, 'sm', focusedMemberId === single.id)}
                  </div>
                ))}

              </div>
              
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-[#EFE9DD] overflow-hidden shadow-xs">
      
      {/* Control Header */}
      <div className="bg-[#FAF6F0] p-4 sm:p-6 border-b border-[#EFE9DD] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        
        {/* Toggle Mode */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-[#EFE9DD] p-1.5 rounded-xl flex shadow-sm shrink-0">
            <button
              onClick={() => setViewMode('focused')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'focused' 
                  ? 'bg-slate-800 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Network size={14} />
              Pohon Fokus
            </button>
            <button
              onClick={() => setViewMode('org')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'org' 
                  ? 'bg-slate-800 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <GitBranch size={14} />
              Struktur Organisasi
            </button>
          </div>
        </div>

        {/* Global Family Search Bar */}
        <div className="relative max-w-sm w-full">
          <div className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Search size={15} />
          </div>
          <input
            type="text"
            placeholder="Cari anggota silsilah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#EFE9DD] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl pl-9 pr-4 py-2 text-xs font-sans outline-hidden transition-all shadow-xs"
          />

          {/* Quick results dropdown if query exists */}
          {searchQuery && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-[#EFE9DD] rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map(res => (
                  <button
                    key={res.id}
                    onClick={() => handleSearchSelect(res.id)}
                    className="w-full text-left px-4 py-2 hover:bg-[#FAF6F0] text-xs font-medium text-slate-700 flex justify-between items-center transition-colors cursor-pointer border-b border-slate-50 last:border-b-0"
                  >
                    <span>{res.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{res.gender}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-slate-400 italic">Anggota tidak ditemukan.</div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Main Graph Area */}
      <div className="p-6 overflow-hidden min-h-[480px] bg-radial from-slate-50 to-white flex items-center justify-center relative">
        
        {viewMode === 'focused' ? (
          /* Focused family view layout (Roots, Siblings, Couples, Kids) */
          <div className="w-full max-w-2xl font-sans space-y-12">
            
            {/* 1. Generasi Orang Tua (Father & Mother) */}
            <div className="flex flex-col items-center space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Generasi Orang Tua</span>
              <div className="flex items-center gap-6 relative">
                
                {/* Father */}
                {father ? (
                  renderMemberNode(father, 'sm')
                ) : (
                  <div className="border border-dashed border-[#EFE9DD] p-3 text-center text-[10px] text-slate-400 italic rounded-xl w-36 bg-slate-50">
                    Bapak belum terdata
                  </div>
                )}

                {/* Connection line between parents */}
                {mother && father && (
                  <div className="h-px bg-slate-200 w-6"></div>
                )}

                {/* Mother */}
                {mother ? (
                  renderMemberNode(mother, 'sm')
                ) : (
                  <div className="border border-dashed border-[#EFE9DD] p-3 text-center text-[10px] text-slate-400 italic rounded-xl w-36 bg-slate-50">
                    Ibu belum terdata
                  </div>
                )}

              </div>
            </div>

            {/* Downward connection lines */}
            <div className="flex justify-center -my-6">
              <div className="w-px h-10 bg-slate-200"></div>
            </div>

            {/* 2. Inti Silsilah (Focused Member & Spouse Center Block) */}
            <div className="flex flex-col items-center space-y-3 bg-[#FAF8F5] p-5 rounded-2xl border border-amber-200 relative shadow-sm">
              <span className="p-1 px-3 rounded-full bg-[#D4AF37]/15 text-[#B38728] text-[9px] font-bold tracking-widest uppercase absolute -top-3">
                Fokus Silsilah Terpilih
              </span>

              <div className="flex flex-wrap items-center justify-center gap-6">
                
                {/* Focused Person */}
                {focusedMember ? (
                  renderMemberNode(focusedMember, 'lg', true)
                ) : (
                  <div className="text-center text-slate-400 text-xs italic">Memuat silsilah...</div>
                )}

                {/* Spouse connection */}
                {spouse ? (
                  <>
                    <div className="flex flex-col items-center bg-white p-2 rounded-full border border-rose-100 shadow-xs text-rose-500 animate-pulse">
                      <Heart size={16} className="fill-rose-500" />
                    </div>
                    {renderMemberNode(spouse, 'lg')}
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-slate-300">
                      <Heart size={16} />
                    </div>
                    <div className="border border-dashed border-[#EFE9DD] p-3 text-center text-[10px] text-slate-400 italic rounded-xl w-36 bg-slate-50/50">
                      Belum memiliki pasangan terdaftar
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Downward connection to children */}
            {children.length > 0 && (
              <div className="flex justify-center -my-6">
                <div className="w-px h-10 bg-slate-200"></div>
              </div>
            )}

            {/* 3. Generasi Anak-Anak (Children List) */}
            {children.length > 0 ? (
              <div className="flex flex-col items-center space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Anak-anak ({children.length})</span>
                <div className="flex flex-wrap justify-center gap-4">
                  {children.map(child => renderMemberNode(child, 'sm'))}
                </div>
              </div>
            ) : (
              <div className="text-center text-[10px] text-slate-400 bg-[#FAF6F0] p-3 rounded-xl border border-dashed border-[#EFE9DD] max-w-sm mx-auto">
                Fokus terpilih belum mendata anak.
              </div>
            )}

          </div>
        ) : (
          /* High quality Autogenerated Generational Organogram Layout */
          renderOrganogramLayout()
        )}

      </div>

      {/* Dynamic bottom hint bar */}
      <div className="px-6 py-3 bg-[#FAF6F0]/80 border-t border-[#EFE9DD] flex items-center gap-2 justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <HelpCircle size={13} className="text-[#D4AF37]" />
          <span>Tip: Klik kartu anggota manapun untuk menjadikannya pusat bagan, klik tombol <kbd className="bg-white px-1 border rounded text-[9px] shadow-2xs">👁</kbd> di kartu untuk melihat rincian pribadi lengkap.</span>
        </span>
        {focusedMember && (
          <button 
            onClick={() => onSelectMember(focusedMember)}
            className="text-[#D4AF37] hover:text-[#B38728] font-bold flex items-center gap-1 cursor-pointer"
          >
            Lihat Detail {focusedMember.name.split(' ')[0]} →
          </button>
        )}
      </div>

    </div>
  );
}
