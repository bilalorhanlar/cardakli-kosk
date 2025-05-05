import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;

async function uploadMenuData() {
  try {
    const menuDataPath = path.join(process.cwd(), 'data', 'menu-data.json');
    const menuData = fs.readFileSync(menuDataPath, 'utf8');

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: 'menu-data.json',
      Body: menuData,
      ContentType: 'application/json',
    });

    await s3Client.send(command);
    console.log('Menu data successfully uploaded to S3');
  } catch (error) {
    console.error('Error uploading menu data:', error);
  }
}

uploadMenuData(); 