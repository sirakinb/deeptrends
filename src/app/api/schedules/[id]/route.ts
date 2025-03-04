import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { NextRequest } from 'next/server';

interface RequestContext {
  params: {
    id: string;
  };
}

export async function PUT(
  req: NextRequest,
  { params }: RequestContext
) {
  try {
    const scheduleId = String(params.id);
    const updates = await req.json();

    const { data, error } = await supabase
      .from('schedules')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) {
      console.error('Error updating schedule:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: `Schedule ${scheduleId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/schedules/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: RequestContext
) {
  try {
    const scheduleId = String(params.id);
    console.log(`Attempting to delete schedule: ${scheduleId}`);
    
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) {
      console.error('Error deleting schedule:', error);
      return NextResponse.json(
        { error: 'Failed to delete schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: `Successfully deleted schedule: ${scheduleId}` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 