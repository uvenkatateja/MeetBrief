import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export interface EmailTemplate {
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

export interface ShareSummaryData {
  summary: {
    title: string;
    content: string;
    ai_model: string;
    created_at: string;
  };
  sender: {
    name: string;
    email: string;
  };
  recipients: string[];
}

/**
 * Generate HTML template for summary sharing
 */
function generateSummaryEmailHTML(data: ShareSummaryData): string {
  const { summary, sender } = data;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meeting Summary - ${summary.title}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #f8fafc; 
        }
        .container { 
            background: white; 
            border-radius: 12px; 
            padding: 32px; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
        }
        .header { 
            border-bottom: 2px solid #e5e7eb; 
            padding-bottom: 20px; 
            margin-bottom: 24px; 
            text-align: center; 
        }
        .logo { 
            font-size: 24px; 
            font-weight: bold; 
            color: #3b82f6; 
            margin-bottom: 8px; 
        }
        .title { 
            font-size: 20px; 
            font-weight: 600; 
            color: #1f2937; 
            margin: 16px 0; 
        }
        .meta { 
            background: #f1f5f9; 
            padding: 16px; 
            border-radius: 8px; 
            margin: 16px 0; 
            font-size: 14px; 
            color: #64748b; 
        }
        .content { 
            font-size: 16px; 
            line-height: 1.8; 
            color: #374151; 
            white-space: pre-wrap; 
        }
        .content h1, .content h2, .content h3 { 
            color: #1f2937; 
            margin-top: 24px; 
            margin-bottom: 12px; 
        }
        .content ul, .content ol { 
            margin: 12px 0; 
            padding-left: 24px; 
        }
        .content li { 
            margin: 4px 0; 
        }
        .footer { 
            margin-top: 32px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            text-align: center; 
            font-size: 14px; 
            color: #6b7280; 
        }
        .cta { 
            background: #3b82f6; 
            color: white; 
            padding: 12px 24px; 
            border-radius: 8px; 
            text-decoration: none; 
            display: inline-block; 
            margin: 20px 0; 
            font-weight: 500; 
        }
        .ai-badge {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Meetbrief</div>
            <p>AI-Powered Meeting Summary</p>
        </div>
        
        <div class="title">${summary.title}</div>
        
        <div class="meta">
            <strong>Shared by:</strong> ${sender.name} (${sender.email})<br>
            <strong>Generated:</strong> ${new Date(summary.created_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}<br>
        </div>
        
        <div class="content">${summary.content.replace(/\n/g, '<br>')}</div>
        
        <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta">
                View in Meetbrief Dashboard
            </a>
        </div>
        
        <div class="footer">
            <p>This summary was generated using AI and shared via <strong>Meetbrief</strong></p>
            <p style="margin-top: 16px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #3b82f6; text-decoration: none;">Try Meetbrief</a> • 
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" style="color: #6b7280; text-decoration: none;">Privacy Policy</a>
            </p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of the email
 */
function generateSummaryEmailText(data: ShareSummaryData): string {
  const { summary, sender } = data;
  
  return `
MEETING SUMMARY - ${summary.title}

Shared by: ${sender.name} (${sender.email})
Generated: ${new Date(summary.created_at).toLocaleDateString()}
AI Model: ${summary.ai_model}

---

${summary.content}

---

This summary was generated using AI and shared via Meetbrief.
View in dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

Try Meetbrief: ${process.env.NEXT_PUBLIC_APP_URL}
  `.trim();
}

/**
 * Send summary email using Resend
 */
export async function sendSummaryEmail(data: ShareSummaryData): Promise<{
  id: string;
  success: boolean;
  error?: string;
}> {
  try {
    console.log('📧 Sending summary email to:', data.recipients);
    
    const htmlContent = generateSummaryEmailHTML(data);
    const textContent = generateSummaryEmailText(data);
    
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Meetbrief <onboarding@resend.dev>',
      to: data.recipients,
      subject: `Meeting Summary: ${data.summary.title}`,
      html: htmlContent,
      text: textContent,
      headers: {
        'X-Meetbrief-Summary': 'true',
        'X-Meetbrief-Sender': data.sender.email,
      },
      tags: [
        {
          name: 'category',
          value: 'summary-share'
        },
        {
          name: 'ai-model',
          value: data.summary.ai_model
        }
      ]
    });

    console.log('🔍 Resend response:', JSON.stringify(response, null, 2));
    
    // Check if there was an error
    if (response.error) {
      console.error('❌ Resend API error:', response.error);
      return {
        id: '',
        success: false,
        error: response.error.error || response.error.message || 'Email service error'
      };
    }
    
    // Fix: Resend API returns the ID directly, not in data property
    const emailId = response.data?.id || response.id || `resend_${Date.now()}`;
    console.log('✅ Email sent successfully:', emailId);
    
    return {
      id: emailId,
      success: true
    };

  } catch (error) {
    console.error('❌ Failed to send email:', error);
    
    return {
      id: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error'
    };
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
  try {
    console.log('👋 Sending welcome email to:', userEmail);
    
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Meetbrief <onboarding@resend.dev>',
      to: [userEmail],
      subject: 'Welcome to Meetbrief - Your AI Meeting Assistant',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #3b82f6;">Welcome to Meetbrief, ${userName}! 🎉</h1>
          <p>Thanks for signing up! You can now start uploading meeting transcripts and generating AI-powered summaries.</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>What you can do:</h3>
            <ul>
              <li>📄 Upload meeting transcripts (PDF, DOCX, TXT)</li>
              <li>🤖 Generate AI summaries with custom prompts</li>
              <li>✏️ Edit and refine your summaries</li>
              <li>📤 Share summaries via email</li>
            </ul>
          </div>
          
          <p style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="background: #3b82f6; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 8px; display: inline-block;">
              Go to Dashboard
            </a>
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Need help? Reply to this email or check our documentation.
          </p>
        </div>
      `,
      tags: [{ name: 'category', value: 'welcome' }]
    });
    
    console.log('✅ Welcome email sent to:', userEmail);
    
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
  }
}

/**
 * Validate Resend configuration
 */
export function validateEmailConfig(): { 
  configured: boolean; 
  domain?: string; 
  error?: string; 
} {
  if (!process.env.RESEND_API_KEY) {
    return { 
      configured: false, 
      error: 'RESEND_API_KEY not configured' 
    };
  }
  
  return { 
    configured: true, 
    domain: process.env.RESEND_DOMAIN || 'localhost' 
  };
}

/**
 * Get email delivery status (if supported by Resend)
 */
export async function getEmailStatus(emailId: string): Promise<{
  status: string;
  delivered_at?: Date;
  opened_at?: Date;
}> {
  try {
    // Note: This is a placeholder - Resend may not support this yet
    // Check Resend docs for actual implementation
    return {
      status: 'sent',
      delivered_at: new Date(),
    };
  } catch (error) {
    console.error('Error getting email status:', error);
    return { status: 'unknown' };
  }
}
