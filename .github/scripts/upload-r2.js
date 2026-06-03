/**
 * upload-r2.js
 * 上传文件到 Cloudflare R2 存储
 *
 * 用法：
 *   node upload-r2.js <localFile> <remoteKey>        上传文件
 *   node upload-r2.js --check                        测试 R2 连通性
 *
 * 环境变量（直接在脚本中配置，不依赖 GitHub Secrets）：
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_CUSTOM_DOMAIN
 */

const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

// R2 配置
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || 'f561b82dbf51a88ffdad2808ebff59c7';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || 'cb15bd80fad859a8d7c22231281e1bea';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || 'f4703ccd61a12224aa835171c2b2afc0152a082d6d0aa6edcef3820f2f88bf07';
const R2_BUCKET = process.env.R2_BUCKET || 'hucos';
const R2_CUSTOM_DOMAIN = process.env.R2_CUSTOM_DOMAIN || 'pub-634661256d2a40a5a022b824d51bf62d.r2.dev';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function upload(localFile, remoteKey) {
  const fs = require('fs');
  const path = require('path');

  const fileContent = fs.readFileSync(localFile);
  const fileSize = (fileContent.length / 1024 / 1024).toFixed(1);
  console.log(`Uploading ${localFile} (${fileSize} MB) → ${R2_CUSTOM_DOMAIN}/${remoteKey}`);

  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: remoteKey,
    Body: fileContent,
    ACL: 'public-read',
  }));

  console.log(`✅ Upload complete: ${R2_CUSTOM_DOMAIN}/${remoteKey}`);
}

async function checkConnectivity() {
  // 用一个已知存在的 key 测试连通性
  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET,
      Key: 'test.txt',
    });
    await s3.send(command);
    console.log('✅ R2 连接成功');
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      console.log('✅ R2 连接成功（测试 key 不存在但连通性正常）');
    } else if (error.Code === 'NoSuchBucket') {
      console.log(`❌ Bucket '${R2_BUCKET}' 不存在`);
      process.exit(1);
    } else {
      console.log(`⚠️ R2 连接异常: ${error.message}，但继续运行`);
    }
  }
}

// CLI 入口
const args = process.argv.slice(2);
if (args[0] === '--check') {
  checkConnectivity().catch(e => { console.error(e); process.exit(1); });
} else if (args.length === 2) {
  upload(args[0], args[1]).catch(e => { console.error(e); process.exit(1); });
} else {
  console.log('Usage:');
  console.log('  node upload-r2.js <localFile> <remoteKey>   Upload file');
  console.log('  node upload-r2.js --check                  Test R2 connectivity');
  process.exit(1);
}
