'use server'; // Mark this file as containing Server Actions

import { createClient } from '@/lib/supabase/server';

export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    // Handle not logged in - return null
    // Redirects should ideally be handled in middleware or layout
    console.log('getUser action: No authenticated user found.');
    return null; 
  }
  
  // Optionally fetch profile data here if needed later
  // const { data: profile } = await supabase...

  console.log(`getUser action: Found user ${user.id}`);
  return user; 
} 