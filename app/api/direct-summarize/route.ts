import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

interface DirectSummarizeRequest {
  text: string;
  prompt?: string;
  title?: string;
}

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Direct Summarize API called');

    // Check if Groq API key is configured
    if (!process.env.GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    const body: DirectSummarizeRequest = await req.json();
    const { text, prompt, title } = body;

    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { error: 'Text is required and must be at least 10 characters' },
        { status: 400 }
      );
    }

    console.log(`📝 Processing text: ${text.length} characters`);
    console.log(`💭 Using prompt: ${prompt ? 'Custom' : 'Default'}`);

    const startTime = Date.now();

    // Build the complete prompt
    const defaultPrompt = 'Please provide a comprehensive summary of this meeting transcript, highlighting key points, decisions made, and action items. Format with clear headings and bullet points.';
    const fullPrompt = `${prompt || defaultPrompt}

Meeting Content:
${text.trim()}`;

    console.log('🤖 Calling Groq API...');

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert meeting summarizer. Provide clear, structured summaries that capture the essential information from meeting transcripts. Use appropriate formatting with headings and bullet points.'
        },
        {
          role: 'user',
          content: fullPrompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_completion_tokens: 4000,
      top_p: 0.9,
    });

    const summary = chatCompletion.choices[0]?.message?.content || '';
    const processingTime = Date.now() - startTime;

    if (!summary) {
      throw new Error('No summary generated from Groq API');
    }

    console.log(`✅ Summary generated successfully in ${processingTime}ms`);
    console.log(`📊 Summary length: ${summary.length} characters`);

    // Estimate token count (rough estimation)
    const tokenCount = Math.ceil(summary.length / 4);

    const result = {
      id: `summary-${Date.now()}`,
      title: title || 'AI Generated Summary',
      summary,
      model: 'groq-llama-3.3-70b-versatile',
      token_count: tokenCount,
      processing_time: processingTime,
      created_at: new Date().toISOString()
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Direct summarization error:', error);

    // Check if it's a Groq API specific error
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return NextResponse.json(
          { 
            error: 'AI API authentication failed',
            message: 'Please check your Groq API key configuration',
            details: 'The GROQ_API_KEY may be invalid or expired.'
          },
          { status: 401 }
        );
      } else if (error.message.includes('429') || error.message.includes('rate limit')) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            message: 'Too many requests to AI service. Please try again in a moment.',
            details: 'Groq API rate limit exceeded. Wait a few minutes before retrying.'
          },
          { status: 429 }
        );
      } else if (error.message.includes('model')) {
        return NextResponse.json(
          { 
            error: 'AI model error',
            message: 'The AI model is currently unavailable. Please try again.',
            details: 'Groq model llama-3.3-70b-versatile may be temporarily unavailable.'
          },
          { status: 503 }
        );
      } else if (error.message.includes('not configured')) {
        return NextResponse.json(
          { 
            error: 'AI service not configured',
            message: 'AI service is not properly configured.',
            details: 'GROQ_API_KEY is not set in environment variables.'
          },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      {
        error: 'Summarization failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Please check your input and try again. If the problem persists, the AI service may be temporarily unavailable.'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Direct Summarization API',
    status: 'ready',
    groq_configured: !!process.env.GROQ_API_KEY,
    timestamp: new Date().toISOString()
  });
}
