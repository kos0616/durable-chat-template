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

  // 提取重複的表格結構定義
  private readonly TABLE_SCHEMA = `
    id TEXT PRIMARY KEY, 
    user TEXT, 
    role TEXT, 
    content TEXT,
    created_at TEXT,
    user_ip TEXT,
    user_device TEXT,
		user_avatar TEXT
  `;

  broadcastMessage(message: Message, exclude?: string[]) {
    this.broadcast(JSON.stringify(message), exclude);
  }

  onRequest(request: Request): Response | Promise<Response> {
		console.log('connected request:', request);
    // 處理請求
    return new Response("Hello World");
  }

  onStart() {
    try {
      // 嘗試建立完整的表格結構
      this.ctx.storage.sql.exec(
        `CREATE TABLE IF NOT EXISTS messages (${this.TABLE_SCHEMA})`,
      );

      // 嘗試載入訊息
      this.messages = this.ctx.storage.sql
        .exec(`SELECT * FROM messages ORDER BY created_at ASC`)
        .toArray() as ChatMessage[];
    } catch (error) {
      // 如果出現任何錯誤，清空重建
      console.log("⚠️ 表格結構不符，清空重建...");

      try {
        // 刪除舊表格
        this.ctx.storage.sql.exec(`DROP TABLE IF EXISTS messages`);
      } catch (e) {
        // 忽略刪除錯誤
      }

      // 重新建立完整表格
      this.ctx.storage.sql.exec(`CREATE TABLE messages (${this.TABLE_SCHEMA})`);

      // 初始化空的訊息陣列
      this.messages = [];
      console.log("✅ 表格重建完成");
    }
  }

  onConnect(connection: Connection) {
    // console.log("this.ctx.id:", this.ctx.id.name); // id of room: PORN

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

    // 直接使用完整的欄位結構（因為表格已經包含所有欄位）
    const now = new Date().toISOString();
    this.ctx.storage.sql.exec(
      `INSERT INTO messages (id, user, role, content, created_at, user_ip, user_device) 
       VALUES ('${message.id}', '${message.user}', '${message.role}', ${JSON.stringify(message.content)}, 
               '${message.created_at || now}', '${message.user_ip || ""}', 
               '${message.user_device || ""}') 
       ON CONFLICT (id) DO UPDATE SET 
         content = ${JSON.stringify(message.content)},
         created_at = '${message.created_at || now}',
         user_ip = '${message.user_ip || ""}',
         user_device = '${message.user_device || ""}'`,
    );
  }

  onMessage(connection: Connection, message: WSMessage) {
    // let's broadcast the raw message to everyone else
    this.broadcast(message);
    console.log("on message");
    console.log(message);


    // let's update our local messages store
    const parsed = JSON.parse(message as string) as Message;
    if (parsed.type === "add" || parsed.type === "update") {
      const messageWithTimestamp: ChatMessage = {
        ...parsed,
        created_at: new Date().toISOString(),
        user_avatar: parsed.user_avatar || "",
        user_ip: "",
        user_device: "",
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
