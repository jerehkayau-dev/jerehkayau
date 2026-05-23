export interface FamilyMember {
  id: string;
  name: string;
  gender: 'Laki-laki' | 'Perempuan';
  birthDate: string; // YYYY-MM-DD
  birthPlace?: string;
  isDeceased?: boolean;
  deathDate?: string; // YYYY-MM-DD
  phone?: string;
  email?: string;
  address?: string;
  photo?: string; // Base64 string or image URL
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  notes?: string;
}

export interface FamilyStats {
  totalMembers: number;
  totalGenerations: number;
  maleCount: number;
  femaleCount: number;
  averageAge: number;
  livingCount: number;
  deceasedCount: number;
}
