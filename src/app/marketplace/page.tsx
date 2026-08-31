'use client';

import React, { useState, useEffect } from 'react';
import {
  Search, Filter, ShoppingBag, Heart, ArrowLeft, Plus, CheckCircle2, Truck,
  Package, Clock, Check, ChevronRight, X, User, Phone, MapPin, Sparkles,
  ShieldCheck, FileText, Camera, Edit2, Trash2, Tag, AlertCircle,
  TrendingUp, CreditCard, Wallet, Send, ChevronDown, Award, HelpCircle,
  RefreshCw, MessageCircle, ExternalLink, Shield, Navigation, Compass, Box,
  Building, CheckSquare, Edit, Share2, SlidersHorizontal, ArrowUpDown, ChevronLeft, Lock, Loader2
} from 'lucide-react';

export const normalizeImageUrl = (url?: string): string => {
  if (!url) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80';
  let clean = url.trim();

  if (clean.startsWith('data:image') || clean.startsWith('blob:')) {
    return clean;
  }

  if (clean.includes('product_')) {
    const filename = clean.split('/').pop()?.split('?')[0];
    if (filename && filename.startsWith('product_')) {
      return `https://api.fiinway.com/api/v1/marketplace/image/${filename}`;
    }
  }

  if (clean.startsWith('http://localhost') || clean.startsWith('https://localhost') || clean.startsWith('http://127.0.0.1') || clean.startsWith('https://127.0.0.1')) {
    clean = clean.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, 'https://api.fiinway.com');
  }
  if (clean.startsWith('/assets/') || clean.startsWith('assets/') || clean.startsWith('public/')) {
    const withoutPublic = clean.replace(/^public\//, '').replace(/^\/+/, '');
    clean = `https://api.fiinway.com/${withoutPublic}`;
  }
  if (clean.startsWith('http://api.fiinway.com')) {
    clean = clean.replace('http://api.fiinway.com', 'https://api.fiinway.com');
  }
  return clean;
};

interface ProductImage {
  id?: number;
  image_path: string;
  is_primary?: boolean;
}

interface Category {
  id: number;
  name: string;
  icon?: string;
  subcategories?: Category[];
}

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  stock_quantity: number;
  user_id: number;
  category_id: number;
  subcategory_id?: number;
  condition: 'New' | 'Used' | string;
  condition_detail?: string;
  specifications?: string;
  delivery_type: 'Self Delivery' | 'Courier Delivery' | 'Both' | string;
  status: 'active' | 'pending_verification' | 'sold' | 'inactive' | string;
  images?: ProductImage[];
  category?: Category;
  seller?: {
    id: number;
    name: string;
    phone?: string;
    rating?: string;
    sales_count?: number;
  };
  created_at?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  selected: boolean;
}

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product?: Product;
}

interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  delivery_address: string;
  phone: string;
  contact_name?: string;
  status: 'placed' | 'confirmed' | 'packed' | 'dispatched' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | string;
  delivery_type?: string;
  payment_method?: string;
  payment_status?: string;
  txn_id?: string;
  tracking_id?: string;
  courier_name?: string;
  delivery_days?: number;
  status_notes?: string;
  created_at?: string;
  items?: OrderItem[];
  buyer?: {
    id: number;
    name: string;
    phone?: string;
  };
}

interface ChatMessage {
  id: number;
  sender: 'user' | 'seller';
  text: string;
  time: string;
}

export default function MarketplacePage() {
  // Navigation & User State
  const [activeTab, setActiveTab] = useState<'home' | 'product_detail' | 'categories' | 'sell' | 'orders' | 'track_order' | 'seller'>('home');
  const [orderFilterTab, setOrderFilterTab] = useState<'all' | 'pending' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [sellerFilterTab, setSellerFilterTab] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<Order | null>(null);
  const [userToken, setUserToken] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('Valued User');
  const [userPhone, setUserPhone] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Delivery City Selector Modal
  const [selectedCity, setSelectedCity] = useState<string>('Kolkata, WB');
  const [isCityModalOpen, setIsCityModalOpen] = useState<boolean>(false);
  const [citySearchQuery, setCitySearchQuery] = useState<string>('');

  // Cart Toast / Non-Intrusive Notification State
  const [cartToast, setCartToast] = useState<{ show: boolean; message: string; productName: string; price: number } | null>(null);

  // Popular Cities List
  const popularCities = [
    { name: 'Kolkata, WB', state: 'West Bengal' },
    { name: 'Howrah, WB', state: 'West Bengal' },
    { name: 'Siliguri, WB', state: 'West Bengal' },
    { name: 'Durgapur, WB', state: 'West Bengal' },
    { name: 'Delhi NCR', state: 'Delhi' },
    { name: 'Mumbai, MH', state: 'Maharashtra' },
    { name: 'Bengaluru, KA', state: 'Karnataka' },
    { name: 'Hyderabad, TS', state: 'Telangana' },
    { name: 'Chennai, TN', state: 'Tamil Nadu' },
    { name: 'Pune, MH', state: 'Maharashtra' },
    { name: 'Ahmedabad, GJ', state: 'Gujarat' },
    { name: 'Patna, BR', state: 'Bihar' },
    { name: 'Jaipur, RJ', state: 'Rajasthan' },
    { name: 'Lucknow, UP', state: 'Uttar Pradesh' },
    { name: 'Ranchi, JH', state: 'Jharkhand' },
    { name: 'Bhubaneswar, OD', state: 'Odisha' },
    { name: 'Guwahati, AS', state: 'Assam' },
    { name: 'Chandigarh', state: 'Punjab' },
  ];

  // Buyer Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [conditionFilter, setConditionFilter] = useState<'All' | 'New' | 'Used'>('All');
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [wishlist, setWishlist] = useState<number[]>([]);

  // ADVANCED FILTER STATES
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<'default' | 'price_asc' | 'price_desc' | 'newest'>('default');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under_1k' | '1k_5k' | '5k_20k' | 'above_20k'>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'pan_india' | 'local'>('all');

  // Cart & Checkout State (with LocalStorage Persistence)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');

  // Editable Delivery Address State During Order Checkout
  const [deliveryAddress, setDeliveryAddress] = useState<string>('Park Street, Kolkata, West Bengal - 700016');
  const [contactName, setContactName] = useState<string>('Valued Customer');
  const [isEditingAddress, setIsEditingAddress] = useState<boolean>(false);
  const [editStreetAddress, setEditStreetAddress] = useState<string>('Park Street');
  const [editCity, setEditCity] = useState<string>('Kolkata');
  const [editPincode, setEditPincode] = useState<string>('700016');
  const [editPhone, setEditPhone] = useState<string>('9876543210');

  const [deliveryOption, setDeliveryOption] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'razorpay' | 'upi' | 'card'>('wallet');
  const [placedOrderId, setPlacedOrderId] = useState<string>('');
  const [placingOrder, setPlacingOrder] = useState<boolean>(false);

  // Admin Configured Tax State
  const [taxName, setTaxName] = useState<string>('GST');
  const [taxRate, setTaxRate] = useState<number>(10.7);

  // Orders State
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);

  // Seller Management State
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [sellerTab, setSellerTab] = useState<'my_ads' | 'orders'>('my_ads');

  // Seller Chat Drawer State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, sender: 'seller', text: 'Hello! Thanks for your interest. How can I help you?', time: '10:30 AM' }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');

  // Seller Order Shipping Modal State
  const [selectedSellerOrder, setSelectedSellerOrder] = useState<Order | null>(null);
  const [shippingCourier, setShippingCourier] = useState<string>('BlueDart');
  const [shippingTrackingId, setShippingTrackingId] = useState<string>('');
  const [shippingDays, setShippingDays] = useState<string>('3');
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState<boolean>(false);

  // Add Product Wizard State
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newBrandName, setNewBrandName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<number>(1);
  const [newCondition, setNewCondition] = useState<'New' | 'Used'>('Used');
  const [newConditionDetail, setNewConditionDetail] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newSpecifications, setNewSpecifications] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newDiscountPercent, setNewDiscountPercent] = useState<string>('15');
  const [newOriginalPrice, setNewOriginalPrice] = useState<string>('');
  const [newStock, setNewStock] = useState<string>('10');
  const [newDeliveryType, setNewDeliveryType] = useState<'Local Delivery' | 'Pan India' | 'Digital Delivery'>('Local Delivery');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [submittingProduct, setSubmittingProduct] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // M-PIN Security Modal States
  const [showMPinModal, setShowMPinModal] = useState<boolean>(false);
  const [mPinInput, setMPinInput] = useState<string>('');
  const [mPinError, setMPinError] = useState<string>('');
  const [verifyingMPin, setVerifyingMPin] = useState<boolean>(false);

  // Categories List (22 categories for product posting & browsing)
  const defaultCategories: Category[] = [
    { id: 1, name: 'Mobiles', icon: '📱' },
    { id: 2, name: 'Electronics', icon: '💻' },
    { id: 3, name: 'Fashion', icon: '👗' },
    { id: 4, name: 'Home', icon: '🛋️' },
    { id: 5, name: 'Beauty', icon: '💄' },
    { id: 6, name: 'Shoes', icon: '👟' },
    { id: 7, name: 'Watches', icon: '⌚' },
    { id: 8, name: 'Furniture', icon: '🪑' },
    { id: 9, name: 'Bags', icon: '🎒' },
    { id: 10, name: 'Vehicles', icon: '🚗' },
    { id: 11, name: 'Bikes', icon: '🏍️' },
    { id: 12, name: 'Books', icon: '📚' },
    { id: 13, name: 'Sports', icon: '⚽' },
    { id: 14, name: 'Toys & Kids', icon: '🧸' },
    { id: 15, name: 'Appliances', icon: '📺' },
    { id: 16, name: 'Jewelry', icon: '💎' },
    { id: 17, name: 'Real Estate', icon: '🏠' },
    { id: 18, name: 'Pets', icon: '🐶' },
    { id: 19, name: 'Services & Jobs', icon: '🛠️' },
    { id: 20, name: 'Machinery & Tools', icon: '⚙️' },
    { id: 21, name: 'Automobiles & Spares', icon: '🚘' },
    { id: 22, name: 'Other Items', icon: '📦' },
  ];

  const defaultProducts: Product[] = [
    {
      id: 101,
      title: 'iPhone 13 (128GB)',
      description: '128GB Storage • Battery Health 85%+ • No Physical Damage • Original Bill Available',
      price: 32000,
      original_price: 36000,
      discount_percentage: 11,
      stock_quantity: 2,
      user_id: 201,
      category_id: 1,
      condition: 'Used',
      condition_detail: 'Like New',
      delivery_type: 'Self Delivery',
      status: 'active',
      images: [
        { id: 1, image_path: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80', is_primary: true }
      ],
      seller: { id: 201, name: 'Rahul Sharma', rating: '4.8', sales_count: 230 },
    },
    {
      id: 102,
      title: 'Royal Enfield Classic 350',
      description: '2021 Model • 12,500 KM Driven • Single Owner • Complete Insurance & Service History',
      price: 135000,
      original_price: 165000,
      discount_percentage: 18,
      stock_quantity: 1,
      user_id: 202,
      category_id: 11,
      condition: 'Used',
      condition_detail: 'Excellent Condition',
      delivery_type: 'Self Delivery',
      status: 'active',
      images: [
        { id: 3, image_path: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80', is_primary: true }
      ],
      seller: { id: 202, name: 'Amit Kumar', rating: '4.9', sales_count: 45 },
    },
    {
      id: 103,
      title: 'Nike Air Max 270',
      description: 'Men\'s Running Shoes, Size 9 UK, Lightweight Cushioning, Breathable Mesh Upper',
      price: 3499,
      original_price: 7995,
      discount_percentage: 56,
      stock_quantity: 3,
      user_id: 203,
      category_id: 6,
      condition: 'New',
      delivery_type: 'Courier Delivery',
      status: 'active',
      images: [
        { id: 5, image_path: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80', is_primary: true }
      ],
      seller: { id: 203, name: 'Fashion Hub', rating: '4.7', sales_count: 512 },
    },
    {
      id: 104,
      title: 'Dell Laptop i5 (11th Gen)',
      description: '8GB RAM / 512GB SSD / Windows 11 / Backlit Keyboard / Excellent Working Condition',
      price: 25000,
      original_price: 45000,
      discount_percentage: 44,
      stock_quantity: 1,
      user_id: 201,
      category_id: 2,
      condition: 'Used',
      condition_detail: 'Like New',
      delivery_type: 'Self Delivery',
      status: 'active',
      images: [
        { id: 6, image_path: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80', is_primary: true }
      ],
      seller: { id: 201, name: 'Rahul Sharma', rating: '4.8', sales_count: 230 },
    },
  ];

  // 1. Cart LocalStorage Persistence Syncing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem('fiinway_marketplace_cart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch (e) {
        console.warn('Failed to parse saved cart:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('fiinway_marketplace_cart', JSON.stringify(cart));
      } catch (e) {
        console.warn('Failed to save cart:', e);
      }
    }
  }, [cart]);

  // 2. Extract Params & Load Live Data (Supports Consumer App & Business App Webviews)
  useEffect(() => {
    let token = '';
    let uid = '';
    let phone = '';
    let name = '';
    let uType = 'user';

    if (typeof window !== 'undefined') {
      if (typeof document !== 'undefined') {
        let metaTheme = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
        if (!metaTheme) {
          metaTheme = document.createElement('meta');
          metaTheme.name = 'theme-color';
          document.head.appendChild(metaTheme);
        }
        metaTheme.content = '#ffffff';

        let metaStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement;
        if (!metaStatus) {
          metaStatus = document.createElement('meta');
          metaStatus.name = 'apple-mobile-web-app-status-bar-style';
          document.head.appendChild(metaStatus);
        }
        metaStatus.content = 'default';
      }

      const urlParams = new URLSearchParams(window.location.search);
      token = urlParams.get('accesstoken') || urlParams.get('token') || urlParams.get('access_token') || localStorage.getItem('accesstoken') || '';
      
      const driverIdParam = urlParams.get('driver_id') || urlParams.get('id_conducteur');
      const userIdParam = urlParams.get('user_id') || urlParams.get('id_user') || urlParams.get('userId') || urlParams.get('id');

      if (driverIdParam) {
        uid = driverIdParam;
        uType = 'driver';
      } else if (userIdParam) {
        uid = userIdParam;
        uType = 'user';
      } else {
        uid = localStorage.getItem('user_id') || '';
        uType = localStorage.getItem('user_type') || 'user';
      }

      phone = urlParams.get('phone') || urlParams.get('user_phone') || '';
      name = urlParams.get('name') || urlParams.get('user_name') || '';

      const cityParam = urlParams.get('city') || urlParams.get('location') || urlParams.get('user_city') || localStorage.getItem('fiinway_selected_city');
      if (cityParam) {
        setSelectedCity(cityParam);
      } else {
        setSelectedCity('Kolkata, WB');
      }

      if (token) localStorage.setItem('accesstoken', token);
      if (uid) localStorage.setItem('user_id', uid);
      if (uType) localStorage.setItem('user_type', uType);
    }

    setUserToken(token);
    setUserId(uid);
    if (phone) setUserPhone(phone);
    if (name) setUserName(name);

    loadAllBackendData(token, uid, uType);
  }, []);

  // Calculate Original Price when price or discount percent changes
  useEffect(() => {
    if (newPrice) {
      const p = parseFloat(newPrice) || 0;
      const d = parseFloat(newDiscountPercent) || 0;
      if (d > 0 && d < 100) {
        const orig = p / (1 - d / 100);
        setNewOriginalPrice(Math.round(orig).toString());
      } else {
        setNewOriginalPrice(Math.round(p * 1.2).toString());
      }
    }
  }, [newPrice, newDiscountPercent]);

  // Load Real Data from Backend APIs
  const loadAllBackendData = async (token = userToken, uid = userId, uType = 'user') => {
    setLoadingProducts(true);

    await Promise.all([
      fetchUserProfile(token, uid, uType),
      fetchCategories(),
      fetchProducts(),
      fetchCheckoutTax(),
      fetchMyProducts(token, uid),
      fetchBuyerOrders(token, uid),
      fetchSellerOrders(token, uid),
    ]);

    setLoadingProducts(false);
  };

  // Fetch Real User Profile & Accurate Wallet Balance
  const fetchUserProfile = async (token = userToken, uid = userId, uType = 'user') => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['accesstoken'] = token;
      if (uid) headers['user_id'] = uid;

      const queryParams = new URLSearchParams();
      if (uid) {
        if (uType === 'driver') queryParams.set('driver_id', uid);
        else queryParams.set('user_id', uid);
      }
      if (uType) queryParams.set('user_type', uType);
      if (token) queryParams.set('accesstoken', token);

      const res = await fetch(`/api/v1/marketplace/user-profile?${queryParams.toString()}`, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          if (json.data.name) {
            setUserName(json.data.name);
            setContactName(json.data.name);
          }
          if (json.data.phone) {
            setUserPhone(json.data.phone);
            setEditPhone(json.data.phone);
          }
          if (json.data.email) setUserEmail(json.data.email);
          if (json.data.address) {
            setDeliveryAddress(json.data.address);
            setEditStreetAddress(json.data.address);
          }
          if (json.data.amount !== undefined) setWalletBalance(parseFloat(json.data.amount));
          if (json.data.id) setUserId(json.data.id.toString());
          return;
        }
      }
    } catch (err) {
      console.warn('UserProfile API note:', err);
    }
  };

  // Fetch Active Taxes from Admin Panel (tj_tax via checkout-summary)
  const fetchCheckoutTax = async () => {
    try {
      const res = await fetch('/api/v1/marketplace/checkout-summary');
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.tax) {
          setTaxName(json.data.tax.name || 'GST');
          setTaxRate(parseFloat(json.data.tax.rate || '10.7'));
        }
      }
    } catch (err) {
      console.warn('Tax API note:', err);
    }
  };

  // Fetch Real Categories from Backend API & Deduplicate
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/v1/marketplace/categories');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          const seen = new Set();
          const cleanCats: Category[] = [];
          for (const c of json.data) {
            const norm = (c.name || '').trim().toLowerCase();
            if (norm && !seen.has(norm)) {
              seen.add(norm);
              cleanCats.push(c);
            }
          }
          setCategories(cleanCats);
          return;
        }
      }
    } catch (err) {
      console.warn('Categories API note:', err);
    }
    setCategories(defaultCategories);
  };

  // Fetch ALL Products from Backend API & Merge Cleanly
  const fetchProducts = async () => {
    try {
      let url = '/api/v1/marketplace/products?status=all';
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category_id', selectedCategory.toString());
      if (conditionFilter !== 'All') params.append('condition', conditionFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCity) params.append('city', selectedCity);
      if (params.toString()) url += '&' + params.toString();

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          const apiProducts: Product[] = json.data.map((item: any) => ({
            ...item,
            images: (item.images && item.images.length > 0)
              ? item.images.map((img: any) => ({
                  ...img,
                  image_path: normalizeImageUrl(img.image_path)
                }))
              : [
                  { id: 1, image_path: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80', is_primary: true }
                ]
          }));

          setProducts(apiProducts);

          // Auto-sync user's owned products into My Active Ads state
          if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const qUid = urlParams.get('user_id') || urlParams.get('id_user') || urlParams.get('driver_id') || urlParams.get('id_conducteur');
            const activeUid = userId || qUid || localStorage.getItem('user_id') || '';
            if (activeUid) {
              const ownedFromApi = apiProducts.filter((p: any) => p.user_id && p.user_id.toString() === activeUid.toString());
              setMyProducts(ownedFromApi);
            }
          }
          return;
        }
      }
    } catch (err) {
      console.warn('Products API note:', err);
    }
  };

  // Fetch Real Seller Listings from Backend API
  const fetchMyProducts = async (token = userToken, uid = userId) => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const qUserId = urlParams.get('user_id') || urlParams.get('id_user') || urlParams.get('driver_id') || urlParams.get('id_conducteur');
    const qToken = urlParams.get('accesstoken') || urlParams.get('token');

    const currentUid = uid || userId || qUserId || localStorage.getItem('user_id') || '';
    const currentToken = token || userToken || qToken || localStorage.getItem('accesstoken') || '';

    if (!currentUid) return;

    try {
      const headers: Record<string, string> = {};
      if (currentToken) headers['accesstoken'] = currentToken;
      headers['user_id'] = currentUid;

      const res = await fetch(`/api/v1/marketplace/my-products?user_id=${currentUid}&driver_id=${currentUid}&id_user=${currentUid}&accesstoken=${currentToken}`, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          const mappedMyProducts = json.data.map((item: any) => ({
            ...item,
            images: (item.images && item.images.length > 0)
              ? item.images.map((img: any) => ({
                  ...img,
                  image_path: normalizeImageUrl(img.image_path)
                }))
              : []
          }));
          setMyProducts(mappedMyProducts);
          return;
        }
      }
    } catch (err) {
      console.warn('My products API note:', err);
    }
  };

  const getActiveUserId = (overrideUid?: string) => {
    if (overrideUid) return overrideUid;
    if (userId) return userId;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const qUid = urlParams.get('user_id') || urlParams.get('id_user') || urlParams.get('driver_id') || urlParams.get('id_conducteur');
      if (qUid) return qUid;
      return localStorage.getItem('user_id') || '1';
    }
    return '1';
  };

  const getActiveToken = (overrideToken?: string) => {
    if (overrideToken) return overrideToken;
    if (userToken) return userToken;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const qToken = urlParams.get('accesstoken') || urlParams.get('token');
      if (qToken) return qToken;
      return localStorage.getItem('accesstoken') || '';
    }
    return '';
  };

  const fetchBuyerOrders = async (token = userToken, uid = userId) => {
    const currentUid = getActiveUserId(uid);
    const currentToken = getActiveToken(token);
    try {
      const headers: Record<string, string> = {};
      if (currentToken) headers['accesstoken'] = currentToken;
      headers['user_id'] = currentUid;
      headers['driver_id'] = currentUid;

      const res = await fetch(`/api/v1/marketplace/orders/buyer?user_id=${currentUid}&driver_id=${currentUid}&id_user=${currentUid}&accesstoken=${currentToken}`, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setBuyerOrders(json.data);
          return;
        }
      }
    } catch (err) {
      console.warn('Buyer orders API note:', err);
    }
  };

  const fetchSellerOrders = async (token = userToken, uid = userId) => {
    const currentUid = getActiveUserId(uid);
    const currentToken = getActiveToken(token);
    try {
      const headers: Record<string, string> = {};
      if (currentToken) headers['accesstoken'] = currentToken;
      headers['user_id'] = currentUid;
      headers['driver_id'] = currentUid;

      const res = await fetch(`/api/v1/marketplace/orders/seller?user_id=${currentUid}&driver_id=${currentUid}&id_user=${currentUid}&accesstoken=${currentToken}`, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setSellerOrders(json.data);
          return;
        }
      }
    } catch (err) {
      console.warn('Seller orders API note:', err);
    }
  };

  // MULTI-FILTER & SORT ENGINE
  const filteredProducts = products.filter(p => {
    const matchesSearch = searchQuery === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === null || p.category_id === selectedCategory;
    const matchesCondition = conditionFilter === 'All' || p.condition === conditionFilter;

    let matchesPrice = true;
    if (priceFilter === 'under_1k') matchesPrice = p.price < 1000;
    else if (priceFilter === '1k_5k') matchesPrice = p.price >= 1000 && p.price <= 5000;
    else if (priceFilter === '5k_20k') matchesPrice = p.price >= 5000 && p.price <= 20000;
    else if (priceFilter === 'above_20k') matchesPrice = p.price > 20000;

    let matchesDelivery = true;
    if (deliveryFilter === 'pan_india') matchesDelivery = p.delivery_type?.includes('Courier');
    else if (deliveryFilter === 'local') matchesDelivery = p.delivery_type?.includes('Self');

    return matchesSearch && matchesCategory && matchesCondition && matchesPrice && matchesDelivery;
  }).sort((a, b) => {
    if (sortOrder === 'price_asc') return a.price - b.price;
    if (sortOrder === 'price_desc') return b.price - a.price;
    if (sortOrder === 'newest') return b.id - a.id;
    return 0;
  });

  const openProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setActiveImageIndex(0);
    setActiveTab('product_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Universal Navigation Helper
  const handleBackNav = () => {
    if (activeTab === 'sell' && wizardStep > 1) {
      setWizardStep(prev => prev - 1);
    } else {
      setActiveTab('home');
    }
  };

  // Cart Management
  const addToCart = (product: Product, openCheckout = false) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1, selected: true }];
    });

    if (openCheckout) {
      setCheckoutStep('checkout');
      setIsCartOpen(true);
    } else {
      setCartToast({
        show: true,
        message: `Added to cart!`,
        productName: product.title,
        price: product.price,
      });
      setTimeout(() => {
        setCartToast(null);
      }, 3500);
    }
  };

  const updateCartQty = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeCartItem = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearAllCart = () => {
    if (cart.length === 0) return;
    if (window.confirm("Are you sure you want to remove all items from your cart?")) {
      setCart([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fiinway_marketplace_cart');
      }
    }
  };

  // Accurate Discount Percentage Helper
  const getDiscountPercentage = (price: number, originalPrice?: number, explicitDiscount?: number): number => {
    if (originalPrice && originalPrice > price) {
      const calculated = Math.round(((originalPrice - price) / originalPrice) * 100);
      return Math.max(0, Math.min(99, calculated));
    }
    if (explicitDiscount && explicitDiscount > 0) {
      return Math.max(0, Math.min(99, Math.round(explicitDiscount)));
    }
    return 0;
  };

  // Cart Calculations
  const selectedCartItems = cart.filter(i => i.selected);
  const cartSubtotal = selectedCartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryFee = deliveryOption === 'express' ? 99 : 0;
  const taxAmount = Math.round(((cartSubtotal * taxRate) / 100) * 100) / 100;
  const cartTotal = Math.max(0, Math.round((cartSubtotal + deliveryFee + taxAmount) * 100) / 100);

  // Address Save Handler During Checkout
  const handleApplyAddressEdit = () => {
    if (!editStreetAddress || !editCity) {
      alert('Please fill out street address and city');
      return;
    }
    const full = `${editStreetAddress}, ${editCity} ${editPincode ? '- ' + editPincode : ''}`;
    setDeliveryAddress(full);
    if (editPhone) setUserPhone(editPhone);
    setIsEditingAddress(false);
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setConditionFilter('All');
    setSortOrder('default');
    setPriceFilter('all');
    setDeliveryFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCategory !== null || conditionFilter !== 'All' || sortOrder !== 'default' || priceFilter !== 'all' || deliveryFilter !== 'all' || searchQuery !== '';

  // Order Placement (Handles Wallet M-PIN Verification, Cash on Delivery & Razorpay Online Payment)
  const handlePlaceOrder = async () => {
    if (selectedCartItems.length === 0) {
      alert("Please select at least one product in your cart to proceed with checkout.");
      return;
    }

    if (paymentMethod === 'wallet' && walletBalance < cartTotal) {
      alert(`Insufficient Wallet Balance! Required: ₹${cartTotal.toLocaleString()}, Available: ₹${walletBalance.toLocaleString()}. Please choose Cash on Delivery or Online Payment.`);
      return;
    }

    if (paymentMethod === 'wallet') {
      setMPinInput('');
      setMPinError('');
      setShowMPinModal(true);
      return;
    }

    if (paymentMethod === 'razorpay' || paymentMethod === 'card' || paymentMethod === 'upi') {
      await handleRazorpayOnlinePayment();
      return;
    }

    await submitFinalOrder(paymentMethod);
  };

  // Razorpay Online Payment Gateway Integration
  const handleRazorpayOnlinePayment = async () => {
    setPlacingOrder(true);
    try {
      let razorpayKey = 'rzp_test_demo_key';
      try {
        const keyRes = await fetch('/api/v1/app-settings/keys');
        if (keyRes.ok) {
          const keyJson = await keyRes.json();
          if (keyJson.data && keyJson.data.razorpay_key_id) {
            razorpayKey = keyJson.data.razorpay_key_id;
          }
        }
      } catch (e) {
        // use default
      }

      if (typeof (window as any).Razorpay === 'undefined') {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }

      const options = {
        key: razorpayKey,
        amount: Math.round(cartTotal * 100),
        currency: 'INR',
        name: 'Fiinway Marketplace',
        description: 'Marketplace Purchase Order',
        prefill: {
          name: contactName || userName,
          contact: userPhone || editPhone,
          email: userEmail,
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay via UPI / GPay / PhonePe / QR',
                instruments: [
                  { method: 'upi' }
                ]
              },
              other: {
                name: 'Cards & Netbanking',
                instruments: [
                  { method: 'card' },
                  { method: 'netbanking' }
                ]
              }
            },
            sequence: ['block.upi', 'block.other'],
            preferences: {
              show_default_blocks: true
            }
          }
        },
        theme: {
          color: '#047857',
        },
        handler: async function (response: any) {
          const txnId = response.razorpay_payment_id || ('RZP_' + Date.now());
          await submitFinalOrder('razorpay', txnId);
        },
        modal: {
          ondismiss: function () {
            setPlacingOrder(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.warn('Razorpay popup error, proceeding with order submission:', err);
      await submitFinalOrder('razorpay', 'RZP_TXN_' + Date.now());
    }
  };

  const submitFinalOrder = async (payMethod: string, transactionId?: string, mPinVal?: string) => {
    setPlacingOrder(true);
    const activeUid = getActiveUserId();
    const activeToken = getActiveToken();

    try {
      const payload: Record<string, any> = {
        user_id: activeUid,
        driver_id: activeUid,
        items: selectedCartItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        delivery_address: deliveryAddress,
        delivery_charge: deliveryFee,
        tax_amount: taxAmount,
        phone: userPhone || editPhone,
        contact_name: contactName,
        payment_method: payMethod,
        txn_id: transactionId || ('TXN_' + Date.now()),
      };

      if (payMethod === 'wallet' && mPinVal) {
        payload['m_pin'] = mPinVal;
        payload['mpin'] = mPinVal;
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (activeToken) headers['accesstoken'] = activeToken;
      if (activeUid) {
        headers['user_id'] = activeUid;
        headers['driver_id'] = activeUid;
      }

      const res = await fetch(`/api/v1/marketplace/orders?user_id=${activeUid}&driver_id=${activeUid}&id_user=${activeUid}&accesstoken=${activeToken}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.id) {
          if (payMethod === 'wallet') setWalletBalance(prev => Math.max(0, prev - cartTotal));
          setPlacedOrderId(json.data.id.toString());
          setCheckoutStep('success');
          setShowMPinModal(false);
          setMPinInput('');
          setMPinError('');
          setCart(prev => prev.filter(item => !item.selected));
          await fetchBuyerOrders(activeToken, activeUid);
          await fetchSellerOrders(activeToken, activeUid);
          setPlacingOrder(false);
          return;
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson.error || errJson.message || 'Server error placing order.';
        if (payMethod === 'wallet' && showMPinModal) {
          setMPinError(errMsg);
        } else {
          alert(`Order Booking Error: ${errMsg}`);
        }
        setPlacingOrder(false);
        return;
      }
    } catch (err: any) {
      const msg = `Network / System Error: ${err?.message || 'Failed to communicate with order server.'}`;
      if (payMethod === 'wallet' && showMPinModal) {
        setMPinError(msg);
      } else {
        alert(msg);
      }
      setPlacingOrder(false);
      return;
    }
  };

  const handleConfirmMPinPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mPinInput || mPinInput.length !== 4) {
      setMPinError('Please enter your 4-digit Wallet M-PIN');
      return;
    }
    setMPinError('');
    setVerifyingMPin(true);
    await submitFinalOrder('wallet', undefined, mPinInput);
    setVerifyingMPin(false);
  };

  // Seller Update Order Status API Call
  const handleUpdateSellerOrderStatus = async (status: string) => {
    if (!selectedSellerOrder) return;
    setUpdatingOrderStatus(true);

    try {
      const payload = {
        user_id: userId,
        status,
        tracking_id: shippingTrackingId || 'BD' + Math.floor(10000000 + Math.random() * 90000000) + 'IN',
        courier_name: shippingCourier,
        delivery_days: parseInt(shippingDays) || 3,
      };

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userToken) headers['accesstoken'] = userToken;
      if (userId) headers['user_id'] = userId;

      const res = await fetch(`/api/v1/marketplace/orders/${selectedSellerOrder.id}/status?user_id=${userId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(`Order status updated to ${status}!`);
        await fetchSellerOrders();
        await fetchBuyerOrders();
        setSelectedSellerOrder(null);
        setUpdatingOrderStatus(false);
        return;
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(`Status update failed: ${errJson.error || 'Server error'}`);
        setUpdatingOrderStatus(false);
        return;
      }
    } catch (err) {
      console.warn('Status update API error, applying fallback');
    }

    setSellerOrders(prev => prev.map(o => o.id === selectedSellerOrder.id ? { ...o, status: status as any, courier_name: shippingCourier, tracking_id: shippingTrackingId } : o));
    setBuyerOrders(prev => prev.map(o => o.id === selectedSellerOrder.id ? { ...o, status: status as any, courier_name: shippingCourier, tracking_id: shippingTrackingId } : o));
    alert(`Order status updated to ${status}!`);
    setSelectedSellerOrder(null);
    setUpdatingOrderStatus(false);
  };

  // Client-side Image Compression Helper for Instant & 100% Reliable Rendering
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve((e.target?.result as string) || '');
          }
        };
        img.onerror = () => resolve((e.target?.result as string) || '');
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Image Upload File Handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const compressedBase64 = await compressImageFile(file);
        if (compressedBase64) {
          setUploadedImages(prev => [...prev, compressedBase64].slice(0, 5));
        }
      } catch (err) {
        console.warn('Image compression error:', err);
      }
    }

    setUploadingImage(false);
    e.target.value = '';
  };

  // Start Editing Product Listing
  const handleStartEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setNewTitle(prod.title);
    setNewBrandName(prod.brand_name || '');
    setNewCategory(prod.category_id || 1);
    setNewCondition(prod.condition === 'New' ? 'New' : 'Used');
    setNewConditionDetail(prod.condition_detail || '');
    setNewDescription(prod.description || '');
    setNewSpecifications(prod.specifications || '');
    setNewPrice(prod.price.toString());
    setNewOriginalPrice(prod.original_price ? prod.original_price.toString() : '');
    setNewDiscountPercent(prod.discount_percentage ? prod.discount_percentage.toString() : '15');
    setNewStock(prod.stock_quantity ? prod.stock_quantity.toString() : '1');
    setNewDeliveryType((prod.delivery_type as any) || 'Local Delivery');

    if (prod.images && prod.images.length > 0) {
      setUploadedImages(prod.images.map(img => img.image_path));
    } else {
      setUploadedImages([]);
    }

    setActiveTab('sell');
    setWizardStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Enable / Disable Product Status Toggle Handler
  const handleToggleProductStatus = async (product: Product) => {
    const newStatus = (product.status || '').toLowerCase() === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? 'Enable' : 'Disable';

    if (!confirm(`Are you sure you want to ${actionText.toLowerCase()} "${product.title}"?`)) return;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userToken) headers['accesstoken'] = userToken;
      if (userId) headers['user_id'] = userId;

      await fetch(`/api/v1/marketplace/products/${product.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus, user_id: userId })
      });
    } catch (e) {
      console.warn('Status toggle API note:', e);
    }

    setMyProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
  };

  // Delete Product Listing
  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product listing?')) return;

    try {
      const headers: Record<string, string> = {};
      if (userToken) headers['accesstoken'] = userToken;
      if (userId) headers['user_id'] = userId;

      const res = await fetch(`/api/v1/marketplace/products/${productId}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        setMyProducts(prev => prev.filter(p => p.id !== productId));
        await fetchProducts();
        alert('Product ad deleted successfully.');
      } else {
        setMyProducts(prev => prev.filter(p => p.id !== productId));
      }
    } catch (e) {
      setMyProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  // Submit or Update Product Listing & SHOW IMMEDIATELY on Home Page
  const handleSubmitNewProduct = async () => {
    if (!newTitle || !newPrice) {
      alert('Please fill out product title and price!');
      return;
    }

    setSubmittingProduct(true);

    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const qUid = urlParams ? (urlParams.get('user_id') || urlParams.get('id_user') || urlParams.get('driver_id') || urlParams.get('id_conducteur')) : null;
    const activeUid = userId || qUid || (typeof window !== 'undefined' ? localStorage.getItem('user_id') || '' : '') || '1';
    const activeToken = userToken || (urlParams ? urlParams.get('accesstoken') : null) || (typeof window !== 'undefined' ? localStorage.getItem('accesstoken') || '' : '');

    try {
      const finalImages = uploadedImages.length > 0 
        ? uploadedImages 
        : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80'];

      const payload = {
        user_id: activeUid,
        driver_id: activeUid,
        title: newTitle,
        brand_name: newBrandName,
        description: newDescription || 'Product listed on Fiinway Marketplace.',
        specifications: newSpecifications,
        price: parseFloat(newPrice),
        original_price: newOriginalPrice ? parseFloat(newOriginalPrice) : parseFloat(newPrice) * 1.2,
        discount_percentage: parseFloat(newDiscountPercent) || 0,
        stock_quantity: parseInt(newStock) || 1,
        category_id: newCategory,
        condition: newCondition,
        condition_detail: newConditionDetail,
        delivery_type: newDeliveryType,
        seller_city: selectedCity,
        city: selectedCity,
        image_urls: finalImages,
      };

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (activeToken) headers['accesstoken'] = activeToken;
      if (activeUid) {
        headers['user_id'] = activeUid;
        headers['driver_id'] = activeUid;
      }

      const isEditing = Boolean(editingProduct);
      const url = isEditing 
        ? `/api/v1/marketplace/products/${editingProduct?.id}` 
        : '/api/v1/marketplace/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const updatedItem = json.data;
          setMyProducts(prev => [updatedItem, ...prev.filter(p => p.id !== updatedItem.id)]);
        }
        await fetchProducts();
        await fetchMyProducts(activeToken, activeUid);
        alert(isEditing ? 'Product Ad updated successfully!' : 'Product listed successfully! It is now live on the Marketplace catalog.');
        setEditingProduct(null);
        setWizardStep(1);
        setNewTitle('');
        setNewBrandName('');
        setNewPrice('');
        setNewDescription('');
        setNewSpecifications('');
        setNewConditionDetail('');
        setUploadedImages([]);
        setActiveTab('seller');
        setSellerTab('my_ads');
        setSelectedCategory(null);
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert('Failed to save product: ' + (errJson.error || ('Server response code ' + res.status)));
      }
    } catch (err: any) {
      console.warn('Product submit error:', err);
      alert('Product submission error: ' + (err.message || 'Connection error'));
    }

    setSubmittingProduct(false);
  };

  const getOrderStatusInfo = (status: string) => {
    const s = (status || 'placed').toLowerCase();
    if (s === 'delivered') return { label: 'Delivered', step: 4, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (s === 'dispatched' || s === 'shipped') return { label: 'Shipped', step: 3, color: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (s === 'out_for_delivery') return { label: 'Out for Delivery', step: 3.5, color: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (s === 'confirmed' || s === 'packed') return { label: 'Confirmed', step: 2, color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
    return { label: 'Placed', step: 1, color: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-24">

      {/* TOP FLOATING NAVIGATION BAR - SAFE AREA & HIGH CONTRAST */}
      <div className="bg-white border-b border-slate-200 px-4 pt-[max(env(safe-area-inset-top),0.625rem)] pb-2.5 shadow-2xs sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {activeTab !== 'home' ? (
            /* UNIVERSAL BACK BUTTON ON ALL SUB-PAGES */
            <button
              onClick={handleBackNav}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition-all shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" /> Back
            </button>
          ) : (
            /* City Location Selector Button on Home */
            <button
              onClick={() => setIsCityModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-[#047857]" />
              <span className="font-bold">{selectedCity}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          )}

          <div className="flex items-center gap-2">
            {/* ACCURATE WALLET BALANCE BADGE */}
            <div className="flex items-center gap-1.5 bg-emerald-50 text-[#047857] border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs">
              <Wallet className="w-3.5 h-3.5 text-[#047857]" />
              <span>₹{walletBalance.toLocaleString()}</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => loadAllBackendData()}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loadingProducts ? 'animate-spin text-[#047857]' : ''}`} />
            </button>

            {/* Cart Icon Button */}
            <button
              onClick={() => {
                setCheckoutStep('cart');
                setIsCartOpen(true);
              }}
              className="relative p-2 rounded-xl bg-[#047857] text-white shadow-xs hover:bg-[#065f46] transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 pt-4">

        {/* TAB 1: BUYER HOME CATALOG & SEARCH */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Search Bar & Advanced Filter Trigger */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products, brands, vehicles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#047857] shadow-2xs"
                />
              </div>

              {/* Advanced Filter Button */}
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className={`px-3.5 py-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all shadow-2xs ${
                  hasActiveFilters
                    ? 'bg-[#047857] text-white border-[#047857]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
            </div>

            {/* Quick Filter Badges Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setConditionFilter(conditionFilter === 'All' ? 'New' : conditionFilter === 'New' ? 'Used' : 'All')}
                className={`px-3 py-1.5 rounded-lg font-semibold border transition-all shrink-0 ${
                  conditionFilter !== 'All' ? 'bg-emerald-50 text-[#047857] border-emerald-200' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Condition: {conditionFilter}
              </button>

              <button
                onClick={() => setDeliveryFilter(deliveryFilter === 'all' ? 'pan_india' : deliveryFilter === 'pan_india' ? 'local' : 'all')}
                className={`px-3 py-1.5 rounded-lg font-semibold border transition-all shrink-0 ${
                  deliveryFilter !== 'all' ? 'bg-emerald-50 text-[#047857] border-emerald-200' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Delivery: {deliveryFilter === 'pan_india' ? 'Courier' : deliveryFilter === 'local' ? 'Self Direct' : 'All'}
              </button>

              <button
                onClick={() => setSortOrder(sortOrder === 'default' ? 'price_asc' : sortOrder === 'price_asc' ? 'price_desc' : sortOrder === 'price_desc' ? 'newest' : 'default')}
                className={`px-3 py-1.5 rounded-lg font-semibold border transition-all shrink-0 flex items-center gap-1 ${
                  sortOrder !== 'default' ? 'bg-emerald-50 text-[#047857] border-emerald-200' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                <ArrowUpDown className="w-3 h-3" />
                Sort: {sortOrder === 'price_asc' ? 'Price ⬆ Low-High' : sortOrder === 'price_desc' ? 'Price ⬇ High-Low' : sortOrder === 'newest' ? 'Newest' : 'Default'}
              </button>

              {hasActiveFilters && (
                <button onClick={handleResetFilters} className="text-red-600 font-bold text-[11px] px-2 shrink-0">Clear All</button>
              )}
            </div>

            {/* PROMOTIONAL BANNER CARD */}
            <div className="bg-[#047857] rounded-2xl p-4 sm:p-5 text-white shadow-sm flex items-center justify-between relative overflow-hidden">
              <div className="space-y-1 z-10">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-800/60 text-emerald-200 px-2.5 py-0.5 rounded-full inline-block">
                  Sell & Earn Direct Money
                </span>
                <h2 className="text-base sm:text-lg font-bold leading-snug text-white">Used or New, Sale on fiinway
-Earn your way!</h2>
                <button
                  onClick={() => { setActiveTab('sell'); setWizardStep(1); }}
                  className="mt-2 bg-white text-[#047857] hover:bg-emerald-50 font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1"
                >
                  Sale Now <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="text-5xl opacity-80 shrink-0">🛍️</div>
            </div>

            {/* POPULAR CATEGORIES GRID (EXACTLY 8 CARDS TOTAL WITH 'ALL PRODUCTS' FIRST) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Marketplace Categories</h2>
                <button onClick={() => setActiveTab('categories')} className="text-xs font-semibold text-[#047857]">View All ({categories.length})</button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2">
                {/* 1. ALL PRODUCTS CATEGORY CARD */}
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all ${
                    selectedCategory === null
                      ? 'border-[#047857] bg-emerald-50 text-[#047857] font-bold shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl mb-1">🛍️</span>
                  <span className="text-[11px] truncate max-w-full font-bold">All</span>
                </button>

                {/* 2 to 8. TOP 7 CATEGORIES (TOTAL 8 CARDS) */}
                {categories.slice(0, 7).map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all ${
                      selectedCategory === cat.id
                        ? 'border-[#047857] bg-emerald-50 text-[#047857] font-bold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl mb-1">{cat.icon || '📦'}</span>
                    <span className="text-[11px] truncate max-w-full font-semibold">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* RECOMMENDED PRODUCTS GRID */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Marketplace Catalog</h2>
                <span className="text-xs font-semibold text-slate-500">{filteredProducts.length} products listed</span>
              </div>

              {loadingProducts ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 text-[#047857] animate-spin mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-500">Loading catalog...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-2">
                  <Package className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">No products found</h3>
                  <p className="text-xs text-slate-500">Try adjusting your filters or search keywords.</p>
                  <button
                    onClick={handleResetFilters}
                    className="mt-2 bg-[#047857] text-white font-semibold text-xs px-4 py-2 rounded-xl"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredProducts.map(prod => (
                    <div
                      key={prod.id}
                      onClick={() => openProductDetails(prod)}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer group"
                    >
                      {/* Image Container */}
                      <div className="relative aspect-4/3 sm:aspect-square bg-slate-100 overflow-hidden">
                        <img
                          src={normalizeImageUrl(prod.images?.[0]?.image_path)}
                          alt={prod.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                        <span className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded text-white shadow-2xs uppercase ${
                          prod.condition === 'New' ? 'bg-[#047857]' : 'bg-amber-600'
                        }`}>
                          {prod.condition}
                        </span>

                        {(() => {
                          const disc = getDiscountPercentage(prod.price, prod.original_price, prod.discount_percentage);
                          return disc > 0 ? (
                            <span className="absolute top-2 left-16 bg-rose-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs">
                              {disc}% OFF
                            </span>
                          ) : null;
                        })()}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setWishlist(prev => prev.includes(prod.id) ? prev.filter(i => i !== prod.id) : [...prev, prod.id]);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-slate-600 hover:text-red-500 shadow-2xs"
                        >
                          <Heart className={`w-3.5 h-3.5 ${wishlist.includes(prod.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-3 space-y-1">
                        <h3 className="text-xs font-bold text-slate-900 line-clamp-1 leading-tight group-hover:text-[#047857] transition-colors">
                          {prod.title}
                        </h3>

                        <p className="text-[10px] text-slate-500 font-medium">
                          {prod.condition_detail || prod.condition}
                        </p>

                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 mt-1">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-[#047857]">₹{prod.price.toLocaleString()}</span>
                            {prod.original_price && prod.original_price > prod.price && (
                              <span className="text-[10px] text-slate-400 line-through">₹{prod.original_price.toLocaleString()}</span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(prod);
                            }}
                            className="bg-emerald-50 hover:bg-[#047857] hover:text-white text-[#047857] p-1.5 rounded-lg border border-emerald-200 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DEDICATED FULL CATEGORIES VIEW ALL PAGE (WITH ALL PRODUCTS OPTION) */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">All Marketplace Categories ({categories.length + 1})</h2>
              <span className="text-xs font-semibold text-slate-500">Select category to browse products</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {/* ALL PRODUCTS CATEGORY CARD */}
              <div
                onClick={() => {
                  setSelectedCategory(null);
                  setActiveTab('home');
                }}
                className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs hover:shadow-md flex flex-col justify-between space-y-3 ${
                  selectedCategory === null ? 'border-[#047857] bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">🛍️</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">All Products</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Show all verified listings</p>
                </div>
                <button className="w-full text-left text-xs font-bold text-[#047857] pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span>View All Items</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </div>

              {categories.map(cat => (
                <div
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setActiveTab('home');
                  }}
                  className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs hover:shadow-md flex flex-col justify-between space-y-3 ${
                    selectedCategory === cat.id ? 'border-[#047857] bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{cat.icon || '📦'}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Browse verified listings</p>
                  </div>
                  <button className="w-full text-left text-xs font-bold text-[#047857] pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span>View Items</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DEDICATED PRODUCT DETAILS VIEW */}
        {activeTab === 'product_detail' && selectedProduct && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-4 shadow-2xs">
              <div className="relative aspect-4/3 sm:aspect-16/9 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                <img
                  src={normalizeImageUrl(selectedProduct.images?.[activeImageIndex]?.image_path)}
                  alt={selectedProduct.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                {(() => {
                  const disc = getDiscountPercentage(selectedProduct.price, selectedProduct.original_price, selectedProduct.discount_percentage);
                  return disc > 0 ? (
                    <span className="absolute top-3 left-3 bg-rose-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm">
                      {disc}% OFF
                    </span>
                  ) : null;
                })()}
                <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-0.5 rounded text-white shadow-2xs ${
                  selectedProduct.condition === 'New' ? 'bg-[#047857]' : 'bg-amber-600'
                }`}>
                  {selectedProduct.condition}
                </span>
              </div>

              {selectedProduct.images && selectedProduct.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selectedProduct.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                        activeImageIndex === idx ? 'border-[#047857]' : 'border-transparent opacity-60'
                      }`}
                    >
                      <img
                        src={normalizeImageUrl(img.image_path)}
                        alt="thumb"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <h1 className="text-lg font-bold text-slate-900">{selectedProduct.title}</h1>

                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-black text-[#047857]">₹{selectedProduct.price.toLocaleString()}</span>
                  {selectedProduct.original_price && selectedProduct.original_price > selectedProduct.price && (
                    <>
                      <span className="text-sm text-slate-400 line-through font-semibold">₹{selectedProduct.original_price.toLocaleString()}</span>
                      {(() => {
                        const disc = getDiscountPercentage(selectedProduct.price, selectedProduct.original_price, selectedProduct.discount_percentage);
                        return disc > 0 ? (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Save ₹{(selectedProduct.original_price - selectedProduct.price).toLocaleString()} ({disc}% OFF)
                          </span>
                        ) : null;
                      })()}
                    </>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-[#047857] shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      {selectedProduct.delivery_type?.includes('Self') ? 'Self Direct Delivery' : 'Courier Shipping'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {selectedProduct.delivery_type?.includes('Self')
                        ? 'Product delivered directly by local seller.'
                        : 'Shipped via trusted courier partner.'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">Description</h4>
                  <p className="text-xs text-slate-600 whitespace-pre-line">{selectedProduct.description}</p>
                </div>

                {/* BOLD HIGHLIGHTED PRODUCT SPECIFICATION BADGE BOX */}
                {selectedProduct.specifications && (
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-500/40 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-black text-[#047857] uppercase tracking-wider">
                      
                      <span>Product Specifications & Details</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedProduct.specifications.split('|').map((spec, idx) => (
                        <span
                          key={idx}
                          className="bg-white text-slate-900 border border-emerald-300 font-extrabold text-xs px-3 py-1.5 rounded-lg shadow-2xs flex items-center gap-1.5"
                        >
                          <span className="w-2 h-2 rounded-full bg-[#047857]"></span>
                          {spec.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seller Info Box (Name & Phone Number Only) */}
                {(() => {
                  const sInfo = (selectedProduct as any).seller_info || {};
                  const sObj = selectedProduct.seller || {};
                  const displayName = sInfo.name || sObj.name || (sObj as any).prenom || (sObj as any).phone || `Seller #${selectedProduct.user_id}`;
                  const phoneNum = sInfo.phone || sObj.phone || (sObj as any).mobile || (sObj as any).phone_number || '';
                  const initialLetter = displayName ? displayName.trim()[0].toUpperCase() : 'S';

                  return (
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#047857] text-white font-bold flex items-center justify-center text-sm shadow-2xs shrink-0">
                        {initialLetter}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900">Seller Name: <span className="text-[#047857]">{displayName}</span></p>
                        {phoneNum ? (
                          <p className="text-xs font-semibold text-slate-700">Seller Phone: <span className="font-bold text-slate-900">{phoneNum}</span></p>
                        ) : (
                          <p className="text-xs font-medium text-slate-500">Seller Phone: Contact details available on order</p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Bottom Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => addToCart(selectedProduct)}
                    className="bg-emerald-50 text-[#047857] hover:bg-emerald-100 font-bold text-xs py-3 rounded-xl border border-emerald-200 flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" /> Add to Cart
                  </button>
                  <button
                    onClick={() => {
                      addToCart(selectedProduct);
                      setIsCartOpen(true);
                      setCheckoutStep('checkout');
                    }}
                    className="bg-[#047857] hover:bg-[#065f46] text-white font-bold text-xs py-3 rounded-xl shadow-xs flex items-center justify-center gap-2"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BUYER ORDERS & ORDER FILTERING */}
        {activeTab === 'orders' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('home')}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h1 className="text-base font-extrabold text-slate-900 leading-tight">My Orders</h1>
              </div>
              <span className="text-xs font-extrabold text-[#047857] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                {buyerOrders.length} Orders
              </span>
            </div>

            {/* Horizontal Filter Tabs Bar */}
            <div className="flex border-b border-slate-200 text-xs font-semibold overflow-x-auto no-scrollbar gap-2 pb-0.5">
              {(['all', 'pending', 'shipped', 'delivered', 'cancelled'] as const).map((tab) => {
                const isActive = orderFilterTab === tab;
                const tabLabel = tab === 'all' ? 'All' :
                                 tab === 'pending' ? 'Pending' :
                                 tab === 'shipped' ? 'Shipped' :
                                 tab === 'delivered' ? 'Delivered' : 'Cancelled';
                return (
                  <button
                    key={tab}
                    onClick={() => setOrderFilterTab(tab)}
                    className={`py-2 px-3.5 border-b-2 transition-all font-extrabold capitalize shrink-0 ${
                      isActive
                        ? 'border-indigo-600 text-indigo-700 font-black'
                        : 'border-transparent text-slate-500 hover:text-slate-700 font-bold'
                    }`}
                  >
                    {tabLabel}
                  </button>
                );
              })}
            </div>

            {/* Filtered Orders List */}
            {(() => {
              if (buyerOrders.length === 0) {
                return (
                  <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-2">
                    <Box className="w-10 h-10 text-slate-300 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-800">No orders placed yet</h3>
                    <p className="text-xs text-slate-500">Your marketplace purchases will appear here.</p>
                    <button onClick={() => setActiveTab('home')} className="mt-2 bg-[#047857] text-white font-semibold text-xs px-4 py-2 rounded-xl">
                      Shop Products
                    </button>
                  </div>
                );
              }

              const filtered = buyerOrders.filter(order => {
                const st = (order.status || '').toLowerCase();
                if (orderFilterTab === 'pending') return st === 'placed' || st === 'confirmed';
                if (orderFilterTab === 'shipped') return ['packed', 'shipped', 'dispatched', 'out_for_delivery'].includes(st);
                if (orderFilterTab === 'delivered') return st === 'delivered';
                if (orderFilterTab === 'cancelled') return st === 'cancelled';
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-2">
                    <Box className="w-10 h-10 text-slate-300 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-800">No orders found</h3>
                    <p className="text-xs text-slate-500">There are no orders under the selected filter tab.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-2.5">
                  {filtered.map(order => {
                    const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || order.items?.length || 1;
                    const formattedDate = order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '12 May 2024';
                    const isOutForDelivery = order.status === 'out_for_delivery';
                    const isDelivered = order.status === 'delivered';
                    const isCancelled = order.status === 'cancelled';

                    return (
                      <div key={order.id} className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-2">
                        {/* Header Row: Order ID & Date (NO TIME) */}
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                          <span>Order ID: <span className="font-extrabold text-slate-800">#ORD{order.id}</span></span>
                          <span className="text-[11px] font-medium text-slate-500">{formattedDate}</span>
                        </div>

                        {/* Thumbnails Row & Summary (Compact height) */}
                        <div className="flex items-center justify-between gap-2.5">
                          {/* Product Thumbnails */}
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            {order.items && order.items.length > 0 ? (
                              order.items.slice(0, 3).map((item, idx) => {
                                const imgPath = item.product?.images?.[0]?.image_path || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80';
                                return (
                                  <div key={idx} className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                    <img src={imgPath} alt={item.product?.title || 'Product'} className="w-full h-full object-cover" />
                                  </div>
                                );
                              })
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>

                          {/* Right side summary & status */}
                          <div className="text-right space-y-0">
                            <span className="text-[10px] text-slate-500 font-medium block">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
                            <span className="text-sm font-extrabold text-slate-900 block leading-tight">
                              ₹{(parseFloat(String(order.total_amount || 0)) || 0).toLocaleString('en-IN')}
                            </span>
                            <span className={`inline-block text-[10px] font-bold mt-0.5 ${
                              isOutForDelivery ? 'text-indigo-600 font-black' :
                              isDelivered ? 'text-emerald-600' :
                              isCancelled ? 'text-red-600' : 'text-amber-600'
                            }`}>
                              {isOutForDelivery ? 'Out for Delivery' :
                               isDelivered ? 'Delivered' :
                               isCancelled ? 'Cancelled' :
                               order.status === 'shipped' ? 'Shipped' :
                               order.status === 'packed' ? 'Packed' : 'Order Confirmed'}
                            </span>
                          </div>
                        </div>

                        {/* Track Order / View Details CTA Button (Compact) */}
                        <button
                          onClick={() => {
                            setSelectedOrderForTracking(order as Order);
                            setActiveTab('track_order');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="w-full py-1.5 bg-white hover:bg-slate-50 text-indigo-700 font-extrabold text-xs rounded-lg border border-indigo-200 transition-all flex items-center justify-center gap-1 shadow-2xs"
                        >
                          {['out_for_delivery', 'shipped', 'packed', 'confirmed', 'placed'].includes((order.status || '').toLowerCase()) ? 'Track Order' : 'View Details'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 4.5: DEDICATED TRACK ORDER SCREEN (Matching reference image) */}
        {activeTab === 'track_order' && selectedOrderForTracking && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="flex items-center gap-3 py-1 mb-2">
              <button
                onClick={() => setActiveTab('orders')}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">Track Order</h1>
            </div>

            {/* Top Order Confirmation Banner Card */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-1 shadow-2xs">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <h3 className="text-sm font-extrabold">
                  {selectedOrderForTracking.status === 'delivered' ? 'Order Delivered' :
                   selectedOrderForTracking.status === 'cancelled' ? 'Order Cancelled' :
                   selectedOrderForTracking.status === 'out_for_delivery' ? 'Order Out for Delivery' :
                   'Order Confirmed'}
                </h3>
              </div>
              <p className="text-xs text-slate-600 font-medium pl-7">
                {selectedOrderForTracking.status === 'delivered' ? 'Your package has been delivered successfully' :
                 selectedOrderForTracking.status === 'cancelled' ? 'This order was cancelled' :
                 selectedOrderForTracking.status === 'out_for_delivery' ? 'Your order is out for delivery with our delivery partner' :
                 'Your order has been confirmed'}
              </p>
              <div className="pl-7 pt-2 flex items-center justify-between text-xs font-bold text-slate-700 border-t border-emerald-100 mt-2">
                <span>Order ID: <span className="font-extrabold text-slate-900">#ORD{selectedOrderForTracking.id}</span></span>
                <span className="text-[11px] text-slate-500">
                  Placed on: {selectedOrderForTracking.created_at ? new Date(selectedOrderForTracking.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '12 May 2024'}
                </span>
              </div>
            </div>

            {/* Simple Order Progress Status Badges (No vertical timeline lines) */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
              <h4 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2">Order Progress Status</h4>
              <div className="grid grid-cols-5 text-center text-[9px] font-black gap-1">
                <div className={`py-2 px-0.5 rounded-lg border transition-all ${
                  ['placed', 'confirmed', 'packed', 'shipped', 'dispatched', 'out_for_delivery', 'delivered'].includes((selectedOrderForTracking.status || '').toLowerCase())
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                  ✓ Placed
                </div>
                <div className={`py-2 px-0.5 rounded-lg border transition-all ${
                  ['confirmed', 'packed', 'shipped', 'dispatched', 'out_for_delivery', 'delivered'].includes((selectedOrderForTracking.status || '').toLowerCase())
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                  ✓ Confirmed
                </div>
                <div className={`py-2 px-0.5 rounded-lg border transition-all ${
                  ['packed', 'shipped', 'dispatched', 'out_for_delivery', 'delivered'].includes((selectedOrderForTracking.status || '').toLowerCase())
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                  ✓ Packed
                </div>
                <div className={`py-2 px-0.5 rounded-lg border transition-all ${
                  ['shipped', 'dispatched', 'out_for_delivery', 'delivered'].includes((selectedOrderForTracking.status || '').toLowerCase())
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                  ✓ Shipped
                </div>
                <div className={`py-2 px-0.5 rounded-lg border transition-all ${
                  (selectedOrderForTracking.status || '').toLowerCase() === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  (selectedOrderForTracking.status || '').toLowerCase() === 'out_for_delivery' ? 'bg-purple-50 text-purple-700 border-purple-200 font-extrabold' :
                  'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                  {selectedOrderForTracking.status === 'delivered' ? '✓ Delivered' : 'Out for Delivery'}
                </div>
              </div>
            </div>

            {/* Delivery Partner Details Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900">Delivery Partner</h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-black text-xs">
                    {selectedOrderForTracking.courier_name?.[0] || 'BD'}
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">{selectedOrderForTracking.courier_name || 'BlueDart'}</p>
                    <p className="text-[11px] text-slate-500 font-semibold">Tracking ID: {selectedOrderForTracking.tracking_id || 'BD123456789'}</p>
                  </div>
                </div>
              </div>
              <a
                href={`tel:${selectedOrderForTracking.phone || '+91 9876543210'}`}
                className="w-full py-2.5 bg-white hover:bg-slate-50 text-indigo-700 font-extrabold text-xs rounded-xl border border-indigo-200 transition-all flex items-center justify-center gap-2 shadow-2xs block text-center"
              >
                <Phone className="w-3.5 h-3.5" /> Call Partner
              </a>
            </div>

            {/* Delivery Address Details Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <h4 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2">Delivery Address</h4>
              <div className="space-y-1 pt-1">
                <p className="text-xs font-extrabold text-slate-900">{selectedOrderForTracking.contact_name || contactName || userName || 'Rahul Sharma'}</p>
                <p className="text-xs font-semibold text-slate-600">{selectedOrderForTracking.phone || userPhone || '+91 9876543210'}</p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                  {selectedOrderForTracking.delivery_address || deliveryAddress || '44, Park Road, Hazratganj, Lucknow, Uttar Pradesh - 226001'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SELLER DASHBOARD & MY PRODUCTS MANAGEMENT */}
        {activeTab === 'seller' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* 1. SELLER DASHBOARD HEADER CARD (Matching Screenshot 1) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl shrink-0 font-bold border border-indigo-200 shadow-2xs">
                    🏪
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Welcome Back!</span>
                    <h2 className="text-base font-extrabold text-slate-900">{userName || contactName || 'Valued Seller'}</h2>
                    <p className="text-[11px] font-semibold text-slate-500">Seller ID: <span className="font-bold text-indigo-700">SEL{userId || 'N/A'}</span></p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
                  Active Seller
                </span>
              </div>

              {/* Today's Overview (4 Grid Boxes) */}
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-900">Today&apos;s Overview</h3>
                  <button onClick={() => setSellerTab('my_ads')} className="text-[11px] font-bold text-indigo-700 hover:underline">View All</button>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-200/80">
                    <h4 className="text-base font-black text-blue-900 leading-tight">{myProducts.length}</h4>
                    <p className="text-[9px] font-bold text-slate-500 mt-0.5 leading-tight">Total Products</p>
                  </div>
                  <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/80">
                    <h4 className="text-base font-black text-emerald-900 leading-tight">{myProducts.filter(p => (p.status || '').toLowerCase() === 'active').length}</h4>
                    <p className="text-[9px] font-bold text-slate-500 mt-0.5 leading-tight">Active Ads</p>
                  </div>
                  <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/80">
                    <h4 className="text-base font-black text-amber-900 leading-tight">{sellerOrders.length}</h4>
                    <p className="text-[9px] font-bold text-slate-500 mt-0.5 leading-tight">Orders</p>
                  </div>
                  <div className="bg-purple-50/60 p-2.5 rounded-xl border border-purple-200/80">
                    <h4 className="text-sm font-black text-purple-900 leading-tight">
                      ₹{sellerOrders.reduce((sum, o) => sum + (parseFloat(String(o.total_amount || 0)) || 0), 0).toLocaleString('en-IN')}
                    </h4>
                    <p className="text-[9px] font-bold text-slate-500 mt-0.5 leading-tight">Total Earning</p>
                  </div>
                </div>
              </div>

              {/* Orders Summary (4 Status Cards matching Screenshot 1) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-900">Orders Summary</h3>
                  <button onClick={() => setSellerTab('orders')} className="text-[11px] font-bold text-indigo-700 hover:underline">View All</button>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-1">
                    <ShoppingBag className="w-4 h-4 text-blue-600 mx-auto" />
                    <h4 className="text-xs font-black text-slate-900">{sellerOrders.filter(o => (o.status || '').toLowerCase() === 'placed').length}</h4>
                    <p className="text-[9px] font-bold text-slate-500">New Orders</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    <h4 className="text-xs font-black text-slate-900">{sellerOrders.filter(o => (o.status || '').toLowerCase() === 'confirmed').length}</h4>
                    <p className="text-[9px] font-bold text-slate-500">Confirmed</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-1">
                    <Truck className="w-4 h-4 text-indigo-600 mx-auto" />
                    <h4 className="text-xs font-black text-slate-900">{sellerOrders.filter(o => ['shipped', 'out_for_delivery', 'dispatched'].includes((o.status || '').toLowerCase())).length}</h4>
                    <p className="text-[9px] font-bold text-slate-500">Shipped</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-1">
                    <Box className="w-4 h-4 text-emerald-600 mx-auto" />
                    <h4 className="text-xs font-black text-slate-900">{sellerOrders.filter(o => (o.status || '').toLowerCase() === 'delivered').length}</h4>
                    <p className="text-[9px] font-bold text-slate-500">Delivered</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid (Matching Screenshot 1) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-extrabold text-slate-900">Quick Actions</h3>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-extrabold text-slate-700">
                  <button
                    onClick={() => { setActiveTab('sell'); setWizardStep(1); }}
                    className="bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200 flex flex-col items-center gap-1 transition-all"
                  >
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                      +
                    </div>
                    <span>Add Product</span>
                  </button>
                  <button
                    onClick={() => setSellerTab('my_ads')}
                    className="bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200 flex flex-col items-center gap-1 transition-all"
                  >
                    <Package className="w-5 h-5 text-emerald-600" />
                    <span>My Products</span>
                  </button>
                  <button
                    onClick={() => setSellerTab('orders')}
                    className="bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200 flex flex-col items-center gap-1 transition-all"
                  >
                    <ShoppingBag className="w-5 h-5 text-amber-600" />
                    <span>My Orders</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. SELLER NAVIGATION TABS */}
            <div className="flex border-b border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setSellerTab('my_ads')}
                className={`py-2 px-4 border-b-2 transition-all ${sellerTab === 'my_ads' ? 'border-indigo-600 text-indigo-700 font-extrabold' : 'border-transparent text-slate-500 font-bold'}`}
              >
                My Products / My Ads ({myProducts.length})
              </button>
              <button
                onClick={() => setSellerTab('orders')}
                className={`py-2 px-4 border-b-2 transition-all ${sellerTab === 'orders' ? 'border-indigo-600 text-indigo-700 font-extrabold' : 'border-transparent text-slate-500 font-bold'}`}
              >
                Received Orders ({sellerOrders.length})
              </button>
            </div>

            {/* 3. MY PRODUCTS / MY ADS SECTION (Matching Screenshot 2) */}
            {sellerTab === 'my_ads' && (
              <div className="space-y-3">
                {/* Filter Pills Bar: All, Active, Pending, Inactive (Matching Screenshot 2) */}
                <div className="flex border-b border-slate-200 text-xs font-semibold overflow-x-auto no-scrollbar gap-2 pb-0.5">
                  {(['all', 'active', 'pending', 'inactive'] as const).map((tab) => {
                    const count = tab === 'all' ? myProducts.length : myProducts.filter(p => (p.status || 'active').toLowerCase() === tab).length;
                    const isActive = sellerFilterTab === tab;

                    return (
                      <button
                        key={tab}
                        onClick={() => setSellerFilterTab(tab)}
                        className={`py-1.5 px-3.5 rounded-full text-xs transition-all font-extrabold capitalize shrink-0 border ${
                          isActive
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {tab === 'all' ? `All (${count})` :
                         tab === 'active' ? `Active (${count})` :
                         tab === 'pending' ? `Pending (${count})` :
                         `Inactive (${count})`}
                      </button>
                    );
                  })}
                </div>

                {/* Filtered Product Cards List (Horizontal Row Layout matching Screenshot 2) */}
                {(() => {
                  const filtered = myProducts.filter(p => {
                    const st = (p.status || 'active').toLowerCase();
                    if (sellerFilterTab === 'active') return st === 'active';
                    if (sellerFilterTab === 'pending') return st === 'pending';
                    if (sellerFilterTab === 'inactive') return st === 'inactive';
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-2">
                        <Package className="w-8 h-8 text-slate-300 mx-auto" />
                        <h3 className="text-sm font-bold text-slate-800">No products found</h3>
                        <p className="text-xs text-slate-500">You haven't posted any products under this tab yet.</p>
                        <button
                          onClick={() => { setActiveTab('sell'); setWizardStep(1); }}
                          className="mt-2 bg-[#047857] text-white font-bold text-xs px-4 py-2 rounded-xl"
                        >
                          + Post New Ad
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2.5">
                      {filtered.map(prod => {
                        const imgPath = prod.images?.[0]?.image_path || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80';
                        const isProdActive = (prod.status || '').toLowerCase() === 'active';
                        const isProdPending = (prod.status || '').toLowerCase() === 'pending';
                        const formattedDate = prod.created_at ? new Date(prod.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '12 May 2024';

                        return (
                          <div key={prod.id} className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-2">
                            <div className="flex gap-3 items-center">
                              {/* Thumbnail */}
                              <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                <img
                                  src={normalizeImageUrl(imgPath)}
                                  alt={prod.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80';
                                  }}
                                />
                              </div>

                              {/* Details */}
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <h4 className="text-xs font-extrabold text-slate-900 truncate">{prod.title}</h4>
                                <p className="text-sm font-black text-emerald-600">₹{prod.price.toLocaleString('en-IN')}</p>
                                
                                <div className="flex items-center gap-2 text-[10px] font-bold pt-0.5">
                                  <span className="text-purple-700 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 inline-block"></span>
                                    {prod.condition === 'New' ? 'New' : 'Old'}
                                  </span>
                                  <span className={`flex items-center gap-1 ${
                                    isProdActive ? 'text-emerald-700' :
                                    isProdPending ? 'text-amber-600' : 'text-slate-500'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                                      isProdActive ? 'bg-emerald-600' :
                                      isProdPending ? 'bg-amber-500' : 'bg-slate-400'
                                    }`}></span>
                                    {isProdActive ? 'Active' : isProdPending ? 'Pending' : 'Inactive'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Bottom Row: Creation Date & Action Buttons (Edit + Enable/Disable + Delete) */}
                            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                              <span className="text-[10px] font-semibold text-slate-400">{formattedDate}</span>

                              <div className="flex items-center gap-1.5">
                                {/* Edit Button */}
                                <button
                                  type="button"
                                  onClick={() => handleStartEditProduct(prod)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-extrabold flex items-center gap-1 transition-all"
                                >
                                  <Edit2 className="w-3 h-3 text-slate-600" /> Edit
                                </button>

                                {/* Enable / Disable Toggle Action Button */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleProductStatus(prod)}
                                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-extrabold flex items-center gap-1 transition-all ${
                                    isProdActive
                                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  {isProdActive ? 'Disable' : 'Enable'}
                                </button>

                                {/* Delete Button */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(prod.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add New Product CTA Button matching Screenshot 2 */}
                      <button
                        onClick={() => { setActiveTab('sell'); setWizardStep(1); }}
                        className="w-full py-3 bg-white hover:bg-indigo-50/50 text-indigo-700 font-extrabold text-xs rounded-2xl border-2 border-dashed border-indigo-300 flex items-center justify-center gap-2 transition-all mt-3 shadow-2xs"
                      >
                        <Plus className="w-4 h-4 text-indigo-600" /> Add New Product
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}

            {sellerTab === 'orders' && (
              <div className="space-y-3">
                {sellerOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-2">
                    <Box className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600">No customer orders received yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sellerOrders.map(order => {
                      const buyerName = order.contact_name || order.buyer?.name || (order.buyer as any)?.prenom || 'Customer';
                      const buyerPhone = order.phone || order.buyer?.phone || (order.buyer as any)?.mobile || 'N/A';
                      const productItem = order.items?.[0]?.product;
                      const productTitle = productItem?.title || 'Marketplace Item';
                      const productSpecs = productItem?.specifications || '';

                      return (
                        <div key={order.id} className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 shadow-2xs">
                          {/* Order Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                           
                            <span className="text-[10px] font-bold text-[#047857] bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 uppercase">
                              {order.status}
                            </span>
                          </div>

                          {/* Customer / Buyer Information */}
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1 text-xs">
                            <p className="font-bold text-slate-900">
                               Customer Name: <span className="text-[#047857]">{buyerName}</span>
                            </p>
                            <p className="font-semibold text-slate-700">
                               Phone Number: <span className="font-bold text-slate-900">{buyerPhone}</span>
                            </p>
                            <p className="font-medium text-slate-600 leading-snug">
                              📍 Address: <span className="text-slate-800 font-semibold">{order.delivery_address}</span>
                            </p>
                          </div>

                          {/* Product Details & Specifications */}
                          <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-200 space-y-1.5">
                            <p className="text-xs font-bold text-slate-900">
                               Product Name: <span className="text-[#047857]">{productTitle}</span>
                            </p>
                            {productSpecs && (
                              <div className="space-y-1 pt-1 border-t border-emerald-200/60">
                                <p className="text-[11px] font-bold text-[#047857] uppercase tracking-wider">
                                   Specifications (Size / Gender / Age Group):
                                </p>
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                  {productSpecs.split('|').map((spec, idx) => (
                                    <span
                                      key={idx}
                                      className="bg-white text-slate-900 border border-emerald-300 font-extrabold text-[11px] px-2.5 py-1 rounded-md shadow-2xs"
                                    >
                                      {spec.trim()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Earnings & Escrow Payout Breakdown */}
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs">
                            <div className="flex justify-between items-center text-slate-700">
                              <span>Gross Sale:</span>
                              <span className="font-bold text-slate-900">₹{(order.subtotal || order.total_amount || 0).toLocaleString()}</span>
                            </div>
                            {(order as any).admin_commission_amount > 0 && (
                              <div className="flex justify-between items-center text-red-600">
                                <span>Platform Commission ({(order as any).admin_commission_rate || 5}%):</span>
                                <span className="font-bold">-₹{((order as any).admin_commission_amount).toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center border-t border-slate-200 pt-1.5 font-bold">
                              <span className="text-emerald-700">Net Seller Payout:</span>
                              <span className="text-emerald-700 text-sm font-black">₹{((order as any).seller_payout_amount || (order.subtotal || order.total_amount || 0)).toLocaleString()}</span>
                            </div>
                            <div className="pt-1">
                              {(order as any).payout_status === 'released' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  ✓ Payout Credited to Wallet
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                  ⏳ Held in Escrow (Settles upon Admin Confirmation)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Update Shipping Status Action */}
                          <button
                            onClick={() => setSelectedSellerOrder(order)}
                            className="w-full bg-[#047857] hover:bg-[#065f46] text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition-all"
                          >
                            Update Shipping Status
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: SELL PRODUCT FORM SCREEN */}
        {activeTab === 'sell' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Post New Product Ad</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b pb-2">1. Product Information</h3>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Product Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. iPhone 13 (128GB) Blue"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#047857]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Brand Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Apple, Samsung, Nike..."
                    value={newBrandName}
                    onChange={e => setNewBrandName(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#047857]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Category *</label>
                  <select
                    value={newCategory}
                    onChange={e => {
                      setNewCategory(parseInt(e.target.value));
                      setNewConditionDetail('');
                    }}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#047857]"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Condition *</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setNewCondition('Used')}
                      className={`py-2 rounded-xl border text-xs font-semibold ${newCondition === 'Used' ? 'bg-[#047857] text-white border-[#047857]' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                    >
                      Used / Pre-Owned
                    </button>
                    <button
                      type="button"
                      onClick={() => { setNewCondition('New'); setNewConditionDetail('Brand New'); }}
                      className={`py-2 rounded-xl border text-xs font-semibold ${newCondition === 'New' ? 'bg-[#047857] text-white border-[#047857]' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                    >
                      Brand New
                    </button>
                  </div>

                  {/* Sub-Condition based on Category */}
                  {newCondition === 'Used' && (
                    <div className="space-y-1.5 mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[11px] font-bold text-slate-700 uppercase">Item Condition Detail *</label>
                      {[1, 2, 10, 11, 13].includes(newCategory) ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setNewConditionDetail('Working')}
                            className={`py-1.5 rounded-lg border text-xs font-bold ${newConditionDetail === 'Working' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'}`}
                          >
                            A - Working
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewConditionDetail('Not Working')}
                            className={`py-1.5 rounded-lg border text-xs font-bold ${newConditionDetail === 'Not Working' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 border-slate-200'}`}
                          >
                            B - Not Working
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setNewConditionDetail('Scratched')}
                            className={`py-1.5 rounded-lg border text-xs font-bold ${newConditionDetail === 'Scratched' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-700 border-slate-200'}`}
                          >
                            A - Scratched
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewConditionDetail('Damage')}
                            className={`py-1.5 rounded-lg border text-xs font-bold ${newConditionDetail === 'Damage' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 border-slate-200'}`}
                          >
                            B - Damage
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 border-b pb-2 pt-2">2. Pricing, MRP & Stock</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Selling Price (₹) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 25000"
                      value={newPrice}
                      onChange={e => {
                        const val = e.target.value;
                        setNewPrice(val);
                        const p = parseFloat(val) || 0;
                        const orig = parseFloat(newOriginalPrice) || 0;
                        if (orig > p && p > 0) {
                          setNewDiscountPercent(Math.round(((orig - p) / orig) * 100).toString());
                        }
                      }}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#047857]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Original MRP (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 30000"
                      value={newOriginalPrice}
                      onChange={e => {
                        const val = e.target.value;
                        setNewOriginalPrice(val);
                        const orig = parseFloat(val) || 0;
                        const p = parseFloat(newPrice) || 0;
                        if (orig > p && p > 0) {
                          setNewDiscountPercent(Math.round(((orig - p) / orig) * 100).toString());
                        }
                      }}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#047857]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Stock Qty *</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 10"
                      value={newStock}
                      onChange={e => setNewStock(e.target.value)}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#047857]"
                    />
                  </div>
                </div>

                {parseFloat(newOriginalPrice) > parseFloat(newPrice) && parseFloat(newPrice) > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-emerald-800 font-semibold">Calculated Discount:</span>
                    <span className="font-extrabold text-[#047857]">
                      {Math.round(((parseFloat(newOriginalPrice) - parseFloat(newPrice)) / parseFloat(newOriginalPrice)) * 100)}% OFF (Save ₹{(parseFloat(newOriginalPrice) - parseFloat(newPrice)).toLocaleString()})
                    </span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-700">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Mention working condition, warranty details, features..."
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#047857]"
                  />
                </div>

                {/* EXTRA FIELD BELOW DESCRIPTION FOR PRODUCT SPECIFICATION (Size, Gender, Age Group) */}
                <div className="space-y-1.5 bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#047857] flex items-center gap-1">
                      <span>Product Specifications</span>
                      <span className="text-[10px] font-normal text-emerald-800">(Size, Gender, Age Group)</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Size: XL | Gender: Men | Age: Adults | Material: Cotton"
                    value={newSpecifications}
                    onChange={e => setNewSpecifications(e.target.value)}
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#047857]"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="text-[10px] text-slate-500 font-semibold self-center mr-1">Quick Add:</span>
                    {['Size: M', 'Size: L', 'Size: XL', 'Gender: Men', 'Gender: Women', 'Age: Kids', 'Age: Adults'].map(chip => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          if (!newSpecifications.includes(chip)) {
                            setNewSpecifications(prev => prev ? `${prev} | ${chip}` : chip);
                          }
                        }}
                        className="text-[10px] font-bold bg-white text-[#047857] hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md shadow-2xs transition-all"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Delivery Process *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* A) Local Delivery */}
                    <button
                      type="button"
                      onClick={() => setNewDeliveryType('Local Delivery')}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        newDeliveryType === 'Local Delivery'
                          ? 'bg-emerald-50 border-[#047857] text-[#047857] font-bold shadow-2xs ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-lg block mb-0.5">📍</span>
                      <span className="text-xs font-bold block">A) Local</span>
                      <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">Same City Only</span>
                    </button>

                    {/* B) Pan India */}
                    <button
                      type="button"
                      onClick={() => setNewDeliveryType('Pan India')}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        newDeliveryType === 'Pan India'
                          ? 'bg-blue-50 border-blue-600 text-blue-800 font-bold shadow-2xs ring-2 ring-blue-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-lg block mb-0.5">🇮🇳</span>
                      <span className="text-xs font-bold block">B) Pan India</span>
                      <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">All India Users</span>
                    </button>

                    {/* C) Digital Delivery */}
                    <button
                      type="button"
                      onClick={() => setNewDeliveryType('Digital Delivery')}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        newDeliveryType === 'Digital Delivery'
                          ? 'bg-purple-50 border-purple-600 text-purple-800 font-bold shadow-2xs ring-2 ring-purple-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-lg block mb-0.5">⚡</span>
                      <span className="text-xs font-bold block">C) Digital</span>
                      <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">Instant Digital</span>
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 border-b pb-2 pt-2">3. Product Photos</h3>
                
                {/* Webview Compatible File Uploader */}
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center space-y-3 bg-slate-50">
                  <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">Select photos from Gallery or Camera</p>
                  
                  <div className="relative inline-block">
                    <input
                      type="file"
                      id="photo-upload-input"
                      accept="image/*"
                      multiple
                      onChange={handleImageFileChange}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#047857] file:text-white hover:file:bg-[#065f46] cursor-pointer"
                    />
                  </div>

                  {uploadingImage && (
                    <p className="text-xs font-bold text-[#047857] animate-pulse">Uploading photo(s)... Please wait.</p>
                  )}
                </div>

                {/* Alternative URL Input Option */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">Or Add Photo Link (URL)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste image web link (https://...)"
                      id="imageUrlInput"
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-[#047857]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('imageUrlInput') as HTMLInputElement;
                        if (input && input.value.trim()) {
                          setUploadedImages(prev => [...prev, input.value.trim()].slice(0, 5));
                          input.value = '';
                        }
                      }}
                      className="bg-[#047857] text-white font-semibold text-xs px-3 py-1.5 rounded-xl"
                    >
                      Add Link
                    </button>
                  </div>
                </div>

                {/* Photo Preview Thumbnails with Remove Button */}
                {uploadedImages.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-600">Attached Photos ({uploadedImages.length}/5):</p>
                    <div className="flex gap-2 overflow-x-auto py-1">
                      {uploadedImages.map((img, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 group">
                          <img src={img} alt="preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5 text-[9px] font-bold shadow-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); handleSubmitNewProduct(); }}
                    disabled={submittingProduct || uploadingImage}
                    className="w-full bg-[#047857] hover:bg-[#065f46] disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl shadow-xs"
                  >
                    {submittingProduct ? 'Publishing Product Ad...' : 'Publish Product Ad'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CART & CHECKOUT DRAWER WITH EDITABLE DELIVERY ADDRESS */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-slide-left">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {checkoutStep === 'checkout' ? (
                  <button
                    onClick={() => setCheckoutStep('cart')}
                    className="flex items-center gap-1 text-xs font-bold text-[#047857] hover:underline"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back to Cart
                  </button>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-[#047857]" />
                    <h2 className="text-sm font-bold text-slate-900">Your Cart ({cart.length})</h2>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {checkoutStep === 'cart' && cart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllCart}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Clear All
                  </button>
                )}
                <button onClick={() => setIsCartOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">Your cart is empty</p>
                  <button onClick={() => setIsCartOpen(false)} className="text-xs font-bold text-[#047857]">Browse Marketplace</button>
                </div>
              ) : checkoutStep === 'cart' ? (
                cart.map(item => (
                  <div key={item.product.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between gap-3">
                    <img src={item.product.images?.[0]?.image_path || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80'} alt={item.product.title} className="w-12 h-12 rounded-lg object-cover bg-white" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{item.product.title}</h4>
                      <p className="text-xs font-bold text-[#047857]">₹{item.product.price.toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-2 border border-slate-200 rounded-lg bg-white p-1">
                      <button onClick={() => updateCartQty(item.product.id, -1)} className="px-2 font-bold text-slate-600 text-xs">-</button>
                      <span className="text-xs font-bold text-slate-900">{item.quantity}</span>
                      <button onClick={() => updateCartQty(item.product.id, 1)} className="px-2 font-bold text-slate-600 text-xs">+</button>
                    </div>

                    <button onClick={() => removeCartItem(item.product.id)} className="text-slate-400 hover:text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : checkoutStep === 'checkout' ? (
                <div className="space-y-4">
                  {/* EDITABLE DELIVERY ADDRESS SECTION */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#047857]" /> Delivery Address
                      </span>
                      <button
                        onClick={() => setIsEditingAddress(!isEditingAddress)}
                        className="text-[11px] font-bold text-[#047857] hover:underline flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> {isEditingAddress ? 'Cancel' : 'Edit Address'}
                      </button>
                    </div>

                    {isEditingAddress ? (
                      <div className="space-y-2 pt-1 text-xs">
                        <div>
                          <label className="font-semibold text-slate-700">Contact Name</label>
                          <input
                            type="text"
                            value={contactName}
                            onChange={e => setContactName(e.target.value)}
                            placeholder="Full Name"
                            className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700">Street Address & Landmark</label>
                          <input
                            type="text"
                            value={editStreetAddress}
                            onChange={e => setEditStreetAddress(e.target.value)}
                            placeholder="House No, Colony, Landmark"
                            className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="font-semibold text-slate-700">City</label>
                            <input
                              type="text"
                              value={editCity}
                              onChange={e => setEditCity(e.target.value)}
                              placeholder="City"
                              className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-slate-700">Pincode</label>
                            <input
                              type="text"
                              value={editPincode}
                              onChange={e => setEditPincode(e.target.value)}
                              placeholder="Pincode"
                              className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700">Mobile Phone</label>
                          <input
                            type="text"
                            value={editPhone}
                            onChange={e => setEditPhone(e.target.value)}
                            placeholder="Mobile Phone"
                            className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                          />
                        </div>
                        <button
                          onClick={handleApplyAddressEdit}
                          className="w-full bg-[#047857] text-white text-xs font-bold py-2 rounded-lg mt-1"
                        >
                          Save & Apply Address
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-700 space-y-0.5">
                        <p className="font-bold text-slate-900">{contactName}</p>
                        <p className="text-slate-600">{deliveryAddress}</p>
                        <p className="text-[11px] text-slate-500 font-medium">Phone: {userPhone || editPhone}</p>
                      </div>
                    )}
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-800">Select Payment Method</label>
                    <div className="space-y-2">
                      <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${paymentMethod === 'wallet' ? 'border-[#047857] bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-center gap-2.5">
                          <input type="radio" name="payMethod" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} className="text-[#047857]" />
                          <div>
                            <p className="text-xs font-bold text-slate-900">Pay &amp; Get Cashback</p>
                            <p className="text-[10px] text-slate-500">Smart Value Wallet • Available: ₹{walletBalance.toLocaleString()}</p>
                          </div>
                        </div>
                        <Wallet className="w-4 h-4 text-[#047857]" />
                      </label>

                      <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${paymentMethod === 'razorpay' ? 'border-[#047857] bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-center gap-2.5">
                          <input type="radio" name="payMethod" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} className="text-[#047857]" />
                          <div>
                            <p className="text-xs font-bold text-slate-900">Razorpay / UPI / Cards / GPay</p>
                            <p className="text-[10px] text-slate-500">Instant Online Gateway Payment (UPI Apps & Cards)</p>
                          </div>
                        </div>
                        <CreditCard className="w-4 h-4 text-[#047857]" />
                      </label>

                     
                    </div>
                  </div>
                </div>
              ) : (
                /* SUCCESS STEP */
                <div className="text-center py-12 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-[#047857] mx-auto" />
                  <h3 className="text-base font-bold text-slate-900">Order Placed Successfully!</h3>
                 
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setCheckoutStep('cart');
                      setActiveTab('orders');
                    }}
                    className="bg-[#047857] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs"
                  >
                    View My Orders
                  </button>
                </div>
              )}
            </div>

            {cart.length > 0 && checkoutStep !== 'success' && (
              <div className="p-4 border-t border-slate-200 space-y-2.5 bg-slate-50">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Item Subtotal ({selectedCartItems.length} item{selectedCartItems.length > 1 ? 's' : ''})</span>
                  <span className="font-bold text-slate-900">₹{cartSubtotal.toLocaleString()}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-xs text-indigo-700 font-medium">
                    <span>Taxes &amp; Govt Charges ({taxName} {taxRate}%):</span>
                    <span className="font-bold">+₹{taxAmount.toLocaleString()}</span>
                  </div>
                )}
                {deliveryFee > 0 ? (
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Express Delivery:</span>
                    <span className="font-bold">+₹{deliveryFee}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-xs text-emerald-600 font-medium">
                    <span>Delivery Charges:</span>
                    <span className="font-bold uppercase text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded">Free Delivery</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black border-t border-slate-200 pt-2.5">
                  <span className="text-slate-900">Total Payable Amount</span>
                  <span className="text-[#047857] text-base">₹{cartTotal.toLocaleString()}</span>
                </div>

                {checkoutStep === 'cart' ? (
                  <button
                    onClick={() => setCheckoutStep('checkout')}
                    className="w-full bg-[#047857] hover:bg-[#065f46] text-white font-bold text-xs py-3 rounded-xl shadow-xs"
                  >
                    Proceed to Checkout
                  </button>
                ) : (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placingOrder}
                    className="w-full bg-[#047857] hover:bg-[#065f46] text-white font-bold text-xs py-3 rounded-xl shadow-xs"
                  >
                    {placingOrder ? 'Processing Order...' : `Pay ₹${cartTotal.toLocaleString()} & Confirm`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SELLER SHIPPING STATUS UPDATE MODAL */}
      {selectedSellerOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            
              <button onClick={() => setSelectedSellerOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Courier Partner</label>
                <input
                  type="text"
                  value={shippingCourier}
                  onChange={e => setShippingCourier(e.target.value)}
                  placeholder="e.g. BlueDart / Delhivery"
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Tracking Number ID</label>
                <input
                  type="text"
                  value={shippingTrackingId}
                  onChange={e => setShippingTrackingId(e.target.value)}
                  placeholder="e.g. BD9821414IN"
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleUpdateSellerOrderStatus('processing')}
                  disabled={updatingOrderStatus}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl"
                >
                  Mark Processing
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateSellerOrderStatus('dispatched')}
                  disabled={updatingOrderStatus}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl"
                >
                  Mark Shipped
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateSellerOrderStatus('out_for_delivery')}
                  disabled={updatingOrderStatus}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 rounded-xl"
                >
                  Out for Delivery
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateSellerOrderStatus('delivered')}
                  disabled={updatingOrderStatus}
                  className="bg-[#047857] hover:bg-[#065f46] text-white font-semibold py-2 rounded-xl"
                >
                  Mark Delivered
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STICKY MOBILE BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1 text-center">
          {/* 0. BACK BUTTON (FAR LEFT) */}
          <button
            type="button"
            onClick={handleBackNav}
            className="flex flex-col items-center justify-center py-1 rounded-xl text-slate-500 hover:text-slate-900 transition-all active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[10px] mt-0.5 font-bold">Back</span>
          </button>

          {/* 1. HOME TAB */}
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'home' ? 'text-[#047857] font-bold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Compass className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5">Home</span>
          </button>

          {/* 2. MY ORDERS TAB */}
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'orders' ? 'text-[#047857] font-bold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Package className={`w-5 h-5 ${activeTab === 'orders' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5">Orders</span>
            {buyerOrders.length > 0 && (
              <span className="absolute top-0 right-2 bg-emerald-600 text-white text-[9px] font-bold px-1 rounded-full">
                {buyerOrders.length}
              </span>
            )}
          </button>

          {/* 3. SELLER DASHBOARD TAB */}
          <button
            type="button"
            onClick={() => setActiveTab('seller')}
            className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'seller' ? 'text-[#047857] font-bold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Tag className={`w-5 h-5 ${activeTab === 'seller' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5">Seller</span>
            {sellerOrders.length > 0 && (
              <span className="absolute top-0 right-2 bg-amber-500 text-white text-[9px] font-bold px-1 rounded-full">
                {sellerOrders.length}
              </span>
            )}
          </button>

          {/* 4. POST NEW AD TAB */}
          <button
            type="button"
            onClick={() => { setActiveTab('sell'); setWizardStep(1); }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'sell' ? 'text-[#047857] font-bold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Plus className={`w-5 h-5 ${activeTab === 'sell' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5">Post Ad</span>
          </button>
        </div>
      </div>

      {/* WALLET M-PIN AUTHORIZATION POPUP MODAL */}
      {showMPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-[#047857]">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Wallet Security M-PIN</h3>
              </div>
              <button onClick={() => { setShowMPinModal(false); setMPinInput(''); setMPinError(''); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 text-center space-y-1">
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">Pay Via Smart Value</span>
              <p className="text-xl font-extrabold text-[#047857] dark:text-emerald-400">₹{cartTotal.toLocaleString()}</p>
              
            </div>

            <form onSubmit={handleConfirmMPinPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 text-center">
                  Enter 4-Digit Wallet M-PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  autoFocus
                  placeholder="••••"
                  value={mPinInput}
                  onChange={(e) => setMPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full text-center tracking-[0.5em] text-2xl font-extrabold bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-[#047857] rounded-2xl py-3 text-slate-900 dark:text-white focus:outline-none transition-all"
                />
              </div>

              {mPinError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl text-center">
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1.5">
                    <span>⚠️</span> {mPinError}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowMPinModal(false); setMPinInput(''); setMPinError(''); }}
                  className="py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyingMPin || mPinInput.length !== 4}
                  className="py-3 bg-[#047857] hover:bg-[#035e44] text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-700/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {verifyingMPin ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                    </>
                  ) : (
                    'Authorize & Pay'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLOATING ADD-TO-CART SNACKBAR / TOAST */}
      {cartToast && (
        <div className="fixed bottom-20 left-4 right-4 z-45 max-w-md mx-auto animate-slide-up">
          <div className="bg-slate-900/95 text-white backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate text-white">{cartToast.productName}</p>
                <p className="text-[10px] text-emerald-400 font-semibold">{cartToast.message} • ₹{cartToast.price.toLocaleString()}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setCartToast(null);
                setCheckoutStep('cart');
                setIsCartOpen(true);
              }}
              className="bg-[#047857] hover:bg-[#065f46] text-white text-xs font-bold px-3 py-1.5 rounded-xl shrink-0 flex items-center gap-1 shadow-xs"
            >
              <span>View Cart</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ADVANCED FILTER & SORT MODAL */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl animate-slide-up sm:animate-in overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-[#047857]">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Filter &amp; Sort Products</h3>
                  <p className="text-[10px] text-slate-500">Refine your marketplace browsing</p>
                </div>
              </div>
              <button onClick={() => setIsFilterModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* 1. Sort Order */}
              <div className="space-y-2">
                <label className="font-bold text-slate-900 block">Sort Order</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'default', label: 'Default / Featured' },
                    { id: 'newest', label: '✨ Newest Listings' },
                    { id: 'price_asc', label: 'Price: Low to High' },
                    { id: 'price_desc', label: 'Price: High to Low' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSortOrder(opt.id as any)}
                      className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
                        sortOrder === opt.id
                          ? 'bg-emerald-50 text-[#047857] border-emerald-300 ring-1 ring-emerald-400'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Price Range */}
              <div className="space-y-2">
                <label className="font-bold text-slate-900 block">Price Range</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under_1k', label: 'Under ₹1,000' },
                    { id: '1k_5k', label: '₹1,000 - ₹5,000' },
                    { id: '5k_20k', label: '₹5,000 - ₹20,000' },
                    { id: 'above_20k', label: 'Above ₹20,000' },
                  ].map(pr => (
                    <button
                      key={pr.id}
                      type="button"
                      onClick={() => setPriceFilter(pr.id as any)}
                      className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
                        priceFilter === pr.id
                          ? 'bg-emerald-50 text-[#047857] border-emerald-300 ring-1 ring-emerald-400'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {pr.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Condition */}
              <div className="space-y-2">
                <label className="font-bold text-slate-900 block">Item Condition</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['All', 'New', 'Used'] as const).map(cond => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => setConditionFilter(cond)}
                      className={`p-2.5 rounded-xl border text-center font-semibold transition-all ${
                        conditionFilter === cond
                          ? 'bg-emerald-50 text-[#047857] border-emerald-300 ring-1 ring-emerald-400'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cond === 'All' ? 'All Items' : cond === 'New' ? 'Brand New' : 'Gently Used'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Delivery Method */}
              <div className="space-y-2">
                <label className="font-bold text-slate-900 block">Delivery Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'all', label: 'All Modes' },
                    { id: 'pan_india', label: 'Courier Delivery' },
                    { id: 'local', label: 'Self Direct Pickup' },
                  ].map(del => (
                    <button
                      key={del.id}
                      type="button"
                      onClick={() => setDeliveryFilter(del.id as any)}
                      className={`p-2.5 rounded-xl border text-center font-semibold transition-all ${
                        deliveryFilter === del.id
                          ? 'bg-emerald-50 text-[#047857] border-emerald-300 ring-1 ring-emerald-400'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {del.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Categories Filter */}
              <div className="space-y-2">
                <label className="font-bold text-slate-900 block">Categories</label>
                <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className={`p-2 rounded-xl border text-center font-semibold transition-all ${
                      selectedCategory === null
                        ? 'bg-emerald-50 text-[#047857] border-emerald-300 ring-1 ring-emerald-400'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🏷️ All Categories
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-2 rounded-xl border text-center font-semibold truncate transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-emerald-50 text-[#047857] border-emerald-300 ring-1 ring-emerald-400'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat.icon || '📦'} {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="flex-1 bg-[#047857] hover:bg-[#065f46] text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <span>Apply Filters ({filteredProducts.length} Results)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CITY & LOCATION SELECTOR MODAL */}
      {isCityModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl animate-slide-up sm:animate-in overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-[#047857]">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Select Your City / Location</h3>
                  <p className="text-[10px] text-slate-500">Find marketplace products near you</p>
                </div>
              </div>
              <button onClick={() => setIsCityModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              {/* City Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search city or district..."
                  value={citySearchQuery}
                  onChange={(e) => setCitySearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#047857]"
                />
              </div>

              {/* Use Current GPS Location Button */}
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      async (pos) => {
                        try {
                          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
                          if (res.ok) {
                            const data = await res.json();
                            const city = data.address?.city || data.address?.town || data.address?.state_district || 'Kolkata';
                            const state = data.address?.state ? data.address.state.slice(0, 2).toUpperCase() : 'WB';
                            const fullLoc = `${city}, ${state}`;
                            setSelectedCity(fullLoc);
                            localStorage.setItem('fiinway_selected_city', fullLoc);
                            setIsCityModalOpen(false);
                            return;
                          }
                        } catch (e) {
                          // fallback
                        }
                        setSelectedCity('Kolkata, WB');
                        localStorage.setItem('fiinway_selected_city', 'Kolkata, WB');
                        setIsCityModalOpen(false);
                      },
                      () => {
                        setSelectedCity('Kolkata, WB');
                        localStorage.setItem('fiinway_selected_city', 'Kolkata, WB');
                        setIsCityModalOpen(false);
                      }
                    );
                  }
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#047857] hover:bg-emerald-100 transition-all font-bold text-xs"
              >
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  <span>Use Current Device Location</span>
                </div>
                <span className="text-[10px] bg-[#047857] text-white px-2 py-0.5 rounded-full font-semibold">GPS</span>
              </button>

              {/* Popular Cities Grid */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Cities &amp; Locations</label>
                <div className="grid grid-cols-2 gap-2">
                  {popularCities
                    .filter(c => citySearchQuery === '' || c.name.toLowerCase().includes(citySearchQuery.toLowerCase()) || c.state.toLowerCase().includes(citySearchQuery.toLowerCase()))
                    .map(city => (
                      <button
                        key={city.name}
                        type="button"
                        onClick={() => {
                          setSelectedCity(city.name);
                          localStorage.setItem('fiinway_selected_city', city.name);
                          setIsCityModalOpen(false);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          selectedCity === city.name
                            ? 'bg-emerald-50 text-[#047857] border-emerald-300 font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-xs font-bold">{city.name}</p>
                        <p className="text-[10px] text-slate-400">{city.state}</p>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
