import 'server-only';
import path from 'node:path';
import fs from 'node:fs/promises';
import { v4 as uuid } from 'uuid';
import sharp from 'sharp';

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB raw upload
const MAX_DIMENSION = 2400;          // longest edge
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

function uploadDir(): string {
  const d = process.env.UPLOAD_DIR || './data/uploads';
  return path.isAbsolute(d) ? d : path.resolve(process.cwd(), d);
}

function publicPathFromAbs(abs: string): string {
  // /data/uploads/2026/05/foo.webp -> /uploads/2026/05/foo.webp
  // ./data/uploads/2026/05/foo.webp -> /uploads/2026/05/foo.webp
  const root = uploadDir();
  const rel = path.relative(root, abs).split(path.sep).join('/');
  return `/uploads/${rel}`;
}

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

export type SavedImage = { path: string; width: number; height: number };

/**
 * 保存上传的图片：MIME 校验 + 体积校验 + sharp 压缩到 webp，原图丢弃。
 */
export async function saveUploadedImage(file: File): Promise<SavedImage> {
  if (!ALLOWED_MIMES.has(file.type)) {
    throw new Error(`不支持的图片类型: ${file.type}`);
  }
  if (file.size > MAX_BYTES) {
    throw new Error('图片体积超过 25MB');
  }

  const buf = Buffer.from(await file.arrayBuffer());

  // sniff with sharp to know dims & rotate properly
  const meta = await sharp(buf, { failOn: 'none' }).metadata();
  if (!meta.width || !meta.height) {
    throw new Error('无法解析图片尺寸');
  }

  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dir = path.join(uploadDir(), yyyy, mm);
  await ensureDir(dir);

  const filename = `${uuid()}.webp`;
  const abs = path.join(dir, filename);

  const pipeline = sharp(buf, { failOn: 'none' })
    .rotate() // honour EXIF orientation
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 4 });

  const info = await pipeline.toFile(abs);

  return {
    path: publicPathFromAbs(abs),
    width: info.width,
    height: info.height,
  };
}

/** 把 /uploads/... 转回磁盘绝对路径，删除时使用 */
export function publicToDiskPath(publicPath: string): string | null {
  if (!publicPath.startsWith('/uploads/')) return null;
  const rel = publicPath.replace(/^\/uploads\//, '');
  return path.join(uploadDir(), rel);
}

export async function deletePhotoFile(publicPath: string) {
  const abs = publicToDiskPath(publicPath);
  if (!abs) return;
  try {
    await fs.unlink(abs);
  } catch {
    // ignore - file may have been removed
  }
}

export const UPLOAD_LIMITS = {
  maxBytes: MAX_BYTES,
  maxDimension: MAX_DIMENSION,
  allowedMimes: Array.from(ALLOWED_MIMES),
};
