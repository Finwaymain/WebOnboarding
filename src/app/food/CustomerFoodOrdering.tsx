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
  Banknote
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
  base_price?: number;
  final_price?: number;
  price?: number;
  image_url?: string;
  food_type?: 'veg' | 'non-veg' | 'egg';
  is_available?: boolean;
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
  restaurant?: Restaurant;
}

interface Props {
  initialLat?: number;
  initialLng?: number;
  userPhone?: string;
  userName?: string;
  onSwitchToMerchant?: () => void;
}

export default function CustomerFoodOrdering({
  initialLat,
  initialLng,
  userPhone = '',
  userName = '',
  onSwitchToMerchant,
}: Props) {
  const [lat, setLat] = useState<number>(initialLat || 28.5355);
  const [lng, setLng] = useState<number>(initialLng || 77.3910);
  const [radiusKm] = useState<number>(25);
  const [locationName, setLocationName] = useState<string>('Detecting location...');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState<boolean>(true);
  const [restaurantError, setRestaurantError] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'veg' | 'rated' | 'fast'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [activeRestaurant, setActiveRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingMenu, setLoadingMenu] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const [cart, setCart] = useState<{ [productId: number]: CartItem }>({});
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  const [customerName, setCustomerName] = useState<string>(userName);
  const [customerPhone, setCustomerPhone] = useState<string>(userPhone);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'upi' | 'cod'>('wallet');
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);

  const [confirmedOrder, setConfirmedOrder] = useState<OrderConfirmation | null>(null);
  const [isTrackingModal, setIsTrackingModal] = useState<boolean>(false);

  const detectGPSLocation = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!navigator.geolocation) {
      setLocationName('Noida / Delhi NCR (25km Zone)');
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
          const formatted = [road, city].filter(Boolean).join(', ') || data.display_name?.slice(0, 40);
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
        setLocationName('Current Location (within 25km)');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [deliveryAddress]);

  useEffect(() => {
    if (initialLat && initialLng) {
      setLat(initialLat);
      setLng(initialLng);
      setLocationName(`GPS: ${initialLat.toFixed(3)}, ${initialLng.toFixed(3)}`);
    } else {
      detectGPSLocation();
    }
  }, [initialLat, initialLng, detectGPSLocation]);

  const fetchNearbyRestaurants = useCallback(async () => {
    setLoadingRestaurants(true);
    setRestaurantError('');
    try {
      const url = `/api/v1/food/customer/nearby?latitude=${lat}&longitude=${lng}&radius=${radiusKm}`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json', apikey: API_KEY }
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

  const openRestaurantMenu = async (restaurant: Restaurant) => {
    setActiveRestaurant(restaurant);
    setLoadingMenu(true);
    try {
      const res = await fetch(`/api/v1/food/customer/restaurants/${restaurant.id}/menu`, {
        headers: { Accept: 'application/json', apikey: API_KEY }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setCategories(json.data.categories || []);
        const rawProducts: any[] = json.data.products || [];
        const normalized: Product[] = rawProducts.map((p) => ({
          ...p,
          final_price: p.final_price || p.base_price || p.price || 0,
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

  const addToCart = (product: Product) => {
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
    const dist = activeRestaurant.distance_km || 2.5;
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
    if (!activeRestaurant) return;
    if (!customerPhone || customerPhone.length < 10) {
      alert('Please enter a valid 10-digit mobile number for order delivery & OTP.');
      return;
    }
    if (!deliveryAddress || deliveryAddress.trim().length < 5) {
      alert('Please enter your complete delivery address.');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const payload = {
        restaurant_id: activeRestaurant.id,
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
          'Accept': 'application/json',
          'apikey': API_KEY,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success && data.data) {
        setConfirmedOrder({ ...data.data, restaurant: activeRestaurant });
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
      const matchSearch =
        !searchQuery ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(r.cuisines || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;
      if (selectedFilter === 'veg') return r.pure_veg === true;
      if (selectedFilter === 'rated') return (r.rating || r.rating_avg || 0) >= 4.0;
      if (selectedFilter === 'fast') return (r.estimated_prep_time_minutes || 30) <= 25;
      return true;
    });
  }, [restaurants, searchQuery, selectedFilter]);

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter((p) => p.category_id === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900">Fiinway Food</span>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-amber-200">
                  25km Zone
                </span>
              </div>
              <button
                onClick={detectGPSLocation}
                disabled={isLocating}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-amber-600 transition truncate max-w-[210px] sm:max-w-xs text-left"
                title="Click to re-fetch GPS"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate font-medium">{locationName}</span>
                <RefreshCw className={`w-3 h-3 text-slate-400 shrink-0 ${isLocating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSwitchToMerchant && (
              <button
                onClick={onSwitchToMerchant}
                className="hidden sm:flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
              >
                <Store className="w-3.5 h-3.5 text-slate-500" />
                Merchant Portal
              </button>
            )}
            {cartItemCount > 0 && (
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="flex items-center gap-1.5 bg-orange-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm hover:bg-orange-700 transition active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{cartItemCount}</span>
                <span className="opacity-80">•</span>
                <span>₹{cartSubtotal}</span>
              </button>
            )}
          </div>
        </div>

        {!activeRestaurant && (
          <div className="max-w-5xl mx-auto mt-2.5 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search restaurants, cuisines, or dishes within 25km..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-100 border border-transparent rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none transition shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* VIEW 1: RESTAURANT LISTING (WITHIN 25KM RADIUS) */}
      {!activeRestaurant && (
        <main className="max-w-5xl mx-auto px-4 pt-3">
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none mb-3">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                selectedFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All Restaurants
            </button>
            <button
              onClick={() => setSelectedFilter('veg')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                selectedFilter === 'veg'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              Pure Veg
            </button>
            <button
              onClick={() => setSelectedFilter('rated')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                selectedFilter === 'rated'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-amber-700 hover:bg-amber-50'
              }`}
            >
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              Rating 4.0+
            </button>
            <button
              onClick={() => setSelectedFilter('fast')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                selectedFilter === 'fast'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-blue-700 hover:bg-blue-50'
              }`}
            >
              <Clock className="w-3 h-3" />
              Under 25 mins
            </button>
          </div>

          <div className="bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl p-3 mb-4 flex items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
            <div className="flex items-center gap-2">
              <Bike className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Showing verified dining & delivery partners within <strong>{radiusKm} km radius</strong> of your location.
              </span>
            </div>
            <button
              onClick={detectGPSLocation}
              className="shrink-0 font-semibold text-amber-700 hover:underline"
            >
              Update GPS
            </button>
          </div>

          {loadingRestaurants && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3 animate-pulse">
                  <div className="h-36 bg-slate-200 rounded-xl mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded-md w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded-md w-1/2 mb-3"></div>
                </div>
              ))}
            </div>
          )}

          {!loadingRestaurants && restaurantError && filteredRestaurants.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-8 shadow-xs">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-800 mb-1">No Restaurants in 25km Radius</h3>
              <p className="text-xs text-slate-500 mb-4">{restaurantError}</p>
              <button
                onClick={detectGPSLocation}
                className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-slate-800 transition inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh GPS Location
              </button>
            </div>
          )}

          {!loadingRestaurants && filteredRestaurants.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredRestaurants.map((res) => {
                const cuisinesText = Array.isArray(res.cuisines)
                  ? res.cuisines.join(', ')
                  : res.cuisines || 'North Indian, Fast Food';
                const rating = res.rating || res.rating_avg || 4.2;
                const distance = res.distance_km != null ? `${res.distance_km} km` : 'Nearby';
                const time = `${res.estimated_prep_time_minutes || 25}-${(res.estimated_prep_time_minutes || 25) + 10} mins`;

                return (
                  <div
                    key={res.id}
                    onClick={() => openRestaurantMenu(res)}
                    className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-amber-400 transition cursor-pointer flex flex-col"
                  >
                    <div className="relative h-36 bg-slate-100 overflow-hidden">
                      {res.cover_url ? (
                        <img
                          src={res.cover_url}
                          alt={res.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-amber-100 to-orange-100 flex items-center justify-center text-amber-500">
                          <UtensilsCrossed className="w-10 h-10 opacity-40" />
                        </div>
                      )}

                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                        <span className="bg-black/75 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" /> {time}
                        </span>
                        <span className="bg-black/75 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-400" /> {distance}
                        </span>
                      </div>

                      {res.pure_veg && (
                        <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                          Pure Veg
                        </div>
                      )}

                      <div className="absolute top-2 right-2 bg-white/95 text-slate-800 text-xs font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{rating}</span>
                      </div>
                    </div>

                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-amber-600 transition truncate">
                          {res.name}
                        </h3>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{cuisinesText}</p>
                        {res.address && (
                          <p className="text-[11px] text-slate-400 truncate mt-1">
                            📍 {res.address}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100/60">
                          Free delivery on ₹249+
                        </span>
                        <span className="font-semibold text-slate-700 flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                          View Menu <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* VIEW 2: RESTAURANT MENU DETAIL */}
      {activeRestaurant && (
        <main className="max-w-4xl mx-auto px-4 pt-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setActiveRestaurant(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Restaurants
            </button>
            <span className="text-xs text-slate-500 font-medium">Within 25km radius</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {activeRestaurant.logo_url ? (
                  <img
                    src={activeRestaurant.logo_url}
                    alt={activeRestaurant.name}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-xs"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl">
                    {activeRestaurant.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-lg text-slate-900">{activeRestaurant.name}</h2>
                    {activeRestaurant.pure_veg && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                        PURE VEG
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeRestaurant.address || 'Delivering via Fiinway Network'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-600 mt-1.5 font-medium">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <strong>{activeRestaurant.rating || activeRestaurant.rating_avg || 4.2}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {activeRestaurant.estimated_prep_time_minutes || 25}-{(activeRestaurant.estimated_prep_time_minutes || 25) + 10} mins
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {activeRestaurant.distance_km != null ? `${activeRestaurant.distance_km} km away` : 'Nearby'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="self-start sm:self-center bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Accepting Orders
              </div>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="sticky top-14 z-20 bg-slate-50/95 backdrop-blur-md py-2 mb-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === null
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Items ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedCategory === cat.id
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {loadingMenu ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse flex justify-between gap-4">
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded-md w-1/2 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded-md w-1/4 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded-md w-3/4"></div>
                  </div>
                  <div className="w-24 h-24 bg-slate-200 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <p className="text-xs text-slate-500">No dishes found in this category.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((prod) => {
                const price = prod.final_price || prod.base_price || 0;
                const inCart = cart[prod.id];
                const isVeg = prod.food_type === 'veg' || activeRestaurant.pure_veg;

                return (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 flex items-center justify-between gap-4 hover:border-slate-300 transition shadow-2xs"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center shrink-0 ${
                            isVeg ? 'border-emerald-600' : 'border-rose-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          ></span>
                        </span>
                        <h4 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                          {prod.name}
                        </h4>
                      </div>

                      <div className="font-bold text-sm text-slate-800 mb-1">₹{price}</div>

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
                          className="w-24 h-24 rounded-xl object-cover border border-slate-200 shadow-2xs"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
                          <UtensilsCrossed className="w-8 h-8 opacity-40" />
                        </div>
                      )}

                      <div className="-mt-4 z-10">
                        {!inCart ? (
                          <button
                            onClick={() => addToCart(prod)}
                            className="bg-white text-orange-600 border border-orange-200 hover:bg-orange-50 font-bold text-xs px-5 py-1.5 rounded-lg shadow-sm active:scale-95 transition flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> ADD
                          </button>
                        ) : (
                          <div className="flex items-center bg-orange-600 text-white rounded-lg shadow-sm overflow-hidden text-xs font-bold">
                            <button
                              onClick={() => removeFromCart(prod.id)}
                              className="px-2.5 py-1.5 hover:bg-orange-700 transition active:scale-90"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 select-none min-w-[20px] text-center">
                              {inCart.quantity}
                            </span>
                            <button
                              onClick={() => addToCart(prod)}
                              className="px-2.5 py-1.5 hover:bg-orange-700 transition active:scale-90"
                            >
                              <Plus className="w-3 h-3" />
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

      {/* FLOATING CART BAR */}
      {cartItemCount > 0 && !isCheckoutOpen && (
        <div className="fixed bottom-3 inset-x-0 z-40 px-4 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto bg-slate-900 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-slate-800 animate-in slide-in-from-bottom-3">
            <div className="flex items-center gap-2.5 min-w-0 pl-1">
              <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-xs">
                {cartItemCount}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm leading-tight truncate">₹{grandTotal}</div>
                <div className="text-[11px] text-slate-400 truncate">
                  {activeRestaurant?.name || 'Your Cart'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition shrink-0"
            >
              <span>View Cart & Checkout</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL / DRAWER */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-base text-slate-900">Complete Your Food Order</h3>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
                  Items from {activeRestaurant?.name}
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl bg-slate-50/50 p-2.5 space-y-2">
                  {cartList.map((item) => (
                    <div key={item.product.id} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2">
                      <div className="flex-1 truncate">
                        <div className="font-semibold text-slate-800 truncate">{item.product.name}</div>
                        <div className="text-[11px] text-slate-500">
                          ₹{item.product.final_price || item.product.base_price} × {item.quantity}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-2xs">
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-1 text-slate-600 hover:text-rose-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-slate-800">{item.quantity}</span>
                          <button
                            onClick={() => addToCart(item.product)}
                            className="p-1 text-slate-600 hover:text-emerald-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-bold text-slate-800 min-w-[50px] text-right">
                          ₹{(item.product.final_price || item.product.base_price || 0) * item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Delivery Details (Within 25 km Radius)
                </h4>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Delivery Address *
                  </label>
                  <textarea
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="House / Flat No, Street, Landmark, Area..."
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none transition"
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
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none transition font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Cooking / Delivery Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="E.g., Don't ring doorbell, leave at gate"
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
                  Select Payment Method
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition text-center ${
                      paymentMethod === 'wallet'
                        ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span className="text-[11px] leading-tight">Fiinway Wallet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition text-center ${
                      paymentMethod === 'upi'
                        ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-[11px] leading-tight">UPI / Online</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition text-center ${
                      paymentMethod === 'cod'
                        ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span className="text-[11px] leading-tight">Cash on Delivery</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Item Total</span>
                  <span>₹{cartSubtotal}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Partner Fee ({activeRestaurant?.distance_km != null ? `${activeRestaurant.distance_km} km` : 'standard'})</span>
                  <span>₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Taxes & Restaurant GST (5%)</span>
                  <span>₹{taxesAndGst}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Platform Fee</span>
                  <span>₹{platformFee}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                  <span>To Pay</span>
                  <span className="text-orange-600">₹{grandTotal}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-slate-500 block">Total Amount</span>
                <span className="text-base font-bold text-slate-900">₹{grandTotal}</span>
              </div>
              <button
                disabled={isPlacingOrder}
                onClick={handlePlaceOrder}
                className="flex-1 bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-md active:scale-95 transition flex items-center justify-center gap-2"
              >
                {isPlacingOrder ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Placing Food Order...</span>
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

      {/* LIVE ORDER CONFIRMATION & REAL-TIME TRACKING MODAL */}
      {isTrackingModal && confirmedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl text-slate-900 relative overflow-hidden animate-in zoom-in-95">
            <button
              onClick={() => {
                setIsTrackingModal(false);
                setActiveRestaurant(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-center text-slate-900">
              Order Successfully Placed!
            </h3>
            <p className="text-xs text-slate-500 text-center mt-0.5 mb-4">
              Sent to kitchen at <strong>{confirmedOrder.restaurant?.name || 'Restaurant'}</strong>
            </p>

            <div className="bg-linear-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-4 mb-4 text-center shadow-md">
              <div className="text-xs uppercase tracking-wider text-amber-100 font-semibold mb-1">
                Delivery Handover OTP
              </div>
              <div className="text-3xl font-extrabold tracking-widest">
                {confirmedOrder.delivery_otp || '----'}
              </div>
              <p className="text-[11px] text-amber-100 mt-1">
                Share this 4-digit code with rider upon delivery
              </p>
            </div>

            <div className="border border-slate-200/80 rounded-2xl p-3.5 bg-slate-50 mb-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800">Order Placed</div>
                  <div className="text-[10px] text-slate-500">#{confirmedOrder.order_number}</div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600">Confirmed</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold animate-pulse">
                  🍳
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800">Kitchen Cooking</div>
                  <div className="text-[10px] text-slate-500">Estimated 20-30 mins</div>
                </div>
                <span className="text-[11px] font-semibold text-amber-600">In Progress</span>
              </div>

              <div className="flex items-center gap-3 opacity-60">
                <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold">
                  🛵
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800">Rider Pickup & Delivery</div>
                  <div className="text-[10px] text-slate-500">Within 25km radius</div>
                </div>
                <span className="text-[11px] text-slate-400">Pending</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsTrackingModal(false);
                  setActiveRestaurant(null);
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-xs"
              >
                Done & Order More Food
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
