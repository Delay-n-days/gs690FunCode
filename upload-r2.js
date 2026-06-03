// upload-r2.js <localFile> <remoteKey>
// 使用 R2 的 S3 兼容 API 上传文件
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const [,, localFile, remoteKey] = process.argv;
if (!localFile || !remoteKey) {
  console.error('Usage: node upload-r2.js <localFile> <remoteKey>');
  process.exit(1);
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function main() {
  const body = fs.readFileSync(localFile);
  const contentType = localFile.endsWith('.exe') ? 'application/vnd.microsoft.portable-exec'
    : localFile.endsWith('.msi') ? 'application/x-msi'
    : 'application/octet-stream';

  await client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: remoteKey,
    Body: body,
    ContentType: contentType,
  }));

  console.log(`Uploaded ${localFile} -> r2://${process.env.R2_BUCKET}/${remoteKey}`);
  console.log(`Public URL: https://pub-634661256d2a40a5a022b824d51bf62d.r2.dev/${remoteKey}`);
}

main().catch(err => {
  console.error('Upload failed:', err.message);
  process.exit(1);
});
