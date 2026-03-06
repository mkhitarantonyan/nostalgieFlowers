import React, { useState, useEffect } from 'react';
import logo from './assets/logo.png'
import { 
  ShoppingCart, 
  Menu,
  Instagram,
  Facebook,
  Mail,
  X, 
  Phone, 
  MapPin, 
  User, 
  ChevronRight, 
  CheckCircle2, 
  Package, 
  Clock, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  Save,
  Archive,
  ArchiveRestore,
  History,
  Lock,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem, Order, Settings } from './types';

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50, x: '-50%' }}
    animate={{ opacity: 1, y: 0, x: '-50%' }}
    exit={{ opacity: 0, y: 50, x: '-50%' }}
    className={`fixed bottom-8 left-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
      type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-red-500 border-red-400 text-white'
    }`}
  >
    {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="ml-4 hover:opacity-60 transition-opacity"><X className="w-4 h-4" /></button>
  </motion.div>
  );

const LoadingOverlay = () => (
  <div className="fixed inset-0 z-[60] bg-[#1B3022]/40 backdrop-blur-[2px] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-[#EAB308] border-t-transparent rounded-full animate-spin" />
  </div>
  );

const AdminLogin = ({ handleAdminLogin, adminPassword, setAdminPassword, navigate }: { 
  handleAdminLogin: (e: React.FormEvent) => void, 
  adminPassword: string, 
  setAdminPassword: (val: string) => void,
  navigate: (path: string) => void
}) => (
<div className="min-h-screen bg-[#1B3022] flex items-center justify-center px-4">
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white/5 p-10 rounded-[40px] border border-white/10 w-full max-w-md backdrop-blur-xl"
  >
    <div className="w-20 h-20 bg-[#EAB308] rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-[#EAB308]/20">
      <Lock className="w-10 h-10 text-[#1B3022]" />
    </div>
    <h2 className="text-3xl font-serif text-white text-center mb-2">Admin Access</h2>
    <p className="text-white/40 text-center mb-8 text-sm uppercase tracking-widest font-bold">Restricted Area</p>

    <form onSubmit={handleAdminLogin} className="space-y-6">
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 ml-4">Password</label>
        <input 
          type="password" 
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#EAB308] transition-all"
          placeholder="••••••••"
          required
        />
      </div>
      <button 
        type="submit"
        className="w-full bg-[#EAB308] text-[#1B3022] font-bold py-4 rounded-2xl hover:bg-white hover:text-[#1B3022] transition-all shadow-lg shadow-[#EAB308]/20"
      >
        Enter Console
      </button>
      <button 
        type="button"
        onClick={() => navigate('/')}
        className="w-full text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-all"
      >
        Back to Shop
      </button>
    </form>
  </motion.div>
</div>
);

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const navigate = (newPath: string) => {
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
      setPath(newPath);
      window.scrollTo(0, 0);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/check');
        const data = await res.json();
        setIsAdminAuthenticated(data.isAdmin);
      } catch (e) {
        console.error("Auth check failed", e);
      } finally {
        setIsAuthChecking(false);
      }
    };
    checkAuth();

    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

// Redirects
  useEffect(() => {
    if (isAuthChecking) return;

    const isAdminPath = path.startsWith('/admin');

    if (isAdminPath && !isAdminAuthenticated && path !== '/admin') {
      navigate('/admin');
    } else if (path === '/admin' && isAdminAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [path, isAdminAuthenticated, isAuthChecking]);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminTab, setAdminTab] = useState<'orders' | 'catalog' | 'settings'>('orders');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [orders, setOrders] = useState<Order[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings>({
    hero_title: 'NOSTALGIE FLOWERS',
    hero_subtitle: 'Where elegance becomes memory. Premium floral design in Los Angeles.',
    shop_name: 'Nostalgie Flowers',
    contact_phone: '+1 (213) 555-0199',
    contact_address: 'Los Angeles, CA',
    categories: ['Bouquets', 'Premium', 'Seasonal', 'Dried']
  });

// Form states
  const [formData, setFormData] = useState({ name: '', surname: '', phone: '', address: '' });
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ name: '', price: 0, image: '', description: '', category: 'Bouquets' });
  const [editSettings, setEditSettings] = useState<Settings>(settings);
  const [newAdminPassword, setNewAdminPassword] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, setRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/settings')
      ]);
      const prodData = await prodRes.json();
      const setData = await setRes.json();

// Parse categories if it's a string
      if (setData.categories && typeof setData.categories === 'string') {
        try {
          setData.categories = JSON.parse(setData.categories);
        } catch (e) {
          setData.categories = setData.categories.split(',').map((c: string) => c.trim());
        }
      } else if (!setData.categories) {
        setData.categories = ['Bouquets', 'Premium', 'Seasonal', 'Dried'];
      }

      setProducts(prodData);
      setSettings(setData);
      setEditSettings(setData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderStatus('loading');
    setIsLoading(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          items: cart, 
          totalPrice
        })
      });
      if (response.ok) {
        setOrderStatus('success');
        setCart([]);
        setFormData({ name: '', surname: '', phone: '', address: '' });
        showToast('Order placed successfully!');
        setTimeout(() => { setIsOrderModalOpen(false); setOrderStatus('idle'); }, 3000);
      } else {
        showToast('Failed to place order', 'error');
        setOrderStatus('idle');
      }
    } catch (error) {
      console.error(error);
      showToast('Network error', 'error');
      setOrderStatus('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error(error);
      showToast('Failed to load orders', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (id: number, status: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/orders/' + id + '/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        showToast(`Order status updated to ${status}`);
        fetchOrders();
      } else {
        showToast('Failed to update status', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Network error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const archiveOrder = async (id: number, is_archived: boolean) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived })
      });
      if (response.ok) {
        showToast(is_archived ? 'Order archived' : 'Order restored');
        fetchOrders();
      } else {
        showToast('Failed to archive order', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Network error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteOrder = async (id: number) => {
    if (!confirm('Are you sure you want to delete this order permanently?')) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        showToast('Order deleted permanently');
        fetchOrders();
      } else {
        showToast('Failed to delete order', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Network error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const archiveOldOrders = async () => {
    if (!confirm('Archive all orders older than 7 days?')) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/orders/archive-old', {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        showToast(`Archived ${data.count} orders`);
        fetchOrders();
      } else {
        showToast('Failed to archive old orders', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Network error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        showToast('Product added successfully');
        fetchData();
        setNewProduct({ name: '', price: 0, image: '', description: '', category: 'Bouquets' });
      } else {
        showToast('Failed to add product', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Network error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!id) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/products/${id}`, { 
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        showToast('Product deleted');
        setProductToDelete(null);
        await fetchData();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
        showToast(errorData.error || 'Failed to delete', 'error');
      }
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      showToast('Network error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword })
      });
      if (response.ok) {
        setIsAdminAuthenticated(true);
        showToast('Authenticated as Admin');
        navigate('/admin/dashboard');
      } else {
        showToast('Invalid password', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Network error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setIsAdminAuthenticated(false);
      setAdminPassword('');
      navigate('/');
      showToast('Logged out');
    } catch (e) {
      showToast('Logout failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      const settingsToSave = { ...editSettings };
// Stringify categories for storage
      if (Array.isArray(settingsToSave.categories)) {
        (settingsToSave as any).categories = JSON.stringify(settingsToSave.categories);
      }

// Handle password change
      if (newAdminPassword.trim()) {
        (settingsToSave as any).admin_password = newAdminPassword.trim();
      }

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsToSave })
      });
      if (res.ok) {
        setSettings(editSettings);
        setNewAdminPassword('');
        showToast('Settings saved successfully');
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Network error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (path.startsWith('/admin') && isAdminAuthenticated && adminTab === 'orders') {
      fetchOrders();
    }
  }, [path, isAdminAuthenticated, adminTab]);

  if (isAuthChecking) return <LoadingOverlay />;

  return (
    <div className="min-h-screen flex flex-col">
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
          {isLoading && <LoadingOverlay />}
        </AnimatePresence>
{/* Navigation */}
        <nav className="sticky top-0 z-40 bg-[#1B3022]/80 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div  className="cursor-pointer" onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}>
                <img src={logo} alt="logo" className="h-10 md:h-12 object-contain"/>
              </div>

{/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-8">
                <button onClick={() => { navigate('/'); setTimeout(() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-xs uppercase tracking-widest font-bold text-white hover:opacity-60 transition-opacity">Catalog</button>
                <button onClick={() => { navigate('/'); setTimeout(() => document.getElementById('weddings')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-xs uppercase tracking-widest font-bold text-white hover:opacity-60 transition-opacity">Weddings</button>
                <button onClick={() => { navigate('/'); setTimeout(() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-xs uppercase tracking-widest font-bold text-white hover:opacity-60 transition-opacity">About</button>
                <button onClick={() => { navigate('/'); setTimeout(() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-xs uppercase tracking-widest font-bold text-white hover:opacity-60 transition-opacity">Contact</button>
                <div className="h-4 w-[1px] bg-white/10 mx-2" />
                {path.startsWith('/admin') && (
                  <button 
                    onClick={() => navigate('/')}
                    className="text-xs uppercase tracking-widest font-bold text-white hover:opacity-60 transition-opacity"
                  >
                    Back to Shop
                  </button>
                  )}

                {!path.startsWith('/admin') && (
                  <button 
                    onClick={() => setIsCartOpen(true)}
                    className="relative p-2 text-white hover:bg-white/5 rounded-full transition-all"
                  >
                    <ShoppingCart className="w-6 h-6" />
                    {cart.length > 0 && (
                      <span className="absolute top-0 right-0 bg-[#EAB308] text-[#1B3022] text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#1B3022]">
                        {cart.reduce((a, b) => a + b.quantity, 0)}
                      </span>
                      )}
                  </button>
                  )}
              </div>

{/* Mobile Menu Toggle */}
              <div className="md:hidden flex items-center gap-4">
                {!path.startsWith('/admin') && (
                  <button 
                    onClick={() => setIsCartOpen(true)}
                    className="relative p-2 text-white"
                  >
                    <ShoppingCart className="w-6 h-6" />
                    {cart.length > 0 && (
                      <span className="absolute top-0 right-0 bg-[#EAB308] text-[#1B3022] text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#1B3022]">
                        {cart.reduce((a, b) => a + b.quantity, 0)}
                      </span>
                      )}
                  </button>
                  )}
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-white">
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>

{/* Mobile Menu Content */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden bg-[#1B3022] border-t border-white/5 overflow-hidden"
              >
                <div className="px-4 py-8 space-y-6 flex flex-col items-center text-center">
                  <button onClick={() => { navigate('/'); setIsMobileMenuOpen(false); setTimeout(() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-sm uppercase tracking-widest font-bold text-white">Catalog</button>
                  <button onClick={() => { navigate('/'); setIsMobileMenuOpen(false); setTimeout(() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-sm uppercase tracking-widest font-bold text-white">About</button>
                  <button onClick={() => { navigate('/'); setIsMobileMenuOpen(false); setTimeout(() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-sm uppercase tracking-widest font-bold text-white">Contact</button>
                  <div className="h-[1px] w-12 bg-white/10" />
                  {path.startsWith('/admin') && (
                    <button 
                      onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}
                      className="text-sm uppercase tracking-widest font-bold text-white"
                    >
                      Back to Shop
                    </button>
                    )}
                </div>
              </motion.div>
              )}
          </AnimatePresence>
        </nav>

        <main className="flex-grow">
          {!path.startsWith('/admin') ? (
            <>
{/* Hero Section */}
            <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 z-0">
                <img src="/hero.png" alt="Nostalgie Flowers Collection" className="w-full h-full object-cover brightness-[0.7]"/>
              </div>
              <div className="relative z-10 text-center px-4">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-6xl md:text-8xl font-serif text-white mb-6 drop-shadow-2xl tracking-tight"
                >
                  {settings.hero_title}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-10 font-light italic"
                >
                  {settings.hero_subtitle}
                </motion.p>
                <motion.button 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-[#EAB308] text-[#1B3022] px-10 py-5 rounded-full font-bold hover:bg-white transition-all shadow-2xl uppercase tracking-widest text-sm"
                >
                  Shop the Collection
                </motion.button>
              </div>
            </section>
{/* Catalog */}
            <section id="catalog" className="max-w-7xl mx-auto px-4 py-24">
              <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 gap-8">
                <div className="text-center md:text-left">
                  <h2 className="text-4xl md:text-5xl font-serif text-white mb-2 uppercase tracking-tight">Our Collection</h2>
                  <p className="text-white/70 italic">Hand-picked, fresh, and vibrant in Los Angeles</p>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {['All', ...settings.categories].map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setActiveCategory(cat)}
                      className={`text-[10px] uppercase tracking-widest font-bold px-6 py-3 rounded-full border transition-all ${
                        activeCategory === cat 
                        ? 'bg-[#EAB308] text-[#1B3022] border-[#EAB308] shadow-lg' 
                        : 'bg-transparent text-white border-white/20 hover:border-white/40'
                      }`}
                    >
                      {cat}
                    </button>
                    ))}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                {products
                .filter(p => activeCategory === 'All' || p.category === activeCategory)
                .map((product) => (
                  <motion.div 
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] mb-4 shadow-sm group-hover:shadow-xl transition-all duration-500">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-pointer"
                        referrerPolicy="no-referrer"
                        onClick={() => setSelectedProduct(product)}
                      />
                      <div className="absolute inset-0 bg-[#1B3022]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <div className="flex flex-col gap-2 pointer-events-auto">
                          <button 
                            onClick={() => addToCart(product)}
                            className="bg-[#EAB308] text-[#1B3022] px-6 py-2.5 rounded-full font-bold uppercase tracking-widest text-[10px] transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:bg-white"
                          >
                            Add to Cart
                          </button>
                          <button 
                            onClick={() => setSelectedProduct(product)}
                            className="bg-white/20 backdrop-blur-md text-white border border-white/30 px-6 py-2.5 rounded-full font-bold uppercase tracking-widest text-[10px] transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-75 hover:bg-white hover:text-[#1B3022]"
                          >
                            Quick View
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="px-1">
                      <h3 className="text-lg font-serif text-white mb-0.5 truncate">{product.name}</h3>
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-white/40">{product.category}</p>
                        <span className="text-sm font-serif text-white">{product.price} $</span>
                      </div>
                    </div>
                  </motion.div>
                  ))}
              </div>
            </section>
{/* Weddings & Events Section */}
            <section id="weddings" className="py-24 overflow-hidden relative">
              <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  
                  {/* Текстовая часть */}
                  <div className="space-y-8 z-10">
                    <div className="inline-block px-4 py-1 bg-white/5 border border-white/10 text-[#EAB308] text-[10px] font-bold uppercase tracking-[0.3em] rounded-full">
                      Special Events
                    </div>
                    <h2 className="text-5xl md:text-6xl font-serif text-white leading-tight">
                      Your Perfect Day, <br/>
                      <span className="text-[#EAB308] italic">In Full Bloom</span>
                    </h2>
                    <p className="text-lg text-white/70 leading-relaxed font-light">
                      From intimate gatherings to grand celebrations, our wedding floral design service is tailored to bring your unique vision to life. We handle everything from bridal bouquets to breathtaking venue installations across Los Angeles.
                    </p>
                    <button 
                      onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                      className="bg-transparent border border-[#EAB308] text-[#EAB308] px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-[#EAB308] hover:text-[#1B3022] transition-all"
                    >
                      Book a Consultation
                    </button>
                  </div>
                  <div className="relative z-10">
                    <div className="grid grid-cols-2 gap-4 md:gap-6">
                      {/* Левая колонка фото (сдвинута вниз) */}
                      <div className="space-y-4 md:space-y-6 translate-y-8 md:translate-y-12">
                        <div className="aspect-[4/5] rounded-[32px] overflow-hidden bg-white/5 border border-white/10 shadow-2xl">
                          <img src="/wedding-1.png" alt="Wedding Bouquet" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                        </div>
                        <div className="aspect-square rounded-[32px] overflow-hidden bg-white/5 border border-white/10 shadow-2xl">
                          <img src="/wedding-2.png" alt="Table Arrangement" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                        </div>
                      </div>
                      <div className="space-y-4 md:space-y-6 -translate-y-8 md:-translate-y-12">
                        <div className="aspect-square rounded-[32px] overflow-hidden bg-white/5 border border-white/10 shadow-2xl">
                          <img src="/wedding-3.png" alt="Wedding Arch" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                        </div>
                        <div className="aspect-[4/5] rounded-[32px] overflow-hidden bg-white/5 border border-white/10 shadow-2xl">
                          <img src="/wedding-4.png" alt="Bridal Detail" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#EAB308]/10 blur-[120px] -z-10 rounded-full pointer-events-none" />
                  </div>
                </div>
              </div>
            </section>
{/* About Section */}
            <section id="about" className="bg-white/5 py-24 overflow-hidden">
              <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div className="relative">
                    <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl">
                      <img  src="/about.jpg" alt="Our Florist"  className="w-full h-full object-cover"/>
                    </div>
                    <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-[#1B3022] border border-white/10 rounded-[32px] p-6 shadow-xl hidden md:flex flex-col justify-center items-center text-center">
                      <img src="/flower.png" alt="flower" className="w-12 h-12 mb-3"/>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white">Est. 2026</p>
                      <p className="text-xs font-serif text-white/60">Los Angeles</p>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="inline-block px-4 py-1 bg-[#EAB308] text-[#1B3022] text-[10px] font-bold uppercase tracking-[0.3em] rounded-full">Our Story</div>
                    <h2 className="text-5xl md:text-6xl font-serif text-white leading-tight">Crafting Memories Through Flowers</h2>
                    <p className="text-lg text-white/70 leading-relaxed font-light italic">
                      "At Nostalgie Flowers, we believe every bouquet tells a story. Our studio in the heart of Los Angeles is dedicated to the art of floral storytelling, blending classic elegance with modern design."
                    </p>
                    <div className="grid grid-cols-2 gap-8 pt-4">
                      <div>
                        <h4 className="text-2xl font-serif text-white mb-2">Fresh Daily</h4>
                        <p className="text-sm text-white/60">Sourced from the finest local growers every morning.</p>
                      </div>
                      <div>
                        <h4 className="text-2xl font-serif text-white mb-2">Artisan Design</h4>
                        <p className="text-sm text-white/60">Each arrangement is a unique piece of floral art.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

{/* Contact Info Section */}
            <section id="contact" className="py-24 max-w-7xl mx-auto px-4">
              <div className="bg-[#1B3022] rounded-[40px] p-12 md:p-20 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <h2 className="text-4xl md:text-5xl font-serif mb-6">Visit Our Studio</h2>
                    <p className="text-white/60 mb-10 font-light max-w-md">Experience the fragrance and beauty of our collection in person. We're open daily for consultations and walk-ins.</p>
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"><Phone className="w-5 h-5" /></div>
                        <span className="text-lg font-light">{settings.contact_phone}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"><MapPin className="w-5 h-5" /></div>
                        <span className="text-lg font-light">{settings.contact_address}</span>
                      </div>
                    </div>
                  </div>
                  <div className="aspect-video rounded-3xl overflow-hidden bg-white/10">
                    <img src="/contact.png" alt="Studio"  className="w-full h-full object-cover opacity-80"/>
                  </div>
                </div>
              </div>
            </section>
            </>
            ) : !isAdminAuthenticated ? (
            <AdminLogin 
              handleAdminLogin={handleAdminLogin}
              adminPassword={adminPassword}
              setAdminPassword={setAdminPassword}
              navigate={navigate}
              />
              ) : (
/* Admin Dashboard */
              <section className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                      <img src="/flower.png"  alt="flower" className="w-10 h-10 object-contain"/>
                    </div>
                    <div>
                      <h2 className="text-3xl font-serif text-white">Management Console</h2>
                      <p className="text-xs text-white/40 uppercase tracking-[0.3em] font-bold">Nostalgie Flowers Studio</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleLogout}
                      className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-all border border-white/10"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                      <button 
                        onClick={() => setAdminTab('orders')}
                        className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${adminTab === 'orders' ? 'bg-[#EAB308] text-[#1B3022] shadow-md' : 'text-white/60 hover:text-white'}`}
                      >
                        Orders
                      </button>
                      <button 
                        onClick={() => setAdminTab('catalog')}
                        className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${adminTab === 'catalog' ? 'bg-[#EAB308] text-[#1B3022] shadow-md' : 'text-white/60 hover:text-white'}`}
                      >
                        Catalog
                      </button>
                      <button 
                        onClick={() => setAdminTab('settings')}
                        className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${adminTab === 'settings' ? 'bg-[#EAB308] text-[#1B3022] shadow-md' : 'text-white/60 hover:text-white'}`}
                      >
                        Settings
                      </button>
                    </div>
                  </div>
                </div>
                {adminTab === 'orders' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        <button onClick={() => setShowArchived(false)} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${!showArchived ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
                          Active
                        </button>
                        <button onClick={() => setShowArchived(true)} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${showArchived ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
                          Archived
                        </button>
                      </div>
                      {!showArchived && (
                        <button onClick={archiveOldOrders} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#EAB308] hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl border border-[#EAB308]/20">
                          <History className="w-3 h-3" /> Archive Weekly Orders
                        </button>
                        )}
                    </div>

                    {orders.filter(o => !!o.is_archived === showArchived).length === 0 ? (
                      <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/20">
                        <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <p className="text-white/60">{showArchived ? 'No archived orders.' : 'No active orders found yet.'}</p>
                      </div>
                      ) : (
                      orders.filter(o => !!o.is_archived === showArchived).map((order) => (
                        <div key={order.id} className="bg-white/5 rounded-3xl p-8 border border-white/10 shadow-sm relative group">
                          <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => archiveOrder(order.id, !order.is_archived)}
                              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/60 hover:text-white transition-all"
                              title={order.is_archived ? "Restore Order" : "Archive Order"}
                            >
                              {order.is_archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => deleteOrder(order.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500 rounded-lg text-red-400 hover:text-white transition-all"
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex flex-col lg:flex-row justify-between gap-8">
                            <div className="flex-grow">
                              <div className="flex items-center gap-4 mb-4">
                                <span className="text-xs font-bold uppercase tracking-widest text-white/40">Order #{order.id}</span>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                  order.status === 'pending' ? 'bg-amber-100/10 text-amber-400 border border-amber-400/20' : 
                                  order.status === 'confirmed' ? 'bg-blue-100/10 text-blue-400 border border-blue-400/20' : 
                                  'bg-emerald-100/10 text-emerald-400 border border-emerald-400/20'
                                }`}>
                                {order.status}
                              </span>
                            </div>
                            <h3 className="text-2xl font-serif mb-4 text-white">{order.customer_name} {order.customer_surname}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                              <div className="flex items-center gap-3 text-white/70"><Phone className="w-4 h-4 opacity-50" /><span className="text-sm">{order.phone}</span></div>
                              <div className="flex items-center gap-3 text-white/70"><MapPin className="w-4 h-4 opacity-50" /><span className="text-sm">{order.address}</span></div>
                              <div className="flex items-center gap-3 text-white/70"><Clock className="w-4 h-4 opacity-50" /><span className="text-sm">{new Date(order.created_at).toLocaleString()}</span></div>
                            </div>
                            <div className="border-t border-white/10 pt-6">
                              <h4 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Items</h4>
                              <div className="space-y-2">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-sm text-white/80">
                                    <span>{item.name} x {item.quantity}</span>
                                    <span className="font-medium">{item.price * item.quantity} $</span>
                                  </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                          <div className="lg:w-64 flex flex-col justify-between">
                            <div className="text-right mb-8">
                              <p className="text-sm text-white/60 mb-1">Total Amount</p>
                              <p className="text-3xl font-serif text-white">{order.total_price} $</p>
                            </div>
                            <div className="space-y-2">
                              {order.status === 'pending' && (
                                <button onClick={() => updateOrderStatus(order.id, 'confirmed')} className="w-full bg-[#EAB308] text-[#1B3022] py-3 rounded-xl font-bold hover:bg-white transition-all">Confirm Order</button>
                                )}
                              {order.status === 'confirmed' && (
                                <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-400 transition-all">Mark as Delivered</button>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                      ))
)}
</div>
)}

{adminTab === 'catalog' && (
  <div className="space-y-12">
    <div className="bg-white/5 rounded-3xl p-8 border border-white/10 shadow-sm">
      <h3 className="text-2xl font-serif mb-6 flex items-center gap-2 text-white"><Plus className="w-6 h-6" /> Add New Product</h3>
      <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <input required placeholder="Product Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="bg-transparent border-b border-white/20 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-[#EAB308]" />
        <input required type="number" placeholder="Price ($)" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="bg-transparent border-b border-white/20 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-[#EAB308]" />
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Product Image</label>
          <input required type="file" accept="image/*" onChange={handleFileChange} className="w-full text-xs text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20" />
          {newProduct.image && <img src={newProduct.image} className="mt-2 w-20 h-20 object-cover rounded-xl border border-white/10" />}
          </div>
          <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="bg-transparent border-b border-white/20 py-2 text-white focus:outline-none focus:border-[#EAB308]">
            {settings.categories.map(cat => (
              <option key={cat} className="bg-[#1B3022]" value={cat}>{cat}</option>
              ))}
          </select>
          <textarea placeholder="Description" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="md:col-span-2 bg-transparent border-b border-white/20 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-[#EAB308] resize-none" />
            <button type="submit" className="md:col-span-2 bg-[#EAB308] text-[#1B3022] py-4 rounded-xl font-bold hover:bg-white transition-all">Add to Catalog</button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white/5 rounded-3xl p-6 border border-white/10 flex gap-4">
              <img src={product.image} className="w-20 h-20 object-cover rounded-xl border border-white/10" />
              <div className="flex-grow">
                <h4 className="font-serif text-lg text-white">{product.name}</h4>
                <p className="text-sm text-white/60 mb-2">{product.price} $</p>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setProductToDelete(product.id);
                  }} 
                  className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all flex items-center justify-center group/del"
                  title="Delete Product"
                >
                  <Trash2 className="w-5 h-5 group-hover/del:scale-110 transition-transform" />
                </button>
              </div>
            </div>
            ))}
        </div>
      </div>
      )}

{adminTab === 'settings' && (
  <div className="bg-white/5 rounded-3xl p-8 border border-white/10 shadow-sm max-w-2xl mx-auto">
    <h3 className="text-2xl font-serif mb-8 flex items-center gap-2 text-white"><Edit3 className="w-6 h-6" /> Site Settings</h3>
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-white/40">Shop Name</label>
        <input value={editSettings.shop_name} onChange={e => setEditSettings({...editSettings, shop_name: e.target.value})} className="w-full bg-transparent border-b border-white/20 py-2 text-white focus:outline-none focus:border-[#EAB308]" />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-white/40">Hero Title</label>
        <input value={editSettings.hero_title} onChange={e => setEditSettings({...editSettings, hero_title: e.target.value})} className="w-full bg-transparent border-b border-white/20 py-2 text-white focus:outline-none focus:border-[#EAB308]" />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-white/40">Hero Subtitle</label>
        <textarea rows={2} value={editSettings.hero_subtitle} onChange={e => setEditSettings({...editSettings, hero_subtitle: e.target.value})} className="w-full bg-transparent border-b border-white/20 py-2 text-white focus:outline-none focus:border-[#EAB308] resize-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-white/40">Contact Phone</label>
          <input value={editSettings.contact_phone} onChange={e => setEditSettings({...editSettings, contact_phone: e.target.value})} className="w-full bg-transparent border-b border-white/20 py-2 text-white focus:outline-none focus:border-[#EAB308]" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-white/40">Contact Address</label>
          <input value={editSettings.contact_address} onChange={e => setEditSettings({...editSettings, contact_address: e.target.value})} className="w-full bg-transparent border-b border-white/20 py-2 text-white focus:outline-none focus:border-[#EAB308]" />
        </div>

        <div className="space-y-4 pt-4 border-t border-white/10">
          <label className="text-xs font-bold uppercase tracking-widest text-white/40">Product Categories</label>
          <div className="flex flex-wrap gap-2">
            {editSettings.categories.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                <span className="text-sm text-white">{cat}</span>
                <button 
                  onClick={() => {
                    const newCats = editSettings.categories.filter((_, i) => i !== idx);
                    setEditSettings({...editSettings, categories: newCats});
                  }}
                  className="text-white/40 hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              ))}
          </div>
          <div className="flex gap-2">
            <input 
              id="new-category-input"
              placeholder="New Category" 
              className="flex-grow bg-transparent border-b border-white/20 py-2 text-white focus:outline-none focus:border-[#EAB308]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const input = e.currentTarget;
                  const val = input.value.trim();
                  if (val && !editSettings.categories.includes(val)) {
                    setEditSettings({...editSettings, categories: [...editSettings.categories, val]});
                    input.value = '';
                  }
                }
              }}
            />
            <button 
              onClick={() => {
                const input = document.getElementById('new-category-input') as HTMLInputElement;
                const val = input.value.trim();
                if (val && !editSettings.categories.includes(val)) {
                  setEditSettings({...editSettings, categories: [...editSettings.categories, val]});
                  input.value = '';
                }
              }}
              className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/10">
          <label className="text-xs font-bold uppercase tracking-widest text-white/40">Security</label>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">Change Admin Password</label>
            <input 
              type="password"
              placeholder="New Password (leave blank to keep current)"
              value={newAdminPassword}
              onChange={e => setNewAdminPassword(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 py-2 text-white focus:outline-none focus:border-[#EAB308]"
            />
          </div>
        </div>

        <button onClick={handleSaveSettings} className="w-full bg-[#EAB308] text-[#1B3022] py-4 rounded-xl font-bold hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg">
          <Save className="w-5 h-5" /> Save All Changes
        </button>
      </div>
    </div>
    )}
</section>
)}
</main>

{/* Footer */}
<footer className="bg-[#1B3022] text-white py-24">
  <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-16">
    <div>
      <div className="mb-8">
        <img src={logo} alt="logo" className="h-16 object-contain"/>
      </div>
      <p className="text-white/60 font-light italic leading-relaxed">Where elegance becomes memory. Bringing the finest floral designs to Los Angeles since 2026.</p>
    </div>
    <div>
      <h4 className="font-serif text-2xl mb-8">Visit Our Studio</h4>
      <ul className="space-y-6 text-white/70 font-light">
        <li className="flex items-center gap-4"><Phone className="w-5 h-5 text-white/40" /> {settings.contact_phone}</li>
        <li className="flex items-center gap-4"><MapPin className="w-5 h-5 text-white/40" /> {settings.contact_address}</li>
      </ul>
    </div>
    <div>
      <h4 className="font-serif text-2xl mb-8">Follow Us</h4>
      <p className="text-white/60 font-light mb-6">
        Follow Nostalgie Flowers on social media for new collections and inspiration.
      </p>
      <div className="flex gap-4">
        <a href="https://www.instagram.com/nostalgieflowers/" className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-full hover:bg-[#EAB308] hover:text-[#1B3022] transition-all"><Instagram className="w-5 h-5" /></a>
        <a href="#" className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-full hover:bg-[#EAB308] hover:text-[#1B3022] transition-all"><Facebook className="w-5 h-5" /></a>
        <a href="#" className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-full hover:bg-[#EAB308] hover:text-[#1B3022] transition-all text-xs font-bold">Yelp</a>
        <a href="https://mail.google.com/mail/u/0/#inbox?compose=GTvVlcSBmXGGVLrpPkrDZjlSLCBZdSqQWKQXWbVXlftqqClPnJCZcMvLBhZhGFjmtZJkQMXXbpksx" target="_blank" rel="noreferrer" className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-full hover:bg-[#EAB308] hover:text-[#1B3022] transition-all"><Mail className="w-5 h-5" /></a>
      </div>
    </div>
  </div>
  <div className="max-w-7xl mx-auto px-4 mt-24 pt-10 border-t border-white/5 text-center text-white/30 text-[10px] font-bold tracking-[0.3em] uppercase">
    © 2026 {settings.shop_name}. All rights reserved.
  </div>
</footer>

{/* Cart Drawer */}
<AnimatePresence>
  {isCartOpen && (
    <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#1B3022] z-50 shadow-2xl flex flex-col border-l border-white/10">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-2xl font-serif text-white">Your Cart</h2>
          <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-all"><X className="w-6 h-6 text-white" /></button>
        </div>
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/20"><ShoppingCart className="w-12 h-12 mb-4 opacity-20" /><p className="italic">Your cart is empty</p></div>
            ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-4">
                <img src={item.image} alt={item.name} className="w-20 h-24 object-cover rounded-2xl border border-white/10" />
                <div className="flex-grow">
                  <h4 className="font-serif text-lg text-white">{item.name}</h4>
                  <p className="text-[#EAB308] font-medium mb-2">{item.price} $</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white/5">-</button>
                    <span className="text-sm font-medium text-white">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white/5">+</button>
                    <button onClick={() => removeFromCart(item.id)} className="ml-auto text-xs text-red-400 hover:underline">Remove</button>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
          {cart.length > 0 && (
            <div className="p-6 border-t border-white/10 bg-white/5">
              <div className="flex justify-between items-end mb-6"><span className="text-white/60 italic">Total</span><span className="text-3xl font-serif text-white">{totalPrice} $</span></div>
              <button onClick={() => { setIsCartOpen(false); setIsOrderModalOpen(true); }} className="w-full bg-[#EAB308] text-[#1B3022] py-4 rounded-full font-bold hover:bg-white transition-all shadow-lg">Checkout</button>
            </div>
            )}
        </motion.div>
        </>
        )}
</AnimatePresence>

{/* Order Modal */}
<AnimatePresence>
  {isOrderModalOpen && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => orderStatus !== 'loading' && setIsOrderModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-2xl bg-[#1B3022] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl">
          {orderStatus === 'success' ? (
            <div className="p-12 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-400/20"><CheckCircle2 className="w-10 h-10" /></motion.div>
              <h2 className="text-4xl font-serif mb-4 text-white">Thank You!</h2>
              <p className="text-white/70 italic mb-8">Your order has been placed. Our florist will contact you shortly to confirm the details.</p>
              <button onClick={() => setIsOrderModalOpen(false)} className="bg-[#EAB308] text-[#1B3022] px-8 py-3 rounded-full font-bold">Close</button>
            </div>
            ) : (
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 bg-white/5 p-8 text-white border-r border-white/10">
                <h2 className="text-3xl font-serif mb-6">Complete Your Order</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4"><ShieldCheck className="w-5 h-5 text-[#EAB308] mt-1" /><p className="text-sm font-light text-white/80">Secure checkout and personal data protection.</p></div>
                  <div className="flex items-start gap-4"><Clock className="w-5 h-5 text-[#EAB308] mt-1" /><p className="text-sm font-light text-white/80">Delivery within 2-4 hours after confirmation.</p></div>
                </div>
                <div className="mt-12 pt-8 border-t border-white/10"><p className="text-xs uppercase tracking-widest text-white/40 mb-2">Total to pay</p><p className="text-3xl font-serif text-[#EAB308]">{totalPrice} $</p></div>
              </div>
              <div className="md:w-2/3 p-8 md:p-12">
                <form onSubmit={handleSubmitOrder} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-widest text-white/40">First Name</label><input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-transparent border-b border-white/20 py-2 text-white focus:outline-none focus:border-[#EAB308] transition-colors" /></div>
                    <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-widest text-white/40">Last Name</label><input required type="text" value={formData.surname} onChange={(e) => setFormData({...formData, surname: e.target.value})} className="w-full bg-transparent border-b border-white/20 py-2 text-white focus:outline-none focus:border-[#EAB308] transition-colors" /></div>
                  </div>
                  <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-widest text-white/40">Phone Number</label><input required type="tel" placeholder="+7 (___) ___-__-__" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-transparent border-b border-white/20 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-[#EAB308] transition-colors" /></div>
                  <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-widest text-white/40">Delivery Address</label><textarea required rows={2} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-transparent border-b border-white/20 py-2 text-white focus:outline-none focus:border-[#EAB308] transition-colors resize-none" /></div>
                    <button disabled={orderStatus === 'loading'} type="submit" className="w-full bg-[#EAB308] text-[#1B3022] py-4 rounded-full font-bold hover:bg-white transition-all shadow-lg disabled:opacity-50">{orderStatus === 'loading' ? 'Processing...' : 'Place Order'}</button>
                  </form>
                </div>
              </div>
              )}
          </motion.div>
        </div>
        )}
</AnimatePresence>

{/* Delete Confirmation Modal */}
<AnimatePresence>
  {productToDelete !== null && (
    <>
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      onClick={() => setProductToDelete(null)} 
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]" 
    />
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }} 
      animate={{ opacity: 1, scale: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 0.9, y: 20 }} 
      className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#1B3022] border border-white/10 z-[101] rounded-[2.5rem] p-8 shadow-2xl text-center"
    >
      <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
        <Trash2 className="w-10 h-10" />
      </div>
      <h3 className="text-2xl font-serif mb-2 text-white">Delete Product?</h3>
      <p className="text-white/60 mb-8 italic">This action cannot be undone. Are you sure you want to remove this item from your catalog?</p>
      <div className="flex flex-col gap-3">
        <button 
          onClick={() => handleDeleteProduct(productToDelete)}
          className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-red-600 transition-all shadow-lg shadow-red-900/20"
        >
          Yes, Delete
        </button>
        <button 
          onClick={() => setProductToDelete(null)}
          className="w-full bg-white/5 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-all border border-white/10"
        >
          Cancel
        </button>
      </div>
    </motion.div>
    </>
    )}
</AnimatePresence>

{/* Quick View Modal */}
<AnimatePresence>
  {selectedProduct && (
    <>
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      onClick={() => setSelectedProduct(null)} 
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]" 
    />
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }} 
      animate={{ opacity: 1, scale: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 0.9, y: 20 }} 
      className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-[#1B3022] border border-white/10 z-[101] rounded-[40px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
    >
      <div className="md:w-1/2 h-64 md:h-auto relative">
        <img 
          src={selectedProduct.image} 
          alt={selectedProduct.name} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <button onClick={() => setSelectedProduct(null)} className="absolute top-4 left-4 p-2 bg-black/20 backdrop-blur-md rounded-full text-white md:hidden"><X className="w-6 h-6" /></button>
      </div>
      <div className="md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto">
        <button onClick={() => setSelectedProduct(null)} className="self-end p-2 hover:bg-white/5 rounded-full transition-all hidden md:block"><X className="w-6 h-6 text-white" /></button>
        <div className="mt-4 md:mt-0">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#EAB308] mb-2 block">{selectedProduct.category}</span>
          <h2 className="text-4xl font-serif text-white mb-4">{selectedProduct.name}</h2>
          <p className="text-2xl font-serif text-[#EAB308] mb-8">{selectedProduct.price} $</p>
          <div className="h-[1px] w-full bg-white/10 mb-8" />
          <p className="text-white/70 leading-relaxed font-light italic mb-10">
            {selectedProduct.description || "A masterfully crafted arrangement designed to bring elegance and joy to any space. Hand-picked by our expert florists in Los Angeles."}
          </p>
          <div className="mt-auto space-y-4">
            <button 
              onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
              className="w-full bg-[#EAB308] text-[#1B3022] py-5 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white transition-all shadow-xl"
            >
              Add to Cart
            </button>
            <p className="text-[10px] text-center text-white/40 uppercase tracking-widest">Free delivery in Los Angeles area</p>
          </div>
        </div>
      </div>
    </motion.div>
    </>
    )}
</AnimatePresence>
</div>
);
}
