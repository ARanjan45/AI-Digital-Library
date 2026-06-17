import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_BUCKET_NAME!;
const REGION = process.env.AWS_REGION!;

export async function uploadPDFToS3(
  fileBuffer: Buffer,
  fileName: string
): Promise<{ url: string; publicId: string; pages: number }> {
  const key = `pdfs/${Date.now()}-${fileName.replace(/\s+/g, "-")}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: "application/pdf",
    })
  );

  const url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  return { url, publicId: key, pages: 0 };
}

export async function uploadCoverToS3(
  fileBuffer: Buffer,
  fileName: string
): Promise<{ url: string; publicId: string }> {
  const key = `covers/${Date.now()}-${fileName.replace(/\s+/g, "-")}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: "image/jpeg",
    })
  );

  const url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  return { url, publicId: key };
}

export async function deleteFromS3(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}