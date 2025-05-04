import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { 
  getMenuData, 
  saveMenuData, 
  uploadImage, 
  addCategory, 
  deleteCategory, 
  addItem, 
  updateItem, 
  deleteItem 
} from '../../lib/s3';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const menuData = await getMenuData();
      res.status(200).json(menuData);
    } catch (error) {
      console.error('Error getting menu data:', error);
      res.status(500).json({ error: 'Failed to get menu data' });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const form = formidable({ multiples: false });
      const [fields, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          resolve([fields, files]);
        });
      });

      const { category, name, price, shortDescription, longDescription } = fields;
      const image = files.image;

      if (!category || !name || !price) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image, name);
      }

      const newItem = {
        id: Date.now().toString(),
        name,
        price: price.startsWith('₺') ? price : `₺${price}`,
        shortDescription: shortDescription || '',
        longDescription: longDescription || '',
        image: imageUrl
      };

      const success = await addItem(category, newItem);
      if (!success) {
        res.status(500).json({ error: 'Failed to add item' });
        return;
      }

      res.status(200).json({ success: true, item: newItem });
    } catch (error) {
      console.error('Error adding item:', error);
      res.status(500).json({ error: 'Failed to add item' });
    }
    return;
  }

  if (req.method === 'PUT') {
    try {
      const form = formidable({ multiples: false });
      const [fields, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          resolve([fields, files]);
        });
      });

      const { category, id, name, price, shortDescription, longDescription } = fields;
      const image = files.image;

      if (!category || !id || !name || !price) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image, name);
      }

      const updatedItem = {
        id,
        name,
        price: price.startsWith('₺') ? price : `₺${price}`,
        shortDescription: shortDescription || '',
        longDescription: longDescription || '',
        image: imageUrl
      };

      const success = await updateItem(category, id, updatedItem);
      if (!success) {
        res.status(500).json({ error: 'Failed to update item' });
        return;
      }

      res.status(200).json({ success: true, item: updatedItem });
    } catch (error) {
      console.error('Error updating item:', error);
      res.status(500).json({ error: 'Failed to update item' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    try {
      const { category, id } = req.query;

      if (!category || !id) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const success = await deleteItem(category, id);
      if (!success) {
        res.status(500).json({ error: 'Failed to delete item' });
        return;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({ error: 'Failed to delete item' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
} 