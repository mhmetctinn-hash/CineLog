export interface User {
  id: string;
  email: string;
  password_hash: string;
  avatar_url: string | null;
  created_at: Date;
}

export interface AuthPayload {
  userId: string;
  email: string;
}
