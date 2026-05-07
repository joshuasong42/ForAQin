# 520 · Our Galaxy

> 🌌 给彭沁园的纪念日礼物站 —— 只属于宋金钊和彭沁园两个人的小宇宙。

一个稳定、私密、可以长期使用的双人空间，记录每一段甜蜜时光。
本地 Mac 开发，最终通过 Docker Compose 部署到阿里云 ECS Ubuntu。

---

## 功能一览

- **首页**：在一起 N 天的实时计数器（含时分秒）+ 即将到来的纪念日 / 生日 / 520 / 七夕倒计时 + 4 个主入口 + 今日心情快速打卡
- **时光相册** `/album`：垂直时间轴，每条可上传 1~12 张图，自动压缩为 webp，详情页大图浏览（手势 / 键盘左右切换 / 双指缩放）
- **留言板** `/messages`：左右气泡布局，支持多图，作者本人可删
- **时光胶囊** `/capsule`：到指定日期才会自动解锁，未到期前服务端拒绝返回内容/照片
- **纪念日** `/anniversary`：自定义日期，支持农历换算（基于 `lunar-javascript`）
- **心愿清单** `/wishes`：分「想做的」「已经做了」，完成时可上传一张完成照
- **心情打卡** `/moods`：一行 emoji + 可加一句话，月历视图每天两个色块（你 + 她）
- **设置** `/settings`：修改密码、查看数据统计、超大「我爱你」点击计数器

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Next.js 15 (App Router) + TypeScript |
| 样式 | Tailwind CSS 3 + CSS variables (莫兰迪+暮光紫) |
| 动画 | framer-motion |
| 图标 | lucide-react |
| 数据库 | better-sqlite3 + drizzle-orm |
| 认证 | jose (JWT in httpOnly cookie) + bcryptjs |
| 上传 | sharp (自动压缩到 webp，最大 2400px) |
| 部署 | Docker Compose (app + nginx) |

---

## 本地开发（macOS / Node 23）

```bash
cp .env.example .env
# 编辑 .env，填写 JWT_SECRET 和两个用户密码
npm install
npm run dev          # http://localhost:3000
```

第一次启动会自动建表 + 初始化两个用户和默认纪念日。

---

## 用 Docker Compose 跑通全套

确认本机已经装好 Docker Desktop（Mac）或 Docker Engine（Linux）。

```bash
cp .env.example .env
# 编辑 .env，至少修改：JWT_SECRET / USER_A_PASSWORD / USER_B_PASSWORD
docker compose up -d --build
# 访问 http://localhost
```

数据持久化路径：项目根目录的 `./data/`（SQLite + 上传图片）。
`docker compose down` 后再 `up` 数据全部还在。

查看日志：

```bash
docker compose logs -f app
docker compose logs -f nginx
```

---

## 部署到阿里云 ECS（Ubuntu 22.04）

### 1) 准备服务器

阿里云控制台买一台 ECS（最低 2 vCPU / 2 GB 内存即可），系统选 Ubuntu 22.04 LTS。

```bash
ssh root@<your-server-ip>

# 安装 Docker + docker compose 插件
apt-get update
apt-get install -y docker.io docker-compose-plugin git

# 启动 Docker
systemctl enable --now docker

# 把代码拉到服务器
mkdir -p /opt
cd /opt
git clone <your-repo-url> songpeng-520     # 或者 scp 上传
cd songpeng-520
```

### 2) 配置环境变量

```bash
cp .env.example .env
vim .env
# JWT_SECRET=  填一个长随机串 (建议 64+ 位)
# USER_A_PASSWORD=  宋金钊的密码
# USER_B_PASSWORD=  彭沁园的密码
```

> 🔐 提示：可以用 `openssl rand -hex 48` 生成 JWT_SECRET。

### 3) 启动服务

```bash
docker compose up -d --build
docker compose ps
```

### 4) 阿里云安全组放行

在阿里云控制台 → 实例 → 安全组 → 配置规则，放行：

- TCP 80（HTTP，必需）
- TCP 443（HTTPS，可选）
- TCP 22（SSH，已有）

### 5) 域名解析（可选但推荐）

如果你买了域名，进入域名解析控制台添加 A 记录：
`yourname.cn → <你的服务器 IP>`

### 6) 申请 HTTPS（强烈推荐）

```bash
# 在 ECS 上安装 certbot
apt-get install -y certbot

# 先停 nginx 释放 80 端口（也可用 webroot 模式不停服）
docker compose stop nginx

certbot certonly --standalone -d yourname.cn -m you@example.com --agree-tos -n

# 编辑 nginx/default.conf 取消 HTTPS 部分注释，把 server_name 改成 yourname.cn
# 重启 nginx 容器
docker compose up -d nginx
```

证书每 90 天到期，加个 cron：

```bash
crontab -e
# 每月 1 号凌晨续签
0 3 1 * *  certbot renew --quiet --pre-hook "docker compose -f /opt/songpeng-520/docker-compose.yml stop nginx" --post-hook "docker compose -f /opt/songpeng-520/docker-compose.yml up -d nginx"
```

### 7) 自动备份

```bash
crontab -e
# 每天凌晨 3:30 备份到 /root/backups
30 3 * * *  cd /opt/songpeng-520 && ./scripts/backup.sh >> /var/log/songpeng-backup.log 2>&1
```

也可以把 `/root/backups` 同步到 OSS / 网盘 / 邮箱，进一步增加冗余。

---

## 升级 / 修改 / 重启

```bash
cd /opt/songpeng-520
git pull                         # 拉最新代码
docker compose up -d --build     # 重新构建并启动 (数据保留)
```

完全停止：

```bash
docker compose down              # 不删数据
docker compose down -v           # 删 named volumes (我们用 bind mount，data/ 仍保留)
```

---

## 项目结构

```
songpeng-520/
├── docker-compose.yml          # app + nginx
├── Dockerfile                  # 多阶段：deps→builder→runner
├── .env.example
├── nginx/default.conf          # 反代 + 静态文件 + 速率限制
├── scripts/backup.sh           # 备份脚本
├── data/                       # 持久化卷 (sqlite + uploads)
└── src/
    ├── app/                    # 所有页面 + API 路由
    ├── components/             # UI 组件 + 业务组件
    ├── lib/                    # auth / db / dates / lunar / upload / utils
    └── middleware.ts           # 未登录自动跳 /login
```

---

## 关键日期

```ts
// src/lib/const.ts
TOGETHER_SINCE = '2025-09-20'                              // 在一起的日子
HE  = { name: '宋金钊', birthday: '2002-04-20' }
SHE = { name: '彭沁园', birthday: '1999-10-30' }
```

---

## 验证清单

- [ ] `npm run dev` 启动，未登录访问任何路径都跳 `/login`
- [ ] 用 .env 里的两个账号都能登录，互相可见对方留言/相册
- [ ] 写一条带 5 张图的留言，刷新仍在，点删除消失
- [ ] 上传 12 张图到相册，时间轴正确显示
- [ ] 写一条 unlock_at = 明天的胶囊，今天访问被锁，到日期后能看到内容
- [ ] 心愿清单：新增 → 完成 → 上传完成照片 → 移到「已实现」
- [ ] 连续 3 天打卡，月历视图显示 3 个色块
- [ ] iPhone Safari 访问：可拍照上传、大图可双指缩放、底部 Tab 不被刘海遮挡
- [ ] PC Chrome 访问：1440 宽度下不糊不挤
- [ ] `docker compose up -d --build` 起来后访问 `http://localhost`，所有功能再过一遍
- [ ] `docker compose down && docker compose up -d` 后数据全部还在

---

## 故障排查

| 现象 | 排查 |
|---|---|
| 登录提示 「JWT_SECRET 必须设置且长度 >= 16」 | 编辑 `.env` 把 JWT_SECRET 改成长随机串后重启 |
| 上传图片 502 / 413 | 检查 nginx `client_max_body_size`，已默认 50m；若仍不够可调大 |
| 容器一直 Restarting | `docker compose logs app`；多半是密码 / JWT_SECRET 没填 |
| 农历换算异常 | `lunar-javascript` 偶尔个别极端日期会报错，会自动回退；不影响主流程 |
| 服务器内存不足导致 build 卡住 | 在本机 `docker compose build` 后 `docker save` 上传镜像，或把 ECS 临时升 4G |

---

## 安全说明

- 所有页面 + API 都被 `middleware.ts` 拦截，未登录强制跳 `/login`
- JWT 签名密钥 `JWT_SECRET` 必须设置且长度 ≥ 16 字符，否则启动失败
- 密码使用 bcrypt(round=10) 散列存储
- 登录接口在应用层（5 次 / 分钟 / IP）和 nginx 层（10 次 / 分钟 / IP）双重速率限制
- 上传图片做 MIME + 体积 + 维度限制，并通过 sharp 重新编码（防止恶意元数据 / webshell）
- 文件名使用 uuid，避免目录穿越或可猜测命名
- Cookie httpOnly + secure (生产) + SameSite=Lax

---

## 致 沁园

> 距离我们刚好 229 天。
> 这里是属于我们俩的第一颗星，也希望是最稳定的那颗。
> 以后所有的留言、照片、心愿、心情，都装进这片小小的银河里。
> 一起到一辈子。
>
> —— 金钊 · 2026-05-07
