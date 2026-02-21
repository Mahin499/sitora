import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  Plus,
  Trash2,
  MessageCircle,
  Menu,
  X,
  ChevronRight,
  Globe,
  Package,
  ArrowRight,
  Settings,
  Upload,
  Image as ImageIcon,
  Edit2,
  List
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  origin: string;
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<{ type: 'terms' | 'privacy' | null }>({ type: null });
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    origin: 'China',
    password: ''
  });

  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    fetchData();
    // Check if already logged in (simple local storage check for demo)
    const savedAuth = localStorage.getItem('sitora_admin_auth');
    if (savedAuth === 'true') setIsAdmin(true);
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchProducts(), fetchCategories()]);
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
      if (data.length > 0 && !newProduct.category) {
        setNewProduct(prev => ({ ...prev, category: data[0].name }));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const pwd = prompt('Enter admin password to add category:');
    if (!pwd) return;
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, password: pwd }),
      });
      if (response.ok) {
        fetchCategories();
        setNewCategoryName('');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add category');
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    const pwd = prompt('Enter admin password to delete this category:');
    if (!pwd) return;
    if (!confirm('Are you sure? This will not delete products in this category, but they will become uncategorized in the UI.')) return;
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
      });
      if (response.ok) {
        fetchCategories();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword }),
      });
      const data = await response.json();
      if (data.success) {
        setIsAdmin(true);
        setIsLoginModalOpen(false);
        setLoginPassword('');
        localStorage.setItem('sitora_admin_auth', 'true');
      } else {
        setLoginError('Invalid password. Please try again.');
      }
    } catch (error) {
      setLoginError('An error occurred. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('sitora_admin_auth');
  };

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setNewProduct({ ...newProduct, image_url: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          price: parseInt(newProduct.price)
        }),
      });
      if (response.ok) {
        await fetchProducts();
        setIsAddModalOpen(false);
        setEditingProduct(null);
        setNewProduct({
          name: '',
          description: '',
          price: '',
          category: categories[0]?.name || '',
          image_url: '',
          origin: 'China',
          password: ''
        });
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      image_url: product.image_url,
      origin: product.origin,
      password: ''
    });
    setIsAddModalOpen(true);
  };

  const handleDeleteProduct = async (id: number) => {
    const pwd = prompt('Enter admin password to delete this product:');
    if (!pwd) return;
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
      });
      if (response.ok) {
        fetchProducts();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const openWhatsApp = (productName: string) => {
    const message = `Hello Sitora! I am interested in the "${productName}". Could you please provide more details?`;
    window.open(`https://wa.me/917907120478?text=${encodeURIComponent(message)}`, '_blank');
  };

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-sitora-cream/80 backdrop-blur-md border-b border-sitora-ink/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <h1 className="text-3xl font-serif font-bold tracking-tighter text-sitora-ink">SITORA</h1>
              <span className="ml-2 text-[10px] uppercase tracking-widest opacity-50 hidden sm:block">Where Comfort Begins</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-sm font-medium hover:text-sitora-gold transition-colors">Collections</a>
              <a href="#" className="text-sm font-medium hover:text-sitora-gold transition-colors">About Us</a>
              <a href="#" className="text-sm font-medium hover:text-sitora-gold transition-colors">Contact</a>
              {isAdmin ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                >
                  <Settings size={18} />
                  <span>Logout</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="p-2 rounded-full hover:bg-sitora-ink/5 transition-colors"
                  title="Admin Login"
                >
                  <Settings size={20} />
                </button>
              )}
            </div>

            <div className="md:hidden flex items-center space-x-4">
              <button
                onClick={() => isAdmin ? handleLogout() : setIsLoginModalOpen(true)}
                className={`p-2 ${isAdmin ? 'text-red-500' : ''}`}
              >
                <Settings size={20} />
              </button>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white border-b border-sitora-ink/5 p-4 space-y-4"
          >
            <a href="#" className="block text-lg font-serif">Collections</a>
            <a href="#" className="block text-lg font-serif">About Us</a>
            <a href="#" className="block text-lg font-serif">Contact</a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Sitora Luxury Interior"
            className="w-full h-full object-cover opacity-90"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-sitora-cream via-sitora-cream/20 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-sitora-olive mb-4">Premium Global Imports</span>
            <h2 className="text-6xl md:text-8xl font-serif leading-[0.9] mb-6">
              Where Design <br />
              <span className="italic text-sitora-gold">Meets Comfort</span>
            </h2>
            <p className="text-lg text-sitora-ink/70 mb-8 max-w-md">
              Curated seating solutions imported from China and Indonesia, crafted for modern Indian homes and workspaces.
            </p>
            <div className="flex space-x-4">
              <button className="bg-sitora-ink text-white px-8 py-4 rounded-full flex items-center space-x-2 hover:bg-sitora-olive transition-all group">
                <span>Explore Collections</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Product Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h3 className="text-4xl font-serif mb-2">Our Curated Catalog</h3>
              <p className="text-sitora-ink/60">Discover our latest imports from across Asia.</p>
            </div>
            {isAdmin && (
              <div className="flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="bg-sitora-cream text-sitora-ink px-6 py-3 rounded-full flex items-center space-x-2 shadow-sm border border-sitora-ink/10"
                >
                  <List size={20} />
                  <span>Categories</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setEditingProduct(null);
                    setNewProduct({
                      name: '',
                      description: '',
                      price: '',
                      category: categories[0]?.name || '',
                      image_url: '',
                      origin: 'China',
                      password: ''
                    });
                    setIsAddModalOpen(true);
                  }}
                  className="bg-sitora-olive text-white px-6 py-3 rounded-full flex items-center space-x-2 shadow-lg"
                >
                  <Plus size={20} />
                  <span>Add Product</span>
                </motion.button>
              </div>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-4 mb-12 border-b border-sitora-ink/5 pb-4">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === 'All'
                ? 'bg-sitora-ink text-white shadow-md'
                : 'bg-sitora-cream text-sitora-ink/60 hover:bg-sitora-ink/5'
                }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === category.name
                  ? 'bg-sitora-ink text-white shadow-md'
                  : 'bg-sitora-cream text-sitora-ink/60 hover:bg-sitora-ink/5'
                  }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -10 }}
                  className="group relative flex flex-col p-4 rounded-[40px] transition-all duration-500 hover:shadow-[0_32px_64px_-16px_rgba(20,20,20,0.1)] hover:bg-white"
                >
                  <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-sitora-cream mb-4 relative">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Globe size={10} /> {product.origin}
                      </span>
                      <span className="bg-sitora-ink/90 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Package size={10} /> {product.category}
                      </span>
                    </div>

                    {isAdmin && (
                      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(product);
                          }}
                          className="bg-white text-sitora-ink p-2 rounded-full shadow-lg hover:bg-sitora-gold hover:text-white transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(product.id);
                          }}
                          className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => openWhatsApp(product.name)}
                        className="bg-white text-sitora-ink px-6 py-3 rounded-full font-medium flex items-center space-x-2 transform translate-y-4 group-hover:translate-y-0 transition-transform"
                      >
                        <MessageCircle size={18} />
                        <span>Order Now</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-serif font-medium">{product.name}</h4>
                      <p className="text-sm text-sitora-ink/50 line-clamp-1">{product.description}</p>
                    </div>
                    <p className="text-lg font-medium text-sitora-gold">{formatPrice(product.price)}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-sitora-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="aspect-square rounded-[40px] overflow-hidden">
                <img
                  src="https://picsum.photos/seed/sitora-craft/1000/1000"
                  alt="Craftsmanship"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 bg-white p-8 rounded-3xl shadow-xl max-w-xs hidden md:block">
                <p className="font-serif text-xl italic mb-2">"Quality is the soul of every piece we import."</p>
                <p className="text-xs uppercase tracking-widest opacity-50">— Founder, Sitora</p>
              </div>
            </div>

            <div>
              <h3 className="text-5xl font-serif mb-8">Crafted for Modern Living</h3>
              <div className="space-y-6 text-lg text-sitora-ink/70">
                <p>
                  Sitora was born from a passion for global design and local comfort. We bridge the gap between international manufacturing excellence and the vibrant Indian market.
                </p>
                <p>
                  Our plastic chairs from China offer unmatched durability and modern aesthetics, while our wooden collections from Indonesia bring the warmth of authentic craftsmanship to your home.
                </p>
                <ul className="space-y-4 pt-4">
                  {[
                    'Direct Import from China & Indonesia',
                    'Quality Inspected for Indian Standards',
                    'Eco-friendly Material Sourcing',
                    'Pan-India Delivery Support'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center space-x-3 text-sm font-medium text-sitora-ink">
                      <div className="w-1.5 h-1.5 rounded-full bg-sitora-gold" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sitora-ink text-white py-20 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <h2 className="text-4xl font-serif font-bold mb-6">SITORA</h2>
              <p className="text-white/50 max-w-sm mb-8">
                Premium furniture imports bringing the best of Asian design to Indian doorsteps. Quality, comfort, and elegance redefined.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-sitora-ink transition-colors">
                  <MessageCircle size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-sitora-ink transition-colors">
                  <ShoppingBag size={18} />
                </a>
              </div>
            </div>

            <div>
              <h5 className="text-xs uppercase tracking-widest font-bold mb-6 text-sitora-gold">Quick Links</h5>
              <ul className="space-y-4 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">New Arrivals</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Plastic Collection</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Lounge Series</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Office Essentials</a></li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs uppercase tracking-widest font-bold mb-6 text-sitora-gold">Contact Us</h5>
              <ul className="space-y-4 text-sm text-white/60">
                <li>Angamaly, Kerala, India</li>
                <li>+91 79071 20478</li>
                <li>sitoracomforts@gmail.com</li>
                <li>Mon - Sat: 10AM - 7PM</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-white/30 uppercase tracking-widest">
            <p>© 2024 Sitora Furniture. All Rights Reserved.</p>
            <div className="flex space-x-8 mt-4 md:mt-0">
              <button onClick={() => setIsLegalModalOpen({ type: 'privacy' })} className="hover:text-white transition-colors">Privacy Policy</button>
              <button onClick={() => setIsLegalModalOpen({ type: 'terms' })} className="hover:text-white transition-colors">Terms & Conditions</button>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <button
        onClick={() => openWhatsApp('General Inquiry')}
        className="whatsapp-float"
      >
        <MessageCircle size={28} />
      </button>

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-serif">Admin Login</h3>
                <button onClick={() => setIsLoginModalOpen(false)} className="p-2 hover:bg-sitora-cream rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-sitora-ink/50 mb-1 block">Password</label>
                  <input
                    required
                    type="password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full bg-sitora-cream border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-sitora-gold"
                    placeholder="Enter admin password"
                  />
                </div>
                {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
                <button
                  type="submit"
                  className="w-full bg-sitora-ink text-white py-4 rounded-2xl font-bold hover:bg-sitora-olive transition-colors mt-4"
                >
                  Login
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Legal Modal */}
      <AnimatePresence>
        {isLegalModalOpen.type && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLegalModalOpen({ type: null })}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[32px] p-8 w-full max-w-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h3 className="text-2xl font-serif">
                  {isLegalModalOpen.type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
                </h3>
                <button onClick={() => setIsLegalModalOpen({ type: null })} className="p-2 hover:bg-sitora-cream rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto pr-4 space-y-6 text-sitora-ink/70 text-sm leading-relaxed">
                {isLegalModalOpen.type === 'terms' ? (
                  <>
                    <p className="font-bold">Effective Date: February 21, 2026</p>
                    <p>Welcome to Sitora Furniture. By placing an order with us, you agree to the following terms:</p>

                    <div>
                      <h4 className="font-bold text-sitora-ink mb-2">1. Products</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>We sell imported furniture (wood & plastic) and home décor items.</li>
                        <li>Product color and finish may slightly vary from images due to lighting or screen differences.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-sitora-ink mb-2">2. Orders & Payments</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Orders can be placed via WhatsApp, social media, or direct visit.</li>
                        <li>Full or advance payment may be required to confirm the order.</li>
                        <li>Prices are subject to change without prior notice.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-sitora-ink mb-2">3. Delivery</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>We provide delivery within a 40 KM radius.</li>
                        <li>Delivery charges may apply based on location.</li>
                        <li>Delivery time will be informed at the time of order.</li>
                        <li>Delays may occur due to logistics or unforeseen circumstances.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-sitora-ink mb-2">4. Returns & Replacement</h4>
                      <p>Products can be replaced only if:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Damaged during delivery</li>
                        <li>Wrong product delivered</li>
                      </ul>
                      <p className="mt-2">Replacement request must be made within 24 hours of delivery with proof (photo/video). No returns for change of mind.</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-sitora-ink mb-2">5. Warranty</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Warranty (if applicable) will be informed at purchase.</li>
                        <li>Warranty does not cover: Physical damage, Misuse or improper handling.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-sitora-ink mb-2">6. Cancellation</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Orders once confirmed may not be cancelled.</li>
                        <li>Advance payments are non-refundable unless approved.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-sitora-ink mb-2">7. Liability</h4>
                      <p>Sitora Furniture is not responsible for damages caused after delivery due to improper use.</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-sitora-ink mb-2">8. Changes to Terms</h4>
                      <p>We may update these terms at any time without prior notice.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-bold">Effective Date: February 21, 2026</p>
                    <p>At Sitora Furniture, we respect your privacy and are committed to protecting your information.</p>

                    <div>
                      <h4 className="font-bold text-sitora-ink mb-2">1. Information We Collect</h4>
                      <p>We may collect: Name, Phone number, Address, Order details.</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-sitora-ink mb-2">2. How We Use Your Information</h4>
                      <p>We use your information to: Process orders, Arrange delivery, Provide customer support, Share offers and updates (if applicable).</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-sitora-ink mb-2">3. Data Protection</h4>
                      <p>Your personal information is kept secure. We do not sell or share your data with third parties except for delivery purposes.</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-sitora-ink mb-2">4. Communication</h4>
                      <p>We may contact you via call, WhatsApp, or messages regarding your order or offers.</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-sitora-ink mb-2">5. Third-Party Services</h4>
                      <p>Delivery partners may access your address only for delivering your order.</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-sitora-ink mb-2">6. Consent</h4>
                      <p>By placing an order, you agree to our Terms & Conditions and Privacy Policy.</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-sitora-ink mb-2">7. Contact Us</h4>
                      <p>For any queries, contact:</p>
                      <ul className="list-none space-y-1 mt-2">
                        <li>📞 Phone/WhatsApp: +91 79071 20478</li>
                        <li>📍 Location: Angamaly, Kerala, India</li>
                        <li>✉️ Email: sitoracomforts@gmail.com</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Product Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingProduct(null);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[32px] p-8 w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-serif">{editingProduct ? 'Edit Listing' : 'Add New Listing'}</h3>
                <button onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }} className="p-2 hover:bg-sitora-cream rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-sitora-ink/50 mb-1 block">Product Name</label>
                  <input
                    required
                    type="text"
                    value={newProduct.name}
                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full bg-sitora-cream border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-sitora-gold"
                    placeholder="e.g. Modern Plastic Chair"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-sitora-ink/50 mb-1 block">Description</label>
                  <textarea
                    required
                    value={newProduct.description}
                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full bg-sitora-cream border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-sitora-gold h-24 resize-none"
                    placeholder="Briefly describe the product..."
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-sitora-ink/50 mb-1 block">Admin Password</label>
                  <input
                    required
                    type="password"
                    value={newProduct.password || ''}
                    onChange={e => setNewProduct({ ...newProduct, password: e.target.value })}
                    className="w-full bg-sitora-cream border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-sitora-gold"
                    placeholder="Enter admin password to confirm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-sitora-ink/50 mb-1 block">Price (INR)</label>
                    <input
                      required
                      type="number"
                      value={newProduct.price}
                      onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="w-full bg-sitora-cream border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-sitora-gold"
                      placeholder="1500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-sitora-ink/50 mb-1 block">Origin</label>
                    <select
                      value={newProduct.origin}
                      onChange={e => setNewProduct({ ...newProduct, origin: e.target.value })}
                      className="w-full bg-sitora-cream border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-sitora-gold"
                    >
                      <option>China</option>
                      <option>Indonesia</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-sitora-ink/50 mb-1 block">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-sitora-cream border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-sitora-gold"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-sitora-ink/50 mb-1 block">Product Image</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files[0];
                      if (file) handleImageUpload(file);
                    }}
                    className={`relative border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center p-6 ${isDragging ? 'border-sitora-gold bg-sitora-gold/5' : 'border-sitora-ink/10 bg-sitora-cream'
                      }`}
                  >
                    {newProduct.image_url ? (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden group">
                        <img
                          src={newProduct.image_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setNewProduct({ ...newProduct, image_url: '' })}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold"
                        >
                          Change Image
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center space-y-2 w-full">
                        <div className="w-12 h-12 rounded-full bg-sitora-ink/5 flex items-center justify-center text-sitora-ink/40">
                          <Upload size={24} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">Click to upload or drag and drop</p>
                          <p className="text-xs text-sitora-ink/40">PNG, JPG or WebP (max. 5MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-sitora-ink/50 mb-1">Or provide Image URL</p>
                    <input
                      type="url"
                      value={newProduct.image_url.startsWith('data:') ? '' : newProduct.image_url}
                      onChange={e => setNewProduct({ ...newProduct, image_url: e.target.value })}
                      className="w-full bg-sitora-cream border-none rounded-2xl px-4 py-2 text-sm focus:ring-2 focus:ring-sitora-gold"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-sitora-ink text-white py-4 rounded-2xl font-bold hover:bg-sitora-olive transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Update Listing' : 'Create Listing'}</span>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Management Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h3 className="text-2xl font-serif">Manage Categories</h3>
                <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 hover:bg-sitora-cream rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddCategory} className="flex space-x-2 mb-6 flex-shrink-0">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="flex-1 bg-sitora-cream border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-sitora-gold"
                  placeholder="New category name..."
                />
                <button type="submit" className="bg-sitora-ink text-white p-2 rounded-xl hover:bg-sitora-olive transition-colors">
                  <Plus size={20} />
                </button>
              </form>

              <div className="overflow-y-auto space-y-2">
                {categories.map(cat => (
                  <div key={cat.id} className="flex justify-between items-center p-3 bg-sitora-cream rounded-xl">
                    <span className="font-medium">{cat.name}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
