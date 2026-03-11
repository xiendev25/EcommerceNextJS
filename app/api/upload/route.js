import { mkdir, unlink, writeFile } from "fs/promises";
import { join, basename } from "path";
import { NextResponse } from 'next/server';

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "gif"];

function slugify(input = "") {
    return input
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function nowStamp() {
    const d = new Date();
    const pad = (n) => `${n}`.padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/**
 * Xử lý UPLOAD file (create/update)
 * Client gọi bằng method: POST
 */
export async function POST(req) {
    try {
        const form = await req.formData();
        const file = form.get("file");
        const rawSlug = form.get("slug") || "";
        const rawPrefix = form.get("prefix") || "";
        const oldImagePath = form.get("old_image") || ""; // Gửi kèm nếu là update

        if (!file) {
            return NextResponse.json({ error: "Thiếu file" }, { status: 400 });
        }
        if (!rawSlug) {
            return NextResponse.json({ error: "Thiếu slug" }, { status: 400 });
        }
        if (!rawPrefix) {
            return NextResponse.json({ error: "Thiếu prefix" }, { status: 400 });
        }

        const originalName = file.name || "uploaded";
        const ext = (originalName.match(/\.([a-zA-Z0-9]+)$/)?.[1] || "").toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) {
            return NextResponse.json({ error: `Định dạng không hỗ trợ: .${ext}` }, { status: 415 });
        }

        await mkdir(UPLOAD_DIR, { recursive: true });

        // Nếu có oldImagePath, đây là hành động update -> xóa file cũ
        if (oldImagePath) {
            try {
                const oldFilename = basename(oldImagePath);
                const oldAbsPath = join(UPLOAD_DIR, oldFilename);
                await unlink(oldAbsPath);
                console.log(`Successfully deleted old file: ${oldFilename}`);
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    console.error(`Lỗi khi xóa file cũ ${oldImagePath}:`, err);
                }
            }
        }

        // Logic upload file mới
        const slug = slugify(rawSlug);
        const prefix = slugify(rawPrefix);

        const filename = `${prefix}_${slug}_${nowStamp()}.${ext}`;
        const absPath = join(UPLOAD_DIR, filename);
        const bytes = await file.arrayBuffer();
        await writeFile(absPath, Buffer.from(bytes));

        const publicPath = `/uploads/${filename}`;
        return NextResponse.json({
            message: "Upload thành công!",
            file: {
                filepath: publicPath,
                newFilename: filename,
                originalFilename: originalName,
            }
        });

    } catch (e) {
        console.error("API POST Upload Error:", e);
        return NextResponse.json({ error: "Đã có lỗi xảy ra phía máy chủ." }, { status: 500 });
    }
}

/**
 * Xử lý XÓA file
 * Client gọi bằng method: DELETE
 */
export async function DELETE(req) {
    try {
        // Với DELETE, dữ liệu thường được gửi qua JSON body hoặc query params
        const { imagePath } = await req.json();

        if (!imagePath) {
            return NextResponse.json({ error: "Thiếu đường dẫn ảnh (imagePath)" }, { status: 400 });
        }

        const filenameToDelete = basename(imagePath);
        const absPathToDelete = join(UPLOAD_DIR, filenameToDelete);

        await unlink(absPathToDelete);
        console.log(`Successfully deleted file: ${filenameToDelete}`);

        return NextResponse.json({ message: "Xóa ảnh thành công!" });
    } catch (err) {
        // Nếu file không tồn tại, vẫn coi như thành công
        if (err.code === 'ENOENT') {
            console.log(`File not found, considered deleted: ${err.path}`);
            return NextResponse.json({ message: "Xóa ảnh thành công (file không tồn tại)." });
        }
        console.error("API DELETE Error:", err);
        return NextResponse.json({ error: "Đã có lỗi xảy ra phía máy chủ." }, { status: 500 });
    }
}

/**
 * Xử lý CORS Preflight request
 */
export function OPTIONS() {
    return new Response(null, { status: 204 });
}