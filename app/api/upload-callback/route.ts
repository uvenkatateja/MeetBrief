import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { transcriptDb, userDb, summaryDb } from '@/lib/database';
import { auth } from '@clerk/nextjs/server';
import { summarizeTranscript } from '@/lib/ai-service';

interface UploadCallbackPayload {
  ufsUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  userId: string;
  fileKey: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, fileSize, ufsUrl, userId, fileType, fileKey } = body;
    
    // Ignore invalid callbacks (gracefully handle retries/empty payloads)
    if (!fileName || !ufsUrl || !userId) {
      console.warn('UploadThing callback missing required fields, ignoring payload:', body);
      return NextResponse.json({ success: false, error: 'Missing required fields, ignored' }, { status: 200 });
    }
    
    console.log('Processing uploaded file:', {
      fileName,
      fileSize,
      userId,
      ufsUrl
    });
    
    // Download the file from UploadThing using ufsUrl
    const response = await fetch(ufsUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    let extractedText = '';
    
    // Extract text based on file type
    const mimeType = response.headers.get('content-type') || '';
    const fileNameLower = fileName.toLowerCase();
    
    if (fileNameLower.endsWith('.pdf') || mimeType.includes('pdf')) {
      // Extract text from PDF using dynamic import
      try {
        const { default: pdfParse } = await import('pdf-parse');
        const pdfData = await pdfParse(Buffer.from(buffer));
        extractedText = pdfData.text;
      } catch (error) {
        console.error('PDF parsing error:', error);
        extractedText = 'Error: Could not extract text from PDF. Please try converting to TXT or DOCX format.';
      }
    } else if (fileNameLower.endsWith('.docx') || mimeType.includes('wordprocessingml')) {
      // Extract text from DOCX
      try {
        const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
        extractedText = result.value;
      } catch (error) {
        console.error('DOCX parsing error:', error);
        extractedText = 'Error: Could not extract text from DOCX';
      }
    } else if (fileNameLower.endsWith('.doc') || mimeType.includes('msword')) {
      extractedText = 'DOC files are not supported. Please convert to DOCX or PDF.';
    } else if (fileNameLower.endsWith('.txt') || mimeType.includes('text/plain')) {
      // Plain text file
      const decoder = new TextDecoder('utf-8');
      extractedText = decoder.decode(buffer);
    } else if (mimeType.includes('audio') || mimeType.includes('video')) {
      extractedText = 'Audio/Video transcription not implemented yet. Please upload a text file with the transcript.';
    } else {
      extractedText = 'Unsupported file type. Please upload PDF, DOCX, or TXT files.';
    }
    
    console.log('Extracted text preview:', extractedText.substring(0, 200) + '...');
    
    // Get or create user in database (auto-create if not exists)
    let user = await userDb.findByClerkId(userId);
    if (!user) {
      console.log(`Creating new user for Clerk ID: ${userId}`);
      user = await userDb.create({
        clerk_user_id: userId,
        email: 'unknown@example.com', // Placeholder - will be updated when user logs in
        first_name: 'Unknown',
        last_name: 'User'
      });
    }
    
    // Create title from filename
    const title = fileName.replace(/\.[^/.]+$/, ""); // Remove file extension
    const wordCount = extractedText.split(' ').filter(word => word.trim().length > 0).length;
    const extractedFileType = fileName.split('.').pop()?.toLowerCase() || 'unknown';
    
    // Save transcript to database
    const transcript = await transcriptDb.create({
      user_id: user.id,
      title: title,
      file_name: fileName,
      file_url: ufsUrl,
      file_size: fileSize,
      file_type: extractedFileType,
    });
    
    // Update with extracted text
    const completedTranscript = await transcriptDb.updateText(
      transcript.id,
      extractedText,
      wordCount
    );
    
    console.log(`✅ Transcript processed and saved: ${transcript.id}`);
    
    // Generate AI summary automatically if transcript has content
    let summaries = [];
    if (extractedText.trim() && !extractedText.includes('Error:') && extractedText.length > 50) {
      try {
        console.log('🤖 Starting AI summarization...');
        
        // Create default summary
        const defaultSummary = await summaryDb.create({
          transcript_id: completedTranscript.id,
          user_id: user.id,
          title: `Summary: ${title}`,
          prompt: 'Please provide a comprehensive summary of this meeting transcript including key discussion points, decisions made, action items, participants, and next steps.'
        });
        
        // Generate AI summary using the OpenAI GPT model through Groq
        const aiResult = await summarizeTranscript({
          transcript: extractedText,
          customPrompt: defaultSummary.prompt
        });
        
        // Update summary with AI result
        await summaryDb.complete(
          defaultSummary.id,
          aiResult.summary,
          aiResult.model,
          aiResult.tokenCount,
          aiResult.processingTime
        );
        
        summaries.push({
          id: defaultSummary.id,
          title: defaultSummary.title,
          model: aiResult.model,
          processingTime: aiResult.processingTime
        });
        
        console.log(`✅ AI Summary generated: ${defaultSummary.id} (${aiResult.model})`);
        
      } catch (error) {
        console.error('❌ AI summarization failed:', error);
        // Don't fail the whole upload if summarization fails
      }
    } else {
      console.log('⚠️ Skipping AI summarization - transcript too short or contains errors');
    }
    
    return NextResponse.json({
      success: true,
      message: 'File processed successfully',
      transcriptId: completedTranscript.id,
      summariesGenerated: summaries.length,
      data: {
        id: completedTranscript.id,
        title: completedTranscript.title,
        fileName: fileName,
        wordCount: completedTranscript.word_count,
        status: completedTranscript.status,
        summaries: summaries
      }
    });
    
  } catch (error) {
    console.error('Upload callback error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process uploaded file',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Optional: Add GET method for testing
export async function GET() {
  return NextResponse.json({
    message: 'Upload callback webhook is working',
    timestamp: new Date().toISOString()
  });
}
