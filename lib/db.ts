import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://egsvtmoauwwtsmecwalz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnc3Z0bW9hdXd3dHNtZWN3YWx6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ5MjYzOCwiZXhwIjoyMDkwMDY4NjM4fQ.Xma8w3NVuZHxgrnkT_o2aUyq03Yl1boLeehzmvl1DCQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
