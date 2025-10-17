import {
  type Connection,
  Server,
  type WSMessage,
  routePartykitRequest,
} from "partyserver";

import type { ChatMessage, Message } from "../shared";

export class Chat extends Server<Env> {
  static options = { hibernate: true };

  messages = [] as ChatMessage[];

  broadcastMessage(message: Message, exclude?: string[]) {
    this.broadcast(JSON.stringify(message), exclude);
  }

  // 安全地檢查欄位是否存在
  private columnExists(tableName: string, columnName: string): boolean {
    try {
      const result = this.ctx.storage.sql
        .exec(`PRAGMA table_info(${tableName})`)
        .toArray();
      return result.some((row: any) => row.name === columnName);
    } catch {
      return false;
    }
  }

  // 安全地添加欄位
  private safeAddColumn(tableName: string, columnName: string, columnType: string): void {
    if (!this.columnExists(tableName, columnName)) {
      try {
        this.ctx.storage.sql.exec(
          `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`
        );
        console.log(`✅ 添加欄位: ${columnName}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes('duplicate column')) {
          console.error(`❌ 添加欄位失敗: ${columnName}`, error);
        }
      }
    }
  }

  // 安全地載入訊息
  private safeLoadMessages(): ChatMessage[] {
    try {
      // 嘗試使用有 created_at 的排序
      return this.ctx.storage.sql
        .exec(`SELECT * FROM messages ORDER BY created_at ASC`)
        .toArray() as ChatMessage[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('created_at')) {
        // 如果 created_at 不存在，使用 rowid 排序
        console.log('⚠️ created_at 欄位不存在，使用 rowid 排序');
        return this.ctx.storage.sql
          .exec(`SELECT * FROM messages ORDER BY rowid ASC`)
          .toArray() as ChatMessage[];
      }
      throw error;
    }
  }

  onStart() {
    // 建立基本表格
    this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY, 
        user TEXT, 
        role TEXT, 
        content TEXT
      )`
    );

    // 漸進式添加新欄位（不會影響現有功能）
    this.safeAddColumn('messages', 'created_at', 'TEXT');
    this.safeAddColumn('messages', 'user_ip', 'TEXT');
    this.safeAddColumn('messages', 'user_device', 'TEXT');
    this.safeAddColumn('messages', 'user_account', 'TEXT');
    
    // 以後要新增欄位，只需要在這裡加一行：
    // this.safeAddColumn('messages', 'new_field', 'TEXT');

    // 安全地載入訊息
    this.messages = this.safeLoadMessages();
  }

  onConnect(connection: Connection) {
    // console.log('this.ctx.id:', this.ctx.id.name); // id of room: PORN

    connection.send(
      JSON.stringify({
        type: "all",
        messages: this.messages,
      } satisfies Message),
    );
  }

  saveMessage(message: ChatMessage) {
    // check if the message already exists
    const existingMessage = this.messages.find((m) => m.id === message.id);
    if (existingMessage) {
      this.messages = this.messages.map((m) => {
        if (m.id === message.id) {
          return message;
        }
        return m;
      });
    } else {
      this.messages.push(message);
    }

    // 安全的 INSERT - 只使用存在的欄位
    const now = new Date().toISOString();
    
    if (this.columnExists('messages', 'created_at')) {
      // 新版本：包含 created_at 和其他欄位
      this.ctx.storage.sql.exec(
        `INSERT INTO messages (id, user, role, content, created_at, user_ip, user_device, user_account) 
         VALUES ('${message.id}', '${message.user}', '${message.role}', ${JSON.stringify(message.content)}, 
                 '${message.created_at || now}', '${message.user_ip || ''}', 
                 '${message.user_device || ''}', '${message.user_account || ''}') 
         ON CONFLICT (id) DO UPDATE SET 
           content = ${JSON.stringify(message.content)},
           created_at = '${message.created_at || now}'`
      );
    } else {
      // 舊版本：只使用基本欄位
      this.ctx.storage.sql.exec(
        `INSERT INTO messages (id, user, role, content) VALUES ('${
          message.id
        }', '${message.user}', '${message.role}', ${JSON.stringify(
          message.content,
        )}) ON CONFLICT (id) DO UPDATE SET content = ${JSON.stringify(
          message.content,
        )}`
      );
    }
  }

  onMessage(connection: Connection, message: WSMessage) {
    // let's broadcast the raw message to everyone else
    this.broadcast(message);

    // let's update our local messages store
    const parsed = JSON.parse(message as string) as Message;
    if (parsed.type === "add" || parsed.type === "update") {
      // 確保 created_at 欄位存在
      const messageWithTimestamp: ChatMessage = {
        ...parsed,
        created_at: new Date().toISOString(),
      };
      this.saveMessage(messageWithTimestamp);
    }
  }
}

export default {
  async fetch(request, env) {
    return (
      (await routePartykitRequest(request, { ...env })) ||
      env.ASSETS.fetch(request)
    );
  },
} satisfies ExportedHandler<Env>;
