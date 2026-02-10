import { query } from "@/lib/db"

export type AssistantType = 'admin' | 'customer' | 'suggestion'

export interface ConversationContext {
  id: number
  username: string
  assistant_type: AssistantType
  conversation_id: string
  last_used_at: Date
  created_at: Date
}

/**
 * AI对话上下文管理器
 * 用于管理和持久化AI助手的对话ID
 */
export class ConversationManager {
  /**
   * 获取用户的对话ID
   * @param username 用户名
   * @param assistantType 助手类型
   * @returns 对话ID，如果不存在则返回null
   */
  static async getConversationId(
    username: string,
    assistantType: AssistantType
  ): Promise<string | null> {
    try {
      const results = await query<ConversationContext[]>(
        `SELECT conversation_id FROM ai_conversation_contexts 
         WHERE username = ? AND assistant_type = ?`,
        [username, assistantType]
      )

      if (results.length > 0) {
        // 更新最后使用时间
        await query(
          `UPDATE ai_conversation_contexts 
           SET last_used_at = NOW() 
           WHERE username = ? AND assistant_type = ?`,
          [username, assistantType]
        )
        return results[0].conversation_id
      }

      return null
    } catch (error) {
      console.error('[ConversationManager] Error getting conversation ID:', error)
      return null
    }
  }

  /**
   * 保存或更新对话ID
   * @param username 用户名
   * @param assistantType 助手类型
   * @param conversationId API返回的对话ID
   */
  static async saveConversationId(
    username: string,
    assistantType: AssistantType,
    conversationId: string
  ): Promise<boolean> {
    try {
      await query(
        `INSERT INTO ai_conversation_contexts (username, assistant_type, conversation_id) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
           conversation_id = VALUES(conversation_id),
           last_used_at = NOW()`,
        [username, assistantType, conversationId]
      )
      return true
    } catch (error) {
      console.error('[ConversationManager] Error saving conversation ID:', error)
      return false
    }
  }

  /**
   * 清除用户的对话上下文（开始新对话）
   * @param username 用户名
   * @param assistantType 助手类型
   */
  static async clearConversation(
    username: string,
    assistantType: AssistantType
  ): Promise<boolean> {
    try {
      await query(
        `DELETE FROM ai_conversation_contexts 
         WHERE username = ? AND assistant_type = ?`,
        [username, assistantType]
      )
      return true
    } catch (error) {
      console.error('[ConversationManager] Error clearing conversation:', error)
      return false
    }
  }

  /**
   * 清理过期的对话上下文（超过7天未使用）
   */
  static async cleanupExpiredConversations(): Promise<number> {
    try {
      const result: any = await query(
        `DELETE FROM ai_conversation_contexts 
         WHERE last_used_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`
      )
      return result.affectedRows || 0
    } catch (error) {
      console.error('[ConversationManager] Error cleaning up conversations:', error)
      return 0
    }
  }
}
