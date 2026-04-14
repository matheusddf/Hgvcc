import { useState, useEffect, useMemo, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  Settings, 
  Plus, 
  Lock,
  X,
  Minus,
  ShoppingBag,
  Home,
  Tag,
  User as UserIcon,
  MessageCircle,
  MapPin,
  Search,
  Clock,
  LayoutGrid,
  CreditCard,
  Instagram,
  ChevronRight,
  Trash2,
  ChevronDown,
  Phone,
  Check
} from 'lucide-react';

// --- Types & Constants ---
import { CATEGORIES as INITIAL_CATEGORIES, PRODUCTS as INITIAL_PRODUCTS, STORE_INFO as INITIAL_STORE_INFO, NEIGHBORHOODS as INITIAL_NEIGHBORHOODS, HOURS, PAYMENT_METHODS } from './constants';
import { Product, CartItem, Category, StoreInfo, Neighborhood } from './types';
import { supabase } from './lib/supabase';

// --- Components ---

// 1. Public Menu Component (The one customers see)
const PublicMenu = () => {
  const { slug } = useParams();
  const [selectedCategory, setSelectedCategory] = useState('destaques');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPromotionsOpen, setIsPromotionsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isStoreInfoOpen, setIsStoreInfoOpen] = useState(false);
  const [storeInfoTab, setStoreInfoTab] = useState<'sobre' | 'horario' | 'pagamento'>('sobre');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  
  // Supabase Data State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(INITIAL_STORE_INFO);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>(INITIAL_NEIGHBORHOODS);
  const [loading, setLoading] = useState(true);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.warn('Supabase demorou demais para responder. Usando dados locais.');
          setLoading(false);
        }
      }, 5000); // 5 segundos de limite

      try {
        // Fetch Store Info
        const { data: storeData, error: storeError } = await supabase
          .from('store_info')
          .select('*')
          .maybeSingle();
        
        if (storeData && !storeError) {
          setStoreInfo(storeData);
        }

        // Fetch Categories
        const { data: categoriesData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .order('id');
        
        if (categoriesData && !catError) {
          setCategories(categoriesData);
        }

        // Fetch Neighborhoods
        const { data: neighborhoodsData, error: neighError } = await supabase
          .from('neighborhoods')
          .select('*')
          .order('name');
        
        if (neighborhoodsData && !neighError) {
          setNeighborhoods(neighborhoodsData);
        }

        // Fetch Products
        const { data: productsData, error: prodError } = await supabase
          .from('products')
          .select('*')
          .order('id');
        
        if (productsData && !prodError) {
          const mappedProducts = productsData.map((p: any) => ({
            ...p,
            category: p.category_id || p.category,
            upsellProductId: p.upsell_product_id || p.upsellProductId
          }));
          setProducts(mappedProducts);
        }

      } catch (error) {
        console.error('Erro ao buscar dados do Supabase:', error);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Product Modal Local State
  const [productQuantity, setProductQuantity] = useState(1);
  const [productObservations, setProductObservations] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});

  // Reset product modal state when product changes
  useEffect(() => {
    if (selectedProduct) {
      setProductQuantity(1);
      setProductObservations('');
      setSelectedOptions({});
    }
  }, [selectedProduct]);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [customerNeighborhood, setCustomerNeighborhood] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');

  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Load address from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pedifacil_customer');
    if (saved) {
      const data = JSON.parse(saved);
      setCustomerName(data.name || '');
      setCustomerAddress(data.address || '');
      setCustomerNumber(data.number || '');
      setCustomerNeighborhood(data.neighborhood || '');
      setCustomerPhone(data.phone || '');
    }
  }, []);

  // Save address to localStorage
  useEffect(() => {
    if (customerName || customerAddress || customerNumber || customerNeighborhood) {
      localStorage.setItem('pedifacil_customer', JSON.stringify({
        name: customerName,
        address: customerAddress,
        number: customerNumber,
        neighborhood: customerNeighborhood,
        phone: customerPhone
      }));
    }
  }, [customerName, customerAddress, customerNumber, customerNeighborhood, customerPhone]);

  // Scroll Spy Logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setSelectedCategory(entry.target.id);
          }
        });
      },
      { threshold: 0.5, rootMargin: '-100px 0px -50% 0px' }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref as Element);
    });

    return () => observer.disconnect();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [searchQuery, products]);

  const addToCart = (product: Product, quantity: number, observations: string, options: Record<string, string[]>) => {
    setCart(prev => {
      // Create a unique ID for cart items based on product ID and selected options
      const optionsString = JSON.stringify(options);
      const cartItemId = `${product.id}-${optionsString}`;
      
      const existing = prev.find(item => {
        const itemOptionsString = JSON.stringify(item.selectedOptions || {});
        return item.id === product.id && itemOptionsString === optionsString;
      });

      if (existing) {
        return prev.map(item => {
          const itemOptionsString = JSON.stringify(item.selectedOptions || {});
          return (item.id === product.id && itemOptionsString === optionsString)
            ? { ...item, quantity: item.quantity + quantity, observations } 
            : item;
        });
      }
      return [...prev, { ...product, quantity, observations, selectedOptions: options }];
    });
    
    setSelectedProduct(null);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const selectedNeighborhoodData = neighborhoods.find(n => n.name === customerNeighborhood);
  const deliveryFee = selectedNeighborhoodData?.fee || 0;
  const freeShippingThreshold = 50.00;
  const isFreeShipping = cartTotal >= freeShippingThreshold;
  const finalTotal = cartTotal + (isFreeShipping ? 0 : deliveryFee);
  const progressToFreeShipping = Math.min((cartTotal / freeShippingThreshold) * 100, 100);

  const handleWhatsAppCheckout = () => {
    const message = `*Novo Pedido - PediFácil*\n\n` +
      `*Cliente:* ${customerName}\n` +
      `*WhatsApp:* ${customerPhone}\n` +
      `*Endereço:* ${customerAddress}, ${customerNumber}\n` +
      `*Bairro:* ${customerNeighborhood}\n` +
      (customerNeighborhood === 'Outro / Não encontrei' ? `_Favor combinar frete pela localização_\n` : '') +
      `\n*Itens:*\n` +
      cart.map(item => {
        const optionsText = item.selectedOptions 
          ? Object.entries(item.selectedOptions)
              .map(([title, items]) => `\n  - ${title}: ${(items as string[]).join(', ')}`)
              .join('')
          : '';
        return `${item.quantity}x ${item.name}${optionsText} - R$ ${(item.price * item.quantity).toFixed(2)}`;
      }).join('\n') +
      `\n\n*Subtotal:* R$ ${cartTotal.toFixed(2)}` +
      `\n*Taxa de Entrega:* ${isFreeShipping ? 'GRÁTIS' : `R$ ${deliveryFee.toFixed(2)}`}` +
      `\n*Total:* R$ ${finalTotal.toFixed(2)}` +
      `\n\n*Forma de Pagamento:* ${paymentMethod.toUpperCase()}`;
    
    window.open(`https://wa.me/${storeInfo.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const scrollToCategory = (id: string) => {
    setSelectedCategory(id);
    
    if (id === 'todos') {
      const element = document.getElementById('products-list');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLogout = () => {
    setCustomerName('');
    setCustomerAddress('');
    setCustomerNumber('');
    setCustomerNeighborhood('');
    localStorage.removeItem('pedifacil_customer');
    setIsProfileOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-zinc-100 border-t-black rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Carregando cardápio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center min-h-screen bg-zinc-50">
      <div className="w-full max-w-[480px] bg-white relative pb-24 shadow-2xl overflow-x-hidden border-x border-zinc-100">
        
        {/* Header Banner */}
        <div className="relative">
          <div 
            className="h-48 bg-cover bg-center"
            style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6)), url(${storeInfo.banner})` }}
          />
          <div className="absolute inset-x-0 -bottom-14 flex flex-col items-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-28 h-28 bg-white rounded-[2.5rem] p-1 shadow-2xl border-4 border-white overflow-hidden"
            >
              <img src={storeInfo.logo} alt="Logotipo" className="w-full h-full object-cover rounded-[2.2rem]" referrerPolicy="no-referrer" />
            </motion.div>
          </div>
        </div>

        {/* Store Info */}
        <div className="px-6 pt-16 pb-8 text-center">
          <h1 className="text-3xl font-black text-zinc-900 mb-2 tracking-tighter">{storeInfo.name}</h1>
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 mb-4">
            <MapPin size={14} className="text-zinc-400" />
            <span className="font-medium">{storeInfo.location} • <button onClick={() => setIsStoreInfoOpen(true)} className="underline font-black text-zinc-900">Info</button></span>
          </div>
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-zinc-100 rounded-full text-[11px] font-black text-zinc-800 uppercase tracking-widest">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Aberto agora • {storeInfo.openingHours}</span>
          </div>
        </div>

        {/* Category Dropdown & Search */}
        <div className="px-6 mb-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
              className="flex-1 flex items-center justify-between bg-zinc-100 px-5 py-3.5 rounded-2xl text-sm font-bold text-zinc-900"
            >
              <span>Lista de categorias</span>
              <ChevronDown size={18} className={`text-zinc-400 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            <button 
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isSearchVisible ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-900'}`}
            >
              {isSearchVisible ? <X size={20} /> : <Search size={20} />}
            </button>
          </div>

          <AnimatePresence>
            {isSearchVisible && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="O que você está procurando?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-4 bg-zinc-100 border-none rounded-2xl text-sm outline-none focus:ring-2 ring-black pl-12"
                  />
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isCategoryMenuOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-2 p-2 bg-zinc-50 rounded-2xl border border-zinc-100">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { scrollToCategory(cat.id); setIsCategoryMenuOpen(false); }}
                      className="p-3 text-left text-xs font-bold text-zinc-600 hover:bg-white hover:text-black rounded-xl transition-all"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Categories Nav */}
        <div className="flex gap-3 overflow-x-auto px-6 py-3 scrollbar-hide sticky top-0 bg-white/90 backdrop-blur-xl z-40 border-b border-zinc-100">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={`px-6 py-2.5 rounded-full whitespace-nowrap text-xs font-black transition-all ${
                selectedCategory === cat.id 
                  ? 'bg-black text-white shadow-xl shadow-black/20' 
                  : 'bg-zinc-100 text-zinc-500'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products List */}
        <div className="px-6 mt-8 space-y-10" id="products-list">
          {categories.map(category => {
            const categoryProducts = category.id === 'todos'
              ? filteredProducts
              : category.id === 'destaques'
                ? filteredProducts.filter(p => p.highlight)
                : filteredProducts.filter(p => p.category === category.id);
              
            if (categoryProducts.length === 0) return null;
            
            return (
              <div 
                key={category.id} 
                id={category.id}
                ref={el => sectionRefs.current[category.id] = el}
                className="scroll-mt-24"
              >
                <h2 className="text-xl font-black text-zinc-900 mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-black rounded-full" />
                  {category.name}
                </h2>
                <div className="space-y-4">
                  {categoryProducts.map((product, idx) => (
                    <motion.div
                      key={product.id}
                      initial={{ y: 30, opacity: 0, scale: 0.95 }}
                      whileInView={{ y: 0, opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ 
                        type: "spring",
                        damping: 20,
                        stiffness: 100,
                        delay: idx * 0.05 
                      }}
                      onClick={() => setSelectedProduct(product)}
                      className="flex justify-between bg-white rounded-3xl p-4 border border-zinc-100 shadow-sm cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all active:scale-[0.98] group"
                    >
                      <div className="flex-1 pr-4">
                        {product.highlight && (
                          <span className="inline-block bg-zinc-900 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-3">
                            {product.highlight}
                          </span>
                        )}
                        <h3 className="text-lg font-bold mb-1.5 text-zinc-900 group-hover:text-black">{product.name}</h3>
                        <p className="text-xs text-zinc-500 mb-4 line-clamp-2 leading-relaxed">{product.description}</p>
                        <span className="text-base font-black text-zinc-900">R$ {product.price.toFixed(2)}</span>
                      </div>
                      <div className="relative">
                        <img 
                          src={product.image} 
                          className="w-28 h-28 rounded-[1.5rem] object-cover shadow-md" 
                          alt={product.name} 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shadow-lg">
                          <Plus size={16} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating WhatsApp Button */}
        <a 
          href={`https://wa.me/${storeInfo.whatsapp}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-24 right-6 w-14 h-14 bg-[#25d366] text-white rounded-full flex items-center justify-center shadow-2xl z-[60] hover:scale-110 transition-transform active:scale-95"
        >
          <Phone size={24} />
        </a>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/90 backdrop-blur-xl border-t border-zinc-100 flex justify-around py-4 z-50">
          <button 
            onClick={() => {
              setIsPromotionsOpen(false);
              setIsOrdersOpen(false);
              setIsProfileOpen(false);
              setIsCartOpen(false);
            }}
            className={`flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-widest ${(!isPromotionsOpen && !isOrdersOpen && !isProfileOpen && !isCartOpen) ? 'text-black' : 'text-zinc-400'}`}
          >
            <Home size={20} />
            <span>Início</span>
          </button>
          <button onClick={() => setIsPromotionsOpen(true)} className={`flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-widest ${isPromotionsOpen ? 'text-black' : 'text-zinc-400'}`}>
            <Tag size={20} />
            <span>Promoções</span>
          </button>
          <button onClick={() => setIsCartOpen(true)} className={`flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-widest relative ${isCartOpen ? 'text-black' : 'text-zinc-400'}`}>
            <ShoppingBag size={20} />
            <span>Sacola</span>
            {cart.length > 0 && (
              <span className="absolute -top-1 right-1 w-5 h-5 bg-black text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-black">
                {cart.length}
              </span>
            )}
          </button>
          <button onClick={() => setIsProfileOpen(true)} className={`flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-widest ${isProfileOpen ? 'text-black' : 'text-zinc-400'}`}>
            <UserIcon size={20} />
            <span>Perfil</span>
          </button>
        </nav>

        {/* Modals (Product, Upsell, Cart, Checkout) */}
        <AnimatePresence>
          {/* Product Modal */}
          {selectedProduct && (
            <motion.div 
              key="product-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/70"
            >
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-[480px] bg-white rounded-t-[32px] max-h-[92vh] overflow-y-auto"
              >
                <div className="h-60 relative">
                  <img src={selectedProduct.image} className="w-full h-full object-cover" alt={selectedProduct.name} referrerPolicy="no-referrer" />
                  <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg"><X size={20} /></button>
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-black mb-2">{selectedProduct.name}</h2>
                  <p className="text-sm text-zinc-500 mb-8 leading-relaxed">{selectedProduct.description}</p>
                  
                  {selectedProduct.options?.map((opt, i) => (
                    <div key={i} className="mb-8">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-base">{opt.title}</h3>
                        {opt.required && <span className="text-[10px] bg-zinc-100 text-zinc-900 px-2 py-1 rounded-md font-bold">OBRIGATÓRIO</span>}
                      </div>
                      <div className="space-y-2">
                        {opt.items.map((item, j) => {
                          const isSelected = selectedOptions[opt.title]?.includes(item.name);
                          return (
                            <label 
                              key={j} 
                              className={`flex justify-between items-center p-4 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-black text-white border-black' : 'bg-zinc-50 border-transparent hover:border-black/10'}`}
                            >
                              <span className="text-sm font-medium">{item.name}</span>
                              <div className="flex items-center gap-3">
                                {item.price > 0 && <span className={`text-xs font-bold ${isSelected ? 'text-zinc-400' : 'text-zinc-900'}`}>+ R$ {item.price.toFixed(2)}</span>}
                                <input 
                                  type={opt.required ? "radio" : "checkbox"} 
                                  name={opt.title} 
                                  checked={isSelected}
                                  onChange={() => {
                                    setSelectedOptions(prev => {
                                      const current = prev[opt.title] || [];
                                      if (opt.required) {
                                        return { ...prev, [opt.title]: [item.name] };
                                      }
                                      if (current.includes(item.name)) {
                                        return { ...prev, [opt.title]: current.filter(n => n !== item.name) };
                                      }
                                      return { ...prev, [opt.title]: [...current, item.name] };
                                    });
                                  }}
                                  className="hidden" 
                                />
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-white bg-white' : 'border-zinc-300'}`}>
                                  {isSelected && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="mb-8">
                    <h3 className="font-bold text-base mb-4">Observações</h3>
                    <textarea 
                      placeholder="Ex: tirar cebola, maionese à parte..."
                      value={productObservations}
                      onChange={(e) => setProductObservations(e.target.value)}
                      className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm outline-none focus:ring-2 ring-black h-24 resize-none"
                    />
                  </div>

                  <div className="flex gap-4 items-center sticky bottom-0 bg-white pt-4 pb-6">
                    <div className="flex items-center gap-6 bg-zinc-100 px-6 py-3 rounded-2xl">
                      <button 
                        onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}
                        className="text-black"
                      >
                        <Minus size={20} />
                      </button>
                      <span className="font-bold text-lg">{productQuantity}</span>
                      <button 
                        onClick={() => setProductQuantity(productQuantity + 1)}
                        className="text-black"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    <button 
                      onClick={() => {
                        // Check for required options
                        const missingRequired = selectedProduct.options?.find(opt => opt.required && !selectedOptions[opt.title]);
                        if (missingRequired) {
                          alert(`Por favor, selecione: ${missingRequired.title}`);
                          return;
                        }
                        addToCart(selectedProduct, productQuantity, productObservations, selectedOptions);
                      }}
                      className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-black/20 active:scale-95 transition-all"
                    >
                      Adicionar • R$ {((selectedProduct.price + Object.entries(selectedOptions).reduce((acc, [title, items]) => {
                        const opt = selectedProduct.options?.find(o => o.title === title);
                        const itemsPrice = (items as string[]).reduce((sum, itemName) => {
                          const item = opt?.items.find(i => i.name === itemName);
                          return sum + (item?.price || 0);
                        }, 0);
                        return acc + itemsPrice;
                      }, 0)) * productQuantity).toFixed(2)}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Store Info Modal */}
          {isStoreInfoOpen && (
            <motion.div 
              key="store-info-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/70"
            >
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-[480px] bg-white rounded-t-[32px] p-8 shadow-2xl max-h-[92vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black">Informações</h2>
                  <button onClick={() => setIsStoreInfoOpen(false)} className="text-zinc-400"><X size={24} /></button>
                </div>

                <div className="flex gap-2 mb-8 bg-zinc-100 p-1.5 rounded-2xl">
                  {(['sobre', 'horario', 'pagamento'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setStoreInfoTab(tab)}
                      className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${storeInfoTab === tab ? 'bg-white text-black shadow-sm' : 'text-zinc-400'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {storeInfoTab === 'sobre' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-900">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-sm">Endereço</h4>
                        <p className="text-xs text-zinc-500">{storeInfo.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-900">
                        <Instagram size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-sm">Instagram</h4>
                        <p className="text-xs text-zinc-500">{storeInfo.instagram}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-900">
                        <Phone size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-sm">WhatsApp</h4>
                        <p className="text-xs text-zinc-500">{storeInfo.phone}</p>
                      </div>
                    </div>
                  </div>
                )}

                {storeInfoTab === 'horario' && (
                  <div className="space-y-4">
                    {HOURS.map(h => (
                      <div key={h.day} className={`flex justify-between items-center p-4 rounded-2xl border ${h.active ? 'bg-black text-white border-black' : 'bg-zinc-50 text-zinc-900 border-zinc-100'}`}>
                        <span className="font-bold text-sm">{h.day}</span>
                        <span className={`text-xs ${h.active ? 'font-black' : 'font-medium text-zinc-500'}`}>{h.hours}</span>
                      </div>
                    ))}
                  </div>
                )}

                {storeInfoTab === 'pagamento' && (
                  <div className="space-y-4">
                    {PAYMENT_METHODS.map(m => (
                      <div key={m.id} className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-zinc-900 shadow-sm">
                          {m.icon === 'Banknote' ? <CreditCard size={20} /> : <CreditCard size={20} />}
                        </div>
                        <span className="font-bold text-sm text-zinc-900">{m.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Orders Modal */}
          {isOrdersOpen && (
            <motion.div 
              key="orders-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/70"
            >
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-[480px] bg-white rounded-t-[32px] p-8 shadow-2xl max-h-[92vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black">Seus Pedidos</h2>
                  <button onClick={() => setIsOrdersOpen(false)} className="text-zinc-400"><X size={24} /></button>
                </div>

                <div className="py-16 text-center text-zinc-400">
                  <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag size={32} className="opacity-20" />
                  </div>
                  <p className="font-bold text-zinc-900 mb-2">Nenhum pedido ainda</p>
                  <p className="text-xs text-zinc-500 max-w-[200px] mx-auto">Seus pedidos aparecerão aqui assim que você finalizar sua primeira compra.</p>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Promotions Modal */}
          {isPromotionsOpen && (
            <motion.div 
              key="promotions-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/70"
            >
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-[480px] bg-white rounded-t-[32px] p-8 shadow-2xl max-h-[92vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black">Promoções 🔥</h2>
                  <button onClick={() => setIsPromotionsOpen(false)} className="text-zinc-400"><X size={24} /></button>
                </div>

                <div className="space-y-4">
                  {products.filter(p => p.highlight).map(product => (
                    <div 
                      key={product.id}
                      onClick={() => { setSelectedProduct(product); setIsPromotionsOpen(false); }}
                      className="flex gap-4 bg-zinc-50 p-4 rounded-3xl border border-zinc-100 cursor-pointer hover:border-black transition-all group"
                    >
                      <img src={product.image} className="w-24 h-24 rounded-2xl object-cover shadow-sm" alt="" />
                      <div className="flex-1 py-1">
                        <span className="text-[9px] font-black bg-black text-white px-3 py-1 rounded-full uppercase tracking-widest mb-2 inline-block">
                          {product.highlight}
                        </span>
                        <h4 className="font-bold text-base text-zinc-900 group-hover:text-black">{product.name}</h4>
                        <p className="text-xs text-zinc-500 line-clamp-1 mb-3">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-black text-lg text-zinc-900">R$ {product.price.toFixed(2)}</span>
                          <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-900 group-hover:bg-black group-hover:text-white transition-colors">
                            <Plus size={16} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Profile Modal */}
          {isProfileOpen && (
            <motion.div 
              key="profile-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/70"
            >
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-[480px] bg-white rounded-t-[32px] p-8 shadow-2xl max-h-[92vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black">Perfil</h2>
                  <button onClick={() => setIsProfileOpen(false)} className="text-zinc-400"><X size={24} /></button>
                </div>

                              <div className="flex items-center gap-4 p-6 bg-zinc-900 rounded-[2rem] text-white shadow-xl">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                      <UserIcon size={32} />
                    </div>
                    <div>
                      <h3 className="font-black text-xl">{customerName || 'Visitante'}</h3>
                      <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
                        {customerName ? 'Cliente Premium' : 'Perfil não criado'}
                      </p>
                    </div>
                  </div>

                  {!customerName ? (
                    <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 text-center">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-zinc-300 mx-auto mb-4 shadow-sm">
                        <UserIcon size={32} />
                      </div>
                      <h3 className="font-black text-lg text-zinc-900 mb-2">Crie seu perfil</h3>
                      <p className="text-zinc-500 text-sm mb-6 px-4">Salve seus dados para pedir mais rápido e acompanhar seus pedidos.</p>
                      <button 
                        onClick={() => { setIsProfileOpen(false); setIsProfileEditOpen(true); }}
                        className="w-full bg-black text-white py-5 rounded-2xl font-black text-base shadow-xl shadow-black/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                        <Plus size={20} />
                        Começar agora
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100">
                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Meus Dados</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-zinc-900 shadow-sm">
                                <UserIcon size={18} />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nome</p>
                                <p className="text-sm font-bold text-zinc-900">{customerName}</p>
                              </div>
                            </div>
                            <button onClick={() => { setIsProfileOpen(false); setIsProfileEditOpen(true); }} className="text-[10px] font-black text-zinc-900 uppercase tracking-widest underline">Editar</button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-zinc-900 shadow-sm">
                                <MapPin size={18} />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Endereço</p>
                                <p className="text-sm font-bold text-zinc-900 truncate max-w-[180px]">
                                  {customerAddress ? `${customerAddress}, ${customerNumber}` : 'Não informado'}
                                </p>
                              </div>
                            </div>
                            <button onClick={() => { setIsProfileOpen(false); setIsProfileEditOpen(true); }} className="text-[10px] font-black text-zinc-900 uppercase tracking-widest underline">Editar</button>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100">
                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Configurações</h4>
                        <div className="space-y-4">
                          <button 
                            onClick={() => { setIsProfileOpen(false); setIsOrdersOpen(true); }}
                            className="w-full flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-zinc-900 shadow-sm group-hover:bg-black group-hover:text-white transition-colors">
                                <Clock size={18} />
                              </div>
                              <span className="text-sm font-bold text-zinc-900">Histórico de Pedidos</span>
                            </div>
                            <ChevronRight size={18} className="text-zinc-300" />
                          </button>
                          <button className="w-full flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-zinc-900 shadow-sm group-hover:bg-black group-hover:text-white transition-colors">
                                <CreditCard size={18} />
                              </div>
                              <span className="text-sm font-bold text-zinc-900">Cartões Salvos</span>
                            </div>
                            <ChevronRight size={18} className="text-zinc-300" />
                          </button>
                        </div>
                      </div>

                      <button 
                        onClick={handleLogout}
                        className="w-full bg-zinc-100 text-zinc-900 py-4 rounded-2xl font-black active:scale-95 transition-all"
                      >
                        Sair da Conta
                      </button>
                    </div>
                  )}

                  <div className="pt-4 text-center">
                    <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest">PediFácil SaaS • v1.0.4</p>
                  </div>
                </motion.div>
              </motion.div>
            )}

          {/* Profile Edit Modal */}
          {isProfileEditOpen && (
            <motion.div 
              key="profile-edit-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/70"
            >
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-[480px] bg-white rounded-t-[32px] p-8 shadow-2xl max-h-[92vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-black">Meu Perfil</h2>
                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">Configure seus dados</p>
                  </div>
                  <button onClick={() => setIsProfileEditOpen(false)} className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-400"><X size={20} /></button>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Informações Pessoais</h3>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest ml-4">Nome Completo</label>
                        <input 
                          type="text" 
                          placeholder="Como quer ser chamado?"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full p-4 bg-white border border-zinc-100 rounded-2xl text-sm outline-none focus:ring-2 ring-black"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest ml-4">WhatsApp</label>
                        <input 
                          type="tel" 
                          placeholder="(00) 00000-0000"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full p-4 bg-white border border-zinc-100 rounded-2xl text-sm outline-none focus:ring-2 ring-black"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Endereço de Entrega</h3>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="flex-[3] space-y-1.5">
                          <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest ml-4">Rua / Avenida</label>
                          <input 
                            type="text" 
                            placeholder="Nome da rua"
                            value={customerAddress}
                            onChange={(e) => setCustomerAddress(e.target.value)}
                            className="w-full p-4 bg-white border border-zinc-100 rounded-2xl text-sm outline-none focus:ring-2 ring-black"
                          />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest ml-4">Nº</label>
                          <input 
                            type="text" 
                            placeholder="00"
                            value={customerNumber}
                            onChange={(e) => setCustomerNumber(e.target.value)}
                            className="w-full p-4 bg-white border border-zinc-100 rounded-2xl text-sm outline-none focus:ring-2 ring-black text-center"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest ml-4">Bairro</label>
                        <select 
                          value={customerNeighborhood}
                          onChange={(e) => setCustomerNeighborhood(e.target.value)}
                          className="w-full p-4 bg-white border border-zinc-100 rounded-2xl text-sm outline-none focus:ring-2 ring-black appearance-none"
                        >
                          <option value="">Selecione seu bairro</option>
                          {neighborhoods.map(n => (
                            <option key={n.name} value={n.name}>{n.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button 
                    onClick={() => {
                      if (!customerName || !customerAddress || !customerNumber || !customerNeighborhood) {
                        alert('Por favor, preencha todos os campos para salvar seu perfil.');
                        return;
                      }
                      setIsProfileEditOpen(false);
                      setIsProfileOpen(true);
                    }}
                    className="w-full bg-black text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-black/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <Check size={24} />
                    Salvar Perfil
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Cart Modal */}
          {isCartOpen && (
            <motion.div 
              key="cart-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/70"
            >
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-[480px] bg-white rounded-t-[32px] p-8 shadow-2xl max-h-[92vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black">Sua sacola</h2>
                  <button onClick={() => setIsCartOpen(false)} className="text-zinc-400"><X size={24} /></button>
                </div>

                {cart.length === 0 ? (
                  <div className="py-16 text-center text-zinc-400">
                    <ShoppingBag size={64} className="mx-auto mb-4 opacity-10" />
                    <p className="font-bold text-zinc-900">Sua sacola está vazia</p>
                    <button onClick={() => setIsCartOpen(false)} className="mt-4 text-black font-black underline">Ver cardápio</button>
                  </div>
                ) : (
                  <>
                    <div className="mb-8">
                      <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Itens adicionados</h3>
                      <div className="space-y-4">
                        {cart.map(item => (
                          <div key={item.id} className="flex justify-between items-center bg-zinc-50 p-4 rounded-[2rem] border border-zinc-100">
                            <div className="flex items-center gap-4">
                              <img src={item.image} className="w-16 h-16 rounded-2xl object-cover shadow-sm" alt="" />
                              <div>
                                <h4 className="font-bold text-sm text-zinc-900">{item.quantity}x {item.name}</h4>
                                <p className="text-zinc-900 font-black text-xs">R$ {(item.price * item.quantity).toFixed(2)}</p>
                              </div>
                            </div>
                            <button onClick={() => removeFromCart(item.id)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-500 shadow-sm hover:bg-red-50 transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-8">
                      <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Peça também</h3>
                      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {products.filter(p => !cart.find(c => c.id === p.id)).slice(0, 5).map(product => (
                          <div 
                            key={product.id}
                            onClick={() => { setSelectedProduct(product); setIsCartOpen(false); }}
                            className="min-w-[140px] bg-zinc-50 p-3 rounded-[2rem] border border-zinc-100 cursor-pointer hover:border-black transition-all"
                          >
                            <img src={product.image} className="w-full h-24 rounded-2xl object-cover mb-3 shadow-sm" alt="" />
                            <h4 className="font-bold text-xs text-zinc-900 truncate mb-1">{product.name}</h4>
                            <p className="text-[10px] font-black text-zinc-900">R$ {product.price.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-zinc-900 rounded-[2.5rem] p-8 mb-8 shadow-2xl shadow-zinc-200 text-white">
                      <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6">Resumo de valores</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm font-bold text-zinc-400">
                          <span>Subtotal</span>
                          <span>R$ {cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-zinc-400">
                          <span>Taxa de entrega</span>
                          <span className={isFreeShipping ? 'text-green-400' : ''}>
                            {isFreeShipping ? 'GRÁTIS' : `R$ ${deliveryFee.toFixed(2)}`}
                          </span>
                        </div>
                        <div className="h-px bg-white/10 my-4" />
                        <div className="flex justify-between font-black text-2xl">
                          <span>Total</span>
                          <span>R$ {finalTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                      className="w-full bg-black text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-black/20 active:scale-95 transition-all"
                    >
                      Finalizar pedido
                    </button>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
          {/* Checkout Modal */}
          {isCheckoutOpen && (
            <motion.div 
              key="checkout-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/70"
            >
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-[480px] bg-white rounded-t-[32px] p-8 shadow-2xl max-h-[92vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black">Finalizar pedido</h2>
                  <button onClick={() => setIsCheckoutOpen(false)} className="text-zinc-400"><X size={24} /></button>
                </div>

                <div className="space-y-8">
                  <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100">
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Seus dados</h3>
                    <div className="space-y-4">
                      <input 
                        type="text" 
                        placeholder="Nome completo" 
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full p-4 bg-white border border-zinc-100 rounded-2xl text-sm outline-none focus:ring-2 ring-black" 
                      />
                      <input 
                        type="text" 
                        placeholder="WhatsApp (com DDD)" 
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full p-4 bg-white border border-zinc-100 rounded-2xl text-sm outline-none focus:ring-2 ring-black" 
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100">
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Endereço de entrega</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-[2fr_1fr] gap-4">
                        <input 
                          type="text" 
                          placeholder="Rua, Avenida..." 
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          className="w-full p-4 bg-white border border-zinc-100 rounded-2xl text-sm outline-none focus:ring-2 ring-black" 
                        />
                        <input 
                          type="text" 
                          placeholder="Nº" 
                          value={customerNumber}
                          onChange={(e) => setCustomerNumber(e.target.value)}
                          className="w-full p-4 bg-white border border-zinc-100 rounded-2xl text-sm outline-none focus:ring-2 ring-black" 
                        />
                      </div>
                      <select 
                        value={customerNeighborhood}
                        onChange={(e) => setCustomerNeighborhood(e.target.value)}
                        className="w-full p-4 bg-white border border-zinc-100 rounded-2xl text-sm outline-none focus:ring-2 ring-black appearance-none"
                      >
                        <option value="">Selecione seu bairro</option>
                        {neighborhoods.map(n => (
                          <option key={n.name} value={n.name}>{n.name} {n.fee > 0 ? `(+ R$ ${n.fee.toFixed(2)})` : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100">
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Forma de pagamento</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {PAYMENT_METHODS.map(method => (
                        <button 
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id)}
                          className={`flex items-center gap-3 p-4 rounded-2xl text-xs font-black transition-all border ${paymentMethod === method.id ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-zinc-500 border-zinc-100'}`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${paymentMethod === method.id ? 'bg-white/10' : 'bg-zinc-50'}`}>
                            <CreditCard size={16} />
                          </div>
                          {method.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900 rounded-[2.5rem] p-8 my-8 shadow-2xl shadow-zinc-200 text-white">
                  <div className="flex justify-between font-black text-xl">
                    <span>Total a pagar</span>
                    <span>R$ {finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  onClick={handleWhatsAppCheckout}
                  className="w-full bg-[#25d366] text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 active:scale-95 transition-all"
                >
                  <MessageCircle size={24} />
                  Finalizar no WhatsApp
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

// 2. Admin Panel (Store Owner)
const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'settings'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes, storeRes] = await Promise.all([
          supabase.from('products').select('*').order('id'),
          supabase.from('categories').select('*').order('id'),
          supabase.from('store_info').select('*').maybeSingle()
        ]);

        if (prodRes.data) setProducts(prodRes.data);
        if (catRes.data) setCategories(catRes.data);
        if (storeRes.data) setStoreInfo(storeRes.data);
      } catch (error) {
        console.error('Erro ao carregar dados admin:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-xs uppercase tracking-widest text-zinc-400">Carregando Painel...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-xl hidden md:block border-r border-zinc-100">
        <div className="p-8 border-b border-zinc-100">
          <h2 className="font-black text-xl tracking-tight">PediFácil</h2>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Painel Admin</p>
        </div>
        <nav className="p-6 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'products' ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <ShoppingBag size={20} /> Produtos
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'categories' ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <Tag size={20} /> Categorias
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'settings' ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <Settings size={20} /> Configurações
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Olá, {storeInfo?.name || 'Lojista'}</h1>
            <p className="text-zinc-500 font-medium">Gerencie seu cardápio em tempo real</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/burger-do-gordo" target="_blank" className="px-6 py-3 bg-white border border-zinc-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-50 transition-all">Ver Cardápio</Link>
            <span className="px-4 py-2 bg-green-50 text-green-600 rounded-full text-xs font-black uppercase tracking-widest border border-green-100">Loja Aberta</span>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-zinc-100">
                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Total de Produtos</p>
                <h3 className="text-4xl font-black">{products.length}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-zinc-100">
                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Categorias Ativas</p>
                <h3 className="text-4xl font-black">{categories.length}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-zinc-100">
                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Visualizações Hoje</p>
                <h3 className="text-4xl font-black">128</h3>
              </div>
            </div>
            
            <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100">
              <h3 className="text-xl font-black mb-6">Produtos Recentes</h3>
              <div className="space-y-4">
                {products.slice(0, 5).map(product => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <img src={product.image} alt={product.name} className="w-12 h-12 rounded-xl object-cover" />
                      <div>
                        <p className="font-black text-sm">{product.name}</p>
                        <p className="text-xs text-zinc-400">R$ {product.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-zinc-200 rounded-lg transition-all"><ChevronRight size={18} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-[2.5rem] border border-zinc-100 overflow-hidden">
            <div className="p-8 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="text-xl font-black">Gerenciar Produtos</h3>
              <button className="bg-black text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <Plus size={16} /> Novo Produto
              </button>
            </div>
            <table className="w-full text-left">
              <thead className="bg-zinc-50 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="p-6">Produto</th>
                  <th className="p-6">Categoria</th>
                  <th className="p-6">Preço</th>
                  <th className="p-6">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <img src={product.image} className="w-10 h-10 rounded-lg object-cover" />
                        <span className="font-bold text-zinc-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-6 text-zinc-500 text-sm">{product.category}</td>
                    <td className="p-6 font-bold text-zinc-900">R$ {product.price.toFixed(2)}</td>
                    <td className="p-6">
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-900 transition-all"><Settings size={16} /></button>
                        <button className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(activeTab === 'categories' || activeTab === 'settings') && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-zinc-100 border-dashed">
            <Settings size={48} className="text-zinc-200 mb-4" />
            <p className="font-black text-zinc-400 uppercase tracking-widest text-xs">Módulo em Desenvolvimento</p>
            <p className="text-zinc-400 text-sm mt-2">Em breve você poderá gerenciar tudo por aqui!</p>
          </div>
        )}
      </main>
    </div>
  );
};

// 3. Master Panel (You)
const MasterPanel = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        setLoading(true);
        const { data } = await supabase.from('store_info').select('*');
        if (data) setStores(data);
      } catch (error) {
        console.error('Erro master:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMasterData();
  }, []);

  return (
    <div className="min-h-screen bg-white p-10">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-end mb-16">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2">Painel Master 👑</h1>
            <p className="text-zinc-500 font-medium">Controle total da plataforma PediFácil</p>
          </div>
          <button className="bg-black text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-2xl shadow-black/20 hover:scale-105 transition-all active:scale-95">
            <Plus size={20} /> Criar Nova Loja
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-zinc-50 p-8 rounded-[2.5rem] border border-zinc-100">
            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-2">Total de Lojas</p>
            <h3 className="text-3xl font-black">{stores.length}</h3>
          </div>
          <div className="bg-zinc-50 p-8 rounded-[2.5rem] border border-zinc-100">
            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-2">Lojas Ativas</p>
            <h3 className="text-3xl font-black text-zinc-900">{stores.length}</h3>
          </div>
          <div className="bg-zinc-50 p-8 rounded-[2.5rem] border border-zinc-100">
            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-2">Inadimplentes</p>
            <h3 className="text-3xl font-black text-zinc-300">0</h3>
          </div>
          <div className="bg-zinc-50 p-8 rounded-[2.5rem] border border-zinc-100">
            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-2">MRR (Recorrência)</p>
            <h3 className="text-3xl font-black">R$ {(stores.length * 49.90).toFixed(0)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="p-6">Loja</th>
                <th className="p-6">Localização</th>
                <th className="p-6">Status</th>
                <th className="p-6">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {stores.map(store => (
                <tr key={store.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="p-6">
                    <div className="font-black text-zinc-900">{store.name}</div>
                    <div className="text-xs text-zinc-400">pedifacil.com/{store.name.toLowerCase().replace(/\s+/g, '-')}</div>
                  </td>
                  <td className="p-6 text-zinc-500 font-medium">{store.location}</td>
                  <td className="p-6">
                    <span className="px-3 py-1 bg-zinc-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest">ATIVO</span>
                  </td>
                  <td className="p-6">
                    <div className="flex gap-2">
                      <button className="p-3 hover:bg-zinc-100 rounded-xl text-zinc-900 transition-all"><Settings size={18} /></button>
                      <button className="p-3 hover:bg-zinc-100 rounded-xl text-zinc-900 transition-all"><MessageCircle size={18} /></button>
                      <button className="p-3 hover:bg-zinc-100 rounded-xl text-zinc-300 transition-all"><Lock size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Main App with Routing ---
export default function App() {
  return (
    <Router>
      <Routes>
        {/* Master Route */}
        <Route path="/master" element={<MasterPanel />} />
        
        {/* Admin Route */}
        <Route path="/admin" element={<AdminPanel />} />
        
        {/* Public Store Route */}
        <Route path="/:slug" element={<PublicMenu />} />
        
        {/* Home Redirect or Landing Page */}
        <Route path="/" element={<Navigate to="/burger-do-gordo" replace />} />
      </Routes>
    </Router>
  );
}
