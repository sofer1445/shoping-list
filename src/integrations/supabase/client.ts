import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://lpyxnwcxfpqiinncqswe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxweXhud2N4ZnBxaWlubmNxc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0NzEyMDQsImV4cCI6MjA1MTA0NzIwNH0.L15l4DTAUBM0PKf_WhQS6jalXF-54lDlH_VVRvTa9jo";

const customFetch = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
  const response = await fetch(input, init);

  if (response.status === 406) {
    const text = await response.text();
    const json = JSON.parse(text);

    if (json.code === 'PGRST116') {
      const arrayResponse = JSON.stringify([json]);
      return new Response(arrayResponse, {
        status: 200,
        statusText: 'OK',
        headers: response.headers,
      });
    }
  }

  return response;
};

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    fetch: customFetch
  }
);
