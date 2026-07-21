export interface User {
  id: string;
  email: string;
  password_hash: string;
  avatar_url: string | null;
  created_at: Date;
  reset_token_hash?: string | null;
  reset_token_expires?: Date | null;
}

export interface AuthPayload {
  userId: string;
  email: string;
}
