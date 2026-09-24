export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  accent: string;
  is_guest: boolean;
  created_at: string;
  updated_at: string;
}