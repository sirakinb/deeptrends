// Simple JavaScript version of the scheduler
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Process a single query
async function processQuery(schedule) {
  console.log(`Processing scheduled query: ${schedule.id}`);
  
  try {
    // Update last_run_time
    const { error: updateError } = await supabase
      .from('schedules')
      .update({
        last_run_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', schedule.id);
      
    if (updateError) {
      console.error(`Error updating last_run_time for schedule ${schedule.id}:`, updateError);
    }
    
    // Call Perplexity API
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityApiKey) {
      throw new Error('PERPLEXITY_API_KEY is not set');
    }
    
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: schedule.model || 'sonar-small-online',
        messages: [{ role: 'user', content: schedule.query_text }]
      },
      {
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Extract the response content
    const content = response.data.choices[0]?.message?.content || '';
    
    // Store the result in Supabase
    const { error: insertError } = await supabase
      .from('query_results')
      .insert({
        schedule_id: schedule.id,
        result_text: content,
        created_at: new Date().toISOString()
      });
      
    if (insertError) {
      console.error(`Error storing result for schedule ${schedule.id}:`, insertError);
    } else {
      console.log(`Successfully processed and stored result for schedule ${schedule.id}`);
    }
    
    // Update last_success_time
    const { error: successError } = await supabase
      .from('schedules')
      .update({
        last_success_time: new Date().toISOString(),
        last_error: null,
        last_error_time: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', schedule.id);
      
    if (successError) {
      console.error(`Error updating last_success_time for schedule ${schedule.id}:`, successError);
    }
    
  } catch (error) {
    console.error(`Error processing schedule ${schedule.id}:`, error);
    
    // Update last_error and last_error_time
    const { error: errorUpdateError } = await supabase
      .from('schedules')
      .update({
        last_error: error.message,
        last_error_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', schedule.id);
      
    if (errorUpdateError) {
      console.error(`Error updating last_error for schedule ${schedule.id}:`, errorUpdateError);
    }
  }
}

async function runOnce() {
  console.log('Scheduler started at:', new Date().toISOString());
  
  try {
    // Get active schedules
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('status', 'active');
    
    if (error) {
      console.error('Error fetching schedules:', error);
      process.exit(1);
    }
    
    console.log(`Found ${schedules.length} active schedules`);
    
    // Check which schedules need to run
    const now = new Date();
    const schedulesToRun = schedules.filter(schedule => {
      const lastRun = schedule.last_run ? new Date(schedule.last_run) : new Date(0);
      const hoursSinceLastRun = (now - lastRun) / (1000 * 60 * 60);
      
      return hoursSinceLastRun >= schedule.frequency_hours;
    });
    
    console.log(`${schedulesToRun.length} schedules need to run now`);
    
    // Process each schedule
    for (const schedule of schedulesToRun) {
      console.log(`Processing schedule: ${schedule.id} - ${schedule.name}`);
      
      // Update last_run time
      const { error: updateError } = await supabase
        .from('schedules')
        .update({ last_run: now.toISOString() })
        .eq('id', schedule.id);
      
      if (updateError) {
        console.error(`Error updating last_run for schedule ${schedule.id}:`, updateError);
        continue;
      }
      
      console.log(`Updated last_run time for schedule ${schedule.id}`);
    }
    
    console.log('Scheduler completed successfully');
  } catch (error) {
    console.error('Unexpected error in scheduler:', error);
  } finally {
    // Always exit when done
    process.exit(0);
  }
}

// Run the scheduler once
runOnce(); 