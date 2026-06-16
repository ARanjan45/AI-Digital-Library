import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function uploadPDF(
  fileBuffer: Buffer,
  fileName: string
): Promise<{ url: string; publicId: string; pages: number }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "ai-library/pdfs",
        public_id: `${Date.now()}-${fileName.replace(/\s+/g, "-")}`,
        format: "pdf",
        access_mode: "public",
        type: "upload",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result!.secure_url,
          publicId: result!.public_id,
          pages: result!.pages || 0,
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
}

export async function uploadCover(
  fileBuffer: Buffer,
  fileName: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "ai-library/covers",
        public_id: `cover-${Date.now()}-${fileName.replace(/\s+/g, "-")}`,
        transformation: [{ width: 400, height: 560, crop: "fill" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result!.secure_url, publicId: result!.public_id });
      }
    );
    uploadStream.end(fileBuffer);
  });
}

export async function deleteFile(publicId: string, resourceType: "raw" | "image" = "raw") {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export default cloudinary;