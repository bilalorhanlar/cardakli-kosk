import Head from 'next/head'
import { useState, useRef, useEffect } from 'react'
import { getMenuData, getImageUrl } from '../lib/s3'
import { useLanguage } from '../context/LanguageContext'

const translations = {
  tr: {
    title: "Çardaklı Köşk - Kebap Menüsü",
    description: "Urfa'nın kalbinde kebap ve sıra gecesi ile unutulmaz bir deneyim",
    address: "Adres: Balıklıgöl Caddesi Yenimahalle No:40 Çardaklı Köşk Eyyübiye/Şanlıurfa",
    phone: "Telefon: +90 532 579 83 08",
    kdv: "* Fiyatlarımıza KDV dahildir.",
    categories: {
      'salatalar': 'Salatalar',
      'kebaplar': 'Kebaplar',
      'pide cesitleri': 'Pide Çeşitleri',
      'soguk icecekler': 'Soğuk İçecekler',
      'ara sicaklar': 'Ara Sıcaklar',
      'sicak icecekler': 'Sıcak İçecekler',
      'tatlilar': 'Tatlılar',
      'izgaralar': 'Izgaralar',
      'tava cesitleri': 'Tava Çeşitleri',
      'corbalar': 'Çorbalar',
      'meze': 'Mezeler',
      'kahvalti': 'Kahvaltı',
      'ozel': 'Özel Menü',
      'cocuk': 'Çocuk Menüsü',
      'vegan': 'Vegan Menü'
    },
    menuItems: {
      'adana-kebap': {
        name: 'Adana Kebap',
        description: 'Özel baharatlarla hazırlanmış, Urfa usulü kıyma ile yapılan nefis kebap',
        price: '120 TL'
      },
      'urfa-kebap': {
        name: 'Urfa Kebap',
        description: 'Acısız, özel baharatlarla hazırlanmış Urfa\'nın meşhur kebabı',
        price: '120 TL'
      },
      'ciger-tava': {
        name: 'Ciğer Tava',
        description: 'Taze ciğer, özel sos ve baharatlarla hazırlanır',
        price: '100 TL'
      },
      'lahmacun': {
        name: 'Lahmacun',
        description: 'İnce açılmış hamur üzerine özel kıymalı harç ile hazırlanır',
        price: '40 TL'
      },
      'ayran': {
        name: 'Ayran',
        description: 'Ev yapımı taze ayran',
        price: '20 TL'
      },
      'cay': {
        name: 'Çay',
        description: 'Türk çayı',
        price: '15 TL'
      },
      'kunefe': {
        name: 'Künefe',
        description: 'Kadayıf, peynir ve şerbet ile hazırlanan geleneksel tatlı',
        price: '60 TL'
      }
    }
  },
  en: {
    title: "Çardaklı Köşk - Kebab Menu",
    description: "An unforgettable experience with kebab and sıra night in the heart of Urfa",
    address: "Address: Balıklıgöl Street Yenimahalle No:40 Çardaklı Köşk Eyyübiye/Şanlıurfa",
    phone: "Phone: +90 532 579 83 08",
    kdv: "* Prices include VAT.",
    categories: {
      'salatalar': 'Salads',
      'kebaplar': 'Kebabs',
      'pide cesitleri': 'Pide Varieties',
      'soguk icecekler': 'Cold Drinks',
      'ara sicaklar': 'Appetizers',
      'sicak icecekler': 'Hot Drinks',
      'tatlilar': 'Desserts',
      'izgaralar': 'Grills',
      'tava cesitleri': 'Pan Dishes',
      'corbalar': 'Soups',
      'meze': 'Mezes',
      'kahvalti': 'Breakfast',
      'ozel': 'Special Menu',
      'cocuk': 'Kids Menu',
      'vegan': 'Vegan Menu'
    },
    menuItems: {
      'adana-kebap': {
        name: 'Adana Kebab',
        description: 'Delicious kebab made with Urfa-style minced meat and special spices',
        price: '120 TL'
      },
      'urfa-kebap': {
        name: 'Urfa Kebab',
        description: 'Famous Urfa kebab prepared with special spices, without chili',
        price: '120 TL'
      },
      'ciger-tava': {
        name: 'Fried Liver',
        description: 'Fresh liver prepared with special sauce and spices',
        price: '100 TL'
      },
      'lahmacun': {
        name: 'Lahmacun',
        description: 'Thin dough topped with special minced meat mixture',
        price: '40 TL'
      },
      'ayran': {
        name: 'Ayran',
        description: 'Homemade fresh ayran',
        price: '20 TL'
      },
      'cay': {
        name: 'Tea',
        description: 'Turkish tea',
        price: '15 TL'
      },
      'kunefe': {
        name: 'Kunefe',
        description: 'Traditional dessert made with kadayıf, cheese, and syrup',
        price: '60 TL'
      }
    }
  }
};

export default function Home() {
  const { language, toggleLanguage, setLanguage } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('kebaplar')
  const [isScrolled, setIsScrolled] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('tr')
  const [menuData, setMenuData] = useState(null)
  const [imageUrls, setImageUrls] = useState({})
  const [selectedItem, setSelectedItem] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const sectionRefs = useRef({})
  const categoriesRef = useRef(null)

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      lastScrollY = window.scrollY;
      
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Scroll threshold'u daha hassas ayarla
          const scrollPosition = lastScrollY;
          setIsScrolled(scrollPosition > 300); // 350'den 300'e düşürdük
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadMenuData = async () => {
      try {
        const data = await getMenuData()
        if (data) {
          setMenuData(data)
          
          // Resim URL'lerini al
          const urls = {}
          for (const category of Object.keys(data)) {
            for (const item of data[category].items) {
              if (item.image) {
                try {
                  const url = await getImageUrl(item.image)
                  if (url) {
                    urls[item.image] = url
                    console.log('Image URL loaded:', url); // Debug için
                  }
                } catch (error) {
                  console.error('Error loading image URL:', error)
                }
              }
            }
          }
          setImageUrls(urls)
        }
      } catch (error) {
        console.error('Error loading menu data:', error)
      }
    }

    loadMenuData()
  }, [])

  const handleLanguageSelect = (lang) => {
    setSelectedLanguage(lang)
  }

  const handleShowMenu = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setLanguage(selectedLanguage)
      setShowSplash(false)
      setIsTransitioning(false)
    }, 500) // Animasyon süresi
  }

  const scrollToSection = (category) => {
    setActiveCategory(category)
    sectionRefs.current[category]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleItemClick = (item) => {
    setSelectedItem(item)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedItem(null)
  }

  if (!menuData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-amber-500 text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] relative overflow-hidden">
      {/* Splash Screen */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${showSplash ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
          {/* Arka plan görseli ve blur */}
          <div className="absolute inset-0">
            <img src="/images/arka.jpg" alt="background" className="w-full h-full object-cover object-center blur-sm scale-105" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-amber-900/20 opacity-80" />
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md mx-auto px-4">
            {/* Logo ve başlık */}
            <div className={`inline-block p-4 rounded-xl bg-black/60 backdrop-blur-xl border-2 border-amber-500/60 shadow-xl shadow-amber-900/30 mb-6 w-full transition-all duration-500 ${isTransitioning ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
              <h1 className="text-2xl sm:text-3xl text-center font-bold text-white font-painter tracking-wider mb-2 drop-shadow-[0_2px_16px_rgba(212,175,55,0.7)]">
                Çardaklı Köşk
              </h1>
              <div className="flex justify-center mb-1">
                <span className="block w-16 h-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-600 to-amber-400 shadow-lg animate-pulse" />
              </div>
              <p className="text-white/90 text-xs sm:text-base italic mt-1 p-1 tracking-wider max-w-xs mx-auto leading-relaxed text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                Urfa'nın kalbinde kebap ve sıra gecesi ile unutulmaz bir deneyim
              </p>
            </div>
            {/* Dil seçimi ve butonlar */}
            <div className={`flex flex-col items-center gap-4 mt-2 w-full transition-all duration-500 ${isTransitioning ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
              <span className="text-white/90 text-base font-semibold mb-1 drop-shadow text-center">Lütfen dil seçin / Please select language</span>
              <div className="flex gap-4 mb-4 w-full justify-center">
                <button
                  onClick={() => handleLanguageSelect('tr')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-base shadow-md transition-all border-2 duration-200 ${selectedLanguage === 'tr' ? 'bg-amber-500 text-white border-amber-700 scale-105 shadow-amber-700/40' : 'bg-black/40 text-white/70 border-transparent hover:bg-amber-700/40 hover:scale-105'}`}
                >
                  <span className="text-lg">🇹🇷</span> Türkçe
                </button>
                <button
                  onClick={() => handleLanguageSelect('en')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-base shadow-md transition-all border-2 duration-200 ${selectedLanguage === 'en' ? 'bg-amber-500 text-white border-amber-700 scale-105 shadow-amber-700/40' : 'bg-black/40 text-white/70 border-transparent hover:bg-amber-700/40 hover:scale-105'}`}
                >
                  <span className="text-lg">🇬🇧</span> English
                </button>
              </div>
              <button
                onClick={handleShowMenu}
                className="mt-1 px-6 py-2 rounded-lg bg-gradient-to-br from-amber-600 via-amber-500 to-amber-700 text-white font-extrabold text-base shadow-lg hover:scale-105 hover:from-amber-700 hover:to-amber-800 transition-all border-2 border-amber-700/60"
              >
                {selectedLanguage === 'tr' ? 'Menüyü Gör' : 'View Menu'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className={`transition-opacity duration-500 ${!showSplash ? 'opacity-100' : 'opacity-0'}`}>
        <Head>
          <title>{translations[language].title}</title>
          <meta name="description" content={translations[language].description} />
        </Head>

        <div className="relative h-[70vh] w-full">
          {/* Hero Image with Parallax Effect */}
          <div className="absolute inset-0">
            <img
              src="/images/arka.jpg"
              alt="background"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent"></div>
          </div>

          {/* Logo and Title */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
            <div className="text-center transform -translate-y-12 max-w-4xl mx-auto">
              <div className="inline-block p-4 sm:p-6 rounded-xl bg-black/30 backdrop-blur-sm border border-amber-600/30 shadow-2xl shadow-amber-900/20">
                <h1 className="text-3xl sm:text-5xl font-bold text-white font-painter tracking-wider">Çardaklı Köşk</h1>  
              </div>
              <p className="text-white/80 text-base sm:text-lg italic mt-4 sm:mt-6 p-2 sm:p-4 tracking-wider max-w-2xl mx-auto leading-relaxed">
                {translations[language].description}
              </p>
            </div>
          </div>

          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            className="absolute top-4 sm:top-6 right-4 sm:right-6 z-50 bg-amber-600/90 hover:bg-amber-700 text-white p-2 sm:p-3 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-amber-900/30 backdrop-blur-sm border border-amber-700/30"
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
              {language === 'tr' ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              )}
            </div>
          </button>
        </div>

        {/* Kategoriler - Yatay/Dikey Kaydırılabilir */}
        <div 
          ref={categoriesRef}
          className={`max-w-4xl mx-auto px-4 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] transform will-change-transform
            ${isScrolled ? 'fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a]/95 backdrop-blur-md py-2 shadow-lg' : 'relative -mt-32 z-10'}`}
        >
          <div className={`${
            isScrolled 
              ? 'flex overflow-x-auto gap-4 sm:gap-6 pb-4 scrollbar-hide scale-90 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform' 
              : 'grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform'
          }`}>
            {Object.keys(menuData).map((category) => {
              const normalize = (str) => str
                .toLocaleLowerCase('tr')
                .replace(/ı/g, 'i')
                .replace(/ç/g, 'c')
                .replace(/ş/g, 's')
                .replace(/ğ/g, 'g')
                .replace(/ü/g, 'u')
                .replace(/ö/g, 'o')
                .replace(/\s+/g, ' ')
                .trim();

              const normalizedKey = normalize(category);
              const translationMap = {};
              Object.entries(translations[language].categories).forEach(([key, value]) => {
                translationMap[normalize(key)] = value;
              });

              const displayName = translationMap[normalizedKey] || menuData[category].name || category;
              const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1).toLowerCase();

              return (
                <button
                  key={category}
                  onClick={() => scrollToSection(category)}
                  className={`flex items-center justify-center w-full px-4 py-2 rounded-lg font-bold text-base shadow-md transition-all duration-300 border-2 ${
                    activeCategory === category
                      ? 'bg-amber-500 text-white border-amber-700 scale-105 shadow-amber-700/40'
                      : 'bg-black/80 text-white/70 border-transparent hover:bg-amber-700/40 hover:scale-105'
                  }`}
                >
                  {formattedName}
                </button>
              );
            })}
          </div>
        </div>

        <main className={`max-w-4xl mx-auto px-4 pb-12 relative z-10 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform ${
          isScrolled ? 'pt-32' : 'pt-8'
        }`}>
          {/* Menu Sections */}
          <div className="space-y-12">
            {Object.entries(menuData).map(([category, data]) => (
              <section
                key={category}
                ref={(el) => (sectionRefs.current[category] = el)}
                className="scroll-mt-24"
              >
                <div className="flex items-center justify-center mb-6">
                  <h2 className="text-3xl font-bold text-white/90 text-center">
                    {translations[language].categories[category] 
                      ? translations[language].categories[category].charAt(0).toUpperCase() + 
                        translations[language].categories[category].slice(1).toLowerCase()
                      : category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="bg-black/40 backdrop-blur-sm rounded-lg p-4 cursor-pointer hover:bg-black/60 transition-all duration-300 border border-amber-500/20 hover:border-amber-500/40"
                    >
                      {item.image && (
                        <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
                          <img
                            src={imageUrls[item.image] || item.image}
                            alt={language === 'en' ? item.translations?.en?.name || item.name : item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {language === 'en' ? item.translations?.en?.name || item.name : item.name}
                      </h3>
                      <p className="text-amber-500 font-medium mb-2">
                        {item.price}
                      </p>
                      {item.shortDescription && (
                        <p className="text-white/70 text-sm">
                          {language === 'en' ? item.translations?.en?.shortDescription || item.shortDescription : item.shortDescription}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-sm text-amber-400/80">
            <p className="mb-1">{translations[language].address}</p>
            <p className="mb-1">{translations[language].phone}</p>
            <p className="mt-2 text-xs text-amber-500/60">{translations[language].kdv}</p>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              {selectedItem.image && (
                <div className="relative h-64 w-full">
                  <img
                    src={imageUrls[selectedItem.image] || selectedItem.image}
                    alt={language === 'en' ? selectedItem.translations?.en?.name || selectedItem.name : selectedItem.name}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                </div>
              )}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {language === 'en' ? selectedItem.translations?.en?.name || selectedItem.name : selectedItem.name}
              </h2>
              <p className="text-amber-500 text-xl font-medium mb-4">{selectedItem.price}</p>
              {selectedItem.longDescription ? (
                <p className="text-white/80 whitespace-pre-line">
                  {language === 'en' ? selectedItem.translations?.en?.longDescription || selectedItem.longDescription : selectedItem.longDescription}
                </p>
              ) : (
                <p className="text-white/80">
                  {language === 'en' ? selectedItem.translations?.en?.shortDescription || selectedItem.shortDescription : selectedItem.shortDescription}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
