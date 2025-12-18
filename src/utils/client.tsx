import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// 싱글톤 Supabase 클라이언트
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);
