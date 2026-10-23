export type Role = 'leitor' | 'redator' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  created_at: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface PostRow {
  id: number;
  title: string;
  content: string;
  author_id: number;
  author_name?: string;
  published: number;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  author_id: number;
  author_name?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  comments?: Comment[];
}

export interface CommentRow {
  id: number;
  post_id: number;
  author_id: number;
  author_name?: string;
  content: string;
  created_at: string;
}

export interface Comment {
  id: number;
  post_id: number;
  author_id: number;
  author_name?: string;
  content: string;
  created_at: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
