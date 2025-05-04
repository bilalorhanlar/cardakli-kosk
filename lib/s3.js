import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// Menü verilerini S3'ten al
export async function getMenuData() {
  try {
    console.log('Getting menu data from S3...');
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: 'menu-data.json',
    });

    const response = await s3Client.send(command);
    const data = await response.Body.transformToString();
    console.log('Menu data retrieved successfully');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting menu data:', error);
    // Eğer dosya yoksa boş bir menü yapısı oluştur
    if (error.name === 'NoSuchKey') {
      console.log('Menu data not found, creating initial structure');
      const initialData = {
        'kebaplar': { items: [] },
        'salatalar': { items: [] },
        'pide cesitleri': { items: [] },
        'soguk icecekler': { items: [] },
        'ara sicaklar': { items: [] },
        'sicak icecekler': { items: [] },
        'tatlilar': { items: [] },
        'izgaralar': { items: [] },
        'tava cesitleri': { items: [] }
      };
      await saveMenuData(initialData);
      return initialData;
    }
    return null;
  }
}

// Menü verilerini S3'e kaydet
export async function saveMenuData(data) {
  try {
    console.log('Saving menu data to S3...');
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: 'menu-data.json',
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(command);
    console.log('Menu data saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving menu data:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
}

// Resim URL'ini al
export async function getImageUrl(fileName) {
  try {
    console.log('Getting URL for image:', fileName);
    
    if (!fileName) {
      console.error('No filename provided');
      return null;
    }

    // Eğer URL zaten S3 URL'si ise, direkt döndür
    if (fileName.startsWith('https://')) {
      return fileName;
    }

    // Dosya adından gereksiz parametreleri temizle
    const cleanFileName = fileName.split('?')[0];
    const key = `images/${cleanFileName}`;
    console.log('Full S3 key:', key);

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    // 7 gün geçerli olacak şekilde URL oluştur
    const url = await getSignedUrl(s3Client, command, { 
      expiresIn: 604800, // 7 days
      signableHeaders: new Set(['host']),
      unsignableHeaders: new Set(['x-amz-checksum-mode', 'x-id'])
    });

    console.log('Generated URL:', url);
    return url;
  } catch (error) {
    console.error('Error getting image URL:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return null;
  }
}

// Resim yükle
export async function uploadImage(file, itemName) {
  try {
    console.log('Uploading image:', file.name);
    console.log('For item:', itemName);
    
    const fileBuffer = await file.arrayBuffer();
    const fileName = `${Date.now()}-${itemName.replace(/\s+/g, '-')}.${file.name.split('.').pop()}`;
    const key = `images/${fileName}`;
    
    console.log('Generated filename:', fileName);
    console.log('Full S3 key:', key);
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: Buffer.from(fileBuffer),
      ContentType: file.type,
      ACL: 'public-read',
      CacheControl: 'public, max-age=31536000' // 1 year cache
    });

    console.log('Upload command created:', command);
    
    await s3Client.send(command);
    console.log('Image uploaded successfully:', fileName);
    
    // Yüklenen resmin URL'ini hemen al
    const url = await getImageUrl(fileName);
    console.log('Image URL after upload:', url);
    
    return url;
  } catch (error) {
    console.error('Error uploading image:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return null;
  }
}

// Resmi sil
export async function deleteImage(fileName) {
  try {
    console.log('Deleting image:', fileName);
    const key = `images/${fileName}`;
    
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log('Image deleted successfully:', fileName);
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}

// Kategori ekle
export async function addCategory(categoryName) {
  try {
    console.log('Adding new category:', categoryName);
    
    // Mevcut menü verilerini al
    const menuData = await getMenuData();
    if (!menuData) {
      console.error('Menu data not found');
      return false;
    }

    // Kategori zaten varsa hata döndür
    if (menuData[categoryName]) {
      console.error('Category already exists:', categoryName);
      return false;
    }

    // Yeni kategoriyi ekle
    menuData[categoryName] = { items: [] };

    // Değişiklikleri kaydet
    const success = await saveMenuData(menuData);
    if (!success) {
      console.error('Failed to save menu data');
      return false;
    }

    console.log('Category added successfully:', categoryName);
    return true;
  } catch (error) {
    console.error('Error adding category:', error);
    return false;
  }
}

// Kategori sil
export async function deleteCategory(categoryName) {
  try {
    console.log('Deleting category:', categoryName);
    
    // Mevcut menü verilerini al
    const menuData = await getMenuData();
    if (!menuData) {
      console.error('Menu data not found');
      return false;
    }

    // Kategori yoksa hata döndür
    if (!menuData[categoryName]) {
      console.error('Category not found:', categoryName);
      return false;
    }

    // Kategoriye ait resimleri sil
    for (const item of menuData[categoryName].items) {
      if (item.image) {
        await deleteImage(item.image);
      }
    }

    // Kategoriyi sil
    delete menuData[categoryName];

    // Değişiklikleri kaydet
    const success = await saveMenuData(menuData);
    if (!success) {
      console.error('Failed to save menu data');
      return false;
    }

    console.log('Category deleted successfully:', categoryName);
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
}

// Ürün ekle
export async function addItem(categoryName, item) {
  try {
    console.log('Adding new item to category:', categoryName);
    const menuData = await getMenuData();
    
    if (!menuData[categoryName]) {
      console.error('Category not found:', categoryName);
      return false;
    }

    menuData[categoryName].items.push(item);
    await saveMenuData(menuData);
    console.log('Item added successfully:', item.name);
    return true;
  } catch (error) {
    console.error('Error adding item:', error);
    return false;
  }
}

// Ürün güncelle
export async function updateItem(categoryName, itemId, updatedItem) {
  try {
    console.log('Updating item:', itemId);
    const menuData = await getMenuData();
    
    if (!menuData[categoryName]) {
      console.error('Category not found:', categoryName);
      return false;
    }

    const itemIndex = menuData[categoryName].items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      console.error('Item not found:', itemId);
      return false;
    }

    menuData[categoryName].items[itemIndex] = updatedItem;
    await saveMenuData(menuData);
    console.log('Item updated successfully:', itemId);
    return true;
  } catch (error) {
    console.error('Error updating item:', error);
    return false;
  }
}

// Ürün sil
export async function deleteItem(categoryName, itemId) {
  try {
    console.log('Deleting item:', itemId);
    const menuData = await getMenuData();
    
    if (!menuData[categoryName]) {
      console.error('Category not found:', categoryName);
      return false;
    }

    const itemIndex = menuData[categoryName].items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      console.error('Item not found:', itemId);
      return false;
    }

    // Ürüne ait resmi sil
    const item = menuData[categoryName].items[itemIndex];
    if (item.image) {
      await deleteImage(item.image);
    }

    menuData[categoryName].items.splice(itemIndex, 1);
    await saveMenuData(menuData);
    console.log('Item deleted successfully:', itemId);
    return true;
  } catch (error) {
    console.error('Error deleting item:', error);
    return false;
  }
}

export async function saveChange(changeData) {
  try {
    const s3Key = `changes/${Date.now()}-${changeData.type}-${changeData.itemName}.json`;
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: JSON.stringify(changeData),
      ContentType: 'application/json',
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error saving change:', error);
    return false;
  }
}

export async function uploadToS3(key, data) {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: 'application/json',
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    return false;
  }
}

export async function deleteFromS3(key) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting from S3:', error);
    return false;
  }
} 