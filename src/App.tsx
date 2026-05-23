import React, { useState, useEffect } from 'react';
import { FamilyMember } from './types';
import { INITIAL_FAMILIES } from './initialData';
import Dashboard from './components/Dashboard';
import FamilyTreeViewer from './components/FamilyTreeViewer';
import DataManager from './components/DataManager';
import MemberProfileModal from './components/MemberProfileModal';
import { 
  Users, 
  GitBranch, 
  FolderLock, 
  Home, 
  RefreshCw, 
  Github,
  Heart
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'tree' | 'admin'>('home');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedMemberModal, setSelectedMemberModal] = useState<FamilyMember | null>(null);
  const [focusedMemberId, setFocusedMemberId] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  // Load awal dari localStorage atau fallback ke Demo Data
  useEffect(() => {
    const saved = localStorage.getItem('silsilah_keluargaku_data');
    if (saved) {
      try {
        setMembers(JSON.parse(saved));
      } catch (e) {
        setMembers(INITIAL_FAMILIES);
      }
    } else {
      setMembers(INITIAL_FAMILIES);
      localStorage.setItem('silsilah_keluargaku_data', JSON.stringify(INITIAL_FAMILIES));
    }
  }, []);

  // Enforce reciprocal relations (e.g. Spouse A has Spouse B -> Spouse B must have Spouse A)
  const syncSpouseRelations = (list: FamilyMember[]): FamilyMember[] => {
    let copy = list.map(m => ({ ...m }));
    
    // Reset spouseId referencing people who don't exist anymore
    const memberIds = new Set(copy.map(m => m.id));
    copy = copy.map(m => {
      if (m.spouseId && !memberIds.has(m.spouseId)) {
        return { ...m, spouseId: undefined };
      }
      return m;
    });

    // Jalankan pemetaan dua arah
    copy.forEach(m => {
      if (m.spouseId) {
        const partnerIdx = copy.findIndex(item => item.id === m.spouseId);
        if (partnerIdx !== -1) {
          copy[partnerIdx].spouseId = m.id;
        }
      }
    });

    return copy;
  };

  // Tambah Anggota Baru
  const handleAddMember = (newMember: FamilyMember) => {
    setMembers(prev => {
      let updated = [...prev, newMember];
      updated = syncSpouseRelations(updated);
      localStorage.setItem('silsilah_keluargaku_data', JSON.stringify(updated));
      return updated;
    });
  };

  // Update Anggota yang Diedit
  const handleUpdateMember = (updatedMember: FamilyMember) => {
    setMembers(prev => {
      // Ganti item yang lama
      let updated = prev.map(m => m.id === updatedMember.id ? updatedMember : m);
      
      // Bersihkan kaitan jika ada perubahan pasangan dua arah
      const oldMember = prev.find(m => m.id === updatedMember.id);
      if (oldMember && oldMember.spouseId && oldMember.spouseId !== updatedMember.spouseId) {
        // Hapus link pasangan lama
        updated = updated.map(m => {
          if (m.id === oldMember.spouseId) {
            return { ...m, spouseId: undefined };
          }
          return m;
        });
      }

      updated = syncSpouseRelations(updated);
      localStorage.setItem('silsilah_keluargaku_data', JSON.stringify(updated));
      return updated;
    });
    setEditingMember(null);
  };

  // Hapus Anggota silsilah secara aman
  const handleDeleteMember = (id: string) => {
    setMembers(prev => {
      // 1. Hapus anggotanya
      let updated = prev.filter(m => m.id !== id);
      
      // 2. Putuskan link orang tua & pasangan yang merujuk ke ID yang dihapus
      updated = updated.map(m => {
        const copy = { ...m };
        if (copy.fatherId === id) copy.fatherId = undefined;
        if (copy.motherId === id) copy.motherId = undefined;
        if (copy.spouseId === id) copy.spouseId = undefined;
        return copy;
      });

      updated = syncSpouseRelations(updated);
      localStorage.setItem('silsilah_keluargaku_data', JSON.stringify(updated));
      return updated;
    });

    if (selectedMemberModal?.id === id) {
      setSelectedMemberModal(null);
    }
    if (focusedMemberId === id) {
      setFocusedMemberId(null);
    }
  };

  // Reset data ke setelan pabrik (Demo Data)
  const handleResetToDemo = () => {
    if (window.confirm('Apakah Anda ingin mereset seluruh database silsilah ke contoh silsilah demo bawaan? Semua modifikasi Anda akan digantikan.')) {
      setMembers(INITIAL_FAMILIES);
      localStorage.setItem('silsilah_keluargaku_data', JSON.stringify(INITIAL_FAMILIES));
      setFocusedMemberId(null);
      setSelectedMemberModal(null);
      setEditingMember(null);
      setActiveTab('home');
    }
  };

  // Navigasi cepat dari modal profil ke bagan terpilih
  const handleNavigateToMember = (id: string) => {
    const found = members.find(m => m.id === id);
    if (found) {
      setFocusedMemberId(found.id);
      setSelectedMemberModal(found);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-slate-800 flex flex-col justify-between font-sans selection:bg-[#D4AF37]/30">
      
      {/* 1. Header & Navigasi Global (Disembunyikan saat CETAK PDF lewat class no-print) */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#EFE9DD] shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Judul Aplikasi */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#0F172A] text-[#FCF6BA] shadow-md flex items-center justify-center shrink-0">
              <Users size={22} className="text-[#D4AF37]" />
            </div>
            <div>
              <h1 className="font-serif font-extrabold text-lg sm:text-xl text-[#1E293B] tracking-tight flex items-center gap-1.5 leading-none">
                Silsilah KeluargaKu
              </h1>
              <span className="text-[10px] text-[#B38728] font-bold tracking-widest uppercase mt-0.5 block">
                Pelacak Garis Keturunan
              </span>
            </div>
          </div>

          {/* Navigasi Utama */}
          <nav className="flex items-center gap-1.5 sm:gap-3 bg-[#FAF6F0]/80 p-1 rounded-2xl border border-[#EFE9DD]">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'home' 
                  ? 'bg-[#1E293B] text-[#FCF6BA] shadow-md' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Home size={14} />
              <span className="hidden md:inline">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('tree')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tree' 
                  ? 'bg-[#1E293B] text-[#FCF6BA] shadow-md' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <GitBranch size={14} />
              <span>Pohon Silsilah</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'admin' 
                  ? 'bg-[#1E293B] text-[#FCF6BA] shadow-md' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <FolderLock size={14} />
              <span>Kelola Data</span>
            </button>
          </nav>

          {/* Sisi Kanan: Reset Playground */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={handleResetToDemo}
              className="flex items-center gap-1.5 bg-white border border-[#EFE9DD] hover:border-amber-200 text-slate-500 hover:text-amber-800 text-xs font-bold p-2 px-3 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              title="Reset Database ke data demo"
            >
              <RefreshCw size={13} className="animate-spin-slow" />
              <span>Reset Data Demo</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. Main Container Body Area (Disediakan space layout untuk cetak PDF) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        
        {/* Render Tab Konten Terpilih secara Conditional */}
        <div className="no-print">
          {activeTab === 'home' && (
            <Dashboard 
              members={members} 
              onNavigate={(tab) => setActiveTab(tab)}
              onQuickAdd={() => {
                setActiveTab('admin');
                setEditingMember(null);
              }}
            />
          )}

          {activeTab === 'tree' && (
            <FamilyTreeViewer
              members={members}
              onSelectMember={(m) => setSelectedMemberModal(m)}
              focusedMemberId={focusedMemberId}
              setFocusedMemberId={setFocusedMemberId}
            />
          )}

          {activeTab === 'admin' && (
            <DataManager
              members={members}
              onAddMember={handleAddMember}
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
              editingMember={editingMember}
              setEditingMember={setEditingMember}
            />
          )}
        </div>

        {/* PRINT ONLY: Merender halaman cetak yang dilarikan dari DataManager */}
        <div className="hidden print-only block">
          <DataManager
            members={members}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            editingMember={editingMember}
            setEditingMember={setEditingMember}
          />
        </div>

      </main>

      {/* 3. Detail Profile Modal Overlay */}
      {selectedMemberModal && (
        <MemberProfileModal
          member={selectedMemberModal}
          allMembers={members}
          onClose={() => setSelectedMemberModal(null)}
          onNavigateToMember={handleNavigateToMember}
          onEdit={(m) => {
            setEditingMember(m);
            setActiveTab('admin');
          }}
        />
      )}

      {/* 4. Footer (Disembunyikan saat CETAK PDF lewat class no-print) */}
      <footer className="bg-white border-t border-[#EFE9DD] py-6 text-center text-xs text-slate-400 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="flex items-center gap-1 justify-center sm:justify-start font-medium text-slate-400 leading-tight">
            © {new Date().getFullYear()} 🏛 Silsilah KeluargaKu. Melestarikan Tradisi dan Jejak Hubungan Antar Generasi.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={handleResetToDemo}
              className="text-[#D4AF37] hover:text-[#B38728] font-bold cursor-pointer"
            >
              Muat Ulang Demo Silsilah
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
