import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '../../../lib/supabase';
import type { QuerySchedule } from '../../../lib/supabase';
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

export async function POST(request: Request) {
  try {
    // Log that we received a request
    console.log('Received query request');
    
    // Parse the request body
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body));
    
    const { query, model = 'pplx-7b-online', schedule } = body;
    const now = new Date().toISOString();

    // Validate required fields
    if (!query) {
      console.error('Missing required field: query');
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // If this is a scheduled query, store the schedule and don't execute immediately
    if (schedule) {
      console.log('Processing scheduled query');
      const scheduleId = uuidv4();
      const { error: scheduleError } = await supabase
        .from('schedules')
        .insert([{
          id: scheduleId,
          query_text: query, // Make sure field name matches your database schema
          model,
          is_active: true,
          created_at: now,
          updated_at: now,
          frequency_hours: schedule.frequency_hours || 24, // Use the correct field name
        }]);

      if (scheduleError) {
        console.error('Error creating schedule:', scheduleError);
        return NextResponse.json(
          { error: 'Failed to create schedule: ' + scheduleError.message },
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
      console.log('Processing immediate query');
      
      // Check if Perplexity API key is set
      const perplexityApiKey = process.env.PERPLEXITY_API_KEY || '';
      if (!perplexityApiKey) {
        console.error('PERPLEXITY_API_KEY environment variable is not set in Vercel');
        return NextResponse.json(
          { 
            error: 'API configuration error: PERPLEXITY_API_KEY is not set in environment variables. Please configure it in Vercel dashboard.',
            details: 'This is a server configuration issue. The API key must be set in the Vercel project settings under Environment Variables.'
          },
          { status: 500 }
        );
      }
      
      // Call Perplexity API
      console.log('Calling Perplexity API with model:', model);
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
            'Authorization': `Bearer ${perplexityApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Received response from Perplexity API');
      const result = perplexityResponse.data.choices[0].message.content;
      const citations = perplexityResponse.data.citations || [];

      // Store the result
      console.log('Storing result in Supabase');
      const { error: resultError } = await supabase
        .from('query_results')
        .insert([{
          query,
          result_text: result, // Make sure field name matches your database schema
          model,
          created_at: now
        }]);

      if (resultError) {
        console.error('Error storing result:', resultError);
        // Continue anyway to return the result to the user
      }

      // Send to Make.com webhook
      try {
        console.log('Sending to Make.com webhook');
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
      // Log more detailed error information
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      return NextResponse.json(
        { error: error.response?.data?.error || error.message || 'Failed to execute query' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error in query handler:', error);
    return NextResponse.json(
      { error: 'Failed to process query: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
} 