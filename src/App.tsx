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
  Check,
  CheckCircle2,
  AlertCircle,
  Share2,
  Gift,
  PlusCircle,
  Star,
  Image as ImageIcon
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
  const [referralCode, setReferralCode] = useState('');
  const [showRecoveryNotify, setShowRecoveryNotify] = useState(false);
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
      setReferralCode(data.referralCode || '');
    }
  }, []);

  // Cart Recovery Logic
  useEffect(() => {
    const savedCart = localStorage.getItem('pedifacil_cart_recovery');
    if (savedCart && cart.length === 0) {
      const { items, timestamp } = JSON.parse(savedCart);
      const now = new Date().getTime();
      // Only recover if less than 2 hours old
      if (now - timestamp < 2 * 60 * 60 * 1000) {
        setCart(items);
        setShowRecoveryNotify(true);
        setTimeout(() => setShowRecoveryNotify(false), 8000);
      }
    }
  }, []);

  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('pedifacil_cart_recovery', JSON.stringify({
        items: cart,
        timestamp: new Date().getTime()
      }));
    } else {
      localStorage.removeItem('pedifacil_cart_recovery');
    }
  }, [cart]);

  // Generate Referral Code if not exists
  useEffect(() => {
    if (customerName && !referralCode) {
      const code = `${customerName.split(' ')[0].toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
      setReferralCode(code);
    }
  }, [customerName, referralCode]);

  // Save address to localStorage
  useEffect(() => {
    if (customerName || customerAddress || customerNumber || customerNeighborhood) {
      localStorage.setItem('pedifacil_customer', JSON.stringify({
        name: customerName,
        address: customerAddress,
        number: customerNumber,
        neighborhood: customerNeighborhood,
        phone: customerPhone,
        referralCode: referralCode
      }));
    }
  }, [customerName, customerAddress, customerNumber, customerNeighborhood, customerPhone, referralCode]);

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
        
        {/* Cart Recovery Notification */}
        <AnimatePresence>
          {showRecoveryNotify && (
            <motion.div 
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 20, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="fixed top-0 left-1/2 -translate-x-1/2 z-[3000] w-[90%] max-w-[400px]"
            >
              <div className="bg-black text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                  <ShoppingBag size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Recuperamos seu carrinho!</p>
                  <p className="text-xs font-bold">Seus itens ainda estão aqui. 🍔🔥</p>
                </div>
                <button onClick={() => setShowRecoveryNotify(false)} className="text-zinc-500"><X size={18} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
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
          {!storeInfo.isOpen && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
              <AlertCircle size={20} />
              <p className="text-xs font-black uppercase tracking-widest text-left">Loja Fechada no momento. Você pode navegar, mas não aceitamos pedidos agora.</p>
            </div>
          )}
          <h1 className="text-3xl font-black text-zinc-900 mb-2 tracking-tighter">{storeInfo.name}</h1>
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 mb-4">
            <MapPin size={14} className="text-zinc-400" />
            <span className="font-medium">{storeInfo.location} • <button onClick={() => setIsStoreInfoOpen(true)} className="underline font-black text-zinc-900">Info</button></span>
          </div>
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-zinc-100 rounded-full text-[11px] font-black text-zinc-800 uppercase tracking-widest">
            <span className={`w-2 h-2 rounded-full ${storeInfo.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span>{storeInfo.isOpen ? 'Aberto agora' : 'Fechado'} • {storeInfo.openingHours}</span>
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
                      onClick={() => product.isAvailable && setSelectedProduct(product)}
                      className={`flex justify-between bg-white rounded-3xl p-4 border border-zinc-100 shadow-sm cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all active:scale-[0.98] group ${!product.isAvailable ? 'opacity-60 grayscale' : ''}`}
                    >
                      <div className="flex-1 pr-4">
                        {product.highlight && (
                          <span className="inline-block bg-zinc-900 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-3">
                            Destaque 🔥
                          </span>
                        )}
                        <h3 className="text-lg font-bold mb-1.5 text-zinc-900 group-hover:text-black">{product.name}</h3>
                        <p className="text-xs text-zinc-500 mb-4 line-clamp-2 leading-relaxed">{product.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-zinc-900">R$ {product.price.toFixed(2)}</span>
                          {product.originalPrice && (
                            <span className="text-xs text-zinc-400 line-through">R$ {product.originalPrice.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                      <div className="relative">
                        <img 
                          src={product.image} 
                          className="w-28 h-28 rounded-[1.5rem] object-cover shadow-md" 
                          alt={product.name} 
                          referrerPolicy="no-referrer"
                        />
                        {!product.isAvailable ? (
                          <div className="absolute inset-0 bg-black/60 rounded-[1.5rem] flex items-center justify-center">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Esgotado</span>
                          </div>
                        ) : (
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shadow-lg">
                            <Plus size={16} />
                          </div>
                        )}
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
                          <div className="flex items-center gap-2">
                            <span className="font-black text-lg text-zinc-900">R$ {product.price.toFixed(2)}</span>
                            {product.originalPrice && (
                              <span className="text-xs text-zinc-400 line-through">R$ {product.originalPrice.toFixed(2)}</span>
                            )}
                          </div>
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
                  <div className="p-6 bg-black rounded-[2.5rem] text-white">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                        <Gift size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-widest">Indique e Ganhe</h3>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Ganhe prêmios indicando amigos</p>
                      </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mb-4">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Seu código de indicação</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-black tracking-tighter">{referralCode || 'GERANDO...'}</span>
                        <button 
                          onClick={() => {
                            const text = `Ei! Peça no ${storeInfo.name} usando meu código ${referralCode} e ganhe um brinde no primeiro pedido! 🍔\n\nPeça aqui: ${window.location.href}`;
                            if (navigator.share) {
                              navigator.share({ text });
                            } else {
                              navigator.clipboard.writeText(text);
                              alert('Link copiado!');
                            }
                          }}
                          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                        >
                          <Share2 size={14} /> Compartilhar
                        </button>
                      </div>
                    </div>
                    <p className="text-[9px] text-zinc-500 font-medium leading-relaxed">Compartilhe seu link. Quando um amigo fizer o primeiro pedido usando seu código:</p>
                    <div className="mt-4 space-y-2">
                       <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">• 1 Indicação = Cupom 10% OFF</p>
                       <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">• 5 Indicações = Burger GRÁTIS</p>
                       <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">• 10 Indicações = Combo Premium</p>
                    </div>
                  </div>

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

                    {cartTotal < freeShippingThreshold && (
                      <div className="mb-8 p-6 bg-zinc-50 border border-zinc-100 rounded-[2rem]">
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                             Faltam <span className="text-black font-black">R$ {(freeShippingThreshold - cartTotal).toFixed(2)}</span> para Frete Grátis
                          </p>
                          <Gift size={16} className="text-zinc-300" />
                        </div>
                        <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressToFreeShipping}%` }}
                            className="h-full bg-black"
                          />
                        </div>
                      </div>
                    )}

                    {cartTotal >= freeShippingThreshold && (
                      <div className="mb-8 p-6 bg-green-50 border border-green-100 rounded-[2rem] flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white">
                          <CheckCircle2 size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-green-600 uppercase tracking-widest">Parabéns! 🎉</p>
                          <h4 className="text-sm font-black text-green-900">Você ganhou frete grátis!</h4>
                        </div>
                      </div>
                    )}

                    <div className="mb-10">
                      <div className="flex justify-between items-end mb-6">
                        <h3 className="text-xl font-black tracking-tighter italic">Que tal acompanhar? 🍟</h3>
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Os favoritos da galera</p>
                      </div>
                      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
                        {products.filter(p => !cart.find(c => c.id === p.id)).slice(0, 6).map(product => (
                          <motion.div 
                            key={product.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setSelectedProduct(product); setIsCartOpen(false); }}
                            className="min-w-[160px] bg-zinc-50 p-4 rounded-[2.5rem] border border-zinc-100 cursor-pointer hover:border-black transition-all group"
                          >
                            <div className="relative mb-3 h-28 overflow-hidden rounded-3xl">
                              <img src={product.image} className="w-full h-full object-cover shadow-sm group-hover:scale-110 transition-transform duration-500" alt="" />
                              <div className="absolute top-2 right-2 bg-black text-white p-2 rounded-xl scale-0 group-hover:scale-100 transition-transform">
                                <Plus size={14} />
                              </div>
                            </div>
                            <h4 className="font-black text-xs text-zinc-900">{product.name}</h4>
                            <p className="text-[10px] font-black text-zinc-400 mt-1">R$ {product.price.toFixed(2)}</p>
                          </motion.div>
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'crm' | 'settings'>('dashboard');
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const toggleStoreStatus = async () => {
    if (!storeInfo) return;
    const newStatus = !storeInfo.isOpen;
    try {
      const { error } = await supabase
        .from('store_info')
        .update({ isOpen: newStatus })
        .eq('id', storeInfo.id);
      
      if (!error) {
        setStoreInfo({ ...storeInfo, isOpen: newStatus });
      }
    } catch (err) {
      console.error('Erro ao mudar status:', err);
    }
  };

  const toggleProductAvailability = async (product: Product) => {
    const newStatus = !product.isAvailable;
    try {
      const { error } = await supabase
        .from('products')
        .update({ isAvailable: newStatus })
        .eq('id', product.id);
      
      if (!error) {
        setProducts(products.map(p => p.id === product.id ? { ...p, isAvailable: newStatus } : p));
      }
    } catch (err) {
      console.error('Erro ao mudar disponibilidade:', err);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        setProducts(products.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

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
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row pb-24 md:pb-0">
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
            <LayoutDashboard size={20} /> Painel Geral
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'products' ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <ShoppingBag size={20} /> Cardápio
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'categories' ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <Tag size={20} /> Categorias
          </button>
          <button 
            onClick={() => setActiveTab('crm')}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'crm' ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <Users size={20} /> Clientes (CRM)
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'settings' ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <Settings size={20} /> Ajustes da Loja
          </button>
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-zinc-100 p-4 flex justify-around items-center z-[1000] md:hidden">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-black' : 'text-zinc-400'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">Painel</span>
        </button>
        <button onClick={() => setActiveTab('products')} className={`flex flex-col items-center gap-1 ${activeTab === 'products' ? 'text-black' : 'text-zinc-400'}`}>
          <ShoppingBag size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">Cardápio</span>
        </button>
        <button onClick={() => setActiveTab('categories')} className={`flex flex-col items-center gap-1 ${activeTab === 'categories' ? 'text-black' : 'text-zinc-400'}`}>
          <Tag size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">Categorias</span>
        </button>
        <button onClick={() => setActiveTab('crm')} className={`flex flex-col items-center gap-1 ${activeTab === 'crm' ? 'text-black' : 'text-zinc-400'}`}>
          <Users size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">Clientes</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-black' : 'text-zinc-400'}`}>
          <Settings size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">Ajustes</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Olá, {storeInfo?.name || 'Lojista'}</h1>
            <p className="text-zinc-500 font-medium">Gerencie seu cardápio em tempo real</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link to="/burger-do-gordo" target="_blank" className="flex-1 md:flex-none px-6 py-3 bg-white border border-zinc-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-50 transition-all text-center">Ver Site</Link>
            <button 
              onClick={toggleStoreStatus}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${storeInfo?.isOpen ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}
            >
              {storeInfo?.isOpen ? 'Loja Aberta' : 'Loja Fechada'}
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Quick Actions - BIG BUTTONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={toggleStoreStatus}
                className={`w-full p-8 rounded-[2.5rem] flex items-center justify-between shadow-xl transition-all active:scale-95 ${storeInfo?.isOpen ? 'bg-green-500 text-white shadow-green-200' : 'bg-red-500 text-white shadow-red-200'}`}
              >
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Status da Loja</p>
                  <h3 className="text-3xl font-black tracking-tighter">{storeInfo?.isOpen ? 'LOJA ABERTA' : 'LOJA FECHADA'}</h3>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Store size={32} />
                </div>
              </button>

              <button 
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                className="w-full p-8 bg-black text-white rounded-[2.5rem] flex items-center justify-between shadow-xl shadow-black/20 transition-all active:scale-95"
              >
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Cardápio</p>
                  <h3 className="text-3xl font-black tracking-tighter">CRIAR LANCHE</h3>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Plus size={32} />
                </div>
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Produtos</p>
                <h3 className="text-2xl font-black">{products.length}</h3>
              </div>
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Categorias</p>
                <h3 className="text-2xl font-black">{categories.length}</h3>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black">Seus Lanches</h3>
                <button onClick={() => setActiveTab('products')} className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-all underline">Ver Todos</button>
              </div>
              <div className="space-y-4">
                {products.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-[1.5rem] border border-zinc-100">
                    <div className="flex items-center gap-4">
                      <img src={product.image} alt={product.name} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                      <div>
                        <p className="font-black text-sm">{product.name}</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{product.category}</p>
                        <p className="text-sm font-black mt-1">R$ {product.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleProductAvailability(product)}
                        className={`p-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${product.isAvailable ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
                      >
                        {product.isAvailable ? 'EM ESTOQUE' : 'ESGOTADO'}
                      </button>
                      <button 
                        onClick={() => {
                          setEditingProduct(product);
                          setIsProductModalOpen(true);
                        }}
                        className="p-4 bg-white border border-zinc-200 rounded-xl text-zinc-400 hover:text-black transition-all"
                      >
                        <Settings size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


        {activeTab === 'products' && (
          <div className="bg-white rounded-[2.5rem] border border-zinc-100 overflow-hidden">
            <div className="p-8 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-black">Gerenciar Produtos</h3>
                <p className="text-zinc-500 text-sm">Adicione, edite ou remova itens do seu cardápio</p>
              </div>
              <button 
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                className="w-full md:w-auto bg-black text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-black/10 active:scale-95 transition-all"
              >
                <Plus size={16} /> Novo Produto
              </button>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
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
                          <img src={product.image} className="w-12 h-12 rounded-xl object-cover" />
                          <span className="font-bold text-zinc-900">{product.name}</span>
                        </div>
                      </td>
                      <td className="p-6 text-zinc-500 text-sm">{product.category}</td>
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-900">R$ {product.price.toFixed(2)}</span>
                          {product.originalPrice && (
                            <span className="text-[10px] text-zinc-400 line-through">R$ {product.originalPrice.toFixed(2)}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => toggleProductAvailability(product)}
                            className={`p-2 rounded-lg transition-all ${product.isAvailable ? 'text-green-500 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}
                            title={product.isAvailable ? 'Marcar como Esgotado' : 'Marcar como Disponível'}
                          >
                            {product.isAvailable ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                          </button>
                          <button 
                            onClick={() => {
                              setEditingProduct(product);
                              setIsProductModalOpen(true);
                            }}
                            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-900 transition-all"
                          >
                            <Settings size={16} />
                          </button>
                          <button 
                            onClick={() => deleteProduct(product.id)}
                            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="md:hidden divide-y divide-zinc-100">
              {products.map(product => (
                <div key={product.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={product.image} className="w-14 h-14 rounded-2xl object-cover" />
                    <div>
                      <p className="font-black text-sm">{product.name}</p>
                      <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{product.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm font-black">R$ {product.price.toFixed(2)}</p>
                        {product.originalPrice && (
                          <p className="text-[10px] text-zinc-400 line-through">R$ {product.originalPrice.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => toggleProductAvailability(product)}
                      className={`p-3 rounded-xl transition-all ${product.isAvailable ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}
                    >
                      {product.isAvailable ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    </button>
                    <button 
                      onClick={() => {
                        setEditingProduct(product);
                        setIsProductModalOpen(true);
                      }}
                      className="p-3 bg-zinc-50 text-zinc-400 rounded-xl"
                    >
                      <Settings size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="bg-white rounded-[2.5rem] border border-zinc-100 overflow-hidden">
            <div className="p-8 border-b border-zinc-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black">Categorias</h3>
                <p className="text-zinc-500 text-sm">Organize seu cardápio por grupos</p>
              </div>
              <button 
                onClick={async () => {
                  const name = prompt('Nome da nova categoria:');
                  if (name) {
                    const id = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
                    const { data, error } = await supabase.from('categories').insert([{ id, name, icon: 'LayoutGrid' }]).select().single();
                    if (!error && data) setCategories([...categories, data]);
                  }
                }}
                className="bg-black text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-black/10 active:scale-95 transition-all"
              >
                <Plus size={16} /> Nova Categoria
              </button>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map(cat => (
                <div key={cat.id} className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <LayoutGrid size={20} className="text-black" />
                    </div>
                    <div>
                      <p className="font-black">{cat.name}</p>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Ativa</p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={async () => {
                        if (confirm(`Excluir categoria "${cat.name}"?`)) {
                          const { error } = await supabase.from('categories').delete().eq('id', cat.id);
                          if (!error) setCategories(categories.filter(c => c.id !== cat.id));
                        }
                      }}
                      className="p-2 text-red-400 hover:text-red-600 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'crm' && (
          <div className="space-y-8">
            <div className="bg-black text-white p-10 rounded-[3rem] relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-2">Recuperação de Clientes</p>
                <h2 className="text-3xl font-black tracking-tighter mb-4">Você tem 12 clientes sumidos! 😱</h2>
                <p className="text-zinc-400 max-w-md mb-8">Essa função (que era R$ 89,90) está liberada de graça para você hoje. Mande uma promoção agora.</p>
                <button className="bg-white text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">Recuperar Todos via Zap</button>
              </div>
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-zinc-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="p-6">Cliente</th>
                    <th className="p-6">Último Pedido</th>
                    <th className="p-6">Gasto Total</th>
                    <th className="p-6">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {[
                    { name: 'Maria Silva', last: '15 dias atrás', total: 'R$ 245,60', phone: '5586999991111' },
                    { name: 'João Paulo', last: '20 dias atrás', total: 'R$ 89,90', phone: '5586999992222' },
                    { name: 'Ana Costa', last: '12 dias atrás', total: 'R$ 156,00', phone: '5586999993333' }
                  ].map((cli, i) => (
                    <tr key={i} className="hover:bg-zinc-50 transition-colors">
                      <td className="p-6 font-black text-zinc-900">{cli.name}</td>
                      <td className="p-6 text-zinc-500 font-medium">{cli.last}</td>
                      <td className="p-6 font-black">{cli.total}</td>
                      <td className="p-6">
                        <button 
                          onClick={() => window.open(`https://wa.me/${cli.phone}?text=Oi ${cli.name}! Tudo bem? Faz tempo que não te vemos no Burger do Gordo. Use o cupom VOLTEI10 e ganhe 10% de desconto hoje!`, '_blank')}
                          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-500 hover:bg-green-50 p-3 rounded-xl transition-all"
                        >
                          <MessageCircle size={14} /> Recuperar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 overflow-hidden">
              <div className="p-8 border-b border-zinc-100">
                <h3 className="text-xl font-black">Configurações da Loja</h3>
                <p className="text-zinc-500 text-sm mt-1">Personalize a identidade do seu estabelecimento</p>
              </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data = {
                    name: formData.get('name') as string,
                    whatsapp: formData.get('whatsapp') as string,
                    logo: formData.get('logo') as string,
                    banner: formData.get('banner') as string,
                  };
                  try {
                    const { error } = await supabase.from('store_info').update(data).eq('id', storeInfo?.id);
                    if (!error) {
                      setStoreInfo({ ...storeInfo!, ...data });
                      alert('Configurações salvas com sucesso!');
                    }
                  } catch (err) {
                    console.error('Erro ao salvar settings:', err);
                  }
                }} className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Nome da Loja</label>
                      <input name="name" defaultValue={storeInfo?.name} className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm outline-none focus:ring-2 ring-black" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">WhatsApp de Pedidos</label>
                      <input name="whatsapp" defaultValue={storeInfo?.whatsapp} className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm outline-none focus:ring-2 ring-black" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">URL do Logotipo</label>
                      <div className="flex gap-4">
                        <input name="logo" defaultValue={storeInfo?.logo} className="flex-1 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm outline-none focus:ring-2 ring-black" />
                        <div className="w-14 h-14 bg-zinc-100 rounded-2xl overflow-hidden">
                          <img src={storeInfo?.logo} className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">URL do Banner</label>
                      <div className="flex gap-4">
                        <input name="banner" defaultValue={storeInfo?.banner} className="flex-1 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm outline-none focus:ring-2 ring-black" />
                        <div className="w-14 h-14 bg-zinc-100 rounded-2xl overflow-hidden">
                          <img src={storeInfo?.banner} className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button type="submit" className="bg-black text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-black/20 active:scale-95 transition-all">
                      Salvar Alterações
                    </button>
                  </div>
                </form>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-zinc-100 p-8 flex items-center justify-between">
              <div>
                <h3 className="font-black">Módulo de Cupons</h3>
                <p className="text-zinc-500 text-xs">Crie códigos de desconto para seus clientes</p>
              </div>
              <span className="px-4 py-2 bg-zinc-100 text-zinc-400 rounded-full text-[10px] font-black uppercase tracking-widest">Em Breve</span>
            </div>
          </div>
        )}
      </main>

      {/* Product Modal */}
      <AnimatePresence>
        {isProductModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl bg-white rounded-[2.5rem] p-10 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
                <button onClick={() => setIsProductModalOpen(false)} className="text-zinc-400 hover:text-black transition-all"><X size={24} /></button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  price: parseFloat(formData.get('price') as string),
                  originalPrice: formData.get('originalPrice') ? parseFloat(formData.get('originalPrice') as string) : null,
                  category: formData.get('category') as string,
                  image: formData.get('image') as string,
                  isAvailable: true
                };

                try {
                  if (editingProduct) {
                    const { error } = await supabase.from('products').update(data).eq('id', editingProduct.id);
                    if (!error) {
                      setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...data } : p));
                    }
                  } else {
                    const { data: newProd, error } = await supabase.from('products').insert([data]).select().single();
                    if (!error && newProd) {
                      setProducts([...products, newProd]);
                    }
                  }
                  setIsProductModalOpen(false);
                } catch (err) {
                  console.error('Erro ao salvar:', err);
                }
              }} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Nome do Produto</label>
                    <input name="name" defaultValue={editingProduct?.name} required className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm outline-none focus:ring-2 ring-black" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Categoria</label>
                    <select name="category" defaultValue={editingProduct?.category} required className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm outline-none focus:ring-2 ring-black">
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Descrição</label>
                  <textarea name="description" defaultValue={editingProduct?.description} rows={3} className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm outline-none focus:ring-2 ring-black resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Preço Atual (R$)</label>
                    <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm outline-none focus:ring-2 ring-black" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Preço Original (Opcional - R$)</label>
                    <input name="originalPrice" type="number" step="0.01" defaultValue={editingProduct?.originalPrice} className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm outline-none focus:ring-2 ring-black" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">URL da Imagem</label>
                  <div className="flex gap-4">
                    <input name="image" defaultValue={editingProduct?.image} required className="flex-1 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm outline-none focus:ring-2 ring-black" />
                    <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400">
                      <ImageIcon size={24} />
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full bg-black text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-black/20 active:scale-95 transition-all">
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 3. Master Panel (You)
const MasterPanel = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);

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
          <button 
            onClick={() => setIsMasterModalOpen(true)}
            className="bg-black text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-2xl shadow-black/20 hover:scale-105 transition-all active:scale-95"
          >
            <Plus size={20} /> Criar Nova Loja
          </button>
        </header>

        <AnimatePresence>
          {isMasterModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-lg bg-white rounded-[3rem] p-12 shadow-2xl relative"
              >
                <button onClick={() => setIsMasterModalOpen(false)} className="absolute top-8 right-8 text-zinc-400 hover:text-black transition-all">
                  <X size={24} />
                </button>
                <div className="mb-10">
                  <h2 className="text-3xl font-black tracking-tighter">Nova Loja 🏪</h2>
                  <p className="text-zinc-500 font-medium">Cadastre um novo cliente PediFácil</p>
                </div>
                
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const name = formData.get('storeName') as string;
                  const email = formData.get('email') as string;
                  const slug = name.toLowerCase().replace(/\s+/g, '-');
                  
                  const newStore = {
                    name,
                    slug,
                    location: 'Timon - MA',
                    whatsapp: '5586999999999',
                    status: 'Aberto',
                    opening_hours: 'Abrimos às 18h00',
                    logo: 'https://picsum.photos/seed/shop/200/200',
                    banner: 'https://picsum.photos/seed/banner/800/400'
                  };

                  const { error } = await supabase.from('store_info').insert([newStore]);
                  if (!error) {
                    setStores([...stores, { ...newStore, id: Math.random().toString() }]);
                    setIsMasterModalOpen(false);
                    alert(`Loja criada! Link: pedifacil.com/${slug}`);
                  }
                }} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Nome da Loja</label>
                    <input name="storeName" required placeholder="Ex: Hamburgueria do João" className="w-full p-5 bg-zinc-50 border border-zinc-100 rounded-3xl outline-none focus:ring-2 ring-black" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">E-mail do Dono</label>
                    <input name="email" type="email" required placeholder="dono@email.com" className="w-full p-5 bg-zinc-50 border border-zinc-100 rounded-3xl outline-none focus:ring-2 ring-black" />
                  </div>
                  <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 text-xs font-medium text-zinc-500">
                    Ao criar a loja, um acesso temporário será enviado ao e-mail informado e o status de pagamento será marcado como <b>Teste Grátis (7 dias)</b>.
                  </div>
                  <button type="submit" className="w-full bg-black text-white py-6 rounded-3xl font-black text-lg shadow-xl shadow-black/20 active:scale-95 transition-all">
                    Criar Loja e Gerar Link
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
                      <button 
                        onClick={() => toggleStoreBlock(store)}
                        className={`p-3 hover:bg-zinc-100 rounded-xl transition-all ${store.status === 'bloqueado' ? 'text-red-500 bg-red-50' : 'text-zinc-300'}`}
                      >
                        {store.status === 'bloqueado' ? <Lock size={18} /> : <CheckCircle2 size={18} />}
                      </button>
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

// 4. Landing Page (SaaS Home)
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      {/* Header */}
      <nav className="p-10 flex justify-between items-center max-w-7xl mx-auto">
        <h2 className="text-3xl font-black tracking-tighter">PediFácil</h2>
        <div className="flex gap-8 items-center">
          <Link to="/burger-do-gordo" className="text-sm font-bold hover:text-zinc-400 transition-colors">Exemplo</Link>
          <Link to="/admin" className="text-sm font-bold hover:text-zinc-400 transition-colors">Entrar</Link>
          <Link to="/calculator" className="text-xs font-black bg-white text-black px-4 py-2 rounded-lg hover:scale-105 transition-all">Calculadora Teste</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-40 px-10 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-zinc-900 border border-zinc-800 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-10 text-zinc-400"
        >
          A Revolução do Delivery Digital
        </motion.div>
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-8xl font-black tracking-tightest mb-8 leading-[0.9]"
        >
          SEU CARDÁPIO <br /> <span className="text-zinc-500">MUITO MAIS</span> ELITE.
        </motion.h1>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-zinc-500 text-lg md:text-xl max-w-2xl font-medium mb-12"
        >
          O sistema de pedidos via WhatsApp mais premium do Brasil. Design Black & White, animações de elite e zero taxas por pedido.
        </motion.p>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col md:flex-row gap-6 w-full max-w-md"
        >
          <button className="flex-1 bg-white text-black py-5 rounded-2xl font-black text-lg shadow-2xl shadow-white/10 active:scale-95 transition-all">Criar minha loja</button>
          <Link to="/burger-do-gordo" className="flex-1 bg-zinc-900 text-white py-5 rounded-2xl font-black text-lg border border-zinc-800 hover:bg-zinc-800 transition-all text-center">Ver exemplo</Link>
        </motion.div>
      </section>

      {/* Features bento grid */}
      <section className="bg-zinc-50 py-40 px-10 text-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[800px]">
            <div className="md:col-span-8 bg-white p-16 rounded-[4rem] border border-zinc-100 flex flex-col justify-end group overflow-hidden relative">
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <h3 className="text-5xl font-black tracking-tight mb-4 relative z-10">Pedidos direto no seu Zap.</h3>
              <p className="text-zinc-500 font-medium max-w-sm relative z-10">Receba pedidos formatados, calculados e prontos para a cozinha automaticamente.</p>
            </div>
            <div className="md:col-span-4 bg-black p-16 rounded-[4rem] flex flex-col justify-end text-white">
              <Gift size={48} className="mb-8" />
              <h3 className="text-3xl font-black mb-4 tracking-tighter">Recuperação de Clientes.</h3>
              <p className="text-zinc-500 text-sm font-medium">Reative clientes sumidos com cupons automáticos e aumente seu faturamento em 30%.</p>
            </div>
            <div className="md:col-span-4 bg-zinc-200 p-16 rounded-[4rem] flex flex-col justify-end relative overflow-hidden">
               <h3 className="text-3xl font-black mb-4 tracking-tighter italic">Design Black & White.</h3>
               <p className="text-zinc-600 text-sm font-medium">Fuja do genérico. Dê um ar de grife para a sua lanchonete ou barbearia.</p>
            </div>
            <div className="md:col-span-8 bg-white p-16 rounded-[4rem] border border-zinc-100 flex flex-col justify-end">
              <h3 className="text-5xl font-black tracking-tight mb-4 text-zinc-900">Zero taxas por pedido.</h3>
              <p className="text-zinc-500 font-medium max-w-md">Pare de dar 27% do seu lucro para aplicativos. Com o PediFácil, o lucro é 100% seu.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="p-20 text-center border-t border-zinc-900">
        <p className="text-zinc-500 font-black text-xs uppercase tracking-widest">© 2024 PediFácil SaaS • Pelo futuro do delivery</p>
      </footer>
    </div>
  );
};

// 5. Test Calculator page to demonstrate clean, aesthetic UI and flawless calculations
const Calculator = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const handleNum = (num: string) => {
    if (display === '0') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOp = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handlePercent = () => {
    const val = parseFloat(display) / 100;
    setDisplay(val.toString());
  };

  const handleToggleSign = () => {
    if (display.startsWith('-')) {
      setDisplay(display.slice(1));
    } else if (display !== '0') {
      setDisplay('-' + display);
    }
  };

  const handleEqual = () => {
    if (!equation) return;
    const parts = equation.split(' ');
    const num1 = parseFloat(parts[0]);
    const op = parts[1];
    const num2 = parseFloat(display);
    let res = 0;

    switch (op) {
      case '+': res = num1 + num2; break;
      case '-': res = num1 - num2; break;
      case '*': res = num1 * num2; break;
      case '/': res = num2 !== 0 ? num1 / num2 : 0; break;
      default: return;
    }

    const fullResult = `${equation}${display} = ${res}`;
    setHistory([fullResult, ...history].slice(0, 5));
    setDisplay(res.toString());
    setEquation('');
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25"></div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Navigation back and header banner */}
        <div className="flex justify-between items-center mb-6">
          <Link to="/" className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all flex items-center gap-2">
            ← Voltar para Home
          </Link>
          <span className="text-[10px] font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full text-zinc-400">
            Design Elite
          </span>
        </div>

        {/* Outer Premium Case */}
        <div className="bg-zinc-950 p-8 rounded-[3rem] border border-zinc-900 shadow-2xl relative">
          
          {/* History Log view */}
          <div className="h-16 text-right mb-4 flex flex-col justify-end text-zinc-600 text-xs font-mono select-none overflow-hidden space-y-1">
            {history.slice(0, 2).map((h, i) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className="opacity-60">
                {h}
              </motion.div>
            ))}
          </div>

          {/* Equation and main display screen */}
          <div className="text-right mb-8 select-all">
            <div className="text-zinc-500 text-sm font-mono h-6">{equation}</div>
            <h2 className="text-5xl font-black tracking-tight mt-1 overflow-x-auto whitespace-nowrap scrollbar-hide text-white">
              {display}
            </h2>
          </div>

          {/* Touch-optimized, fully responsive premium grid layout */}
          <div className="grid grid-cols-4 gap-3">
            {/* Row 1 */}
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleClear} className="h-16 rounded-[1.5rem] bg-zinc-900 text-zinc-300 font-extrabold text-lg hover:bg-zinc-800 transition-colors">
              AC
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleToggleSign} className="h-16 rounded-[1.5rem] bg-zinc-900 text-zinc-300 font-extrabold text-lg hover:bg-zinc-800 transition-colors">
              +/-
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handlePercent} className="h-16 rounded-[1.5rem] bg-zinc-900 text-zinc-300 font-extrabold text-lg hover:bg-zinc-800 transition-colors">
              %
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleOp('/')} className="h-16 rounded-[1.5rem] bg-white text-black font-extrabold text-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center">
              ÷
            </motion.button>

            {/* Row 2 */}
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleNum('7')} className="h-16 rounded-[1.5rem] bg-zinc-900 text-white font-extrabold text-lg hover:bg-zinc-800 transition-colors">
              7
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleNum('8')} className="h-16 rounded-[1.5rem] bg-zinc-900 text-white font-extrabold text-lg hover:bg-zinc-800 transition-colors">
              8
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleNum('9')} className="h-16 rounded-[1.5rem] bg-zinc-900 text-white font-extrabold text-lg hover:bg-zinc-800 transition-colors">
              9
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleOp('*')} className="h-16 rounded-[1.5rem] bg-white text-black font-extrabold text-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center">
              ×
            </motion.button>

            {/* Row 3 */}
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleNum('4')} className="h-16 rounded-[1.5rem] bg-zinc-900 text-white font-extrabold text-lg hover:bg-zinc-800 transition-colors">
              4
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleNum('5')} className="h-16 rounded-[1.5rem] bg-zinc-900 text-white font-extrabold text-lg hover:bg-zinc-800 transition-colors">
              5
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleNum('6')} className="h-16 rounded-[1.5rem] bg-zinc-900 text-white font-extrabold text-lg hover:bg-zinc-800 transition-colors">
              6
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleOp('-')} className="h-16 rounded-[1.5rem] bg-white text-black font-extrabold text-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center">
              -
            </motion.button>

            {/* Row 4 */}
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleNum('1')} className="h-16 rounded-[1.5rem] bg-zinc-900 text-white font-extrabold text-lg hover:bg-zinc-800 transition-colors">
              1
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleNum('2')} className="h-16 rounded-[1.5rem] bg-zinc-900 text-white font-extrabold text-lg hover:bg-zinc-800 transition-colors">
              2
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleNum('3')} className="h-16 rounded-[1.5rem] bg-zinc-900 text-white font-extrabold text-lg hover:bg-zinc-800 transition-colors">
              3
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleOp('+')} className="h-16 rounded-[1.5rem] bg-white text-black font-extrabold text-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center">
              +
            </motion.button>

            {/* Row 5 */}
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleNum('0')} className="col-span-2 h-16 rounded-[1.5rem] bg-zinc-900 text-white font-extrabold text-lg hover:bg-zinc-800 transition-colors px-8 text-left">
              0
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleNum('.')} className="h-16 rounded-[1.5rem] bg-zinc-900 text-white font-extrabold text-lg hover:bg-zinc-800 transition-colors flex items-center justify-center">
              .
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleEqual} className="h-16 rounded-[1.5rem] bg-white text-black font-black text-2xl hover:bg-zinc-100 transition-all flex items-center justify-center shadow-lg shadow-white/5 border border-zinc-200">
              =
            </motion.button>
          </div>
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

        {/* Calculator Test Route */}
        <Route path="/calculator" element={<Calculator />} />
        
        {/* Home Redirect or Landing Page */}
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}
