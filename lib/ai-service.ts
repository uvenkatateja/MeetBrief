import { Groq } from 'groq-sdk';
import OpenAI from 'openai';

// Initialize AI clients with better error handling
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// ===================================
// TYPES
// ===================================
export interface SummaryRequest {
  transcript: string;
  customPrompt?: string;
  maxTokens?: number;
}

export interface SummaryResponse {
  summary: string;
  model: string;
  tokenCount: number;
  processingTime: number;
  chunks?: number;
}

export interface TextChunk {
  text: string;
  index: number;
  tokenCount: number;
}

// ===================================
// TOKEN COUNTING & CHUNKING
// ===================================

/**
 * Rough token count estimation (1 token ≈ 4 characters for English text)
 * For production, consider using tiktoken for more accurate counting
 */
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split text into chunks that fit within token limits
 * Tries to break at sentence boundaries when possible
 */
function chunkText(text: string, maxTokensPerChunk = 7000): TextChunk[] {
  const estimatedTokens = estimateTokenCount(text);
  
  // If text is short enough, return as single chunk
  if (estimatedTokens <= maxTokensPerChunk) {
    return [{
      text,
      index: 0,
      tokenCount: estimatedTokens
    }];
  }

  const chunks: TextChunk[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  let currentChunk = '';
  let chunkIndex = 0;

  for (const sentence of sentences) {
    const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;
    const potentialTokens = estimateTokenCount(potentialChunk);

    if (potentialTokens <= maxTokensPerChunk) {
      currentChunk = potentialChunk;
    } else {
      // Save current chunk if it has content
      if (currentChunk) {
        chunks.push({
          text: currentChunk,
          index: chunkIndex++,
          tokenCount: estimateTokenCount(currentChunk)
        });
      }
      
      // Start new chunk with current sentence
      currentChunk = sentence;
      
      // If single sentence is too long, force split by characters
      if (estimateTokenCount(sentence) > maxTokensPerChunk) {
        const charLimit = maxTokensPerChunk * 4; // Rough character limit
        let start = 0;
        
        while (start < sentence.length) {
          const chunkText = sentence.slice(start, start + charLimit);
          chunks.push({
            text: chunkText,
            index: chunkIndex++,
            tokenCount: estimateTokenCount(chunkText)
          });
          start += charLimit;
        }
        currentChunk = '';
      }
    }
  }

  // Add final chunk if it has content
  if (currentChunk) {
    chunks.push({
      text: currentChunk,
      index: chunkIndex,
      tokenCount: estimateTokenCount(currentChunk)
    });
  }

  return chunks;
}

// ===================================
// PROMPT TEMPLATES
// ===================================

const DEFAULT_SUMMARY_PROMPT = `You are a professional meeting summarizer.

Your task is to produce a detailed, well-structured meeting summary in plain text format.

STRICT RULES:
- Do NOT use markdown formatting (no ##, no **, no __, no *, no ||, no pipes |, no ---).
- Do NOT use emojis or decorative symbols.
- Only use plain text headings and spacing.
- Headings should be written as normal words (for example: Meeting Details, Executive Summary, Technical Architecture, Decisions Made, Role Assignments, Action Items, Next Meeting).
- Lists should use numbers (1., 2., 3.) or simple dashes (-).
- For tabular or structured data, write it in aligned plain text columns, not Markdown tables.

CONTENT REQUIREMENTS:
- Always include: Meeting Details, Executive Summary, Technical Architecture (if discussed), Decisions Made, Role Assignments, Action Items, and Next Meeting.
- Preserve as much information as possible, do not shorten too much.
- Expand into full sentences where helpful to improve readability.
- Keep the summary clear, professional, and suitable for project documentation.`;

function buildPrompt(transcript: string, customPrompt?: string, isChunk = false, chunkIndex = 0, totalChunks = 1): string {
  const basePrompt = customPrompt || DEFAULT_SUMMARY_PROMPT;
  
  if (isChunk && totalChunks > 1) {
    return `This is chunk ${chunkIndex + 1} of ${totalChunks} from a meeting transcript. 
    
${basePrompt}

Since this is only a portion of the full transcript, focus on summarizing the content in this chunk while noting if there are incomplete discussions that might continue in other parts.

Transcript chunk:
${transcript}`;
  }

  return `${basePrompt}

Meeting Transcript:
${transcript}`;
}

// ===================================
// GROQ AI SERVICE
// ===================================

async function summarizeWithGroq(
  transcript: string, 
  customPrompt?: string, 
  maxTokens = 4000
): Promise<SummaryResponse> {
  const startTime = Date.now();
  
  try {
    // Check if Groq API key is available
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const prompt = buildPrompt(transcript, customPrompt);
    
    console.log('Calling Groq API for meeting summarization...');
    console.log(`Transcript length: ${transcript.length} characters`);
    console.log(`Estimated tokens: ${estimateTokenCount(transcript)}`);
    console.log(`Using model: llama-3.3-70b-versatile`);
    console.log(`GROQ API Key configured: ${!!process.env.GROQ_API_KEY}`);
    console.log(`GROQ API Key prefix: ${process.env.GROQ_API_KEY?.substring(0, 8)}...`);
    
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a professional meeting summarizer.

Your task is to produce a detailed, well-structured meeting summary in plain text format.

STRICT RULES:
- Do NOT use markdown formatting (no ##, no **, no __, no *, no ||, no pipes |, no ---).
- Do NOT use emojis or decorative symbols.
- Only use plain text headings and spacing.
- Headings should be written as normal words (for example: Meeting Details, Executive Summary, Technical Architecture, Decisions Made, Role Assignments, Action Items, Next Meeting).
- Lists should use numbers (1., 2., 3.) or simple dashes (-).
- For tabular or structured data, write it in aligned plain text columns, not Markdown tables.

CONTENT REQUIREMENTS:
- Always include: Meeting Details, Executive Summary, Technical Architecture (if discussed), Decisions Made, Role Assignments, Action Items, and Next Meeting.
- Preserve as much information as possible, do not shorten too much.
- Expand into full sentences where helpful to improve readability.
- Keep the summary clear, professional, and suitable for project documentation.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
        model: 'llama-3.3-70b-versatile', // Using Llama model through Groq
        temperature: 0.3,
        max_completion_tokens: 4000,
        top_p: 0.9,
    });

    const summary = chatCompletion.choices[0]?.message?.content || '';
    const processingTime = Date.now() - startTime;

    return {
      summary,
        model: 'groq-llama-3.3-70b-versatile',
      tokenCount: estimateTokenCount(summary),
      processingTime,
      chunks: 1
    };

  } catch (error) {
    console.error('Groq API error:', error);
    
    // More detailed error handling
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        throw new Error(`Groq API authentication failed. Please check API key configuration.`);
      } else if (error.message.includes('429') || error.message.includes('rate limit')) {
        throw new Error(`Groq API rate limit exceeded. Please try again in a moment.`);
      } else if (error.message.includes('403')) {
        throw new Error(`Groq API access denied. Please verify your API key has proper permissions.`);
      } else if (error.message.includes('not configured')) {
        throw new Error('Groq API key is not configured in environment variables.');
      }
    }
    
    throw new Error(`Groq API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ===================================
// OPENAI AI SERVICE  
// ===================================

async function summarizeWithOpenAI(
  transcript: string,
  customPrompt?: string,
  maxTokens = 4000
): Promise<SummaryResponse> {
  const startTime = Date.now();
  
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const prompt = buildPrompt(transcript, customPrompt);
    
    console.log('Calling OpenAI API (fallback)...');
    console.log(`Transcript length: ${transcript.length} characters`);
    console.log(`Estimated tokens: ${estimateTokenCount(transcript)}`);
    console.log(`Using model: gpt-4o-mini`);
    console.log(`OpenAI API Key configured: ${!!process.env.OPENAI_API_KEY}`);
    console.log(`OpenAI API Key prefix: ${process.env.OPENAI_API_KEY?.substring(0, 8)}...`);
    
    
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective model
      messages: [
        {
          role: 'system',
          content: `You are a professional meeting summarizer.

Your task is to produce a detailed, well-structured meeting summary in plain text format.

STRICT RULES:
- Do NOT use markdown formatting (no ##, no **, no __, no *, no ||, no pipes |, no ---).
- Do NOT use emojis or decorative symbols.
- Only use plain text headings and spacing.
- Headings should be written as normal words (for example: Meeting Details, Executive Summary, Technical Architecture, Decisions Made, Role Assignments, Action Items, Next Meeting).
- Lists should use numbers (1., 2., 3.) or simple dashes (-).
- For tabular or structured data, write it in aligned plain text columns, not Markdown tables.

CONTENT REQUIREMENTS:
- Always include: Meeting Details, Executive Summary, Technical Architecture (if discussed), Decisions Made, Role Assignments, Action Items, and Next Meeting.
- Preserve as much information as possible, do not shorten too much.
- Expand into full sentences where helpful to improve readability.
- Keep the summary clear, professional, and suitable for project documentation.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_completion_tokens: maxTokens,
      top_p: 0.9,
    });

    const summary = chatCompletion.choices[0]?.message?.content || '';
    const processingTime = Date.now() - startTime;

    return {
      summary,
      model: 'openai-gpt-4o-mini',
      tokenCount: estimateTokenCount(summary),
      processingTime,
      chunks: 1
    };

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // More detailed error handling
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        throw new Error(`OpenAI API authentication failed. Please check API key configuration.`);
      } else if (error.message.includes('429') || error.message.includes('rate limit')) {
        throw new Error(`OpenAI API rate limit exceeded. Please try again in a moment.`);
      } else if (error.message.includes('403')) {
        throw new Error(`OpenAI API access denied. Please verify your API key has proper permissions.`);
      } else if (error.message.includes('not configured')) {
        throw new Error('OpenAI API key is not configured in environment variables.');
      }
    }
    
    throw new Error(`OpenAI API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ===================================
// CHUNKED SUMMARIZATION
// ===================================

async function summarizeChunks(
  chunks: TextChunk[],
  customPrompt?: string,
  useOpenAI = false
): Promise<SummaryResponse> {
  const startTime = Date.now();
  const chunkSummaries: string[] = [];
  let totalTokenCount = 0;
  let model = '';

  console.log(`Processing ${chunks.length} chunks for summarization...`);

  // Summarize each chunk
  for (const chunk of chunks) {
    try {
      const prompt = buildPrompt(chunk.text, customPrompt, true, chunk.index, chunks.length);
      
      let summary: string;
      
      if (useOpenAI) {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system', 
              content: `You are a professional meeting summarizer. Summarize this portion of the meeting transcript using plain text only. Do NOT use markdown formatting (no ##, no **, no __, no *, no ||, no pipes |, no ---). Use normal text headings and simple lists with numbers or dashes. Keep it professional and clear.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_completion_tokens: 1500,
          top_p: 0.9,
        });
        summary = response.choices[0]?.message?.content || '';
        model = 'openai-gpt-4o-mini';
      } else {
        const response = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are a professional meeting summarizer. Summarize this portion of the meeting transcript using plain text only. Do NOT use markdown formatting (no ##, no **, no __, no *, no ||, no pipes |, no ---). Use normal text headings and simple lists with numbers or dashes. Keep it professional and clear.`
            },
            {
              role: 'user', 
              content: prompt
            }
          ],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.3,
          max_completion_tokens: 2000,
          top_p: 0.9,
        });
        summary = response.choices[0]?.message?.content || '';
        model = 'groq-llama-3.3-70b-versatile';
      }

      chunkSummaries.push(`Chunk ${chunk.index + 1}:\n${summary}`);
      totalTokenCount += estimateTokenCount(summary);
      
      console.log(`Chunk ${chunk.index + 1}/${chunks.length} summarized successfully`);
      
    } catch (error) {
      console.error(`Error summarizing chunk ${chunk.index + 1}:`, error);
      chunkSummaries.push(`Chunk ${chunk.index + 1}: [Error processing this section]`);
    }
  }

  // Combine chunk summaries into final summary
  const combinedSummaries = chunkSummaries.join('\n\n');
  
  // Generate final consolidated summary
  try {
    const finalPrompt = `Please create a comprehensive, unified professional meeting summary from these individual chunk summaries:

${combinedSummaries}

Consolidate into a single, coherent summary with these sections:
Meeting Details
Executive Summary
Technical Architecture (if applicable)
Decisions Made
Role Assignments
Action Items
Next Meeting

IMPORTANT: Use plain text format only. Do NOT use markdown formatting (no ##, no **, no __, no *, no ||, no pipes |, no ---). Write section headings as normal words. Use simple numbered lists (1., 2., 3.) or dashes (-) for lists. For structured data, use aligned plain text columns instead of markdown tables.

Remove redundancy and create a flowing, comprehensive summary.`;

    let finalSummary: string;
    
    if (useOpenAI) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: finalPrompt }],
        temperature: 0.3,
        max_completion_tokens: 3000,
      });
      finalSummary = response.choices[0]?.message?.content || combinedSummaries;
    } else {
      const response = await groq.chat.completions.create({
        messages: [{ role: 'user', content: finalPrompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_completion_tokens: 3000,
        top_p: 0.9,
      });
      finalSummary = response.choices[0]?.message?.content || combinedSummaries;
    }

    const processingTime = Date.now() - startTime;

    return {
      summary: finalSummary,
      model: `${model}-chunked`,
      tokenCount: estimateTokenCount(finalSummary),
      processingTime,
      chunks: chunks.length
    };

  } catch (error) {
    console.error('Error creating final summary:', error);
    // Return combined summaries if final consolidation fails
    return {
      summary: combinedSummaries,
      model: `${model}-chunked-fallback`,
      tokenCount: totalTokenCount,
      processingTime: Date.now() - startTime,
      chunks: chunks.length
    };
  }
}

// ===================================
// MAIN SUMMARIZATION SERVICE
// ===================================

/**
 * Main function to summarize transcript with chunking and fallback
 */
export async function summarizeTranscript({
  transcript,
  customPrompt,
  maxTokens = 4000
}: SummaryRequest): Promise<SummaryResponse> {
  
  if (!transcript.trim()) {
    throw new Error('Transcript is empty');
  }

  const estimatedTokens = estimateTokenCount(transcript);
  console.log(`Estimated tokens: ${estimatedTokens}`);

  // If transcript is small enough, use direct summarization
  if (estimatedTokens <= 8000) {
    try {
      console.log('Using direct summarization with Groq API');
      return await summarizeWithGroq(transcript, customPrompt, maxTokens);
    } catch (error) {
      console.log('Groq failed, falling back to OpenAI');
      try {
        return await summarizeWithOpenAI(transcript, customPrompt, maxTokens);
      } catch (fallbackError) {
        throw new Error('Both Groq and OpenAI failed: ' + 
          (fallbackError instanceof Error ? fallbackError.message : 'Unknown error'));
      }
    }
  }

  // For large transcripts, use chunking
  console.log('Large transcript detected, using chunking approach');
  const chunks = chunkText(transcript, 7000);
  console.log(`Split transcript into ${chunks.length} chunks`);

  try {
    console.log('Using chunked summarization with Groq API');
    return await summarizeChunks(chunks, customPrompt, false);
  } catch (error) {
    console.log('Groq failed, falling back to OpenAI for chunking');
    try {
      return await summarizeChunks(chunks, customPrompt, true);
    } catch (fallbackError) {
      throw new Error('Both Groq and OpenAI failed for chunked summarization: ' + 
        (fallbackError instanceof Error ? fallbackError.message : 'Unknown error'));
    }
  }
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Get available AI models status
 */
export async function getAIStatus(): Promise<{groq: boolean, openai: boolean}> {
  const status = { groq: false, openai: false };

  // Test Groq
  try {
    await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Test' }],
      model: 'llama-3.3-70b-versatile',
      max_completion_tokens: 1,
    });
    status.groq = true;
  } catch (error) {
    console.log('Groq API unavailable:', error);
  }

  // Test OpenAI
  try {
    await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Test' }],
      max_completion_tokens: 1,
    });
    status.openai = true;
  } catch (error) {
    console.log('OpenAI API unavailable:', error);
  }

  return status;
}

/**
 * Validate that API keys are configured
 */
export function validateAIConfig(): { groq: boolean, openai: boolean, hasAtLeastOne: boolean } {
  const groq = !!process.env.GROQ_API_KEY;
  const openai = !!process.env.OPENAI_API_KEY;
  
  return {
    groq,
    openai,
    hasAtLeastOne: groq || openai
  };
}

export { estimateTokenCount, chunkText };
