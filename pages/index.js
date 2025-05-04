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
    }
  }
};

export default function Home() {
  const { language, toggleLanguage, setLanguage } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('kebaplar')
  const [isScrolled, setIsScrolled] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState('tr')
  const [menuData, setMenuData] = useState(null)
  const [imageUrls, setImageUrls] = useState({})
  const sectionRefs = useRef({})
  const categoriesRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
    setLanguage(selectedLanguage)
    setShowSplash(false)
  }

  const scrollToSection = (category) => {
    setActiveCategory(category)
    sectionRefs.current[category]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (showSplash) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a1a1a] relative overflow-hidden">
        {/* Arka plan görseli ve blur */}
        <div className="absolute inset-0">
          <img src="/images/arka.jpg" alt="background" className="w-full h-full object-cover object-center blur-sm scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-amber-900/20 opacity-80" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md mx-auto px-4">
          {/* Logo ve başlık */}
          <div className="inline-block p-4 rounded-xl bg-black/60 backdrop-blur-xl border-2 border-amber-500/60 shadow-xl shadow-amber-900/30 mb-6 animate-fade-in w-full">
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
          <div className="flex flex-col items-center gap-4 mt-2 w-full animate-fade-in">
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
    )
  }

  if (!menuData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-amber-500 text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Head>
        <title>{translations[language].title}</title>
        <meta name="description" content={translations[language].description} />
      </Head>

      <div className="relative h-[70vh] w-full">
        {/* Hero Image with Parallax Effect */}
        <div className="absolute inset-0 bg-[url('/images/arka.jpg')] bg-cover bg-center bg-fixed">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent"></div>
        </div>

        {/* Logo and Title */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-center transform -translate-y-12">
            <div className="inline-block p-4 pl-6 pr-6 rounded-xl bg-black/30 backdrop-blur-sm border border-amber-600/30 shadow-2xl shadow-amber-900/20">
              <h1 className="text-5xl font-bold text-white font-painter tracking-wider">Çardaklı Köşk</h1>  
            </div>
            <p className="text-white/80 text-lg italic mt-6 p-4 tracking-wider max-w-2xl mx-auto leading-relaxed">
              {translations[language].description}
            </p>
          </div>
        </div>

        {/* Language Toggle Button */}
        <button
          onClick={toggleLanguage}
          className="absolute top-6 right-6 z-50 bg-amber-600/90 hover:bg-amber-700 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-amber-900/30 backdrop-blur-sm border border-amber-700/30"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            {language === 'tr' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            )}
          </div>
        </button>
      </div>

      {/* Kategoriler - Yatay/Dikey Kaydırılabilir */}
      <div 
        ref={categoriesRef}
        className={`max-w-4xl mx-auto px-4 transition-all duration-500 ease-in-out transform 
          ${isScrolled ? 'fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a]/95 backdrop-blur-md py-2 shadow-lg' : 'relative -mt-32 z-10'}`}
      >
        <div className={`${
          isScrolled 
            ? 'flex overflow-x-auto gap-4 sm:gap-6 pb-4 scrollbar-hide scale-90' 
            : 'grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6'
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
                className={`flex items-center justify-center w-full px-4 py-2 rounded-lg font-bold text-base shadow-md transition-all border-2 duration-200 ${
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

      <main className={`max-w-4xl mx-auto px-4 pb-12 relative z-10 transition-all duration-500 ease-in-out ${
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
              <div className="grid grid-cols-1 gap-6">
                {data.items.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="group bg-black/30 backdrop-blur-sm border border-amber-600/30 rounded-xl p-4 hover:bg-black/40 transition-all duration-300 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-900/20"
                  >
                    <div className="flex gap-4">
                      {item.image && (
                        <div className="relative h-24 w-24">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="absolute inset-0 w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              console.error('Error loading image:', item.image);
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col h-full">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="text-lg sm:text-xl font-bold text-white/90 group-hover:text-amber-400 transition-colors duration-300 truncate">
                              {item.name}
                            </h3>
                            <span className="text-lg sm:text-xl font-bold text-amber-500 whitespace-nowrap bg-amber-900/20 px-3 py-1 rounded-lg">
                              {item.price.startsWith('₺') ? item.price : `₺${item.price}`}
                            </span>
                          </div>
                          
                          <div className="mt-2 sm:mt-3 space-y-2">
                            {item.shortDescription && (
                              <p className="text-sm sm:text-base text-white/70 leading-relaxed line-clamp-2">
                                {item.shortDescription}
                              </p>
                            )}
                            {item.longDescription && (
                              <p className="text-sm sm:text-base text-white/50 leading-relaxed line-clamp-2">
                                {item.longDescription}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
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
  )
}
