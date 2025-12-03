import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Hardcoded for now to avoid encoding issues with env variables
const supabaseUrl = 'https://odmxtufodaljukdhxggs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kbXh0dWZvZGFsanVrZGh4Z2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzE3MjcsImV4cCI6MjA4MDM0NzcyN30.GY9lSHTNvmylxGpAYR4hRALjsJIQdmtnEuqVWGqiCEM'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
