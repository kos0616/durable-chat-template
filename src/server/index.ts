import {
  type Connection,
  Server,
  type WSMessage,
  routePartykitRequest,
} from "partyserver";

import type { ChatMessage, Message } from "../shared";

// 在檔案頂部新增全域變數
let currentUserInfo: {
  ip: string;
  userAgent: ReturnType<typeof parseUserAgent>;
  country: string;
  city: string;
  acceptLanguage: string;
  origin: string;
} = {
  ip: "",
  userAgent: {
    os: "unknown",
    browser: "unknown",
    deviceType: "unknown",
    fullUA: "unknown",
  },
  country: "",
  city: "",
  acceptLanguage: "",
  origin: "",
};

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
		user_avatar TEXT,
		user_country TEXT
  `;

  broadcastMessage(message: Message, exclude?: string[]) {
    this.broadcast(JSON.stringify(message), exclude);
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
      console.log(
        "錯誤詳情:",
        error instanceof Error ? error.message : String(error),
      );

      try {
        // 刪除舊表格
        this.ctx.storage.sql.exec(`DROP TABLE IF EXISTS messages`);
        console.log("🗑️ 舊資料表已刪除");
      } catch (e) {
        // 忽略刪除錯誤
        console.log("⚠️ 刪除舊表格時出現錯誤（可忽略）:", e);
      }
      try {
        // 重新建立完整表格
        this.ctx.storage.sql.exec(
          `CREATE TABLE messages (${this.TABLE_SCHEMA})`,
        );
        console.log("🆕 新資料表已建立");

        // 初始化空的訊息陣列
        this.messages = [];
        console.log("✅ 表格重建完成");
      } catch (error) {
        console.error("❌ 建立資料表失敗:", error);
      }
    }
  }

  onConnect(connection: Connection) {
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

    // 嘗試使用完整的欄位結構儲存到資料庫
    const now = new Date().toISOString();
    try {
      this.ctx.storage.sql.exec(
        `INSERT INTO messages (id, user, role, content, created_at, user_ip, user_device, user_avatar, user_country) 
         VALUES ('${message.id}', '${message.user}', '${message.role}', ${JSON.stringify(message.content)}, 
                 '${message.created_at || now}', '${message.user_ip || ""}', 
                 '${message.user_device || ""}', '${message.user_avatar || ""}', '${message.user_country || ""}') 
         ON CONFLICT (id) DO UPDATE SET 
           content = ${JSON.stringify(message.content)},
           created_at = '${message.created_at || now}'`,
      );
    } catch (error) {
      console.log("💾 資料庫寫入失敗，嘗試重建資料表...", error);

      try {
        // 刪除並重建資料表
        this.ctx.storage.sql.exec(`DROP TABLE IF EXISTS messages`);
        this.ctx.storage.sql.exec(
          `CREATE TABLE messages (${this.TABLE_SCHEMA})`,
        );
        console.log("🔄 資料表重建完成，重新嘗試儲存訊息");

        // 重新儲存所有訊息（包括目前這則）
        for (const msg of this.messages) {
          this.ctx.storage.sql.exec(
            `INSERT INTO messages (id, user, role, content, created_at, user_ip, user_device, user_avatar, user_country) 
             VALUES ('${msg.id}', '${msg.user}', '${msg.role}', ${JSON.stringify(msg.content)}, 
                     '${msg.created_at || now}', '${msg.user_ip || ""}', 
                     '${msg.user_device || ""}', '${msg.user_avatar || ""}', '${msg.user_country || ""}')`,
          );
        }
        console.log(`✅ 成功重新儲存 ${this.messages.length} 則訊息`);
      } catch (rebuildError) {
        console.error("❌ 資料表重建失敗:", rebuildError);
      }
    }
  }

  onMessage(connection: Connection, message: WSMessage) {
    // let's broadcast the raw message to everyone else
    this.broadcast(message);

    // let's update our local messages store
    const parsed = JSON.parse(message as string) as Message;

    if (parsed.type === "add" || parsed.type === "update") {
      const messageWithTimestamp: ChatMessage = {
        ...parsed,
        created_at: new Date().toISOString(),
        user_avatar: parsed.user_avatar || "",
        user_ip: currentUserInfo.ip,
        user_device: currentUserInfo.userAgent.fullUA,
        user_country: currentUserInfo.country,
      };
      this.saveMessage(messageWithTimestamp);
    }
  }
}

export default {
  async fetch(request, env) {
    saveRequestInfo(request);
    return (
      (await routePartykitRequest(request, { ...env })) ||
      env.ASSETS.fetch(request)
    );
  },
} satisfies ExportedHandler<Env>;

function saveRequestInfo(request: Request) {
  currentUserInfo = {
    ip:
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown",
    userAgent: parseUserAgent(request.headers.get("user-agent") || "unknown"),
    country: (request.cf?.country as string) || "unknown",
    city: (request.cf?.city as string) || "unknown",
    acceptLanguage: request.headers.get("accept-language") || "unknown",
    origin: request.headers.get("origin") || "unknown",
  };
}

function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();

  // 偵測作業系統
  let os = "unknown";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

  // 偵測瀏覽器
  let browser = "unknown";
  if (ua.includes("chrome")) browser = "Chrome";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("safari")) browser = "Safari";
  else if (ua.includes("edge")) browser = "Edge";

  // 偵測裝置類型
  let deviceType = "desktop";
  if (ua.includes("mobile")) deviceType = "mobile";
  else if (ua.includes("tablet")) deviceType = "tablet";

  return { os, browser, deviceType, fullUA: userAgent };
}
