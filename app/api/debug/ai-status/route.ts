import { NextRequest, NextResponse } from 'next/server';
import { validateAIConfig, getAIStatus } from '@/lib/ai-service';

/**
 * GET /api/debug/ai-status - Check AI service configuration and status
 * This endpoint helps debug AI service issues in production
 */
export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Debug AI Status endpoint called');
    
    // Check environment configuration
    const config = validateAIConfig();
    console.log('Environment configuration:', {
      groq: config.groq,
      openai: config.openai,
      hasAtLeastOne: config.hasAtLeastOne
    });
    
    // Test actual API connections
    let status = { groq: false, openai: false };
    let errors: Record<string, string> = {};
    
    try {
      console.log('🧪 Testing AI service connections...');
      status = await getAIStatus();
    } catch (error) {
      console.error('Error testing AI services:', error);
      errors.general = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Environment info (without sensitive data)
    const envInfo = {
      nodeEnv: process.env.NODE_ENV,
      groqKeyPresent: !!process.env.GROQ_API_KEY,
      groqKeyPrefix: process.env.GROQ_API_KEY?.substring(0, 8) + '...' || 'none',
      openaiKeyPresent: !!process.env.OPENAI_API_KEY,
      openaiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 8) + '...' || 'none',
    };
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: envInfo,
      configuration: config,
      connectionStatus: status,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      recommendations: []
    };
    
    // Add recommendations based on findings
    if (!config.groq && !config.openai) {
      debugInfo.recommendations.push('No AI API keys are configured. Please set GROQ_API_KEY or OPENAI_API_KEY environment variables.');
    } else if (!config.groq) {
      debugInfo.recommendations.push('GROQ_API_KEY not configured. Only OpenAI will be available.');
    } else if (!config.openai) {
      debugInfo.recommendations.push('OPENAI_API_KEY not configured. Only Groq will be available.');
    }
    
    if (config.hasAtLeastOne && !status.groq && !status.openai) {
      debugInfo.recommendations.push('API keys are configured but connections failed. Check API key validity and network access.');
    }
    
    console.log('🔍 Debug info:', debugInfo);
    
    return NextResponse.json(debugInfo, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    
  } catch (error) {
    console.error('❌ Debug AI status error:', error);
    
    return NextResponse.json(
      {
        error: 'Debug endpoint failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Also allow POST for testing purposes
export async function POST(req: NextRequest) {
  return GET(req);
}
