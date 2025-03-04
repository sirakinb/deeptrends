import { NextResponse } from 'next/server';

export async function GET() {
  // Check if environment variables are set
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY || '';
  const hasPerplexityKey = perplexityApiKey.length > 0;
  
  // Only show preview if the key exists
  const perplexityKeyFirstChars = hasPerplexityKey && perplexityApiKey.length > 6
    ? `${perplexityApiKey.substring(0, 3)}...${perplexityApiKey.substring(perplexityApiKey.length - 3)}`
    : 'not set';
  
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Return environment variable status
  return NextResponse.json({
    environment: process.env.VERCEL_ENV || 'local',
    variables: {
      PERPLEXITY_API_KEY: {
        exists: hasPerplexityKey,
        preview: perplexityKeyFirstChars,
      },
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: hasSupabaseUrl,
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        exists: hasSupabaseKey,
      }
    }
  });
} 