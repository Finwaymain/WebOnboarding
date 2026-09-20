'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  MapPin,
  Clock,
  Star,
  ShoppingBag,
  ChevronRight,
  ArrowLeft,
  Plus,
  Minus,
  X,
  CheckCircle2,
  Bike,
  UtensilsCrossed,
  AlertCircle,
  Phone,
  ShieldCheck,
  RefreshCw,
  Store,
  Wallet,
  CreditCard,
  Banknote,
  Mic,
  SlidersHorizontal,
  Zap,
  Tag,
  Heart,
  ChevronDown,
  Flame,
  BadgePercent,
  Sparkles
} from 'lucide-react';

const API_KEY = "base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU=";

interface Restaurant {
  id: number;
  name: string;
  description?: string;
  address?: string;
  latitude?: number | string;
  longitude?: number | string;
  distance_km?: number;
  logo_url?: string;
  cover_url?: string;
  rating?: number;
  rating_avg?: number;
  rating_count?: number;
  pure_veg?: boolean;
  cuisines?: string[] | string;
  estimated_prep_time_minutes?: number;
  delivery_radius_km?: number;
  operational_status?: string;
}

interface Product {
  id: number;
  restaurant_id: number;
  category_id?: number;
  name: string;
  description?: string;
  customer_price?: number;
  restaurant_price?: number;
  base_price?: number;
  final_price?: number;
  price?: number;
  image_url?: string;
  food_type?: 'veg' | 'non-veg' | 'egg';
  is_available?: boolean;
  restaurant_name?: string;
}

interface Category {
  id: number;
  name: string;
  sort_order?: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

interface OrderConfirmation {
  id: number;
  order_number: string;
  delivery_otp?: string;
  customer_payable: number;
  order_status: string;
  distance_km?: number;
  delivery_charge?: number;
  platform_charges?: number;
  restaurant?: Restaurant;
}

interface Props {
  initialLat?: number;
  initialLng?: number;
  userPhone?: string;
  userName?: string;
  onSwitchToMerchant?: () => void;
}

const FOOD_STORIES = [
  { id: 'specials', name: 'Specials', icon: '👑', color: 'from-amber-400 to-orange-500' },
  { id: 'pizzas', name: 'Pizzas', icon: '🍕', color: 'from-red-400 to-rose-600' },
  { id: 'burgers', name: 'Burgers', icon: '🍔', color: 'from-amber-500 to-yellow-600' },
  { id: 'thali', name: 'Thali', icon: '🍱', color: 'from-emerald-400 to-teal-600' },
  { id: 'biryani', name: 'Biryani', icon: '🍗', color: 'from-orange-500 to-amber-600' },
  { id: 'sandwich', name: 'Sandwich', icon: '🥪', color: 'from-lime-400 to-green-600' },
  { id: 'rolls', name: 'Rolls', icon: '🌯', color: 'from-cyan-400 to-blue-600' },
  { id: 'desserts', name: 'Desserts', icon: '🍰', color: 'from-pink-400 to-rose-500' },
];

export default function CustomerFoodOrdering({
  initialLat,
  initialLng,
  userPhone = '',
  userName = '',
  onSwitchToMerchant,
}: Props) {
  // Web-only Location Management (No Flutter dependence)
  const [lat, setLat] = useState<number>(initialLat || 22.6066);
  const [lng, setLng] = useState<number>(initialLng || 88.4259);
  const [radiusKm] = useState<number>(25);
  const [locationName, setLocationName] = useState<string>('Locating your area...');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState<boolean>(false);
  const [customLocationInput, setCustomLocationInput] = useState<string>('');

  // Top Swiggy-style sub-tabs & Veg Toggle
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [topTab, setTopTab] = useState<'all' | 'store' | 'offers' | 'bolt' | 'eatright'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Multiple Filter Bar state
  const [filterSort, setFilterSort] = useState<'relevance' | 'rating' | 'time'>('relevance');
  const [filterFastDelivery, setFilterFastDelivery] = useState<boolean>(false);
  const [filter99Store, setFilter99Store] = useState<boolean>(false);
  const [filterRating4Plus, setFilterRating4Plus] = useState<boolean>(false);

  // Bottom Navigation Bar
  const [bottomNav, setBottomNav] = useState<'food' | 'bolt' | 'store' | 'offers' | 'cart'>('food');

  // Restaurant & Menu State
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState<boolean>(true);
  const [restaurantError, setRestaurantError] = useState<string>('');

  const [activeRestaurant, setActiveRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingMenu, setLoadingMenu] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Quick 99 Store Meals across restaurants
  const [quickMeals, setQuickMeals] = useState<Product[]>([]);

  // Cart State
  const [cart, setCart] = useState<{ [productId: number]: CartItem }>({});
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // Checkout Form Details
  const [customerName, setCustomerName] = useState<string>(userName);
  const [customerPhone, setCustomerPhone] = useState<string>(userPhone);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'upi' | 'cod'>('wallet');
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);

  // Live Order Tracking
  const [confirmedOrder, setConfirmedOrder] = useState<OrderConfirmation | null>(null);
  const [isTrackingModal, setIsTrackingModal] = useState<boolean>(false);

  // 1. Detect Live GPS Location entirely in WebView
  const detectLiveGPS = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!navigator.geolocation) {
      setLocationName('Kolkata (Within 25km)');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setLat(latitude);
        setLng(longitude);
        setIsLocating(false);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await res.json();
          const road = data.address?.road || data.address?.suburb || data.address?.neighbourhood || '';
          const city = data.address?.city || data.address?.town || data.address?.state_district || '';
          const formatted = [road, city].filter(Boolean).join(', ') || data.display_name?.slice(0, 35);
          if (formatted) {
            setLocationName(formatted);
            if (!deliveryAddress) setDeliveryAddress(formatted);
          } else {
            setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch {
          setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      },
      () => {
        setIsLocating(false);
        setLocationName('Current Location (25km Zone)');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [deliveryAddress]);

  useEffect(() => {
    detectLiveGPS();
  }, [detectLiveGPS]);

  // 2. Fetch Nearby Restaurants (within 25 km)
  const fetchNearbyRestaurants = useCallback(async () => {
    setLoadingRestaurants(true);
    setRestaurantError('');
    try {
      const url = `/api/v1/food/customer/nearby?latitude=${lat}&longitude=${lng}&radius=${radiusKm}`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json', apikey: API_KEY },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRestaurants(json.data);
      } else {
        setRestaurants([]);
        setRestaurantError(json.error || 'No open restaurants found within 25 km.');
      }
    } catch {
      setRestaurantError('Could not connect to food service. Please check network.');
      setRestaurants([]);
    } finally {
      setLoadingRestaurants(false);
    }
  }, [lat, lng, radiusKm]);

  useEffect(() => {
    fetchNearbyRestaurants();
  }, [fetchNearbyRestaurants]);

  // 3. Load Menu for restaurant
  const openRestaurantMenu = async (restaurant: Restaurant) => {
    setActiveRestaurant(restaurant);
    setLoadingMenu(true);
    try {
      const res = await fetch(`/api/v1/food/customer/restaurants/${restaurant.id}/menu`, {
        headers: { Accept: 'application/json', apikey: API_KEY },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setCategories(json.data.categories || []);
        const rawProducts: any[] = json.data.products || [];
        const normalized: Product[] = rawProducts.map((p) => ({
          ...p,
          final_price: p.customer_price || p.final_price || p.restaurant_price || p.base_price || p.price || 0,
          restaurant_name: restaurant.name,
        }));
        setProducts(normalized);
        if (json.data.categories && json.data.categories.length > 0) {
          setSelectedCategory(json.data.categories[0].id);
        } else {
          setSelectedCategory(null);
        }
      }
    } catch (err) {
      console.error('Menu load error:', err);
    } finally {
      setLoadingMenu(false);
    }
  };

  // Preload quick meals from first available restaurant
  useEffect(() => {
    if (restaurants.length > 0 && quickMeals.length === 0) {
      const firstRes = restaurants[0];
      fetch(`/api/v1/food/customer/restaurants/${firstRes.id}/menu`, {
        headers: { Accept: 'application/json', apikey: API_KEY },
      })
        .then((r) => r.json())
        .then((json) => {
          if (json.success && json.data?.products) {
            const items: Product[] = json.data.products.map((p: any) => ({
              ...p,
              final_price: p.customer_price || p.final_price || p.restaurant_price || p.base_price || 99,
              restaurant_name: firstRes.name,
            }));
            setQuickMeals(items);
          }
        })
        .catch(() => {});
    }
  }, [restaurants, quickMeals.length]);

  const addToCart = (product: Product, restaurant?: Restaurant) => {
    if (restaurant && (!activeRestaurant || activeRestaurant.id !== restaurant.id)) {
      setActiveRestaurant(restaurant);
    }
    setCart((prev) => {
      const current = prev[product.id];
      const newQty = current ? current.quantity + 1 : 1;
      return { ...prev, [product.id]: { product, quantity: newQty } };
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => {
      const current = prev[productId];
      if (!current) return prev;
      if (current.quantity <= 1) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: { ...current, quantity: current.quantity - 1 } };
    });
  };

  const cartList = useMemo(() => Object.values(cart), [cart]);
  const cartItemCount = useMemo(() => cartList.reduce((sum, item) => sum + item.quantity, 0), [cartList]);
  const cartSubtotal = useMemo(
    () => cartList.reduce((sum, item) => sum + (item.product.final_price || 0) * item.quantity, 0),
    [cartList]
  );

  const deliveryFee = useMemo(() => {
    if (!activeRestaurant || cartSubtotal === 0) return 0;
    const dist = activeRestaurant.distance_km || 1.5;
    if (dist <= 3) return 25;
    if (dist <= 7) return 40;
    if (dist <= 15) return 65;
    return 95;
  }, [activeRestaurant, cartSubtotal]);

  const platformFee = 3;
  const taxesAndGst = useMemo(() => Math.round(cartSubtotal * 0.05), [cartSubtotal]);
  const grandTotal = useMemo(
    () => Math.round(cartSubtotal + deliveryFee + platformFee + taxesAndGst),
    [cartSubtotal, deliveryFee, taxesAndGst]
  );

  const handlePlaceOrder = async () => {
    const targetRestaurant = activeRestaurant || (restaurants.length > 0 ? restaurants[0] : null);
    if (!targetRestaurant) return;
    if (!customerPhone || customerPhone.length < 10) {
      alert('Please enter a valid 10-digit mobile number for order delivery & OTP.');
      return;
    }
    if (!deliveryAddress || deliveryAddress.trim().length < 5) {
      alert('Please enter your full delivery address.');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const payload = {
        restaurant_id: targetRestaurant.id,
        customer_name: customerName || 'Fiinway Customer',
        customer_phone: customerPhone,
        delivery_address: deliveryAddress,
        delivery_lat: lat,
        delivery_lng: lng,
        special_instructions: deliveryNotes,
        payment_method: paymentMethod,
        items: cartList.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          instructions: '',
        })),
      };

      const res = await fetch('/api/v1/food/customer/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          apikey: API_KEY,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success && data.data) {
        setConfirmedOrder({ ...data.data, restaurant: targetRestaurant });
        setCart({});
        setIsCheckoutOpen(false);
        setIsTrackingModal(true);
      } else {
        alert(data.error || 'Failed to place order. Please try again.');
      }
    } catch {
      alert('Network error while placing order. Please retry.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      if (vegOnly && !r.pure_veg) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = r.name.toLowerCase().includes(q);
        const matchCuisines = String(r.cuisines || '').toLowerCase().includes(q);
        if (!matchName && !matchCuisines) return false;
      }
      if (topTab === 'bolt' && (r.estimated_prep_time_minutes || 30) > 25) return false;
      if (filterFastDelivery && (r.estimated_prep_time_minutes || 30) > 25) return false;
      if (filterRating4Plus && (r.rating || r.rating_avg || 0) < 4.0) return false;
      return true;
    }).sort((a, b) => {
      if (filterSort === 'rating') {
        return (b.rating || b.rating_avg || 0) - (a.rating || a.rating_avg || 0);
      }
      if (filterSort === 'time') {
        return (a.estimated_prep_time_minutes || 25) - (b.estimated_prep_time_minutes || 25);
      }
      return (a.distance_km || 0) - (b.distance_km || 0);
    });
  }, [restaurants, vegOnly, searchQuery, topTab, filterFastDelivery, filterRating4Plus, filterSort]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (vegOnly && p.food_type !== 'veg' && !activeRestaurant?.pure_veg) return false;
      if (selectedCategory && p.category_id !== selectedCategory) return false;
      return true;
    });
  }, [products, vegOnly, selectedCategory, activeRestaurant]);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans pb-28 select-none">
      {/* 1. TOP HEADER (SWIGGY / ZOMATO STYLE) */}
      <header className="sticky top-0 z-30 bg-white shadow-2xs border-b border-slate-100">
        <div className="px-4 pt-2.5 pb-2 flex items-center justify-between gap-2 max-w-2xl mx-auto">
          <div
            onClick={() => setIsLocationPickerOpen(true)}
            className="flex items-center gap-2 cursor-pointer min-w-0"
          >
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 fill-orange-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 font-extrabold text-sm text-slate-900 tracking-tight leading-tight">
                <span>Deliver to</span>
                <span className="text-orange-600">Home</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div className="text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-xs">
                {locationName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSwitchToMerchant && (
              <button
                onClick={onSwitchToMerchant}
                className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
              >
                <Store className="w-3.5 h-3.5 text-orange-500" />
                <span>Partner</span>
              </button>
            )}
            <button
              onClick={detectLiveGPS}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
              title="Refresh GPS"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search Bar + VEG Switch (Matches Screenshot 1 & 2) */}
        <div className="px-4 pb-2.5 max-w-2xl mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for 'Pizza', 'Biryani', 'Burger'..."
              className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-orange-500 focus:outline-none transition placeholder:text-slate-400 shadow-2xs font-medium"
            />
            <Mic className="w-4 h-4 text-orange-600 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* VEG ONLY TOGGLE (Matches Screenshot 1 & 2) */}
          <div
            onClick={() => setVegOnly(!vegOnly)}
            className={`flex flex-col items-center justify-center px-2 py-1 rounded-xl border cursor-pointer transition select-none shrink-0 ${
              vegOnly
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <span className="text-[9px] font-black uppercase tracking-wider">VEG</span>
            <div
              className={`w-7 h-4 rounded-full p-0.5 flex items-center transition duration-200 ${
                vegOnly ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-white shadow-xs flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs (:: ALL, STORE, OFFERS, BOLT, EATRIGHT) */}
        {!activeRestaurant && (
          <div className="px-4 flex items-center gap-5 overflow-x-auto scrollbar-none border-t border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-600 max-w-2xl mx-auto">
            <button
              onClick={() => setTopTab('all')}
              className={`py-2.5 flex items-center gap-1.5 whitespace-nowrap border-b-2 transition ${
                topTab === 'all'
                  ? 'text-orange-600 border-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>:: ALL</span>
            </button>
            <button
              onClick={() => {
                setTopTab('store');
                setFilter99Store(true);
              }}
              className={`py-2.5 flex items-center gap-1.5 whitespace-nowrap border-b-2 transition ${
                topTab === 'store'
                  ? 'text-orange-600 border-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>🏪 STORE</span>
            </button>
            <button
              onClick={() => setTopTab('offers')}
              className={`py-2.5 flex items-center gap-1.5 whitespace-nowrap border-b-2 transition ${
                topTab === 'offers'
                  ? 'text-orange-600 border-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>🏷️ OFFERS</span>
            </button>
            <button
              onClick={() => {
                setTopTab('bolt');
                setFilterFastDelivery(true);
              }}
              className={`py-2.5 flex items-center gap-1.5 whitespace-nowrap border-b-2 transition ${
                topTab === 'bolt'
                  ? 'text-orange-600 border-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>BOLT</span>
            </button>
            <button
              onClick={() => setTopTab('eatright')}
              className={`py-2.5 flex items-center gap-1.5 whitespace-nowrap border-b-2 transition ${
                topTab === 'eatright'
                  ? 'text-orange-600 border-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Heart className="w-3 h-3 text-rose-500" />
              <span>EATRIGHT</span>
            </button>
          </div>
        )}
      </header>

      {/* VIEW 1: HOME DISCOVERY (MATCHES SCREENSHOT 1 & 2) */}
      {!activeRestaurant && (
        <main className="max-w-2xl mx-auto px-4 pt-3 space-y-4">
          {/* Swiggy Pink "Welcome, foodie!" Hero Banner (Matches Screenshot 1) */}
          <div className="bg-linear-to-b from-[#b00b46] via-[#c40e53] to-[#8d0534] rounded-3xl p-4 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl font-black italic tracking-wide mb-3 flex items-center gap-2">
                <span>Welcome,</span>
                <span className="text-amber-300 font-serif lowercase italic">foodie!</span>
              </h2>

              <div className="grid grid-cols-2 gap-2.5">
                <div
                  onClick={() => setFilter99Store(true)}
                  className="bg-white/15 backdrop-blur-md rounded-2xl p-3 border border-white/20 flex flex-col justify-between cursor-pointer hover:bg-white/20 transition"
                >
                  <div>
                    <div className="font-extrabold text-sm text-yellow-300 flex items-center gap-1">
                      <span>🏷️ 99 store</span>
                    </div>
                    <div className="text-[11px] text-white/80">Meals At ₹99</div>
                  </div>
                  <div className="text-2xl mt-2 text-right">🍔</div>
                </div>

                <div className="space-y-2">
                  <div className="bg-white/15 backdrop-blur-md rounded-xl p-2 border border-white/20 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-amber-200">Free Del</div>
                      <div className="text-[10px] text-white/80">At ₹1 With Fiinway</div>
                    </div>
                    <span className="text-lg">🛵</span>
                  </div>
                  <div className="bg-white/15 backdrop-blur-md rounded-xl p-2 border border-white/20 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-yellow-300">Get 70% OFF</div>
                      <div className="text-[10px] text-white/80">+ Cashback</div>
                    </div>
                    <span className="text-lg">🍛</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Circular Category Stories (Matches Screenshot 2) */}
          <div>
            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
              {FOOD_STORIES.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => setSearchQuery(cat.name)}
                  className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
                >
                  <div
                    className={`w-14 h-14 rounded-full bg-linear-to-tr ${cat.color} flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition transform`}
                  >
                    <span>{cat.icon}</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 tracking-tight">
                    {cat.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Curated Row: "Meals at ₹99 + Free Delivery" (Matches Screenshot 2) */}
          {quickMeals.length > 0 && (
            <div className="bg-white rounded-3xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                  <span>Meals at ₹99 + <strong className="text-orange-600">Free Delivery</strong></span>
                </div>
                <button
                  onClick={() => setFilter99Store(true)}
                  className="text-xs font-bold text-orange-600 flex items-center gap-0.5 hover:underline"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
                {quickMeals.slice(0, 6).map((item) => {
                  const inCart = cart[item.id];
                  const isVeg = item.food_type === 'veg' || true;
                  const originalPrice = Math.round((item.final_price || 99) * 1.6);

                  return (
                    <div
                      key={item.id}
                      className="w-36 bg-slate-50/80 rounded-2xl p-2 border border-slate-200/70 shrink-0 flex flex-col justify-between"
                    >
                      <div className="relative h-24 rounded-xl overflow-hidden bg-slate-200 mb-2">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-linear-to-br from-amber-100 to-orange-100 flex items-center justify-center text-xl">
                            🥪
                          </div>
                        )}

                        <div className="absolute bottom-1 right-1">
                          {!inCart ? (
                            <button
                              onClick={() => addToCart(item)}
                              className="w-7 h-7 rounded-lg bg-white text-emerald-700 shadow-md border border-slate-200 flex items-center justify-center font-black text-sm active:scale-90 transition hover:bg-emerald-50"
                            >
                              +
                            </button>
                          ) : (
                            <div className="flex items-center bg-emerald-700 text-white rounded-lg shadow-sm text-[11px] font-bold px-1.5 py-0.5">
                              <button onClick={() => removeFromCart(item.id)} className="pr-1">
                                -
                              </button>
                              <span>{inCart.quantity}</span>
                              <button onClick={() => addToCart(item)} className="pl-1">
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-1 mb-0.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-xs border flex items-center justify-center ${
                              isVeg ? 'border-emerald-600' : 'border-rose-600'
                            }`}
                          >
                            <span
                              className={`w-1 h-1 rounded-full ${
                                isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                              }`}
                            ></span>
                          </span>
                          <h4 className="font-bold text-xs text-slate-800 truncate">{item.name}</h4>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 line-through">
                            ₹{originalPrice}
                          </span>
                          <span className="bg-yellow-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                            ₹{item.final_price || 99}
                          </span>
                        </div>

                        <div className="text-[9px] text-slate-500 truncate mt-1">
                          {item.restaurant_name || 'Nearby Kitchen'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MULTIPLE FILTER BAR (MATCHES SCREENSHOT 2) */}
          <div className="sticky top-[108px] z-20 bg-slate-100/95 backdrop-blur-md py-2 -mx-4 px-4 border-y border-slate-200/60">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => {
                  setFilterFastDelivery(false);
                  setFilterRating4Plus(false);
                  setFilter99Store(false);
                  setFilterSort('relevance');
                }}
                className="px-3 py-1.5 rounded-full bg-white border border-slate-300 text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-2xs hover:bg-slate-50 shrink-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filter</span>
              </button>

              <div className="relative shrink-0">
                <select
                  value={filterSort}
                  onChange={(e: any) => setFilterSort(e.target.value)}
                  className="appearance-none px-3 py-1.5 pr-6 rounded-full bg-white border border-slate-300 text-xs font-bold text-slate-800 shadow-2xs focus:outline-none cursor-pointer"
                >
                  <option value="relevance">Sort by: Relevance</option>
                  <option value="rating">Rating: High to Low</option>
                  <option value="time">Delivery Time</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                onClick={() => setFilter99Store(!filter99Store)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition shrink-0 ${
                  filter99Store
                    ? 'bg-orange-600 text-white border border-orange-600 shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Tag className="w-3 h-3 text-amber-500" />
                <span>99 Store</span>
              </button>

              <button
                onClick={() => setFilterFastDelivery(!filterFastDelivery)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition shrink-0 ${
                  filterFastDelivery
                    ? 'bg-amber-500 text-white border border-amber-500 shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>Bolt 15-25 mins</span>
              </button>

              <button
                onClick={() => setFilterRating4Plus(!filterRating4Plus)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition shrink-0 ${
                  filterRating4Plus
                    ? 'bg-slate-900 text-white border border-slate-900 shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>Rating 4.0+</span>
              </button>

              <span className="px-2.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold whitespace-nowrap shrink-0">
                📍 25km Range
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
              Top {filteredRestaurants.length} restaurants to explore
            </h3>
            <p className="text-xs text-slate-500 font-medium">Featured & verified dining partners within 25 km</p>
          </div>

          {loadingRestaurants && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-3 border border-slate-200 animate-pulse">
                  <div className="h-44 bg-slate-200 rounded-2xl mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded-md w-2/3 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded-md w-1/3"></div>
                </div>
              ))}
            </div>
          )}

          {!loadingRestaurants && filteredRestaurants.length === 0 && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-2xs my-6">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-slate-900 mb-1">No restaurants found</h4>
              <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
                No open restaurants match your active filters within 25 km of your location.
              </p>
              <button
                onClick={() => {
                  setVegOnly(false);
                  setFilterFastDelivery(false);
                  setFilterRating4Plus(false);
                  setFilter99Store(false);
                  setSearchQuery('');
                }}
                className="bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs hover:bg-orange-700 transition"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* RESTAURANT CARDS (MATCHES SCREENSHOT 1 & 2) */}
          {!loadingRestaurants && filteredRestaurants.length > 0 && (
            <div className="space-y-4">
              {filteredRestaurants.map((res) => {
                const cuisinesText = Array.isArray(res.cuisines)
                  ? res.cuisines.join(', ')
                  : res.cuisines || 'North Indian, Fast Food, Biryani';
                const rating = res.rating || res.rating_avg || 4.5;
                const distance = res.distance_km != null ? `${res.distance_km} km` : '1.2 km';
                const time = `${res.estimated_prep_time_minutes || 20}-${(res.estimated_prep_time_minutes || 20) + 10} mins`;

                return (
                  <div
                    key={res.id}
                    onClick={() => openRestaurantMenu(res)}
                    className="group bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition cursor-pointer"
                  >
                    <div className="relative h-44 sm:h-52 bg-slate-200 overflow-hidden">
                      {res.cover_url ? (
                        <img
                          src={res.cover_url}
                          alt={res.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-4xl font-black">
                          🍽️
                        </div>
                      )}

                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        {res.pure_veg && (
                          <span className="bg-emerald-700 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                            PURE VEG
                          </span>
                        )}
                        <span className="bg-black/60 backdrop-blur-xs text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          👑 Best in Town
                        </span>
                      </div>

                      <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/85 via-black/40 to-transparent p-3 flex items-end justify-between text-white">
                        <div>
                          <div className="font-black text-sm uppercase tracking-wide text-white drop-shadow-sm flex items-center gap-1">
                            <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                            <span>ITEMS AT ₹99</span>
                          </div>
                          <div className="text-[10px] text-slate-300 font-medium">
                            Up to 25km delivery network
                          </div>
                        </div>

                        <div className="bg-black/70 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 border border-white/20">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{time}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-base text-slate-900 group-hover:text-orange-600 transition truncate">
                            {res.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="bg-emerald-700 text-white text-xs font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                              <span>★</span>
                              <span>{rating}</span>
                            </span>
                            <span className="text-xs text-slate-600 font-semibold">• {time}</span>
                            <span className="text-xs text-slate-500 font-medium">• {distance}</span>
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-1">{cuisinesText}</p>
                          {res.address && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              📍 {res.address}
                            </p>
                          )}
                        </div>

                        <button className="bg-orange-50 text-orange-600 font-bold text-xs px-3 py-1.5 rounded-xl border border-orange-200 group-hover:bg-orange-600 group-hover:text-white transition shrink-0 self-center">
                          Menu →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Purple Promo Banner (Matches Screenshot 1) */}
          <div className="bg-linear-to-r from-indigo-700 via-purple-700 to-pink-600 text-white rounded-3xl p-4 shadow-md flex items-center justify-between gap-3">
            <div>
              <div className="font-extrabold text-sm sm:text-base leading-tight">
                Hurry, ₹30 Free Cash expiring soon!
              </div>
              <div className="text-[11px] text-white/80 mt-0.5">
                Valid on food orders above ₹99 within 25km
              </div>
            </div>
            <div className="bg-pink-500/90 text-white text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-sm shrink-0 border border-white/30">
              CASH ₹30
            </div>
          </div>
        </main>
      )}

      {/* VIEW 2: RESTAURANT MENU DETAIL */}
      {activeRestaurant && (
        <main className="max-w-2xl mx-auto px-4 pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveRestaurant(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-xs font-bold text-slate-500 bg-slate-200/80 px-2.5 py-1 rounded-full">
              📍 25km Radius Partner
            </span>
          </div>

          <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-3">
              {activeRestaurant.logo_url ? (
                <img
                  src={activeRestaurant.logo_url}
                  alt={activeRestaurant.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-2xl">
                  {activeRestaurant.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg text-slate-900 truncate">
                    {activeRestaurant.name}
                  </h3>
                  {activeRestaurant.pure_veg && (
                    <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                      PURE VEG
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {activeRestaurant.address || 'Delivering via Fiinway Network'}
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mt-1">
                  <span className="bg-emerald-700 text-white px-1.5 py-0.5 rounded text-[11px]">
                    ★ {activeRestaurant.rating || activeRestaurant.rating_avg || 4.5}
                  </span>
                  <span>•</span>
                  <span>{activeRestaurant.distance_km != null ? `${activeRestaurant.distance_km} km` : '1.2 km'}</span>
                  <span>•</span>
                  <span>{activeRestaurant.estimated_prep_time_minutes || 20} mins</span>
                </div>
              </div>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="sticky top-[108px] z-20 bg-slate-100/95 backdrop-blur-md py-2 -mx-4 px-4 border-y border-slate-200/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === null
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700'
                }`}
              >
                All Dishes ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                    selectedCategory === cat.id
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-white border border-slate-300 text-slate-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {loadingMenu ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-4 border border-slate-200 animate-pulse flex justify-between gap-3">
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                  </div>
                  <div className="w-24 h-24 bg-slate-200 rounded-2xl"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center">
              <p className="text-xs text-slate-500 font-medium">No dishes found matching your filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((prod) => {
                const inCart = cart[prod.id];
                const price = prod.final_price || 99;
                const isVeg = prod.food_type === 'veg' || activeRestaurant.pure_veg;

                return (
                  <div
                    key={prod.id}
                    className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`w-3 h-3 rounded-xs border flex items-center justify-center shrink-0 ${
                            isVeg ? 'border-emerald-600' : 'border-rose-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          ></span>
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 truncate">{prod.name}</h4>
                      </div>

                      <div className="font-extrabold text-sm text-slate-900 mb-1">₹{price}</div>

                      {prod.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {prod.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-center shrink-0 relative">
                      {prod.image_url ? (
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl">
                          🍛
                        </div>
                      )}

                      <div className="-mt-4 z-10">
                        {!inCart ? (
                          <button
                            onClick={() => addToCart(prod)}
                            className="bg-white text-emerald-700 border border-slate-200 hover:bg-emerald-50 font-black text-xs px-5 py-1.5 rounded-xl shadow-md active:scale-95 transition"
                          >
                            ADD +
                          </button>
                        ) : (
                          <div className="flex items-center bg-emerald-700 text-white rounded-xl shadow-md text-xs font-black">
                            <button
                              onClick={() => removeFromCart(prod.id)}
                              className="px-2.5 py-1.5 hover:bg-emerald-800 transition"
                            >
                              -
                            </button>
                            <span className="px-2">{inCart.quantity}</span>
                            <button
                              onClick={() => addToCart(prod)}
                              className="px-2.5 py-1.5 hover:bg-emerald-800 transition"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* FLOATING CART BAR (SWIGGY GREEN PILL) */}
      {cartItemCount > 0 && !isCheckoutOpen && (
        <div className="fixed bottom-16 inset-x-0 z-40 px-4 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto bg-[#60b246] text-white p-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-emerald-600 animate-in slide-in-from-bottom-3">
            <div className="flex items-center gap-2.5 min-w-0 pl-1">
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center font-black text-xs">
                {cartItemCount}
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-sm leading-tight">
                  ₹{grandTotal}
                </div>
                <div className="text-[10px] text-emerald-100 truncate">
                  {activeRestaurant?.name || 'Your Food Order'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs active:scale-95 transition shrink-0"
            >
              <span>VIEW CART</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION BAR (MATCHES SCREENSHOT 2: Food, Bolt, 99 store, Offers, Cart) */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200/90 shadow-lg px-2 py-1.5 max-w-2xl mx-auto">
        <div className="grid grid-cols-5 gap-1 text-center">
          <button
            onClick={() => {
              setBottomNav('food');
              setActiveRestaurant(null);
            }}
            className={`flex flex-col items-center justify-center py-1 transition ${
              bottomNav === 'food' ? 'text-orange-600 font-extrabold' : 'text-slate-500 font-semibold'
            }`}
          >
            <span className="text-lg">🍲</span>
            <span className="text-[10px] tracking-tight">Food</span>
          </button>

          <button
            onClick={() => {
              setBottomNav('bolt');
              setFilterFastDelivery(true);
            }}
            className={`flex flex-col items-center justify-center py-1 transition ${
              bottomNav === 'bolt' ? 'text-orange-600 font-extrabold' : 'text-slate-500 font-semibold'
            }`}
          >
            <span className="text-lg">⚡</span>
            <span className="text-[10px] tracking-tight">Bolt 15m</span>
          </button>

          <button
            onClick={() => {
              setBottomNav('store');
              setFilter99Store(true);
            }}
            className={`flex flex-col items-center justify-center py-1 transition ${
              bottomNav === 'store' ? 'text-orange-600 font-extrabold' : 'text-slate-500 font-semibold'
            }`}
          >
            <span className="text-lg">🏷️</span>
            <span className="text-[10px] tracking-tight">99 store</span>
          </button>

          <button
            onClick={() => {
              setBottomNav('offers');
              setTopTab('offers');
            }}
            className={`flex flex-col items-center justify-center py-1 transition ${
              bottomNav === 'offers' ? 'text-orange-600 font-extrabold' : 'text-slate-500 font-semibold'
            }`}
          >
            <span className="text-lg">🎁</span>
            <span className="text-[10px] tracking-tight">Offers</span>
          </button>

          <button
            onClick={() => {
              if (cartItemCount > 0) setIsCheckoutOpen(true);
              else alert('Your food cart is empty. Add delicious meals first!');
            }}
            className="flex flex-col items-center justify-center py-1 text-slate-700 font-semibold relative"
          >
            <span className="text-lg">🛒</span>
            <span className="text-[10px] tracking-tight">Cart</span>
            {cartItemCount > 0 && (
              <span className="absolute top-0 right-3 w-4 h-4 bg-orange-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* CHECKOUT MODAL / DRAWER */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-base text-slate-900">Food Order & Checkout</h3>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase text-slate-500">Order Items</h4>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl bg-slate-50/70 p-3 space-y-2">
                  {cartList.map((item) => (
                    <div key={item.product.id} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2">
                      <div className="flex-1 truncate">
                        <div className="font-bold text-slate-800 truncate">{item.product.name}</div>
                        <div className="text-[11px] text-slate-500">
                          ₹{item.product.final_price} × {item.quantity}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg">
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-1 text-slate-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-bold text-xs">{item.quantity}</span>
                          <button
                            onClick={() => addToCart(item.product)}
                            className="p-1 text-slate-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-bold text-slate-800 min-w-[50px] text-right">
                          ₹{(item.product.final_price || 0) * item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-xs uppercase text-slate-500">
                  Delivery Address (Within 25km Radius)
                </h4>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Address *
                  </label>
                  <textarea
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="House / Flat No, Landmark, Area..."
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Phone Number * (For OTP)
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="10-digit mobile"
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:outline-none transition font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Name"
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase text-slate-500 mb-2">
                  Select Payment Method
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition text-center ${
                      paymentMethod === 'wallet'
                        ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span className="text-[11px]">Wallet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition text-center ${
                      paymentMethod === 'upi'
                        ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-[11px]">UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition text-center ${
                      paymentMethod === 'cod'
                        ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span className="text-[11px]">Cash (COD)</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Item Subtotal</span>
                  <span>₹{cartSubtotal}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee</span>
                  <span>₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Taxes (5% GST)</span>
                  <span>₹{taxesAndGst}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Platform Fee</span>
                  <span>₹{platformFee}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900">
                  <span>To Pay</span>
                  <span className="text-orange-600">₹{grandTotal}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-500 block">Total Payable</span>
                <span className="text-base font-extrabold text-slate-900">₹{grandTotal}</span>
              </div>
              <button
                disabled={isPlacingOrder}
                onClick={handlePlaceOrder}
                className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-extrabold text-sm py-3 px-4 rounded-2xl shadow-md active:scale-95 transition flex items-center justify-center gap-2"
              >
                {isPlacingOrder ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Pay ₹{grandTotal} & Place Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOCATION PICKER MODAL */}
      {isLocationPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl text-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-base">Select Delivery Location</h4>
              <button
                onClick={() => setIsLocationPickerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Fiinway matches food partners within <strong>25 km</strong> of your location.
            </p>

            <button
              onClick={() => {
                detectLiveGPS();
                setIsLocationPickerOpen(false);
              }}
              className="w-full bg-orange-50 text-orange-700 border border-orange-200 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-100 transition"
            >
              <MapPin className="w-4 h-4 text-orange-600" />
              <span>Use Current GPS Location</span>
            </button>

            <div className="relative">
              <input
                type="text"
                value={customLocationInput}
                onChange={(e) => setCustomLocationInput(e.target.value)}
                placeholder="Enter area or landmark..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              onClick={() => {
                if (customLocationInput.trim()) {
                  setLocationName(customLocationInput.trim());
                  if (!deliveryAddress) setDeliveryAddress(customLocationInput.trim());
                  setIsLocationPickerOpen(false);
                }
              }}
              className="w-full bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-slate-800 transition"
            >
              Confirm Location
            </button>
          </div>
        </div>
      )}

      {/* LIVE ORDER CONFIRMATION MODAL */}
      {isTrackingModal && confirmedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl text-slate-900 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-black text-slate-900">Order Placed Successfully!</h3>
            <p className="text-xs text-slate-500">
              Sent to kitchen at <strong>{confirmedOrder.restaurant?.name || 'Restaurant'}</strong>
            </p>

            <div className="bg-linear-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-4 shadow-md">
              <div className="text-xs uppercase font-bold text-amber-100 mb-1">
                Delivery Handover OTP
              </div>
              <div className="text-3xl font-black tracking-widest">
                {confirmedOrder.delivery_otp || '----'}
              </div>
              <p className="text-[11px] text-amber-100 mt-1">
                Share this 4-digit code with rider upon delivery
              </p>
            </div>

            <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="font-bold text-slate-700">Order Number</span>
                <span className="font-mono text-slate-900 font-bold">#{confirmedOrder.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-700">Order Status</span>
                <span className="text-emerald-700 font-extrabold uppercase">Confirmed</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-700">Estimated Delivery</span>
                <span className="text-slate-900 font-bold">20-30 mins</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsTrackingModal(false);
                setActiveRestaurant(null);
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition"
            >
              Done & Explore More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
