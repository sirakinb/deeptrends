import { NextResponse } from 'next/server';
import axios from 'axios';

const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/9hgfpiw3sd4y9giaodcyl01hnkc4jxsh';

export async function POST(request: Request) {
  try {
    const { query, frequency, time } = await request.json();

    // Call Perplexity API
    let perplexityResponse;
    try {
      perplexityResponse = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'sonar-deep-research',
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
          max_tokens: 4000,
          top_p: 0.9
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (perplexityError: any) {
      console.error('Perplexity API Error:', perplexityError.response?.data || perplexityError.message);
      return NextResponse.json(
        { 
          error: perplexityError.response?.status === 401 
            ? 'Invalid API key. Please check your Perplexity API key configuration.'
            : 'Failed to get response from Perplexity API. Please try again.'
        },
        { status: perplexityError.response?.status || 500 }
      );
    }

    const result = perplexityResponse.data.choices[0].message.content;
    const citations = perplexityResponse.data.citations || [];

    // Format result with citations if available
    const formattedResult = citations.length > 0 
      ? `${result}\n\nSources:\n${citations.map((url: string) => `- ${url}`).join('\n')}`
      : result;

    // Try to send results to Make.com webhook, but don't fail if it errors
    try {
      await axios.post(MAKE_WEBHOOK_URL, {
        query,
        frequency,
        time,
        result: formattedResult,
        citations,
        timestamp: new Date().toISOString(),
        isImmediate: frequency === 'immediate'
      });
    } catch (webhookError) {
      console.warn('Make.com webhook error (non-critical):', webhookError);
      // Continue execution - webhook failure shouldn't affect the user experience
    }

    // Return the result in the response for immediate queries
    if (frequency === 'immediate') {
      return NextResponse.json({ 
        success: true,
        result: formattedResult
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('General error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
} 