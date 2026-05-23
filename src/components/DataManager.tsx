import React, { useState, useRef } from 'react';
import { FamilyMember } from '../types';
import { getAge, formatIndonesianDate, exportToCSV } from '../utils';
import { 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Download, 
  Printer, 
  Upload, 
  UserPlus, 
  Search, 
  Filter, 
  HelpCircle,
  X,
  FileSpreadsheet
} from 'lucide-react';

interface DataManagerProps {
  members: FamilyMember[];
  onAddMember: (member: FamilyMember) => void;
  onUpdateMember: (member: FamilyMember) => void;
  onDeleteMember: (id: string) => void;
  editingMember: FamilyMember | null;
  setEditingMember: (m: FamilyMember | null) => void;
}

export default function DataManager({
  members,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  editingMember,
  setEditingMember
}: DataManagerProps) {
  // Model form state
  const [formData, setFormData] = useState<{
    name: string;
    gender: 'Laki-laki' | 'Perempuan';
    birthDate: string;
    birthPlace: string;
    isDeceased: boolean;
    deathDate: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
    photo: string;
    fatherId: string;
    motherId: string;
    spouseId: string;
  }>({
    name: '',
    gender: 'Laki-laki',
    birthDate: '',
    birthPlace: '',
    isDeceased: false,
    deathDate: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    photo: '',
    fatherId: '',
    motherId: '',
    spouseId: '',
  });

  const [searchTable, setSearchTable] = useState('');
  const [genderFilter, setGenderFilter] = useState<'Semua' | 'Laki-laki' | 'Perempuan'>('Semua');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Hidup' | 'Wafat'>('Semua');
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto RELATION mode helper state
  const [relationHelper, setRelationHelper] = useState<{
    type: 'none' | 'child' | 'spouse';
    targetMemberId: string;
  }>({ type: 'none', targetMemberId: '' });

  // Sinkronisasi data ketika sedang EDIT
  React.useEffect(() => {
    if (editingMember) {
      setFormData({
        name: editingMember.name,
        gender: editingMember.gender,
        birthDate: editingMember.birthDate || '',
        birthPlace: editingMember.birthPlace || '',
        isDeceased: editingMember.isDeceased || false,
        deathDate: editingMember.deathDate || '',
        phone: editingMember.phone || '',
        email: editingMember.email || '',
        address: editingMember.address || '',
        notes: editingMember.notes || '',
        photo: editingMember.photo || '',
        fatherId: editingMember.fatherId || '',
        motherId: editingMember.motherId || '',
        spouseId: editingMember.spouseId || '',
      });
      setRelationHelper({ type: 'none', targetMemberId: '' });
    } else {
      resetForm();
    }
  }, [editingMember]);

  const resetForm = () => {
    setFormData({
      name: '',
      gender: 'Laki-laki',
      birthDate: '',
      birthPlace: '',
      isDeceased: false,
      deathDate: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      photo: '',
      fatherId: '',
      motherId: '',
      spouseId: '',
    });
    setEditingMember(null);
    setRelationHelper({ type: 'none', targetMemberId: '' });
    setPhotoError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handler kompresi foto di sisi client
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Berkas harus berupa gambar JPG/PNG!');
      return;
    }

    setPhotoError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Gambarkan ke canvas kecil untuk memperkecil ukuran base64 (agar hemat localStorage)
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFormData(prev => ({ ...prev, photo: dataUrl }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Submit data ke database silsilah
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const memberPayload: FamilyMember = {
      id: editingMember ? editingMember.id : 'm_' + Date.now(),
      name: formData.name.trim(),
      gender: formData.gender,
      birthDate: formData.birthDate,
      birthPlace: formData.birthPlace,
      isDeceased: formData.isDeceased,
      deathDate: formData.isDeceased ? formData.deathDate : undefined,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      notes: formData.notes,
      photo: formData.photo || undefined,
      fatherId: formData.fatherId || undefined,
      motherId: formData.motherId || undefined,
      spouseId: formData.spouseId || undefined,
    };

    if (editingMember) {
      onUpdateMember(memberPayload);
    } else {
      onAddMember(memberPayload);
    }

    resetForm();
  };

  // Aktifkan relasi asisten otomatis
  const handleApplyRelationHelper = (type: 'child' | 'spouse', id: string) => {
    const target = members.find(m => m.id === id);
    if (!target) return;

    resetForm();
    setRelationHelper({ type, targetMemberId: id });

    if (type === 'child') {
      // Tambah Anak dari Ayah X atau Ibu Y
      if (target.gender === 'Laki-laki') {
        // target adalah bapak
        setFormData(prev => ({
          ...prev,
          fatherId: target.id,
          motherId: target.spouseId || '',
          address: target.address || '',
        }));
      } else {
        // target adalah ibu
        setFormData(prev => ({
          ...prev,
          motherId: target.id,
          fatherId: target.spouseId || '',
          address: target.address || '',
        }));
      }
    } else if (type === 'spouse') {
      // Tambah Pasangan dari X
      setFormData(prev => ({
        ...prev,
        spouseId: target.id,
        gender: target.gender === 'Laki-laki' ? 'Perempuan' : 'Laki-laki', // Pasangkan beda kelamin
        address: target.address || '',
      }));
    }

    // Scroll form ke atas
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Filter anggota keluarga untuk tabel
  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTable.toLowerCase()) || 
                          (m.birthPlace && m.birthPlace.toLowerCase().includes(searchTable.toLowerCase()));
    const matchesGender = genderFilter === 'Semua' || m.gender === genderFilter;
    const matchesStatus = statusFilter === 'Semua' || 
                          (statusFilter === 'Hidup' && !m.isDeceased) || 
                          (statusFilter === 'Wafat' && m.isDeceased);
    return matchesSearch && matchesGender && matchesStatus;
  });

  // Aksi Cetak PDF/Print Tabular Roster
  const handlePrintPDF = () => {
    window.print();
  };

  // Temukan nama orang tua & pasangan untuk tabel
  const getRelativeName = (id: string | undefined) => {
    if (!id) return '-';
    const found = members.find(m => m.id === id);
    return found ? found.name : '-';
  };

  return (
    <div className="space-y-10">
      
      {/* 1. SEKSI FORMULIR INPUT / EDIT */}
      <div className="bg-white rounded-3xl border border-[#EFE9DD] overflow-hidden shadow-xs">
        <div className="bg-[#FAF6F0] p-6 border-b border-[#EFE9DD] flex justify-between items-center">
          <div>
            <h3 className="font-serif font-bold text-xl text-[#1E293B] flex items-center gap-2">
              <UserPlus className="text-[#D4AF37]" size={20} />
              {editingMember ? 'Edit Data Anggota Keluarga' : 'Tambah Anggota Keluarga Baru'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {editingMember 
                ? `Memperbarui rincian silsilah asli untuk ${editingMember.name}` 
                : 'Lengkapi rincian profil di bawah ini untuk memperluas bagan silsilah.'}
            </p>
          </div>
          
          {(editingMember || relationHelper.type !== 'none') && (
            <button
              onClick={resetForm}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Batal / bersihkan Form
            </button>
          )}
        </div>

        {/* Notifikasi Asisten Relasi Otomatis */}
        {relationHelper.type !== 'none' && (
          <div className="bg-amber-50 p-4 border-b border-amber-200/60 flex items-center justify-between text-xs text-amber-900 font-medium">
            <span className="flex items-center gap-2">
              <span className="p-1 px-2.5 rounded-full bg-amber-200 text-amber-800 font-bold uppercase text-[9px]">Asisten Aktif</span>
              <span>
                Menghubungkan otomatis sebagai{' '}
                <strong>
                  {relationHelper.type === 'child' ? 'Anak' : 'Pasangan'} dari{' '}
                  {getRelativeName(relationHelper.targetMemberId)}
                </strong>
                .
              </span>
            </span>
            <button 
              onClick={resetForm}
              className="text-[#B38728] hover:text-[#AA771C] font-bold"
            >
              Lepas Kaitan
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Kiri: Foto */}
            <div className="col-span-1 md:col-span-3 flex flex-col items-center space-y-3 p-4 bg-[#FAF6F0]/40 rounded-xl border border-[#EFE9DD]">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Foto Profil</span>
              
              {formData.photo ? (
                <div className="relative group">
                  <img 
                    src={formData.photo} 
                    alt="Upload preview" 
                    referrerPolicy="no-referrer"
                    className="w-28 h-28 rounded-2xl object-cover bg-white border border-slate-200 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
                    className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-md hover:scale-105 transition-transform cursor-pointer"
                    title="Hapus foto"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className={`w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-3 text-slate-400 bg-white ${
                  formData.gender === 'Laki-laki' ? 'hover:bg-sky-50/20' : 'hover:bg-rose-50/20'
                }`}>
                  <Upload size={22} className="mb-1 text-slate-400" />
                  <span className="text-[10px] font-medium leading-tight">Drag / Pilih JPG Profil</span>
                </div>
              )}

              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-uploader"
              />
              <label 
                htmlFor="photo-uploader"
                className="bg-[#D4AF37] hover:bg-[#B38728] text-[#1E293B] text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer text-center w-full shadow-xs transition-colors"
              >
                Pilih Foto
              </label>
              {photoError && <p className="text-[10px] text-rose-500 font-medium text-center">{photoError}</p>}
              <p className="text-[9px] text-slate-400 text-center leading-tight">Direkomendasikan rasio kotak, maksimal 5MB JPG/PNG.</p>
            </div>

            {/* Kanan: Input Form Fields */}
            <div className="col-span-1 md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Nama Lengkap */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Raden Mas Danang Wijaya"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl px-3 py-2 text-xs outline-hidden transition-all shadow-2xs"
                />
              </div>

              {/* Jenis Kelamin */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Jenis Kelamin *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, gender: 'Laki-laki' }))}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      formData.gender === 'Laki-laki'
                        ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Laki-laki
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, gender: 'Perempuan' }))}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      formData.gender === 'Perempuan'
                        ? 'bg-rose-400 text-white border-rose-500 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Perempuan
                  </button>
                </div>
              </div>

              {/* Tempat Lahir */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Tempat Lahir</label>
                <input
                  type="text"
                  placeholder="Contoh: Yogyakarta"
                  value={formData.birthPlace}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthPlace: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl px-3 py-2 text-xs outline-hidden transition-all shadow-2xs"
                />
              </div>

              {/* Tanggal Lahir */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Tanggal Lahir *</label>
                <input
                  type="date"
                  required
                  value={formData.birthDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl px-3 py-2 text-xs outline-hidden transition-all shadow-2xs"
                />
              </div>

              {/* Status Hidup / Wafat Toggle */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between col-span-1 md:col-span-2">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-700 block">Apakah Anggota ini Sudah Wafat?</span>
                  <span className="text-[10px] text-slate-400 block">Mencegah kalkulasi umur hidup & memberi tanda almarhum.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isDeceased: !prev.isDeceased, deathDate: !prev.isDeceased ? prev.deathDate : '' }))}
                  className={`p-2 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    formData.isDeceased
                      ? 'bg-rose-500 text-white border-rose-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {formData.isDeceased ? 'Ya, Wafat / Almarhum/ah' : 'Tidak, Masih Hidup'}
                </button>
              </div>

              {/* Input Tanggal Wafat - Hanya muncul jika Wafat */}
              {formData.isDeceased && (
                <div className="space-y-1.5 col-span-1 md:col-span-2">
                  <label className="text-xs font-bold text-rose-600">Tanggal Wafat (Opsional)</label>
                  <input
                    type="date"
                    value={formData.deathDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, deathDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-rose-200 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-3 py-2 text-xs outline-hidden transition-all shadow-2xs"
                  />
                </div>
              )}

              {/* No Telepon */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Nomor Telepon</label>
                <input
                  type="tel"
                  placeholder="Contoh: 0812xxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl px-3 py-2 text-xs outline-hidden transition-all shadow-2xs"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Alamat E-mail</label>
                <input
                  type="email"
                  placeholder="Contoh: nama@mail.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl px-3 py-2 text-xs outline-hidden transition-all shadow-2xs"
                />
              </div>

              {/* Alamat Rumah */}
              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Alamat Lengkap</label>
                <input
                  type="text"
                  placeholder="Contoh: Perumahan Indah Mulia No. 4, Jakarta Barat"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl px-3 py-2 text-xs outline-hidden transition-all shadow-2xs"
                />
              </div>

              {/* RELASI SECTION */}
              <div className="col-span-1 md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                <h5 className="text-xs font-bold text-slate-700 tracking-wider mb-3 flex items-center gap-1">
                  🖇 Kaitan Hubungan Keluarga (Relasi Manual)
                </h5>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Pilihan Ayah */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">Ayah Kandung</label>
                    <select
                      value={formData.fatherId}
                      onChange={(e) => setFormData(prev => ({ ...prev, fatherId: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-hidden shadow-2xs cursor-pointer"
                    >
                      <option value="">-- Tanpa Bapak --</option>
                      {members.filter(m => m.gender === 'Laki-laki' && m.id !== editingMember?.id).map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Pilihan Ibu */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">Ibu Kandung</label>
                    <select
                      value={formData.motherId}
                      onChange={(e) => setFormData(prev => ({ ...prev, motherId: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-hidden shadow-2xs cursor-pointer"
                    >
                      <option value="">-- Tanpa Ibu --</option>
                      {members.filter(m => m.gender === 'Perempuan' && m.id !== editingMember?.id).map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Pilihan Pasangan */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">Pasangan (Suami/Istri)</label>
                    <select
                      value={formData.spouseId}
                      onChange={(e) => setFormData(prev => ({ ...prev, spouseId: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-hidden shadow-2xs cursor-pointer"
                    >
                      <option value="">-- Tanpa Pasangan --</option>
                      {members.filter(m => m.id !== editingMember?.id).map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.gender === 'Laki-laki' ? 'Pria' : 'Wanita'})</option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>

              {/* Catatan Riwayat singkat */}
              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Catatan Lain / Riwayat Hidup Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Ceritakan sejarah hobi, prestasi, karir, atau cerita kehidupan penting untuk diwariskan..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl px-3 py-2 text-xs outline-hidden transition-all shadow-2xs"
                />
              </div>

            </div>

          </div>

          <div className="border-t border-slate-100 pt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Batal / Reset
            </button>
            <button
              type="submit"
              className="bg-[#1E293B] hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all scale-hover cursor-pointer"
            >
              <PlusCircle size={15} />
              {editingMember ? 'Update Profil Silsilah' : 'Simpan Profil & Sambungkan'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. SEKSI TABEL DAFTAR ANGGOTA LENGKAP */}
      <div className="bg-white rounded-3xl border border-[#EFE9DD] overflow-hidden shadow-xs no-print">
        
        {/* Table Filters Header */}
        <div className="p-6 bg-[#FAF6F0] border-b border-[#EFE9DD] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#1E293B]">
                Manajemen Basis Data Silsilah
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Seluruh daftar keturunan dan anggota keluarga besar terstruktur rapi.
              </p>
            </div>
            
            {/* Export Actions */}
            <div className="flex gap-2.5">
              <button
                onClick={() => exportToCSV(members)}
                className="bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                title="Unduh format spreadsheet CSV"
              >
                <FileSpreadsheet size={14} />
                Ekspor Ke Sheets / Excel
              </button>
              
              <button
                onClick={handlePrintPDF}
                className="bg-[#1E293B] hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="Download format cetak PDF"
              >
                <Printer size={14} />
                Cetak Roster (PDF)
              </button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
            
            <div className="sm:col-span-6 relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Cari berdasarkan nama atau tempat lahir..."
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                className="w-full bg-white border border-[#EFE9DD] rounded-xl pl-9 pr-4 py-2 text-xs outline-hidden shadow-2xs focus:border-[#D4AF37]"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value as any)}
                className="w-full bg-white border border-[#EFE9DD] rounded-xl px-3 py-2 text-xs outline-hidden shadow-2xs cursor-pointer"
              >
                <option value="Semua">Semua Kelamin</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full bg-white border border-[#EFE9DD] rounded-xl px-3 py-2 text-xs outline-hidden shadow-2xs cursor-pointer"
              >
                <option value="Semua">Semua Status</option>
                <option value="Hidup">Masih Hidup</option>
                <option value="Wafat">Selesai / Wafat</option>
              </select>
            </div>

          </div>
        </div>

        {/* Database Roster Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-[#EFE9DD] text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3.5 px-6">Foto</th>
                <th className="py-3.5 px-4">Nama Lengkap</th>
                <th className="py-3.5 px-4">Jenis Kelamin</th>
                <th className="py-3.5 px-4">Tanggal & Tempat Lahir</th>
                <th className="py-3.5 px-4">Relasi Terkait</th>
                <th className="py-3.5 px-4 text-center">Asisten Relasi</th>
                <th className="py-3.5 px-6 text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9DD]/50 text-xs text-slate-700">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-[#FAF6F0]/20 transition-colors">
                    
                    {/* Foto */}
                    <td className="py-3 px-6 whitespace-nowrap">
                      {m.photo ? (
                        <img 
                          src={m.photo} 
                          alt={m.name} 
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-lg object-cover bg-slate-50 border border-slate-100 shadow-2xs"
                        />
                      ) : (
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-extrabold shadow-2xs ${
                          m.gender === 'Laki-laki' ? 'bg-sky-50 text-sky-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {m.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                        </div>
                      )}
                    </td>

                    {/* Nama */}
                    <td className="py-3 px-4 font-serif font-bold text-slate-800 text-sm">
                      <div>
                        {m.name}
                        {m.isDeceased && (
                          <span className="ml-2 inline-block px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[9px] font-sans font-bold uppercase">
                            Wafat
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Gender */}
                    <td className="py-3 px-4">
                      <span className={`p-1 px-2 rounded-full font-bold text-[9px] uppercase ${
                        m.gender === 'Laki-laki' 
                          ? 'bg-sky-50 text-sky-600' 
                          : 'bg-rose-50 text-rose-500'
                      }`}>
                        {m.gender}
                      </span>
                    </td>

                    {/* Tempat / Tgl Lahir */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{m.birthPlace || 'Yogyakarta'}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{formatIndonesianDate(m.birthDate)}</div>
                    </td>

                    {/* Relasi Utama */}
                    <td className="py-3 px-4 text-[11px] space-y-0.5 text-slate-500">
                      <div><span className="font-medium text-slate-400">Ayah:</span> {getRelativeName(m.fatherId)}</div>
                      <div><span className="font-medium text-slate-400">Ibu:</span> {getRelativeName(m.motherId)}</div>
                      <div><span className="font-medium text-slate-400">Pasangan:</span> {getRelativeName(m.spouseId)}</div>
                    </td>

                    {/* Asisten Relasi Otomatis (Tambah Anak / Pasangan) */}
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-1.5">
                        
                        <button
                          onClick={() => handleApplyRelationHelper('child', m.id)}
                          className="bg-white text-[#D4AF37] hover:bg-amber-50 border border-amber-200/50 p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title={`Tambah Anak kandung dari ${m.name}`}
                        >
                          + Anak
                        </button>

                        {!m.spouseId && (
                          <button
                            onClick={() => handleApplyRelationHelper('spouse', m.id)}
                            className="bg-white text-rose-500 hover:bg-rose-50/50 border border-rose-100 p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title={`Tambah Pasangan Suami/Itri untuk ${m.name}`}
                          >
                            + Pasangan
                          </button>
                        )}

                      </div>
                    </td>

                    {/* Aksi Edit / Hapus */}
                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        
                        <button
                          onClick={() => setEditingMember(m)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                          title="Ubah rincian profil"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Apakah Anda yakin ingin menghapus data silsilah ${m.name}? Semua kaitan parental juga akan terputus.`)) {
                              onDeleteMember(m.id);
                            }
                          }}
                          className="p-1.5 text-rose-400 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer transition-colors"
                          title="Hapus profil dari database"
                        >
                          <Trash2 size={14} />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic font-medium">
                    Tidak ada anggota keluarga terdaftar yang sesuai dengan filter pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Info Box Footer */}
        <div className="p-4 bg-slate-50 border-t border-[#EFE9DD] flex items-center gap-2 text-[11px] text-slate-500">
          <HelpCircle size={14} className="text-[#D4AF37]" />
          <span>Anda dapat menyalin data yang Anda unduh via "Ekspor Ke Sheets" tepat di dalam aplikasi Google Sheets Anda dengan sangat mudah.</span>
        </div>

      </div>

      {/* 3. PRINT TAMPILAN KHUSUS LAPORAN PDF (Akan terlihat HANYA SAAT CETAK / CTR+P) */}
      <div className="hidden print-only p-8 bg-white font-sans text-stone-900 space-y-6">
        <div className="text-center pb-6 border-b-2 border-stone-800">
          <h1 className="font-serif text-3xl font-extrabold tracking-tight">LAPORAN ROSTER SILSILAH KELUARGA LENGKAP</h1>
          <p className="text-sm font-semibold tracking-widest text-[#B38728] uppercase mt-1">SILSILAH KELUARGAKU</p>
          <p className="text-xs text-stone-500 mt-2">Dicetak otomatis dari portal pada {new Date().toLocaleDateString('id-ID')}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center py-4 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold">
          <div>
            <span className="text-stone-500 block uppercase text-[10px]">Total Keluarga</span>
            <span className="text-xl font-bold">{members.length} Anggota</span>
          </div>
          <div>
            <span className="text-stone-500 block uppercase text-[10px]">Rata Usia</span>
            <span className="text-xl font-bold">{members.filter(m => !m.isDeceased).reduce((sum,m)=>sum + getAge(m.birthDate), 0) / (members.filter(m => !m.isDeceased).length || 1) | 0} Thn</span>
          </div>
          <div>
            <span className="text-stone-500 block uppercase text-[10px]">Status Hidup</span>
            <span className="text-xl font-bold">{members.filter(m => !m.isDeceased).length} Hidup / {members.filter(m => m.isDeceased).length} Wafat</span>
          </div>
        </div>

        <div className="mt-4">
          <table className="w-full text-left text-xs border border-stone-300">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-300 text-stone-700 uppercase font-bold text-[9px] tracking-wider">
                <th className="p-2 border-r border-stone-300">No</th>
                <th className="p-2 border-r border-stone-300">Nama Lengkap</th>
                <th className="p-2 border-r border-stone-300">Jenis Kelamin</th>
                <th className="p-2 border-r border-stone-300">Lahir & Umur</th>
                <th className="p-2 border-r border-stone-300">Hubungan Keluarga</th>
                <th className="p-2">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-300">
              {members.map((m, index) => (
                <tr key={m.id} className="align-top">
                  <td className="p-2 border-r border-stone-300 text-center font-bold">{index + 1}</td>
                  <td className="p-2 border-r border-stone-300 font-serif font-bold">
                    {m.name} {m.isDeceased && '(Alm/ah)'}
                  </td>
                  <td className="p-2 border-r border-stone-300 font-semibold">{m.gender}</td>
                  <td className="p-2 border-r border-stone-300 text-[11px]">
                    <div>{m.birthPlace}, {formatIndonesianDate(m.birthDate)}</div>
                    <div className="font-bold text-stone-500 mt-0.5">
                      {m.isDeceased ? `Wafat pada usia ${getAge(m.birthDate, true, m.deathDate)}` : `Usia ${getAge(m.birthDate)} tahun`}
                    </div>
                  </td>
                  <td className="p-2 border-r border-stone-300 text-[10px] text-stone-700">
                    <div><strong>Ayah:</strong> {getRelativeName(m.fatherId)}</div>
                    <div><strong>Ibu:</strong> {getRelativeName(m.motherId)}</div>
                    <div><strong>Suami/Istri:</strong> {getRelativeName(m.spouseId)}</div>
                  </td>
                  <td className="p-2 text-[10px] text-stone-600 italic">
                    {m.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center pt-8 border-t border-dashed border-stone-300 mt-12 text-[10px] text-stone-400">
          Laporan ini dilindungi oleh arsip digital Silsilah KeluargaKu. Seluruh arsip di atas dilestarikan untuk penerus generasi mendatang.
        </div>
      </div>

    </div>
  );
}
