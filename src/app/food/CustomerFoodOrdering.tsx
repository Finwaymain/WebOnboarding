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
  Sparkles,
  Check,
  Navigation
} from 'lucide-react';

const API_KEY = "base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU=";
const GOOGLE_MAPS_KEY = "AIzaSyBw7w6Sdryp7JAloPV0fBdAA-eFCtNv060";

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
}

// Professional food photography categories (Curated high-res imagery, no emojis)
const CURATED_CATEGORIES = [
  { id: 'biryani', name: 'Biryani', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&auto=format&fit=crop&q=80' },
  { id: 'pizzas', name: 'Pizzas', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&auto=format&fit=crop&q=80' },
  { id: 'burgers', name: 'Burgers', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80' },
  { id: 'thali', name: 'Thali', img: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=200&auto=format&fit=crop&q=80' },
  { id: 'rolls', name: 'Rolls', img: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=200&auto=format&fit=crop&q=80' },
  { id: 'sandwich', name: 'Sandwich', img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&auto=format&fit=crop&q=80' },
  { id: 'desserts', name: 'Desserts', img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=200&auto=format&fit=crop&q=80' },
  { id: 'chinese', name: 'Chinese', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200&auto=format&fit=crop&q=80' },
];

export default function CustomerFoodOrdering({
  initialLat,
  initialLng,
  userPhone = '',
  userName = '',
}: Props) {
  // Web-only GPS coordinates
  const [lat, setLat] = useState<number>(initialLat || 22.6066);
  const [lng, setLng] = useState<number>(initialLng || 88.4259);
  const [radiusKm] = useState<number>(25);
  const [locationName, setLocationName] = useState<string>('Locating your area...');
  const [locationArea, setLocationArea] = useState<string>('Home');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState<boolean>(false);
  const [manualAddressInput, setManualAddressInput] = useState<string>('');

  // Top Swiggy-style sub-tabs & Veg Toggle
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [topTab, setTopTab] = useState<'all' | 'store' | 'offers' | 'bolt' | 'top_rated'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Multiple Filter Bar state
  const [filterSort, setFilterSort] = useState<'relevance' | 'rating' | 'time'>('relevance');
  const [filterFastDelivery, setFilterFastDelivery] = useState<boolean>(false);
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

  // Curated 99 Store Meals across restaurants
  const [quickMeals, setQuickMeals] = useState<Product[]>([]);

  // Cart State
  const [cart, setCart] = useState<{ [productId: number]: CartItem }>({});
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // Checkout Form Details
  const [customerName, setCustomerName] = useState<string>(userName || 'Customer');
  const [customerPhone, setCustomerPhone] = useState<string>(userPhone);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'upi' | 'cod'>('wallet');
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);

  // Live Order Tracking
  const [confirmedOrder, setConfirmedOrder] = useState<OrderConfirmation | null>(null);
  const [isTrackingModal, setIsTrackingModal] = useState<boolean>(false);

  // Reverse Geocoding with Google Maps API + Fallback to Nominatim
  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    try {
      // 1. Attempt Google Maps Geocoding
      const googleRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_KEY}`
      );
      const googleData = await googleRes.json();
      if (googleData.status === 'OK' && googleData.results?.length > 0) {
        const comps = googleData.results[0].address_components || [];
        const sub = comps.find((c: any) => c.types.includes('sublocality') || c.types.includes('neighborhood'));
        const city = comps.find((c: any) => c.types.includes('locality'));
        const mainArea = sub ? sub.long_name : (city ? city.long_name : 'Current Location');
        setLocationArea(mainArea);
        setLocationName(googleData.results[0].formatted_address?.slice(0, 48));
        if (!deliveryAddress) setDeliveryAddress(googleData.results[0].formatted_address);
        return;
      }
    } catch (_) {}

    // 2. Fallback to OpenStreetMap Nominatim Geocoding
    try {
      const osmRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      const osmData = await osmRes.json();
      const road = osmData.address?.road || osmData.address?.suburb || osmData.address?.neighbourhood || '';
      const city = osmData.address?.city || osmData.address?.town || osmData.address?.state_district || '';
      const area = road || city || 'Current Location';
      const formatted = [road, city].filter(Boolean).join(', ') || osmData.display_name?.slice(0, 48);
      setLocationArea(area);
      setLocationName(formatted);
      if (!deliveryAddress) setDeliveryAddress(formatted);
    } catch (_) {
      setLocationArea('Current Location');
      setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    }
  }, [deliveryAddress]);

  // High-Accuracy HTML5 Browser GPS Detection
  const detectLiveGPS = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!navigator.geolocation) {
      setLocationArea('Kolkata');
      setLocationName('Kolkata Region (Within 25km)');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setLat(latitude);
        setLng(longitude);
        setIsLocating(false);
        reverseGeocode(latitude, longitude);
      },
      () => {
        setIsLocating(false);
        setLocationArea('Kolkata');
        setLocationName('Dum Dum, Kolkata (25km Zone)');
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 }
    );
  }, [reverseGeocode]);

  useEffect(() => {
    detectLiveGPS();
  }, [detectLiveGPS]);

  // Fetch Nearby Restaurants (within 25 km)
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

  // Load Menu for restaurant
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

  // Preload trending 99 store meals
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
      if (topTab === 'top_rated' && (r.rating || r.rating_avg || 0) < 4.2) return false;
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

  const handleBottomNavClick = (tab: 'food' | 'bolt' | 'store' | 'offers' | 'cart') => {
    setBottomNav(tab);
    if (tab === 'cart') {
      setIsCheckoutOpen(true);
    } else if (tab === 'bolt') {
      setActiveRestaurant(null);
      setTopTab('bolt');
    } else if (tab === 'store') {
      setActiveRestaurant(null);
      setTopTab('store');
    } else if (tab === 'offers') {
      setActiveRestaurant(null);
      setTopTab('offers');
    } else {
      setActiveRestaurant(null);
      setTopTab('all');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 pb-28 font-sans antialiased select-none">
      {/* 1. TOP STICKY HEADER */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-4 pt-3 pb-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Location Delivery Bar */}
          <div
            onClick={() => setIsLocationPickerOpen(true)}
            className="flex items-center gap-2 cursor-pointer group flex-1 min-w-0"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
              <MapPin className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-sm text-gray-900 tracking-tight flex items-center gap-1">
                  Deliver to {locationArea}
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </span>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full uppercase tracking-wider ml-1">
                  25km Zone
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate max-w-[240px] sm:max-w-md font-medium">
                {isLocating ? 'Detecting exact GPS...' : locationName}
              </p>
            </div>
          </div>

          {/* GPS Refresh Button */}
          <button
            onClick={detectLiveGPS}
            disabled={isLocating}
            title="Refresh GPS location"
            className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 transition-all shrink-0 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>

        {/* Search Bar & Veg Toggle Switch */}
        <div className="max-w-4xl mx-auto mt-2.5 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for restaurants, biryani, pizza, rolls..."
              className="w-full bg-[#f1f3f6] focus:bg-white text-sm pl-10 pr-10 py-2.5 rounded-xl border border-transparent focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none font-medium placeholder:text-gray-400"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <Mic className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            )}
          </div>

          {/* FSSAI Standard Pure Veg Toggle Switch */}
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold tracking-tight transition-all shrink-0 shadow-sm active:scale-95 ${
              vegOnly
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-emerald-50'
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            {/* Regulatory Veg Green Symbol */}
            <span className="w-3.5 h-3.5 border border-emerald-600 flex items-center justify-center p-[1.5px] rounded-[3px]">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
            </span>
            <span>VEG</span>
          </button>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="max-w-4xl mx-auto mt-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: 'All', icon: UtensilsCrossed },
            { id: 'store', label: '99 Store', icon: Tag },
            { id: 'bolt', label: 'Bolt 15m', icon: Zap },
            { id: 'offers', label: 'Offers', icon: BadgePercent },
            { id: 'top_rated', label: 'Top Rated', icon: Star },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = topTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setTopTab(tab.id as any);
                  setActiveRestaurant(null);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-gray-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main className="max-w-4xl mx-auto px-4 pt-4">
        {/* VIEW A: RESTAURANT MENU VIEW */}
        {activeRestaurant ? (
          <div>
            {/* Back to Discovery Bar */}
            <button
              onClick={() => setActiveRestaurant(null)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm mb-3 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all restaurants</span>
            </button>

            {/* Restaurant Profile Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-black text-gray-900 tracking-tight">{activeRestaurant.name}</h1>
                    {activeRestaurant.pure_veg && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
                        PURE VEG
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    {Array.isArray(activeRestaurant.cuisines)
                      ? activeRestaurant.cuisines.join(', ')
                      : activeRestaurant.cuisines || 'Multi-Cuisine, Fast Food'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{activeRestaurant.address || 'Kolkata'}</p>
                </div>

                {/* Rating Badge */}
                <div className="shrink-0 bg-emerald-600 text-white rounded-xl px-2.5 py-1 text-center shadow-sm">
                  <div className="flex items-center justify-center gap-0.5 text-xs font-black">
                    <span>{Number(activeRestaurant.rating || activeRestaurant.rating_avg || 4.2).toFixed(1)}</span>
                    <Star className="w-3 h-3 fill-white" />
                  </div>
                  <span className="text-[9px] font-medium opacity-90 block">
                    {activeRestaurant.rating_count || 48}+ ratings
                  </span>
                </div>
              </div>

              {/* Delivery Meta Badges */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs font-medium text-gray-600 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>{activeRestaurant.estimated_prep_time_minutes || 25}-35 mins</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Bike className="w-4 h-4 text-emerald-600" />
                  <span>{activeRestaurant.distance_km ? `${activeRestaurant.distance_km} km away` : 'Within delivery range'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Fiinway Verified</span>
                </div>
              </div>
            </div>

            {/* Menu Category Filter Pills */}
            {categories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-tight whitespace-nowrap transition-colors ${
                    selectedCategory === null
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  Full Menu ({products.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-tight whitespace-nowrap transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Dish List */}
            {loadingMenu ? (
              <div className="text-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-medium">Loading fresh menu...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                <UtensilsCrossed className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-700">No dishes match your filters</p>
                <p className="text-xs text-gray-400 mt-1">Try switching off pure veg mode to view all dishes.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((dish) => {
                  const qty = cart[dish.id]?.quantity || 0;
                  const isVeg = dish.food_type === 'veg';
                  return (
                    <div
                      key={dish.id}
                      className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm flex items-center justify-between gap-3 hover:border-gray-200 transition-all"
                    >
                      {/* Left: Dish Info */}
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          {/* Veg/Non-Veg dot */}
                          <span
                            className={`w-3 h-3 border flex items-center justify-center p-[1px] rounded-[2px] ${
                              isVeg ? 'border-emerald-600' : 'border-rose-600'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                              }`}
                            />
                          </span>
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                            {dish.food_type || 'veg'}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 tracking-tight leading-snug">{dish.name}</h3>
                        <p className="text-sm font-black text-gray-900 mt-1">₹{dish.final_price || 99}</p>
                        {dish.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                            {dish.description}
                          </p>
                        )}
                      </div>

                      {/* Right: Dish Photo & Swiggy-Style ADD Button */}
                      <div className="relative shrink-0 w-28 h-28 flex flex-col items-center">
                        <img
                          src={dish.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80'}
                          alt={dish.name}
                          className="w-28 h-24 object-cover rounded-xl border border-gray-100 shadow-inner"
                        />

                        {/* Floating ADD Button / Stepper */}
                        <div className="absolute -bottom-1">
                          {qty > 0 ? (
                            <div className="flex items-center bg-white border border-emerald-600 text-emerald-600 rounded-lg shadow-md font-extrabold text-xs h-7 px-2 gap-2">
                              <button
                                onClick={() => removeFromCart(dish.id)}
                                className="hover:text-emerald-800 p-0.5 active:scale-90"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="min-w-[14px] text-center">{qty}</span>
                              <button
                                onClick={() => addToCart(dish, activeRestaurant)}
                                className="hover:text-emerald-800 p-0.5 active:scale-90"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(dish, activeRestaurant)}
                              className="bg-white hover:bg-emerald-50 border border-emerald-500 text-emerald-600 font-black text-xs h-7 px-4 rounded-lg shadow-md hover:shadow transition-all active:scale-95 flex items-center gap-1 uppercase tracking-wider"
                            >
                              ADD
                              <Plus className="w-3 h-3 stroke-[3]" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* VIEW B: DISCOVERY & RESTAURANT FEED */
          <div className="space-y-5">
            {/* "What's on your mind?" Story Carousel */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-sm font-extrabold text-gray-900 tracking-tight uppercase tracking-wider">
                  What's on your mind?
                </h2>
                <span className="text-[11px] font-semibold text-emerald-600">Curated & Fresh</span>
              </div>
              <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
                {CURATED_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSearchQuery(cat.name)}
                    className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
                  >
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden border-2 border-gray-100 group-hover:border-emerald-500 shadow-sm transition-transform duration-200 group-active:scale-95">
                      <img
                        src={cat.img}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 group-hover:text-emerald-700">
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick 99 Store Row */}
            {quickMeals.length > 0 && (
              <div className="bg-gradient-to-r from-emerald-900 to-teal-950 rounded-2xl p-4 text-white shadow-sm overflow-hidden relative">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-black tracking-tight uppercase">99 Meal Store</h3>
                    </div>
                    <p className="text-[11px] text-emerald-200 font-medium">Flat ₹99 with zero surge</p>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full">
                    FREE DELIVERY
                  </span>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                  {quickMeals.slice(0, 6).map((meal) => {
                    const qty = cart[meal.id]?.quantity || 0;
                    return (
                      <div
                        key={meal.id}
                        className="bg-white text-gray-900 rounded-xl p-2.5 shrink-0 w-44 shadow-md flex flex-col justify-between"
                      >
                        <div className="relative">
                          <img
                            src={meal.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80'}
                            alt={meal.name}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <span className="absolute top-1.5 left-1.5 bg-gray-950/80 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                            ₹99
                          </span>
                        </div>
                        <div className="mt-2 min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 truncate">{meal.name}</h4>
                          <p className="text-[10px] text-gray-500 truncate">{meal.restaurant_name}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs font-black text-gray-900">₹99</span>
                            {qty > 0 ? (
                              <div className="flex items-center bg-emerald-50 text-emerald-700 border border-emerald-500 rounded px-1.5 py-0.5 text-xs font-bold gap-1.5">
                                <button onClick={() => removeFromCart(meal.id)}><Minus className="w-2.5 h-2.5" /></button>
                                <span>{qty}</span>
                                <button onClick={() => addToCart(meal)}><Plus className="w-2.5 h-2.5" /></button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(meal)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm"
                              >
                                ADD +
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Multiple Filter Chips Bar */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {/* Sort Filter */}
              <button
                onClick={() => setFilterSort(filterSort === 'relevance' ? 'rating' : filterSort === 'rating' ? 'time' : 'relevance')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shrink-0 ${
                  filterSort !== 'relevance'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Sort: {filterSort === 'rating' ? 'Top Rated' : filterSort === 'time' ? 'Fast Delivery' : 'Relevance'}</span>
              </button>

              {/* Fast Delivery Filter */}
              <button
                onClick={() => setFilterFastDelivery(!filterFastDelivery)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shrink-0 ${
                  filterFastDelivery
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>Under 25 mins</span>
              </button>

              {/* Rating 4.0+ */}
              <button
                onClick={() => setFilterRating4Plus(!filterRating4Plus)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shrink-0 ${
                  filterRating4Plus
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <Star className="w-3 h-3 fill-current" />
                <span>Rating 4.0+</span>
              </button>

              {/* 25 km Radius Tag */}
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200 shrink-0">
                <MapPin className="w-3 h-3 text-emerald-600" />
                <span>Within 25km</span>
              </div>
            </div>

            {/* Restaurant Count Title */}
            <div className="flex items-center justify-between pt-1">
              <h2 className="text-base font-black text-gray-900 tracking-tight">
                Restaurants near you ({filteredRestaurants.length})
              </h2>
              <span className="text-xs text-gray-500 font-medium">Delivering to {locationArea}</span>
            </div>

            {/* Restaurant Grid / Cards */}
            {loadingRestaurants ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse flex gap-4">
                    <div className="w-28 h-28 bg-gray-200 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredRestaurants.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
                <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-800">No restaurants found in this area</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  {restaurantError || 'No operational restaurants found within 25 km of your location.'}
                </p>
                <button
                  onClick={detectLiveGPS}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Location Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredRestaurants.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => openRestaurantMenu(res)}
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer flex flex-col"
                  >
                    {/* Cover Photo */}
                    <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                      <img
                        src={
                          res.cover_url ||
                          'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&auto=format&fit=crop&q=80'
                        }
                        alt={res.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Offer Ribbon */}
                      <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow">
                        FLAT ₹50 OFF
                      </div>

                      {/* Pure Veg Badge */}
                      {res.pure_veg && (
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded border border-emerald-300">
                          VEG ONLY
                        </div>
                      )}

                      {/* Bottom Image Overlay Details */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white/90 truncate">
                            {Array.isArray(res.cuisines) ? res.cuisines.join(', ') : res.cuisines || 'Multi-Cuisine'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="bg-emerald-600 text-white text-xs font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow">
                            {Number(res.rating || res.rating_avg || 4.2).toFixed(1)}
                            <Star className="w-2.5 h-2.5 fill-white" />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-extrabold text-base text-gray-900 group-hover:text-emerald-600 transition-colors">
                          {res.name}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                          {res.address || 'Kolkata Region'}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                        <div className="flex items-center gap-1 text-gray-700">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{res.estimated_prep_time_minutes || 25}-35 mins</span>
                        </div>
                        <div className="flex items-center gap-1 font-bold text-emerald-700">
                          <Bike className="w-3.5 h-3.5" />
                          <span>{res.distance_km ? `${res.distance_km} km` : 'Within 25km'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. FLOATING CART BAR (Swiggy Style) */}
      {cartItemCount > 0 && !isCheckoutOpen && (
        <div className="fixed bottom-18 left-4 right-4 max-w-4xl mx-auto z-30">
          <div
            onClick={() => setIsCheckoutOpen(true)}
            className="bg-[#60b246] hover:bg-[#529e3c] text-white rounded-2xl p-3.5 shadow-xl flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
                {cartItemCount}
              </div>
              <div>
                <p className="text-xs font-medium text-white/90">
                  {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} added
                </p>
                <p className="text-base font-black tracking-tight leading-none">₹{cartSubtotal}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 font-extrabold text-sm uppercase tracking-wider pr-1">
              <span>View Cart</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </div>
          </div>
        </div>
      )}

      {/* 4. FIXED BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200/80 py-2 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {[
            { id: 'food', label: 'Food', icon: UtensilsCrossed },
            { id: 'bolt', label: 'Bolt', icon: Zap },
            { id: 'store', label: '99 Store', icon: Tag },
            { id: 'offers', label: 'Offers', icon: BadgePercent },
            { id: 'cart', label: 'Cart', icon: ShoppingBag, badge: cartItemCount },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = bottomNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleBottomNavClick(item.id as any)}
                className="relative flex flex-col items-center justify-center py-1 px-3 focus:outline-none transition-colors"
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'text-emerald-600 scale-110 stroke-[2.5]' : 'text-gray-400'
                    }`}
                  />
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[11px] font-semibold mt-1 transition-colors ${
                    isActive ? 'text-emerald-700 font-bold' : 'text-gray-500'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 5. SLIDE-UP CHECKOUT DRAWER */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center transition-opacity">
          <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-gray-900">Review & Checkout</h2>
                <p className="text-xs text-gray-500">
                  {activeRestaurant?.name || 'Fiinway Delivery'}
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Selected Items */}
              <div className="bg-gray-50 rounded-2xl p-3.5 space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Order Items</h3>
                {cartList.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between text-sm">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-gray-900 truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-500">₹{item.product.final_price || 99} each</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center bg-white border border-gray-200 rounded-lg text-xs font-bold h-7 px-2 gap-2 shadow-xs">
                        <button onClick={() => removeFromCart(item.product.id)}>
                          <Minus className="w-3 h-3 text-gray-600" />
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => addToCart(item.product)}>
                          <Plus className="w-3 h-3 text-gray-600" />
                        </button>
                      </div>
                      <span className="font-black text-gray-900 w-12 text-right">
                        ₹{(item.product.final_price || 99) * item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Address & Contact */}
              <div className="bg-gray-50 rounded-2xl p-3.5 space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Delivery Address (Within 25km)</span>
                </h3>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="House / Flat No., Landmark, Street address"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:border-emerald-500 outline-none"
                />

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 block mb-1">CUSTOMER NAME</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 block mb-1">MOBILE (FOR OTP)</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="10-digit mobile"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Instructions: Leave at door / don't ring bell..."
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-gray-50 rounded-2xl p-3.5 space-y-2.5">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Option</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'wallet', label: 'Wallet', icon: Wallet, note: 'Fast 1-tap' },
                    { id: 'upi', label: 'UPI / Online', icon: CreditCard, note: 'GPay/PhonePe' },
                    { id: 'cod', label: 'Cash on Delivery', icon: Banknote, note: 'Pay cash' },
                  ].map((pay) => {
                    const Icon = pay.icon;
                    const isSelected = paymentMethod === pay.id;
                    return (
                      <button
                        key={pay.id}
                        type="button"
                        onClick={() => setPaymentMethod(pay.id as any)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-bold shadow-xs'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mx-auto mb-1 ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`} />
                        <span className="text-[11px] block font-bold leading-tight">{pay.label}</span>
                        <span className="text-[9px] text-gray-400 block mt-0.5">{pay.note}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Bill Summary */}
              <div className="bg-gray-50 rounded-2xl p-3.5 space-y-2 text-xs">
                <h3 className="font-bold text-gray-500 uppercase tracking-wider mb-1">Bill Summary</h3>
                <div className="flex justify-between text-gray-600">
                  <span>Item Total</span>
                  <span className="font-semibold text-gray-900">₹{cartSubtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1">
                    Delivery Partner Fee ({activeRestaurant?.distance_km || 1.5} km)
                  </span>
                  <span className="font-semibold text-gray-900">₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Platform Fee</span>
                  <span className="font-semibold text-gray-900">₹{platformFee}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST & Restaurant Taxes (5%)</span>
                  <span className="font-semibold text-gray-900">₹{taxesAndGst}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-black text-gray-900">
                  <span>To Pay</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>
            </div>

            {/* Drawer Footer CTA */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || cartItemCount === 0}
                className="w-full bg-[#60b246] hover:bg-[#529e3c] disabled:opacity-50 text-white font-black py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-between px-5 active:scale-[0.99]"
              >
                <div className="text-left">
                  <span className="text-xs uppercase tracking-wider block text-white/90">Total Payable</span>
                  <span className="text-lg leading-tight font-black">₹{grandTotal}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm uppercase tracking-wider">
                  <span>{isPlacingOrder ? 'Confirming...' : 'Place Order'}</span>
                  {isPlacingOrder ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ChevronRight className="w-5 h-5 stroke-[3]" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. ORDER CONFIRMATION & LIVE TRACKING MODAL */}
      {isTrackingModal && confirmedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full uppercase tracking-wider">
                Order Placed Successfully
              </span>
              <h2 className="text-xl font-black text-gray-900 mt-2">
                Order #{confirmedOrder.order_number || confirmedOrder.id}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Sent to {confirmedOrder.restaurant?.name || 'Restaurant'}
              </p>
            </div>

            {/* Delivery OTP Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-md">
              <p className="text-xs uppercase tracking-wider font-semibold text-emerald-100">
                Delivery Verification PIN
              </p>
              <div className="text-3xl font-black tracking-widest my-1">
                {confirmedOrder.delivery_otp || '4821'}
              </div>
              <p className="text-[11px] text-emerald-100">
                Share this PIN with your delivery rider upon doorstep arrival.
              </p>
            </div>

            {/* Live Progress Tracker */}
            <div className="text-left space-y-3 bg-gray-50 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Live Status</h4>
              <div className="space-y-2.5 text-xs font-semibold">
                <div className="flex items-center gap-2.5 text-emerald-700">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                  <span>Order Confirmed by Restaurant</span>
                </div>
                <div className="flex items-center gap-2.5 text-emerald-700">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                  <span>Chef is preparing your fresh meal</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300 shrink-0" />
                  <span>Delivery Partner reaching restaurant</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300 shrink-0" />
                  <span>Out for doorstep delivery (Within 25km)</span>
                </div>
              </div>
            </div>

            {/* Back to Home Button */}
            <button
              onClick={() => {
                setIsTrackingModal(false);
                setActiveRestaurant(null);
              }}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-2xl shadow transition-colors text-sm"
            >
              Back to Food Discovery
            </button>
          </div>
        </div>
      )}

      {/* 7. LOCATION PICKER / GPS MODAL */}
      {isLocationPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-gray-900">Select Delivery Location</h3>
              <button
                onClick={() => setIsLocationPickerOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* GPS Locate Button */}
            <button
              onClick={() => {
                detectLiveGPS();
                setIsLocationPickerOpen(false);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-emerald-500 bg-emerald-50 text-emerald-800 font-bold text-xs text-left shadow-xs hover:bg-emerald-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-black text-sm text-emerald-900">Use Exact Device Location</span>
                <span className="text-[11px] text-emerald-700 font-medium">GPS High Accuracy (Within 25km range)</span>
              </div>
            </button>

            {/* Manual input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Or Type Area / Locality
              </label>
              <input
                type="text"
                value={manualAddressInput}
                onChange={(e) => setManualAddressInput(e.target.value)}
                placeholder="e.g. Salt Lake, Dum Dum, New Town..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:border-emerald-500 outline-none"
              />
              <button
                onClick={() => {
                  if (manualAddressInput.trim()) {
                    setLocationArea(manualAddressInput.trim());
                    setLocationName(manualAddressInput.trim());
                    setDeliveryAddress(manualAddressInput.trim());
                    setIsLocationPickerOpen(false);
                  }
                }}
                className="w-full bg-gray-900 text-white text-xs font-bold py-2.5 rounded-xl mt-1"
              >
                Set Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
