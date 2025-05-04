import { useState, useEffect } from 'react'
import { getMenuData, saveMenuData, uploadImage, getImageUrl, addCategory, deleteCategory, addItem, updateItem, deleteItem } from '../../lib/s3'
import { useRouter } from 'next/router'

export default function Admin() {
  const router = useRouter()
  const [menuData, setMenuData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [imageUrls, setImageUrls] = useState({})
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    shortDescription: '',
    longDescription: '',
    image: null
  })

  useEffect(() => {
    const loadMenuData = async () => {
      try {
        const data = await getMenuData()
        if (data) {
          setMenuData(data)
          setSelectedCategory(Object.keys(data)[0])
          
          // Resim URL'lerini yükle
          const urls = {}
          for (const category of Object.keys(data)) {
            for (const item of data[category].items) {
              if (item.image) {
                const url = await getImageUrl(item.image)
                urls[item.image] = url
              }
            }
          }
          setImageUrls(urls)
        }
      } catch (error) {
        console.error('Error loading menu data:', error)
        setError('Menü verileri yüklenirken bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    loadMenuData()
  }, [])

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Kategori adı boş olamaz')
      return
    }

    try {
      // Türkçe karakterleri koru
      const normalizedCategoryName = newCategoryName.trim()
      
      // Kategori adının benzersiz olduğunu kontrol et
      if (menuData[normalizedCategoryName]) {
        setError('Bu kategori zaten mevcut')
        return
      }

      // Yeni kategoriyi ekle
      const success = await addCategory(normalizedCategoryName)
      if (!success) {
        setError('Kategori eklenirken bir hata oluştu')
        return
      }

      // Menü verilerini yeniden yükle
      const updatedMenuData = await getMenuData()
      setMenuData(updatedMenuData)
      setSelectedCategory(normalizedCategoryName)
      setNewCategoryName('')
      setShowNewCategoryForm(false)
      setError(null)

    } catch (error) {
      console.error('Error adding category:', error)
      setError('Kategori eklenirken bir hata oluştu')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const updatedMenuData = { ...menuData }
      const categoryData = updatedMenuData[selectedCategory] || { items: [] }
      
      // Fiyat formatını düzelt
      const price = formData.price.startsWith('₺') ? formData.price : `₺${formData.price}`
      
      if (selectedItem) {
        // Mevcut öğeyi güncelle
        const itemIndex = categoryData.items.findIndex(item => item.id === selectedItem.id)
        if (itemIndex !== -1) {
          categoryData.items[itemIndex] = {
            ...selectedItem,
            ...formData,
            price
          }
        }
      } else {
        // Yeni öğe ekle
        const newItem = {
          id: Date.now().toString(),
          ...formData,
          price
        }
        categoryData.items.push(newItem)
      }

      updatedMenuData[selectedCategory] = categoryData
      await saveMenuData(updatedMenuData)
      setMenuData(updatedMenuData)
      setFormData({
        name: '',
        price: '',
        shortDescription: '',
        longDescription: '',
        image: null
      })
      setSelectedItem(null)
    } catch (error) {
      console.error('Error saving menu data:', error)
      setError('Menü verileri kaydedilirken bir hata oluştu')
    }
  }

  const handleDelete = async (itemId) => {
    if (!confirm('Bu öğeyi silmek istediğinizden emin misiniz?')) return

    try {
      const updatedMenuData = { ...menuData }
      const categoryData = updatedMenuData[selectedCategory]
      categoryData.items = categoryData.items.filter(item => item.id !== itemId)
      
      await saveMenuData(updatedMenuData)
      setMenuData(updatedMenuData)
    } catch (error) {
      console.error('Error deleting item:', error)
      setError('Öğe silinirken bir hata oluştu')
    }
  }

  const handleEdit = (item) => {
    setSelectedItem(item)
    setFormData({
      name: item.name,
      price: item.price.replace('₺', ''),
      shortDescription: item.shortDescription || '',
      longDescription: item.longDescription || '',
      image: null
    })
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const url = await uploadImage(file, formData.name);
        if (url) {
          setFormData(prev => ({ ...prev, image: url }));
          setImageUrls(prev => ({ ...prev, [url]: url }));
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        setError('Resim yüklenirken bir hata oluştu');
      }
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    if (!confirm(`"${categoryName}" kategorisini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const success = await deleteCategory(categoryName);
      if (!success) {
        setError('Kategori silinirken bir hata oluştu');
        return;
      }

      // Menü verilerini yeniden yükle
      const updatedMenuData = await getMenuData();
      setMenuData(updatedMenuData);
      
      // Eğer silinen kategori seçiliyse, seçimi temizle
      if (selectedCategory === categoryName) {
        setSelectedCategory('');
      }
      
      setError(null);

      // Sayfayı yenile
      window.location.reload();
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('Kategori silinirken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-amber-500 text-xl">Yükleniyor...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Menü Yönetimi</h1>
            <p className="text-gray-500 mt-1">Tüm menü öğelerini buradan yönetebilirsiniz</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-gray-900 border-none focus:ring-0 rounded p-2 w-full sm:w-auto"
              >
                <option value="">Kategori Seçin</option>
                {Object.keys(menuData).map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {selectedCategory && (
                <button
                  onClick={() => handleDeleteCategory(selectedCategory)}
                  className="p-2 text-red-500 hover:text-red-600 transition-colors"
                  title="Kategoriyi Sil"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={() => setShowNewCategoryForm(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors w-full sm:w-auto"
            >
              Yeni Kategori Ekle
            </button>
          </div>
        </div>

        {/* New Category Form */}
        {showNewCategoryForm && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Yeni Kategori Ekle</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Kategori adı"
                className="flex-1 p-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex gap-4">
                <button
                  onClick={handleAddCategory}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors w-full sm:w-auto"
                >
                  Ekle
                </button>
                <button
                  onClick={() => {
                    setShowNewCategoryForm(false);
                    setNewCategoryName('');
                    setError(null);
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors w-full sm:w-auto"
                >
                  İptal
                </button>
              </div>
            </div>
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">Ürünler</h2>
            {selectedCategory ? (
              <>
                {/* Products List */}
                <div className="space-y-6 mb-8">
                  {menuData[selectedCategory]?.items.map((item) => (
                    <div key={item.id} className="border border-gray-200 p-6 rounded-lg hover:border-gray-300 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                        <div className="flex flex-col sm:flex-row gap-6 w-full">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full sm:w-32 h-32 object-cover rounded-lg"
                              onError={(e) => {
                                console.error('Error loading image:', item.image);
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                            <p className="text-blue-500 font-medium mt-1">{item.price}</p>
                            <p className="text-gray-500 mt-2">{item.shortDescription}</p>
                          </div>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-500 hover:text-blue-600 transition-colors w-full sm:w-auto"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-500 hover:text-red-600 transition-colors w-full sm:w-auto"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add/Edit Product Form */}
                <div className="border-t border-gray-200 pt-8">
                  <h3 className="text-lg font-semibold mb-6 text-gray-900">
                    {selectedItem ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">İsim</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full p-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fiyat</label>
                        <input
                          type="text"
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                          className="w-full p-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kısa Açıklama</label>
                      <textarea
                        value={formData.shortDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                        className="w-full p-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Uzun Açıklama</label>
                      <textarea
                        value={formData.longDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, longDescription: e.target.value }))}
                        className="w-full p-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="4"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Resim</label>
                      <input
                        type="file"
                        onChange={handleImageChange}
                        className="w-full p-3 bg-white border border-gray-200 rounded-lg text-gray-900"
                        accept="image/*"
                      />
                      {formData.image && (
                        <div className="mt-4">
                          <img
                            src={formData.image}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        type="submit"
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors w-full sm:w-auto"
                      >
                        {selectedItem ? 'Güncelle' : 'Ekle'}
                      </button>
                      {selectedItem && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItem(null);
                            setFormData({
                              name: '',
                              price: '',
                              shortDescription: '',
                              longDescription: '',
                              image: null
                            });
                          }}
                          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors w-full sm:w-auto"
                        >
                          İptal
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Lütfen bir kategori seçin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 