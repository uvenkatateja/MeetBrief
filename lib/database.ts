import { neon } from '@neondatabase/serverless';

// Database connection
const sql = neon(process.env.DATABASE_URL!);

// ===================================
// DATABASE TYPES
// ===================================
export interface User {
  id: string;
  clerk_user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  image_url?: string;
  plan: 'free' | 'pro' | 'enterprise';
  created_at: Date;
  updated_at: Date;
}

export interface Transcript {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  extracted_text?: string;
  word_count: number;
  status: 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Summary {
  id: string;
  transcript_id: string;
  user_id: string;
  title: string;
  prompt: string;
  summary: string;
  ai_model: string;
  token_count: number;
  processing_time: number;
  status: 'generating' | 'completed' | 'failed';
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Send {
  id: string;
  summary_id: string;
  user_id: string;
  recipients: string[];
  subject: string;
  email_id?: string;
  status: 'sending' | 'sent' | 'failed';
  error_message?: string;
  sent_at: Date;
  delivered_at?: Date;
  opened_at?: Date;
}

export interface UserUsage {
  id: string;
  user_id: string;
  usage_type: 'transcript_upload' | 'summary_generation' | 'email_send';
  usage_count: number;
  usage_date: Date;
  created_at: Date;
}

// ===================================
// USER OPERATIONS
// ===================================
export const userDb = {
  async create(userData: {
    clerk_user_id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    image_url?: string;
  }): Promise<User> {
    const result = await sql`
      INSERT INTO users (clerk_user_id, email, first_name, last_name, image_url)
      VALUES (${userData.clerk_user_id}, ${userData.email}, ${userData.first_name || null}, ${userData.last_name || null}, ${userData.image_url || null})
      RETURNING *
    `;
    return result[0] as User;
  },

  async findByClerkId(clerkUserId: string): Promise<User | null> {
    const result = await sql`
      SELECT * FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    return result[0] as User || null;
  },

  async findById(userId: string): Promise<User | null> {
    const result = await sql`
      SELECT * FROM users WHERE id = ${userId} LIMIT 1
    `;
    return result[0] as User || null;
  },

  async update(userId: string, updates: Partial<User>): Promise<User> {
    const result = await sql`
      UPDATE users 
      SET ${sql(updates)}
      WHERE id = ${userId}
      RETURNING *
    `;
    return result[0] as User;
  }
};

// ===================================
// TRANSCRIPT OPERATIONS
// ===================================
export const transcriptDb = {
  async create(transcriptData: {
    user_id: string;
    title: string;
    file_name: string;
    file_url: string;
    file_size: number;
    file_type: string;
  }): Promise<Transcript> {
    const result = await sql`
      INSERT INTO transcripts (user_id, title, file_name, file_url, file_size, file_type)
      VALUES (${transcriptData.user_id}, ${transcriptData.title}, ${transcriptData.file_name}, 
              ${transcriptData.file_url}, ${transcriptData.file_size}, ${transcriptData.file_type})
      RETURNING *
    `;
    return result[0] as Transcript;
  },

  async findById(transcriptId: string): Promise<Transcript | null> {
    const result = await sql`
      SELECT * FROM transcripts WHERE id = ${transcriptId} LIMIT 1
    `;
    return result[0] as Transcript || null;
  },

  async findByUserId(userId: string, limit = 50): Promise<Transcript[]> {
    const result = await sql`
      SELECT * FROM transcripts 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC 
      LIMIT ${limit}
    `;
    return result as Transcript[];
  },

  async findRecentByFileName(userId: string, fileName: string): Promise<Transcript | null> {
    const result = await sql`
      SELECT * FROM transcripts 
      WHERE user_id = ${userId} AND file_name = ${fileName}
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    return (result[0] as Transcript) || null;
  },

  async update(transcriptId: string, updates: Partial<Transcript>): Promise<Transcript> {
    const result = await sql`
      UPDATE transcripts 
      SET ${sql(updates)}
      WHERE id = ${transcriptId}
      RETURNING *
    `;
    return result[0] as Transcript;
  },

  async updateText(transcriptId: string, extractedText: string, wordCount: number): Promise<Transcript> {
    const result = await sql`
      UPDATE transcripts 
      SET extracted_text = ${extractedText}, 
          word_count = ${wordCount}, 
          status = 'completed'
      WHERE id = ${transcriptId}
      RETURNING *
    `;
    return result[0] as Transcript;
  },

  async markFailed(transcriptId: string, errorMessage: string): Promise<Transcript> {
    const result = await sql`
      UPDATE transcripts 
      SET status = 'failed', error_message = ${errorMessage}
      WHERE id = ${transcriptId}
      RETURNING *
    `;
    return result[0] as Transcript;
  }
};

// ===================================
// SUMMARY OPERATIONS
// ===================================
export const summaryDb = {
  async create(summaryData: {
    transcript_id: string;
    user_id: string;
    title: string;
    prompt: string;
  }): Promise<Summary> {
    const result = await sql`
      INSERT INTO summaries (transcript_id, user_id, title, prompt, summary, ai_model, token_count, processing_time)
      VALUES (${summaryData.transcript_id}, ${summaryData.user_id}, ${summaryData.title}, 
              ${summaryData.prompt}, '', '', 0, 0)
      RETURNING *
    `;
    return result[0] as Summary;
  },

  async findById(summaryId: string): Promise<Summary | null> {
    const result = await sql`
      SELECT * FROM summaries WHERE id = ${summaryId} LIMIT 1
    `;
    return result[0] as Summary || null;
  },

  async findByTranscriptId(transcriptId: string): Promise<Summary[]> {
    const result = await sql`
      SELECT * FROM summaries 
      WHERE transcript_id = ${transcriptId} 
      ORDER BY created_at DESC
    `;
    return result as Summary[];
  },

  async findByUserId(userId: string, limit = 50): Promise<Summary[]> {
    const result = await sql`
      SELECT s.*, t.title as transcript_title 
      FROM summaries s
      JOIN transcripts t ON s.transcript_id = t.id
      WHERE s.user_id = ${userId} 
      ORDER BY s.created_at DESC 
      LIMIT ${limit}
    `;
    return result as Summary[];
  },

  async update(summaryId: string, updates: Partial<Summary>): Promise<Summary> {
    const result = await sql`
      UPDATE summaries 
      SET ${sql(updates)}
      WHERE id = ${summaryId}
      RETURNING *
    `;
    return result[0] as Summary;
  },

  async complete(summaryId: string, summary: string, aiModel: string, tokenCount: number, processingTime: number): Promise<Summary> {
    const result = await sql`
      UPDATE summaries 
      SET summary = ${summary}, 
          ai_model = ${aiModel}, 
          token_count = ${tokenCount}, 
          processing_time = ${processingTime},
          status = 'completed'
      WHERE id = ${summaryId}
      RETURNING *
    `;
    return result[0] as Summary;
  },

  async markFailed(summaryId: string, errorMessage: string): Promise<Summary> {
    const result = await sql`
      UPDATE summaries 
      SET status = 'failed', error_message = ${errorMessage}
      WHERE id = ${summaryId}
      RETURNING *
    `;
    return result[0] as Summary;
  },

  async delete(summaryId: string): Promise<void> {
    await sql`
      DELETE FROM summaries WHERE id = ${summaryId}
    `;
  }
};

// ===================================
// SEND OPERATIONS  
// ===================================
export const sendDb = {
  async create(sendData: {
    summary_id: string;
    user_id: string;
    recipients: string[];
    subject: string;
  }): Promise<Send> {
    const result = await sql`
      INSERT INTO sends (summary_id, user_id, recipients, subject)
      VALUES (${sendData.summary_id}, ${sendData.user_id}, 
              ${JSON.stringify(sendData.recipients)}, ${sendData.subject})
      RETURNING *
    `;
    return result[0] as Send;
  },

  async findById(sendId: string): Promise<Send | null> {
    const result = await sql`
      SELECT * FROM sends WHERE id = ${sendId} LIMIT 1
    `;
    return result[0] as Send || null;
  },

  async findByUserId(userId: string, limit = 50): Promise<Send[]> {
    const result = await sql`
      SELECT s.*, sum.title as summary_title 
      FROM sends s
      JOIN summaries sum ON s.summary_id = sum.id
      WHERE s.user_id = ${userId} 
      ORDER BY s.sent_at DESC 
      LIMIT ${limit}
    `;
    return result as Send[];
  },

  async markSent(sendId: string, emailId: string): Promise<Send> {
    const result = await sql`
      UPDATE sends 
      SET status = 'sent', email_id = ${emailId}
      WHERE id = ${sendId}
      RETURNING *
    `;
    return result[0] as Send;
  },

  async markFailed(sendId: string, errorMessage: string): Promise<Send> {
    const result = await sql`
      UPDATE sends 
      SET status = 'failed', error_message = ${errorMessage}
      WHERE id = ${sendId}
      RETURNING *
    `;
    return result[0] as Send;
  }
};

// ===================================
// USAGE TRACKING
// ===================================
export const usageDb = {
  async track(userId: string, usageType: UserUsage['usage_type'], count = 1): Promise<void> {
    await sql`
      INSERT INTO user_usage (user_id, usage_type, usage_count, usage_date)
      VALUES (${userId}, ${usageType}, ${count}, CURRENT_DATE)
      ON CONFLICT (user_id, usage_type, usage_date)
      DO UPDATE SET usage_count = user_usage.usage_count + ${count}
    `;
  },

  async getUsage(userId: string, usageType: UserUsage['usage_type'], date?: Date): Promise<number> {
    const usageDate = date || new Date();
    const result = await sql`
      SELECT usage_count FROM user_usage 
      WHERE user_id = ${userId} 
      AND usage_type = ${usageType} 
      AND usage_date = ${usageDate.toISOString().split('T')[0]}
      LIMIT 1
    `;
    return result[0]?.usage_count || 0;
  },

  async getMonthlyUsage(userId: string, usageType: UserUsage['usage_type']): Promise<number> {
    const result = await sql`
      SELECT COALESCE(SUM(usage_count), 0) as total
      FROM user_usage 
      WHERE user_id = ${userId} 
      AND usage_type = ${usageType} 
      AND usage_date >= DATE_TRUNC('month', CURRENT_DATE)
    `;
    return result[0]?.total || 0;
  }
};

// ===================================
// DASHBOARD STATS
// ===================================
export const dashboardDb = {
  async getUserStats(userId: string) {
    const result = await sql`
      SELECT 
        total_transcripts,
        total_summaries,
        total_sends,
        total_words_processed,
        last_transcript_upload,
        last_summary_generated
      FROM user_dashboard_stats 
      WHERE user_id = ${userId}
      LIMIT 1
    `;
    return result[0] || {
      total_transcripts: 0,
      total_summaries: 0,
      total_sends: 0,
      total_words_processed: 0,
      last_transcript_upload: null,
      last_summary_generated: null
    };
  },

  async getRecentActivity(userId: string, limit = 10) {
    const result = await sql`
      SELECT * FROM recent_activity 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC 
      LIMIT ${limit}
    `;
    return result;
  }
};

export default sql;
