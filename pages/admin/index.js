import { useState, useEffect, useRef } from 'react'
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
  const [newCategoryName_en, setNewCategoryName_en] = useState('')
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    shortDescription: '',
    longDescription: '',
    image: null,
    name_en: '',
    shortDescription_en: '',
    longDescription_en: ''
  })
  const [searchQuery, setSearchQuery] = useState('')
  const editFormRef = useRef(null)

  useEffect(() => {
    // Token kontrolü
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/admin/login')
      return
    }

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
  }, [router])

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Kategori adı boş olamaz')
      return
    }

    try {
      const normalizedCategoryName = newCategoryName.trim()
      const normalizedCategoryName_en = newCategoryName_en.trim()
      
      if (menuData[normalizedCategoryName]) {
        setError('Bu kategori zaten mevcut')
        return
      }

      const success = await addCategory(normalizedCategoryName, normalizedCategoryName_en)
      if (!success) {
        setError('Kategori eklenirken bir hata oluştu')
        return
      }

      const updatedMenuData = await getMenuData()
      setMenuData(updatedMenuData)
      setSelectedCategory(normalizedCategoryName)
      setNewCategoryName('')
      setNewCategoryName_en('')
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
            price,
            translations: {
              en: {
                name: formData.name_en || formData.name,
                shortDescription: formData.shortDescription_en || formData.shortDescription,
                longDescription: formData.longDescription_en || formData.longDescription
              }
            }
          }
        }
      } else {
        // Yeni öğe ekle
        const newItem = {
          id: Date.now().toString(),
          ...formData,
          price,
          translations: {
            en: {
              name: formData.name_en || formData.name,
              shortDescription: formData.shortDescription_en || formData.shortDescription,
              longDescription: formData.longDescription_en || formData.longDescription
            }
          }
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
        image: null,
        name_en: '',
        shortDescription_en: '',
        longDescription_en: ''
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
      price: item.price,
      shortDescription: item.shortDescription || '',
      longDescription: item.longDescription || '',
      image: item.image || null,
      name_en: item.translations?.en?.name || '',
      shortDescription_en: item.translations?.en?.shortDescription || '',
      longDescription_en: item.translations?.en?.longDescription || ''
    })
    
    // Scroll to edit form
    setTimeout(() => {
      editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
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

  const filteredItems = selectedCategory && menuData[selectedCategory]?.items.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.shortDescription?.toLowerCase().includes(query) ||
      item.longDescription?.toLowerCase().includes(query) ||
      item.translations?.en?.name?.toLowerCase().includes(query) ||
      item.translations?.en?.shortDescription?.toLowerCase().includes(query) ||
      item.translations?.en?.longDescription?.toLowerCase().includes(query)
    );
  });

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
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white">Menü Yönetimi</h1>
            <p className="text-gray-400 mt-1">Tüm menü öğelerini buradan yönetebilirsiniz</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-lg p-2 w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-white border-none focus:ring-0 rounded p-2 w-full sm:w-auto"
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
              className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors w-full sm:w-auto"
            >
              Yeni Kategori Ekle
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {selectedCategory && (
          <div className="mb-8">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Yemek ara..."
                className="w-full p-4 bg-black/40 text-white border border-amber-500/20 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent pl-12"
              />
              <div className="absolute left-4 top-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* New Category Form */}
        {showNewCategoryForm && (
          <div className="mb-8 p-6 bg-black/40 backdrop-blur-sm rounded-lg">
            <h2 className="text-lg font-semibold mb-4 text-white">Yeni Kategori Ekle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Türkçe</h3>
                <div>
                  <label htmlFor="categoryName" className="block text-sm font-medium text-gray-300">Kategori Adı</label>
                  <input
                    type="text"
                    id="categoryName"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Kategori adı"
                    className="mt-1 block w-full rounded-md bg-black/40 text-white border border-amber-500/20 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">English</h3>
                <div>
                  <label htmlFor="categoryName_en" className="block text-sm font-medium text-gray-300">Category Name</label>
                  <input
                    type="text"
                    id="categoryName_en"
                    value={newCategoryName_en}
                    onChange={(e) => setNewCategoryName_en(e.target.value)}
                    placeholder="Category name"
                    className="mt-1 block w-full rounded-md bg-black/40 text-white border border-amber-500/20 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleAddCategory}
                className="bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors w-full sm:w-auto"
              >
                Ekle
              </button>
              <button
                onClick={() => {
                  setShowNewCategoryForm(false);
                  setNewCategoryName('');
                  setNewCategoryName_en('');
                  setError(null);
                }}
                className="bg-black/40 text-white px-6 py-3 rounded-lg hover:bg-black/60 transition-colors w-full sm:w-auto"
              >
                İptal
              </button>
            </div>
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>
        )}

        {/* Main Content */}
        <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-amber-500/20">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-white">Ürünler</h2>
            {selectedCategory ? (
              <>
                {/* Products List */}
                <div className="space-y-6 mb-8">
                  {filteredItems?.map((item) => (
                    <div key={item.id} className="border border-amber-500/20 p-6 rounded-lg hover:border-amber-500/40 transition-colors">
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
                            <h3 className="font-semibold text-lg text-white">{item.name}</h3>
                            <p className="text-amber-500 font-medium mt-1">{item.price}</p>
                            <p className="text-gray-400 mt-2">{item.shortDescription}</p>
                          </div>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-amber-500 hover:text-amber-600 transition-colors w-full sm:w-auto"
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
                <div ref={editFormRef} className="border-t border-amber-500/20 pt-8">
                  <h3 className="text-lg font-semibold mb-6 text-white">
                    {selectedItem ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Türkçe alanlar */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white">Türkçe</h3>
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-300">İsim</label>
                          <input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="mt-1 block w-full rounded-md bg-black/40 text-white border border-amber-500/20 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-300">Kısa Açıklama</label>
                          <textarea
                            id="shortDescription"
                            value={formData.shortDescription}
                            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                            className="mt-1 block w-full rounded-md bg-black/40 text-white border border-amber-500/20 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label htmlFor="longDescription" className="block text-sm font-medium text-gray-300">Uzun Açıklama</label>
                          <textarea
                            id="longDescription"
                            value={formData.longDescription}
                            onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                            className="mt-1 block w-full rounded-md bg-black/40 text-white border border-amber-500/20 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                            rows={5}
                          />
                        </div>
                      </div>

                      {/* İngilizce alanlar */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white">English</h3>
                        <div>
                          <label htmlFor="name_en" className="block text-sm font-medium text-gray-300">Name</label>
                          <input
                            type="text"
                            id="name_en"
                            value={formData.name_en}
                            onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                            className="mt-1 block w-full rounded-md bg-black/40 text-white border border-amber-500/20 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="shortDescription_en" className="block text-sm font-medium text-gray-300">Short Description</label>
                          <textarea
                            id="shortDescription_en"
                            value={formData.shortDescription_en}
                            onChange={(e) => setFormData({ ...formData, shortDescription_en: e.target.value })}
                            className="mt-1 block w-full rounded-md bg-black/40 text-white border border-amber-500/20 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label htmlFor="longDescription_en" className="block text-sm font-medium text-gray-300">Long Description</label>
                          <textarea
                            id="longDescription_en"
                            value={formData.longDescription_en}
                            onChange={(e) => setFormData({ ...formData, longDescription_en: e.target.value })}
                            className="mt-1 block w-full rounded-md bg-black/40 text-white border border-amber-500/20 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                            rows={5}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Fiyat</label>
                      <input
                        type="text"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        className="w-full p-3 bg-black/40 text-white border border-amber-500/20 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Resim</label>
                      <input
                        type="file"
                        onChange={handleImageChange}
                        className="w-full p-3 bg-black/40 text-white border border-amber-500/20 rounded-lg"
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
                        className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors w-full sm:w-auto"
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
                              image: null,
                              name_en: '',
                              shortDescription_en: '',
                              longDescription_en: ''
                            });
                          }}
                          className="px-6 py-3 bg-black/40 text-white rounded-lg hover:bg-black/60 transition-colors w-full sm:w-auto"
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
                <p className="text-gray-400">Lütfen bir kategori seçin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 