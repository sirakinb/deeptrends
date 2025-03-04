import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import type { QuerySchedule } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/9hgfpiw3sd4y9giaodcyl01hnkc4jxsh';

async function saveSchedule(schedule: QuerySchedule): Promise<void> {
  const { error } = await supabase
    .from('schedules')
    .upsert([schedule])
    .select();

  if (error) {
    console.error('Error saving schedule:', error);
    throw new Error('Failed to save schedule');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query, model = 'pplx-7b-online', schedule } = await req.json();
    const now = new Date().toISOString();

    // If this is a scheduled query, store the schedule and don't execute immediately
    if (schedule) {
      const scheduleId = uuidv4();
      const { error: scheduleError } = await supabase
        .from('schedules')
        .insert([{
          id: scheduleId,
          query,
          model,
          is_active: true,
          status: 'scheduled',
          created_at: now,
          updated_at: now,
          next_run: schedule.next_run || now,
          frequency: schedule.frequency,
          time: schedule.time,
          week_day: schedule.week_day,
        }]);

      if (scheduleError) {
        console.error('Error creating schedule:', scheduleError);
        return NextResponse.json(
          { error: 'Failed to create schedule' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        message: 'Query scheduled successfully',
        scheduleId 
      }, { status: 201 });
    }

    // For immediate queries, execute right away
    try {
      // Call Perplexity API
      const perplexityResponse = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful research assistant. Provide detailed, well-researched answers.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          temperature: 0.2,
          max_tokens: model === 'sonar-pro' ? 6000 : 4000,
          top_p: 0.9
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = perplexityResponse.data.choices[0].message.content;
      const citations = perplexityResponse.data.citations || [];

      // Store the result
      const { error: resultError } = await supabase
        .from('query_results')
        .insert([{
          query,
          result,
          model,
          citations,
          created_at: now
        }]);

      if (resultError) {
        console.error('Error storing result:', resultError);
        throw new Error('Failed to store result');
      }

      // Send to Make.com webhook
      try {
        await axios.post(MAKE_WEBHOOK_URL, {
          query,
          model,
          result,
          citations,
          timestamp: now,
          type: 'immediate',
          status: 'success'
        });
      } catch (webhookError) {
        console.error('Failed to send to webhook:', webhookError);
        // Don't throw here, as we still want to return the result to the user
      }

      return NextResponse.json({ result });

    } catch (error: any) {
      console.error('Error executing query:', error);
      return NextResponse.json(
        { error: error.response?.data?.error || error.message || 'Failed to execute query' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in query handler:', error);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
} 