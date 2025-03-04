import { NextResponse } from 'next/server';

export async function GET() {
  // Check if environment variables are set
  const hasPerplexityKey = !!process.env.PERPLEXITY_API_KEY;
  const perplexityKeyFirstChars = hasPerplexityKey 
    ? `${process.env.PERPLEXITY_API_KEY.substring(0, 3)}...${process.env.PERPLEXITY_API_KEY.substring(process.env.PERPLEXITY_API_KEY.length - 3)}` 
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