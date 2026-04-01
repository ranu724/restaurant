import { createClient } from '@supabase/supabase-js';

// আপনার Supabase প্রজেক্টের Settings > API থেকে এই URL এবং KEY গুলো নিয়ে এখানে বসাবেন
const supabaseUrl = 'https://tzooiwqlkcjuawxjjqjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6b29pd3Fsa2NqdWF3eGpqcWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4Njg4OTgsImV4cCI6MjA5MDQ0NDg5OH0.RSHxnjC35NvQpk5UgsXCSEd8f2qtuQiziiOw0b2Yt48';

export const supabase = createClient(supabaseUrl, supabaseKey);