import { supabase } from "./supabase";

type UploadResult = {
  url: string;
  path: string;
  error?: string;
};

// Upload a file to Supabase Storage.
// Returns the public URL.
export async function uploadFile(
  file: File | Blob,
  bucket: "avatars" | "attachments",
  folder?: string
): Promise<UploadResult> {
  try {
    const ext = file instanceof File
      ? file.name.split(".").pop() || "bin"
      : "png";

    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}.${ext}`;

    const path = folder ? `${folder}/${fileName}` : fileName;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file instanceof File ? file.type : "image/png",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { url: "", path: "", error: uploadError.message };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    return { url: data.publicUrl, path };
  } catch (err: any) {
    console.error("Upload exception:", err);
    return { url: "", path: "", error: err?.message || "Upload failed" };
  }
}

// Delete a file from storage by its full public URL.
export async function deleteFileByUrl(
  url: string,
  bucket: "avatars" | "attachments"
) {
  try {
    // Extract path from public URL
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return { success: false };

    const path = url.slice(idx + marker.length);

    const { error } = await supabase.storage.from(bucket).remove([path]);
    return { success: !error };
  } catch (err) {
    console.error("Delete file error:", err);
    return { success: false };
  }
}

// Check if a URL is a Supabase Storage URL (vs old base64)
export function isStorageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("/storage/v1/object/public/");
}