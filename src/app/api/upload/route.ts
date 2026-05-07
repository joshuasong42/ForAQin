import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { saveUploadedImage } from '@/lib/upload';
import { ok, fail } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILES = 12;

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json(fail('未登录'), { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(fail('请求体格式错误'), { status: 400 });
  }

  const files = form.getAll('files').filter((x): x is File => x instanceof File);
  if (files.length === 0) return NextResponse.json(fail('未提供图片'), { status: 400 });
  if (files.length > MAX_FILES) {
    return NextResponse.json(fail(`一次最多上传 ${MAX_FILES} 张图片`), { status: 400 });
  }

  const saved: { path: string; width: number; height: number }[] = [];
  for (const f of files) {
    try {
      saved.push(await saveUploadedImage(f));
    } catch (e) {
      const msg = e instanceof Error ? e.message : '上传失败';
      return NextResponse.json(fail(msg), { status: 400 });
    }
  }

  return NextResponse.json(ok({ photos: saved }));
}
