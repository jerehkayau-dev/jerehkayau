import React from 'react';
import { FamilyMember } from '../types';
import { getAge, formatIndonesianDate } from '../utils';
import { X, User, Phone, MapPin, Mail, Calendar, Heart, Shield, Users, ArrowUpRight } from 'lucide-react';

interface MemberProfileModalProps {
  member: FamilyMember;
  allMembers: FamilyMember[];
  onClose: () => void;
  onNavigateToMember: (id: string) => void;
  onEdit?: (m: FamilyMember) => void;
}

export default function MemberProfileModal({
  member,
  allMembers,
  onClose,
  onNavigateToMember,
  onEdit
}: MemberProfileModalProps) {
  const age = getAge(member.birthDate, member.isDeceased, member.deathDate);

  // Cari orang tua, pasangan, anak-anak, dan saudara kandung
  const father = allMembers.find(m => m.id === member.fatherId);
  const mother = allMembers.find(m => m.id === member.motherId);
  const spouse = allMembers.find(m => m.id === member.spouseId);
  const children = allMembers.filter(m => m.fatherId === member.id || m.motherId === member.id);
  
  // Saudara kandung (ayah sama atau ibu sama)
  const siblings = allMembers.filter(m => 
    m.id !== member.id && 
    ((member.fatherId && m.fatherId === member.fatherId) || 
     (member.motherId && m.motherId === member.motherId))
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-[#FAF6F0] rounded-2xl w-full max-w-2xl border border-[#EFE9DD] shadow-xl overflow-hidden my-8">
        
        {/* Header Visual */}
        <div className="relative h-32 bg-linear-to-r from-[#D4AF37]/20 via-[#1E293B] to-[#0F172A] p-6 flex items-end justify-between">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 p-2 rounded-full text-white transition-all cursor-pointer"
            title="Tutup"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-4 translate-y-10">
            {member.photo ? (
              <img 
                src={member.photo} 
                alt={member.name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-2xl border-4 border-[#FAF6F0] object-cover bg-white shadow-md"
              />
            ) : (
              <div className={`w-20 h-20 rounded-2xl border-4 border-[#FAF6F0] flex items-center justify-center shadow-md font-serif text-2xl font-bold ${
                member.gender === 'Laki-laki' 
                  ? 'bg-sky-100 text-sky-700' 
                  : 'bg-rose-100 text-rose-700'
              }`}>
                {member.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
              </div>
            )}
            
            <div className="bg-[#FAF6F0] px-3 py-1.5 rounded-lg shadow-xs">
              <h3 className="font-serif font-bold text-lg text-[#1E293B] leading-tight">
                {member.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {member.gender} {member.isDeceased ? '(Almarhum/ah)' : `(Usia ${age} Tahun)`}
              </p>
            </div>
          </div>

          {onEdit && (
            <button
              onClick={() => {
                onEdit(member);
                onClose();
              }}
              className="bg-[#D4AF37] hover:bg-[#B38728] text-[#1E293B] px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Edit Data
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="pt-14 p-6 space-y-6">
          
          {/* Baris Informasi Pribadi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
            <div className="bg-white p-3.5 rounded-xl border border-[#EFE9DD] space-y-3">
              <div className="flex items-center gap-2 text-slate-700 font-medium border-b border-slate-100 pb-1.5">
                <Calendar size={16} className="text-[#D4AF37]" />
                <span>Kelahiran & Status</span>
              </div>
              <div className="space-y-1 text-xs">
                <p><span className="text-slate-400">Tempat Lahir:</span> <span className="font-medium text-slate-800">{member.birthPlace || 'Tidak diketahui'}</span></p>
                <p><span className="text-slate-400">Tanggal Lahir:</span> <span className="font-medium text-slate-800">{formatIndonesianDate(member.birthDate)}</span></p>
                {member.isDeceased && (
                  <p className="text-rose-600 font-medium">
                    Wafat: {formatIndonesianDate(member.deathDate)} (Wafat pada usia {getAge(member.birthDate, true, member.deathDate)} tahun)
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-[#EFE9DD] space-y-3">
              <div className="flex items-center gap-2 text-slate-700 font-medium border-b border-slate-100 pb-1.5">
                <Phone size={16} className="text-[#D4AF37]" />
                <span>Kontak & Alamat</span>
              </div>
              <div className="space-y-1 text-xs">
                <p><span className="text-slate-400">Nomor Telepon:</span> <span className="font-medium text-slate-800">{member.phone || '-'}</span></p>
                <p><span className="text-slate-400">E-mail:</span> <span className="font-medium text-slate-800">{member.email || '-'}</span></p>
                <p className="line-clamp-2"><span className="text-slate-400">Alamat:</span> <span className="font-medium text-slate-800">{member.address || '-'}</span></p>
              </div>
            </div>
          </div>

          {/* Catatan Tambahan */}
          {member.notes && (
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-sm">
              <span className="font-bold text-amber-800 block mb-1">Catatan / Riwayat Singkat:</span>
              <p className="text-slate-700 leading-relaxed text-xs italic">"{member.notes}"</p>
            </div>
          )}

          {/* Hubungan Keluarga / Relasi */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-[#1E293B] text-md flex items-center gap-2 border-b border-[#EFE9DD] pb-2">
              <Users size={18} className="text-[#D4AF37]" /> Hubungan Keluarga Terdekat
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Box 1: Orang Tua & Pasangan */}
              <div className="space-y-3">
                
                {/* Orang Tua */}
                <div className="bg-white p-3 rounded-xl border border-[#EFE9DD] space-y-2">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Orang Tua Kandung</span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Ayah:</span>
                      {father ? (
                        <button 
                          onClick={() => onNavigateToMember(father.id)}
                          className="text-[#D4AF37] hover:text-[#B38728] font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
                        >
                          {father.name} <ArrowUpRight size={12} />
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">Belum didata</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Ibu:</span>
                      {mother ? (
                        <button 
                          onClick={() => onNavigateToMember(mother.id)}
                          className="text-[#D4AF37] hover:text-[#B38728] font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
                        >
                          {mother.name} <ArrowUpRight size={12} />
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">Belum didata</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pasangan */}
                <div className="bg-white p-3 rounded-xl border border-[#EFE9DD] space-y-2">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Pasangan (Suami/Istri)</span>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Pasangan:</span>
                    {spouse ? (
                      <button 
                        onClick={() => onNavigateToMember(spouse.id)}
                        className="text-[#D4AF37] hover:text-[#B38728] font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        {spouse.name} <ArrowUpRight size={12} />
                      </button>
                    ) : (
                      <span className="text-slate-400 italic">Belum menikah / belum didata</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Box 2: Sibling & Anak */}
              <div className="space-y-3">
                
                {/* Saudara Kandung */}
                <div className="bg-white p-3 rounded-xl border border-[#EFE9DD] space-y-2 max-h-32 overflow-y-auto">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">Saudara Kandung ({siblings.length})</span>
                  {siblings.length > 0 ? (
                    <div className="space-y-1">
                      {siblings.map(sib => (
                        <div key={sib.id} className="flex justify-between items-center text-xs">
                          <span className="text-slate-600 font-medium truncate max-w-[150px]">{sib.name}</span>
                          <button 
                            onClick={() => onNavigateToMember(sib.id)}
                            className="text-xs text-[#D4AF37] hover:text-[#B38728] font-bold flex items-center gap-0.5 cursor-pointer"
                          >
                            Lihat <ArrowUpRight size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic block">Tidak ada / anak tunggal</span>
                  )}
                </div>

                {/* Anak-anak */}
                <div className="bg-white p-3 rounded-xl border border-[#EFE9DD] space-y-2 max-h-32 overflow-y-auto">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">Anak-anak ({children.length})</span>
                  {children.length > 0 ? (
                    <div className="space-y-1">
                      {children.map(child => (
                        <div key={child.id} className="flex justify-between items-center text-xs">
                          <span className="text-slate-600 font-medium truncate max-w-[150px]">{child.name}</span>
                          <button 
                            onClick={() => onNavigateToMember(child.id)}
                            className="text-xs text-[#D4AF37] hover:text-[#B38728] font-bold flex items-center gap-0.5 cursor-pointer"
                          >
                            Lihat <ArrowUpRight size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic block">Belum memiliki anak terdaftar</span>
                  )}
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#FAF4E8]/60 px-6 py-4 border-t border-[#EFE9DD] flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1E293B] hover:bg-slate-800 text-white transition-colors cursor-pointer"
          >
            Tutup Detail
          </button>
        </div>

      </div>
    </div>
  );
}
