# destiny-paywall

Stripe 付费墙，给独立的八字站用。一个 Cloudflare Worker：创建 Checkout、校验付款、签发浏览器可离线验证的授权令牌。不存用户数据，没有数据库。

## 部署

1. 在 Stripe 后台创建一个一次性价格（Product → Price, one-time），记下 `price_…`；在 Settings → Payment methods 打开 Alipay 与 WeChat Pay（需要 Stripe 账户所在地区支持）。
2. 生成签名密钥：`npm run keygen`。把第一段设为 Worker 密钥，第二段设为站点构建变量。
3. 配置：
   - `wrangler.toml` 里填 `STRIPE_PRICE_ID` 与 `ALLOWED_ORIGINS`。
   - `wrangler secret put STRIPE_SECRET_KEY`（sk_live_…）
   - `wrangler secret put SIGNING_JWK`（keygen 输出的私钥 JSON）
4. `npm run deploy`，得到 `https://destiny-paywall.<账号>.workers.dev`。
5. 站点构建时设置：
   - `VITE_PAYWALL_URL=https://destiny-paywall.<账号>.workers.dev`
   - `VITE_LICENSE_JWK=<keygen 输出的公钥 JSON>`
   - `VITE_PRICE_LABEL=¥68 · 一次付费，永久使用`
   在 GitHub 仓库 Settings → Secrets and variables → Actions → Variables 里加这三个变量即可，工作流会读取。

## 流程

浏览器 → `POST /checkout` → 跳转 Stripe → 付款后回到站点并带 `?session_id` → 浏览器 `GET /verify` → Worker 向 Stripe 确认 `payment_status=paid` → 签发 ES256 JWT（10 年）→ 浏览器用公钥验签后存入 localStorage。换设备用购买邮箱 `POST /restore` 重新签发。

令牌只包含邮箱的哈希、`plan: pro` 和有效期，不含任何出生信息。
