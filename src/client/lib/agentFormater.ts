export default function parseUserAgent(userAgent: string) {
  const ua = (userAgent || "").toLowerCase();

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
