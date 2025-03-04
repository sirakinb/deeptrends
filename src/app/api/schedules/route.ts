import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { QuerySchedule } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching schedules:', error);
      return NextResponse.json(
        { error: 'Failed to fetch schedules' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const schedule = await request.json();
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('schedules')
      .insert([{
        ...schedule,
        is_active: true,
        created_at: now,
        updated_at: now
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating schedule:', error);
      return NextResponse.json(
        { error: 'Failed to create schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 