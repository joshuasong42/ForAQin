#!/usr/bin/env bash
# 备份脚本：把 ./data/ 打包到 /root/backups/songpeng-YYYYMMDD.tar.gz
# 使用方法：
#   ./scripts/backup.sh                # 备份到默认位置
#   BACKUP_DIR=/path ./scripts/backup.sh
#   crontab -e:  30 3 * * *  cd /opt/songpeng-520 && ./scripts/backup.sh >> backup.log 2>&1

set -euo pipefail

DATE="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${BACKUP_DIR:-/root/backups}"
SOURCE_DIR="${SOURCE_DIR:-./data}"
KEEP_DAYS="${KEEP_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "[backup] source not found: $SOURCE_DIR" >&2
  exit 1
fi

ARCHIVE="$BACKUP_DIR/songpeng-$DATE.tar.gz"

# WAL 模式下数据库事务文件可能正在被写入，先 checkpoint 一下
if [ -x "$(command -v sqlite3)" ] && [ -f "$SOURCE_DIR/app.db" ]; then
  sqlite3 "$SOURCE_DIR/app.db" 'PRAGMA wal_checkpoint(TRUNCATE);' || true
fi

tar -czf "$ARCHIVE" -C "$(dirname "$SOURCE_DIR")" "$(basename "$SOURCE_DIR")"
echo "[backup] $ARCHIVE  ($(du -h "$ARCHIVE" | cut -f1))"

# 清理 N 天前的备份
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'songpeng-*.tar.gz' -mtime +"$KEEP_DAYS" -delete
echo "[backup] cleaned > $KEEP_DAYS days"
