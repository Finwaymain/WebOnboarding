"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Utensils,
  Store,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Bell,
  Volume2,
  VolumeX,
  Plus,
  Edit2,
  Trash2,
  Bike,
  DollarSign,
  CreditCard,
  Check,
  X,
  ChevronRight,
  Star,
  MessageSquare,
  HelpCircle,
  RefreshCw,
  Sliders,
  ShieldCheck,
  ShoppingBag,
  Filter,
  Calendar,
  ArrowUpRight,
  Lock,
  Phone,
  MapPin,
  Flame,
  ChefHat,
  Receipt,
  User,
  ExternalLink,
  Search,
  Eye,
  Menu as MenuIcon
} from "lucide-react";

const ENV_API_KEY = "base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU=";

function getApiHeaders(authToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    apikey: ENV_API_KEY,
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
    headers["token"] = authToken;
    headers["X-Restaurant-Token"] = authToken;
    headers["accesstoken"] = authToken;
  }
  return headers;
}

interface RestaurantPartnerPortalProps {
  token?: string;
  phone?: string;
  initialTab?: string;
  onBackToOnboarding?: () => void;
}

export default function RestaurantPartnerPortal({
  token = "",
  phone = "",
  initialTab = "dashboard",
  onBackToOnboarding
}: RestaurantPartnerPortalProps) {
  // Active Tab
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Restaurant profile & Operational status (open / busy / closed)
  const [restaurant, setRestaurant] = useState<any>({
    id: 1,
    name: "Fiinway Partner Kitchen",
    business_type: "actual_restaurant",
    operational_status: "open",
    address: "Central Market, Sector 18",
    city: "Noida",
    avg_prep_minutes: 20,
    opening_time: "10:00",
    closing_time: "23:00",
    phone: phone || "9876543210",
    rating: 4.8,
    total_reviews: 142
  });

  // Sound alert toggle
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // Dashboard Stats
  const [stats, setStats] = useState<any>({
    today_orders: 18,
    pending: 2,
    preparing: 4,
    ready: 3,
    out_for_delivery: 2,
    delivered: 7,
    cancelled: 0,
    today_sales: 7420,
    today_net: 6307,
    pending_due: 450
  });

  // Orders
  const [incomingOrders, setIncomingOrders] = useState<any[]>([
    {
      id: 204,
      order_number: "FW-8932",
      created_at: "Just now",
      customer_name: "Amit Verma",
      customer_phone: "9810234567",
      customer_address: "Flat 402, Sunshine Heights, 2.3 KM",
      delivery_distance_km: 2.3,
      items: [
        { name: "Paneer Butter Masala (Special)", quantity: 2, price: 280, veg: true },
        { name: "Butter Naan", quantity: 4, price: 45, veg: true },
        { name: "Jeera Rice", quantity: 1, price: 140, veg: true }
      ],
      food_amount: 880,
      total_amount: 940,
      payment_method: "upi",
      payment_status: "paid",
      special_instructions: "Please make it medium spicy, include extra green chutney."
    }
  ]);

  const [activeOrders, setActiveOrders] = useState<any[]>([
    {
      id: 202,
      order_number: "FW-8930",
      status: "preparing",
      created_at: "8 mins ago",
      prep_minutes: 20,
      customer_name: "Pooja Sharma",
      customer_phone: "9876501234",
      items: [
        { name: "Chicken Biryani (Dum)", quantity: 1, price: 340, veg: false },
        { name: "Mirchi Ka Salan", quantity: 1, price: 60, veg: true }
      ],
      total_amount: 400,
      payment_method: "wallet",
      rider: { name: "Ramesh Rider", phone: "9823456789", vehicle: "UP16 AB 4920", eta: "5 mins" }
    },
    {
      id: 203,
      order_number: "FW-8931",
      status: "ready_for_pickup",
      created_at: "18 mins ago",
      prep_minutes: 15,
      customer_name: "Vikas Malhotra",
      customer_phone: "9911223344",
      items: [
        { name: "Margherita Pizza (Large)", quantity: 1, price: 420, veg: true },
        { name: "Garlic Breadsticks", quantity: 1, price: 160, veg: true }
      ],
      total_amount: 580,
      payment_method: "upi",
      rider: { name: "Sunil Kumar", phone: "9811223344", vehicle: "UP16 XY 8219", eta: "Arrived at Counter" }
    }
  ]);

  // Modals & UI interactive states
  const [selectedIncomingOrder, setSelectedIncomingOrder] = useState<any | null>(null);
  const [prepTimeChoice, setPrepTimeChoice] = useState<number>(20);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [orderToReject, setOrderToReject] = useState<any | null>(null);

  // Rider handover OTP modal
  const [handoverOrderId, setHandoverOrderId] = useState<number | null>(null);
  const [riderOtp, setRiderOtp] = useState<string>("");

  // Menu State
  const [categories, setCategories] = useState<any[]>([
    { id: 1, name: "Main Course", items_count: 8 },
    { id: 2, name: "Breads & Rice", items_count: 5 },
    { id: 3, name: "Starters & Snacks", items_count: 6 },
    { id: 4, name: "Beverages & Desserts", items_count: 4 }
  ]);

  const [products, setProducts] = useState<any[]>([
    {
      id: 101,
      category_id: 1,
      name: "Paneer Butter Masala",
      description: "Rich cottage cheese cooked in silky tomato butter makhani gravy.",
      price: 280,
      original_price: 320,
      is_veg: true,
      is_available: true,
      prep_minutes: 20,
      image_url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: 102,
      category_id: 1,
      name: "Chicken Dum Biryani (Hyderabadi)",
      description: "Fragrant basmati rice layered with marinated tender chicken and slow cooked.",
      price: 340,
      original_price: 390,
      is_veg: false,
      is_available: true,
      prep_minutes: 25,
      image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: 103,
      category_id: 2,
      name: "Butter Naan",
      description: "Crisp and buttery traditional tandoori leavened flatbread.",
      price: 45,
      original_price: 50,
      is_veg: true,
      is_available: true,
      prep_minutes: 10,
      image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: 104,
      category_id: 3,
      name: "Crispy Corn Pepper Salt",
      description: "Crunchy sweet corn kernels tossed with black pepper, scallions and herbs.",
      price: 210,
      original_price: 240,
      is_veg: true,
      is_available: false,
      prep_minutes: 15,
      image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80"
    }
  ]);

  // Product Add / Edit Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [newProdName, setNewProdName] = useState<string>("");
  const [newProdCategory, setNewProdCategory] = useState<number>(1);
  const [newProdPrice, setNewProdPrice] = useState<string>("");
  const [newProdOriginalPrice, setNewProdOriginalPrice] = useState<string>("");
  const [newProdVeg, setNewProdVeg] = useState<boolean>(true);
  const [newProdDesc, setNewProdDesc] = useState<string>("");
  const [newProdPrep, setNewProdPrep] = useState<string>("20");
  const [newProdImage, setNewProdImage] = useState<string>("");

  // Category Add Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");

  // Toast / notification
  const [toastMessage, setToastMessage] = useState<string>("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Web Audio Synthesizer Chime
  const playChime = useCallback(() => {
    if (isAudioMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      // Pleasant alert dual chime: 880Hz (A5) -> 1318Hz (E6)
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1318, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (_) {}
  }, [isAudioMuted]);

  const resolveToken = useCallback(() => {
    if (token) return token;
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      return (
        p.get("token") ||
        p.get("accesstoken") ||
        localStorage.getItem("restaurant_token") ||
        localStorage.getItem("token") ||
        ""
      );
    }
    return "";
  }, [token]);

  // Load backend profile & data
  const fetchPortalData = useCallback(async () => {
    const effectiveToken = resolveToken();
    if (!effectiveToken) return;

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("restaurant_token", effectiveToken);
      } catch (_) {}
    }

    try {
      const headers = getApiHeaders(effectiveToken);

      // 1. Fetch restaurant info
      const res = await fetch("https://api.fiinway.com/api/v1/food/restaurant/me", { headers });
      const data = await res.json();
      if (data?.success && data?.data) {
        setRestaurant((prev: any) => ({
          ...prev,
          ...data.data,
          name: data.data.name || prev.name,
          phone: data.data.owner_phone || phone || prev.phone,
          address: data.data.address || prev.address,
          city: data.data.city || prev.city,
          operational_status: data.data.operational_status || prev.operational_status || "closed",
        }));
      }

      // 2. Fetch dashboard stats
      const dashRes = await fetch("https://api.fiinway.com/api/v1/food/restaurant/dashboard", { headers });
      const dashData = await dashRes.json();
      if (dashData?.success && dashData?.data) {
        setStats((prev: any) => ({ ...prev, ...dashData.data }));
      }

      // 3. Fetch incoming orders
      const incRes = await fetch("https://api.fiinway.com/api/v1/food/restaurant/orders/incoming", { headers });
      const incData = await incRes.json();
      if (incData?.success && Array.isArray(incData.data)) {
        setIncomingOrders(incData.data);
        if (incData.data.length > 0 && !selectedIncomingOrder) {
          setSelectedIncomingOrder(incData.data[0]);
          playChime();
        }
      }

      // 4. Fetch menu categories & products
      const catRes = await fetch("https://api.fiinway.com/api/v1/food/restaurant/categories", { headers });
      const catData = await catRes.json();
      if (catData?.success && Array.isArray(catData.data) && catData.data.length > 0) {
        setCategories(catData.data);
      }

      const prodRes = await fetch("https://api.fiinway.com/api/v1/food/restaurant/products", { headers });
      const prodData = await prodRes.json();
      if (prodData?.success && Array.isArray(prodData.data) && prodData.data.length > 0) {
        setProducts(prodData.data);
      }
    } catch (e) {
      console.warn("Using offline portal cache / mock fallback");
    }
  }, [resolveToken, selectedIncomingOrder, playChime, phone]);

  // Initial fetch and 8-second polling
  useEffect(() => {
    fetchPortalData();
    const interval = setInterval(fetchPortalData, 8000);
    return () => clearInterval(interval);
  }, [fetchPortalData]);

  // Operational Status Switcher (open / busy / closed)
  const handleToggleOperationalStatus = async (newStatus: string) => {
    const effectiveToken = resolveToken();
    setRestaurant((prev: any) => ({ ...prev, operational_status: newStatus }));

    try {
      await fetch("https://api.fiinway.com/api/v1/food/restaurant/operational-status", {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({ status: newStatus })
      });
      showToast(`Restaurant status set to ${newStatus.toUpperCase()}`);
    } catch (_) {
      showToast(`Status updated locally to ${newStatus.toUpperCase()}`);
    }
  };

  // Accept Order
  const handleAcceptOrder = async (order: any) => {
    const effectiveToken = resolveToken();
    try {
      await fetch(`https://api.fiinway.com/api/v1/food/restaurant/orders/${order.id}/accept`, {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({ preparation_time: prepTimeChoice })
      });
    } catch (_) {}

    // Move to active orders
    setIncomingOrders((prev) => prev.filter((o) => o.id !== order.id));
    setActiveOrders((prev) => [
      {
        ...order,
        status: "preparing",
        prep_minutes: prepTimeChoice,
        rider: { name: "Assigning Nearest Rider...", phone: "", vehicle: "", eta: "Calculating" }
      },
      ...prev
    ]);
    setSelectedIncomingOrder(null);
    showToast(`Order #${order.order_number || order.id} accepted! Prep time set to ${prepTimeChoice}m`);
  };

  // Reject Order
  const handleRejectOrder = async () => {
    if (!orderToReject) return;
    const effectiveToken = resolveToken();
    try {
      await fetch(`https://api.fiinway.com/api/v1/food/restaurant/orders/${orderToReject.id}/reject`, {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({ reason: rejectReason || "Kitchen overloaded" })
      });
    } catch (_) {}

    setIncomingOrders((prev) => prev.filter((o) => o.id !== orderToReject.id));
    setSelectedIncomingOrder(null);
    setIsRejectModalOpen(false);
    setOrderToReject(null);
    setRejectReason("");
    showToast(`Order #${orderToReject.order_number || orderToReject.id} rejected.`);
  };

  // Transition Active Order (Preparing -> Ready -> Handed Over)
  const handleUpdateOrderStatus = async (orderId: number, nextStatus: string) => {
    const effectiveToken = resolveToken();
    try {
      await fetch(`https://api.fiinway.com/api/v1/food/restaurant/orders/${orderId}/status`, {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({ status: nextStatus })
      });
    } catch (_) {}

    setActiveOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );
    showToast(`Order updated to ${nextStatus.replace(/_/g, " ").toUpperCase()}`);
  };

  // Rider Handover
  const handleConfirmHandover = async () => {
    if (!handoverOrderId) return;
    const effectiveToken = resolveToken();
    try {
      await fetch(`https://api.fiinway.com/api/v1/food/restaurant/orders/${handoverOrderId}/handover`, {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({ otp: riderOtp })
      });
    } catch (_) {}

    setActiveOrders((prev) => prev.filter((o) => o.id !== handoverOrderId));
    setHandoverOrderId(null);
    setRiderOtp("");
    showToast("Food handed over to delivery captain successfully!");
  };

  // Instant Stock Availability Toggle
  const handleToggleProductStock = async (productId: number, currentAvailable: boolean) => {
    const effectiveToken = resolveToken();
    const updated = !currentAvailable;

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, is_available: updated } : p))
    );

    try {
      await fetch(`https://api.fiinway.com/api/v1/food/restaurant/products/${productId}/availability`, {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({ is_available: updated })
      });
      showToast(`Dish marked as ${updated ? "AVAILABLE" : "OUT OF STOCK"}`);
    } catch (_) {
      showToast(`Dish status toggled locally.`);
    }
  };

  // Save Product (Add or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) {
      showToast("Dish Name and Price are required.");
      return;
    }

    const payload = {
      name: newProdName.trim(),
      category_id: newProdCategory,
      price: parseFloat(newProdPrice),
      original_price: newProdOriginalPrice ? parseFloat(newProdOriginalPrice) : parseFloat(newProdPrice),
      is_veg: newProdVeg,
      description: newProdDesc,
      prep_minutes: parseInt(newProdPrep) || 20,
      image_url: newProdImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
      is_available: true
    };

    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, ...payload } : p))
      );
      showToast("Food item updated!");
    } else {
      const newId = Date.now();
      setProducts((prev) => [{ id: newId, ...payload }, ...prev]);
      showToast("New food item added to menu!");
    }

    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  // Save Category
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCategories((prev) => [
      ...prev,
      { id: Date.now(), name: newCategoryName.trim(), items_count: 0 }
    ]);
    setNewCategoryName("");
    setIsCategoryModalOpen(false);
    showToast("New category created!");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Brand & Outlet Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0F5132] to-[#15803D] text-white flex items-center justify-center shadow-md">
              <Utensils className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 tracking-tight text-base sm:text-lg">
                  {restaurant.name}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wide bg-emerald-100 text-[#0F5132]">
                  {restaurant.business_type === "actual_restaurant" ? "Restaurant" : "Cloud Kitchen"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {restaurant.address || "Outlet"}, {restaurant.city || "India"} • Rating: ⭐ {restaurant.rating || "4.8"}
              </p>
            </div>
          </div>

          {/* Operational Status Toggle + Controls */}
          <div className="flex items-center gap-3">
            {/* Audio Toggle */}
            <button
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              title={isAudioMuted ? "Unmute Order Alarm" : "Mute Order Alarm"}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                isAudioMuted
                  ? "border-slate-300 text-slate-400 bg-slate-100"
                  : "border-emerald-200 text-emerald-700 bg-emerald-50"
              }`}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />}
              <span className="hidden md:inline">{isAudioMuted ? "Alarm Muted" : "Alarm Active"}</span>
            </button>

            {/* Operational Switcher */}
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                onClick={() => handleToggleOperationalStatus("open")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  restaurant.operational_status === "open"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🟢 Open
              </button>
              <button
                onClick={() => handleToggleOperationalStatus("busy")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  restaurant.operational_status === "busy"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🟡 Busy
              </button>
              <button
                onClick={() => handleToggleOperationalStatus("closed")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  restaurant.operational_status === "closed"
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🔴 Closed
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchPortalData}
              title="Refresh Portal Data"
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Verification Status Banner if pending */}
      {restaurant.onboarding_status === "pending_approval" && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2.5 text-xs font-semibold text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Application Under Verification:</strong> Compliance team is reviewing your documents (FSSAI & Bank). You can manage your dishes, hours & settings while verification completes.
            </span>
          </div>
          <span className="shrink-0 bg-amber-200/80 text-amber-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ml-3">
            In Review
          </span>
        </div>
      )}

      {/* BODY WITH RESPONSIVE LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside
          className={`w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 sm:flex ${
            isMobileMenuOpen ? "fixed inset-y-0 left-0 z-50 flex shadow-2xl" : "hidden sm:flex"
          }`}
        >
          {isMobileMenuOpen && (
            <div className="p-4 flex items-center justify-between border-b border-slate-100 sm:hidden">
              <span className="font-bold text-sm">Navigation</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                activeTab === "dashboard"
                  ? "bg-[#FF5200] text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab("orders");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                activeTab === "orders"
                  ? "bg-[#FF5200] text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4" />
                <span>Live Orders & KDS</span>
              </div>
              {incomingOrders.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">
                  {incomingOrders.length} New
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("menu");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                activeTab === "menu"
                  ? "bg-[#FF5200] text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <Utensils className="w-4 h-4" />
                <span>Menu & Dishes</span>
              </div>
              <span className="text-[11px] text-slate-400 font-semibold">{products.length}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("finance");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                activeTab === "finance"
                  ? "bg-[#FF5200] text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4" />
                <span>Finances & Dues</span>
              </div>
              {stats.pending_due > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                  ₹{stats.pending_due} Due
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("history");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                activeTab === "history"
                  ? "bg-[#FF5200] text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <Receipt className="w-4 h-4" />
                <span>Order History</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab("reviews");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                activeTab === "reviews"
                  ? "bg-[#FF5200] text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <Star className="w-4 h-4" />
                <span>Reviews & Disputes</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab("profile");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                activeTab === "profile"
                  ? "bg-[#FF5200] text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <Sliders className="w-4 h-4" />
                <span>Store Profile & SLA</span>
              </div>
            </button>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <p className="font-bold text-slate-800 text-[11px] truncate">Fiinway Food Partner</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{phone || restaurant.phone || "Active Outlet"}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 sm:pb-8">
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Kitchen Intelligence & Overview
                  </h1>
                  <p className="text-xs text-slate-500">
                    Real-time performance metrics and live order stream for today.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setIsProductModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-[#FF5200] text-white rounded-2xl text-xs font-bold shadow-md hover:bg-[#e04800] transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Dish</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#FF5200]" />
                    <span>View KDS Board</span>
                  </button>
                </div>
              </div>

              {/* Alert Banner for Pending Dues if any */}
              {stats.pending_due > 0 && (
                <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                      <h4 className="font-extrabold text-sm">
                        Pending Company Due: ₹{stats.pending_due}
                      </h4>
                      <p className="text-xs text-amber-800">
                        Please settle daily platform commission dues via UPI to keep instant order assignment active.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("finance")}
                    className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shrink-0 shadow-sm"
                  >
                    Pay Due via UPI
                  </button>
                </div>
              )}

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Orders</span>
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF5200] flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-slate-900">{stats.today_orders}</div>
                  <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                    <span>{stats.delivered} Completed</span> • <span>{stats.preparing + stats.pending} Active</span>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Sales</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-slate-900">₹{stats.today_sales}</div>
                  <div className="text-[11px] text-slate-500 font-semibold mt-1">Total food bill value</div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Earnings</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-slate-900">₹{stats.today_net}</div>
                  <div className="text-[11px] text-blue-600 font-bold mt-1">Direct Bank Payout Share</div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Prep Time</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-slate-900">{restaurant.avg_prep_minutes || 20}m</div>
                  <div className="text-[11px] text-purple-600 font-bold mt-1">Target dispatch SLA</div>
                </div>
              </div>

              {/* Live Orders Pipeline */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <span>Live Kitchen Pipeline</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  </h3>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="text-xs font-bold text-[#FF5200] hover:underline flex items-center gap-1"
                  >
                    Open Live KDS <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                    <div className="text-xl font-black text-amber-800">{incomingOrders.length}</div>
                    <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">Incoming</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                    <div className="text-xl font-black text-blue-800">
                      {activeOrders.filter((o) => o.status === "preparing").length}
                    </div>
                    <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">Preparing</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-center">
                    <div className="text-xl font-black text-purple-800">
                      {activeOrders.filter((o) => o.status === "ready_for_pickup").length}
                    </div>
                    <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wide">Food Ready</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-center">
                    <div className="text-xl font-black text-indigo-800">
                      {activeOrders.filter((o) => o.status === "out_for_delivery").length}
                    </div>
                    <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide">On Delivery</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center col-span-2 sm:col-span-1">
                    <div className="text-xl font-black text-emerald-800">{stats.delivered}</div>
                    <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">Delivered Today</div>
                  </div>
                </div>
              </div>

              {/* Active Orders List Quick Cards */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-extrabold text-base text-slate-900">Current Orders Being Cooked</h3>
                {activeOrders.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                    No active cooking orders right now. New incoming orders will appear here automatically.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-black text-sm text-slate-900">{order.order_number}</span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              {order.status.replace(/_/g, " ")}
                            </span>
                            <span className="text-xs text-slate-400">• {order.created_at}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-800">
                            {order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(", ")}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Customer: {order.customer_name} • Total: ₹{order.total_amount}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {order.status === "preparing" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, "ready_for_pickup")}
                              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs"
                            >
                              Mark Ready
                            </button>
                          )}
                          {order.status === "ready_for_pickup" && (
                            <button
                              onClick={() => setHandoverOrderId(order.id)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                            >
                              <Bike className="w-3.5 h-3.5" />
                              <span>Handover to Rider</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE ORDERS & KDS KANBAN */}
          {activeTab === "orders" && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Kitchen Display System (KDS) & Live Orders
                  </h1>
                  <p className="text-xs text-slate-500">
                    Real-time kitchen order board. Drag and advance order fulfillment steps.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={playChime}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5"
                  >
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                    <span>Test Chime</span>
                  </button>
                </div>
              </div>

              {/* Incoming Orders Section (High Priority Alert) */}
              {incomingOrders.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                    <h3 className="font-black text-base text-red-700 uppercase tracking-wide">
                      Incoming Orders Awaiting Acceptance ({incomingOrders.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {incomingOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-5 rounded-3xl bg-white border-2 border-red-400 shadow-lg space-y-4 animate-pulse"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-lg text-slate-900">{order.order_number}</span>
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-black uppercase">
                              New Order
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-500">{order.created_at}</span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{order.customer_name}</span> • <span className="font-normal text-slate-500">{order.customer_phone}</span>
                          </div>
                          <div className="text-slate-600 flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span>{order.customer_address}</span>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-1.5 border-t border-slate-100 pt-3">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs font-semibold">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${item.veg ? "bg-emerald-500" : "bg-red-500"}`} />
                                <span>{item.quantity}x {item.name}</span>
                              </div>
                              <span className="text-slate-700">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {order.special_instructions && (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium">
                            📝 {order.special_instructions}
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                          <span className="text-slate-500 font-medium">Total Bill:</span>
                          <span className="font-black text-base text-slate-900">₹{order.total_amount}</span>
                        </div>

                        {/* Accept / Reject Buttons */}
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span>Set Preparation Time:</span>
                            <div className="flex items-center gap-1.5">
                              {[15, 20, 30].map((mins) => (
                                <button
                                  key={mins}
                                  onClick={() => setPrepTimeChoice(mins)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                                    prepTimeChoice === mins
                                      ? "bg-[#FF5200] text-white"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  }`}
                                >
                                  {mins}m
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              onClick={() => {
                                setOrderToReject(order);
                                setIsRejectModalOpen(true);
                              }}
                              className="py-2.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs"
                            >
                              Reject Order
                            </button>
                            <button
                              onClick={() => handleAcceptOrder(order)}
                              className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                            >
                              Accept ({prepTimeChoice}m)
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* KDS Kanban 3-Column Board */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column 1: Preparing */}
                <div className="p-4 rounded-3xl bg-blue-50/60 border border-blue-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-blue-900 uppercase tracking-wide flex items-center gap-2">
                      <Flame className="w-4 h-4 text-blue-600" />
                      <span>1. Cooking / Preparing</span>
                    </h3>
                    <span className="w-6 h-6 rounded-full bg-blue-200 text-blue-900 font-bold text-xs flex items-center justify-center">
                      {activeOrders.filter((o) => o.status === "preparing").length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activeOrders.filter((o) => o.status === "preparing").map((order) => (
                      <div key={order.id} className="p-4 rounded-2xl bg-white border border-blue-200 shadow-xs space-y-3">
                        <div className="flex justify-between items-baseline">
                          <span className="font-mono font-black text-sm text-slate-900">{order.order_number}</span>
                          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                            ⏱️ {order.prep_minutes || 20}m SLA
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-slate-700">
                          {order.items.map((it: any, i: number) => (
                            <div key={i} className="flex justify-between">
                              <span>{it.quantity}x {it.name}</span>
                              <span className="text-slate-400">₹{it.price * it.quantity}</span>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, "ready_for_pickup")}
                          className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs"
                        >
                          Mark Food Ready
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: Ready for Pickup */}
                <div className="p-4 rounded-3xl bg-purple-50/60 border border-purple-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-purple-900 uppercase tracking-wide flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                      <span>2. Ready For Pickup</span>
                    </h3>
                    <span className="w-6 h-6 rounded-full bg-purple-200 text-purple-900 font-bold text-xs flex items-center justify-center">
                      {activeOrders.filter((o) => o.status === "ready_for_pickup").length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activeOrders.filter((o) => o.status === "ready_for_pickup").map((order) => (
                      <div key={order.id} className="p-4 rounded-2xl bg-white border border-purple-200 shadow-xs space-y-3">
                        <div className="flex justify-between items-baseline">
                          <span className="font-mono font-black text-sm text-slate-900">{order.order_number}</span>
                          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            Hot & Packed
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Bike className="w-3.5 h-3.5 text-purple-600" />
                            <span>{order.rider?.name || "Rider Assigned"}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Vehicle: {order.rider?.vehicle || "Rider on the way"} • ETA: {order.rider?.eta || "Arrived"}
                          </div>
                        </div>

                        <button
                          onClick={() => setHandoverOrderId(order.id)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Verify & Hand Over Food</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 3: Out for Delivery */}
                <div className="p-4 rounded-3xl bg-emerald-50/60 border border-emerald-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-emerald-900 uppercase tracking-wide flex items-center gap-2">
                      <Bike className="w-4 h-4 text-emerald-600" />
                      <span>3. Out for Delivery</span>
                    </h3>
                    <span className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-900 font-bold text-xs flex items-center justify-center">
                      {activeOrders.filter((o) => o.status === "out_for_delivery").length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activeOrders.filter((o) => o.status === "out_for_delivery").length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400">
                        No orders in transit currently.
                      </div>
                    ) : (
                      activeOrders.filter((o) => o.status === "out_for_delivery").map((order) => (
                        <div key={order.id} className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-2">
                          <span className="font-mono font-black text-sm text-slate-900">{order.order_number}</span>
                          <p className="text-xs text-slate-600">Rider on route to customer destination.</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MENU & DISHES */}
          {activeTab === "menu" && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Menu & Inventory Management
                  </h1>
                  <p className="text-xs text-slate-500">
                    Control menu categories, dish pricing, and instantaneous out-of-stock toggles.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    + Add Category
                  </button>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setNewProdName("");
                      setNewProdPrice("");
                      setNewProdDesc("");
                      setIsProductModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#FF5200] text-white rounded-2xl text-xs font-bold shadow-md hover:bg-[#e04800] transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Food Dish</span>
                  </button>
                </div>
              </div>

              {/* Categories Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <button className="px-4 py-2 rounded-2xl bg-slate-900 text-white font-bold text-xs shrink-0 shadow-xs">
                  All Items ({products.length})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    className="px-4 py-2 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs shrink-0 hover:bg-slate-50"
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Product Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
                  >
                    <div>
                      {/* Image & Veg indicator */}
                      <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-slate-100 mb-3.5">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                          <span className={`w-2.5 h-2.5 rounded-full ${product.is_veg ? "bg-emerald-600" : "bg-red-600"}`} />
                          <span className="text-[10px] font-extrabold text-slate-800">
                            {product.is_veg ? "VEG" : "NON-VEG"}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                          {product.name}
                        </h4>
                        <span className="text-base font-black text-[#FF5200] shrink-0">
                          ₹{product.price}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {/* Stock Availability Toggle & Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={product.is_available}
                            onChange={() => handleToggleProductStock(product.id, product.is_available)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                        <span className={`text-[11px] font-extrabold uppercase ${product.is_available ? "text-emerald-700" : "text-slate-400"}`}>
                          {product.is_available ? "In Stock" : "Sold Out"}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setNewProdName(product.name);
                          setNewProdPrice(product.price.toString());
                          setNewProdOriginalPrice(product.original_price?.toString() || "");
                          setNewProdVeg(product.is_veg);
                          setNewProdDesc(product.description || "");
                          setNewProdPrep((product.prep_minutes || 20).toString());
                          setNewProdImage(product.image_url || "");
                          setIsProductModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: FINANCES & DUES */}
          {activeTab === "finance" && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Finances, Dues & Settlement Ledger
                </h1>
                <p className="text-xs text-slate-500">
                  Transparent breakdown of gross food bills, Fiinway commission, company dues, and daily bank transfers.
                </p>
              </div>

              {/* Company Due Alert Box */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-100">
                    Outstanding Company Platform Due
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-extrabold">
                    24h Payout Settlement
                  </span>
                </div>
                <div className="text-3xl font-black">₹{stats.pending_due}</div>
                <p className="text-xs text-amber-100 leading-relaxed max-w-xl">
                  Platform commission dues from Cash-on-Delivery and online order processing. Settle balance via UPI to ensure seamless live order assignment.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => showToast("Opening UPI payment sheet for company due...")}
                    className="px-6 py-2.5 bg-white text-slate-900 font-extrabold text-xs rounded-xl shadow-md hover:bg-slate-100 transition-all flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4 text-orange-600" />
                    <span>Pay ₹{stats.pending_due} via UPI (Instant Clearance)</span>
                  </button>
                </div>
              </div>

              {/* Finance Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Gross Food Sales</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">₹{stats.today_sales}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Total revenue generated from customer bookings</p>
                </div>
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Fiinway Platform Comm.</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">₹{Math.round(stats.today_sales * 0.15)}</div>
                  <p className="text-[11px] text-slate-400 mt-1">15% Standard commission model</p>
                </div>
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Settled Direct to Bank</span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">₹{stats.today_net}</div>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">Transferred every 24 hours</p>
                </div>
              </div>

              {/* Settlement History Table */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-extrabold text-base text-slate-900">Recent Bank Settlement Records</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                        <th className="pb-3">Date</th>
                        <th className="pb-3">UTR / Txn Ref</th>
                        <th className="pb-3">Gross Sales</th>
                        <th className="pb-3">Commission</th>
                        <th className="pb-3">Net Payout</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr>
                        <td className="py-3.5">Yesterday, 10 Sep</td>
                        <td className="font-mono text-slate-600">UTR8931092834</td>
                        <td>₹8,920</td>
                        <td>₹1,338</td>
                        <td className="font-black text-emerald-700">₹7,582</td>
                        <td><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Settled</span></td>
                      </tr>
                      <tr>
                        <td className="py-3.5">09 Sep 2026</td>
                        <td className="font-mono text-slate-600">UTR8920192841</td>
                        <td>₹6,400</td>
                        <td>₹960</td>
                        <td className="font-black text-emerald-700">₹5,440</td>
                        <td><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Settled</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: HISTORY */}
          {activeTab === "history" && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Past Order History & Invoices
                </h1>
                <p className="text-xs text-slate-500">
                  Search past fulfilled orders, customer receipts and delivery reports.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Search by Order ID or Customer Name..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#FF5200]"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    { id: "FW-8910", customer: "Rajeev Singhal", amount: 620, time: "Yesterday, 8:40 PM", items: "1x Dal Makhani, 3x Roti", status: "Delivered" },
                    { id: "FW-8909", customer: "Neha Gupta", amount: 480, time: "Yesterday, 7:15 PM", items: "1x Veg Hakka Noodles, 1x Manchurian", status: "Delivered" },
                    { id: "FW-8908", customer: "Karan Johar", amount: 350, time: "Yesterday, 6:00 PM", items: "2x Butter Chicken Roll", status: "Delivered" }
                  ].map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-black text-slate-900">{ord.id}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {ord.status}
                          </span>
                          <span className="text-slate-400">{ord.time}</span>
                        </div>
                        <p className="text-slate-700 font-semibold">{ord.items}</p>
                        <p className="text-[11px] text-slate-500">Customer: {ord.customer}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-sm text-slate-900 block">₹{ord.amount}</span>
                        <button
                          onClick={() => showToast(`Invoice for ${ord.id} downloaded.`)}
                          className="text-[11px] text-[#FF5200] font-bold hover:underline"
                        >
                          View Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: REVIEWS & DISPUTES */}
          {activeTab === "reviews" && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Customer Ratings, Reviews & Disputes
                </h1>
                <p className="text-xs text-slate-500">
                  Monitor partner ratings and respond directly to customer dish feedback.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Review 1 */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-[#FF5200] font-bold text-xs flex items-center justify-center">
                        AS
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">Ananya Sen</h4>
                        <span className="text-[10px] text-slate-400">Order FW-8902 • 2 days ago</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>5.0</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    "The Paneer Butter Masala was piping hot and absolutely delicious! Packaging was leak-proof and naan stayed soft. Highly recommended!"
                  </p>
                  <button
                    onClick={() => showToast("Reply modal opened.")}
                    className="text-xs font-bold text-[#FF5200] hover:underline"
                  >
                    Reply to Customer
                  </button>
                </div>

                {/* Review 2 */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                        MK
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">Manish Kumar</h4>
                        <span className="text-[10px] text-slate-400">Order FW-8891 • 3 days ago</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>4.5</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    "Biryani had good aroma and portion size was generous. Delivery was right on time."
                  </p>
                  <button
                    onClick={() => showToast("Reply modal opened.")}
                    className="text-xs font-bold text-[#FF5200] hover:underline"
                  >
                    Reply to Customer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PROFILE & SLA */}
          {activeTab === "profile" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Kitchen Profile & Operational Timings
                </h1>
                <p className="text-xs text-slate-500">
                  Registered legal details, operating hours, and average preparation turnaround.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Outlet Name</label>
                    <input
                      type="text"
                      disabled
                      value={restaurant.name}
                      className="w-full p-3 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Business Model</label>
                    <input
                      type="text"
                      disabled
                      value={restaurant.business_type === "actual_restaurant" ? "Actual Restaurant" : "Cloud Kitchen"}
                      className="w-full p-3 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-800 capitalize"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Opening Time</label>
                    <input
                      type="time"
                      defaultValue={restaurant.opening_time || "10:00"}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Closing Time</label>
                    <input
                      type="time"
                      defaultValue={restaurant.closing_time || "23:00"}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Kitchen Address</label>
                  <input
                    type="text"
                    disabled
                    value={restaurant.address || "Sector 18, Noida"}
                    className="w-full p-3 rounded-xl bg-slate-100 border border-slate-200 font-semibold"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => showToast("Kitchen timings and settings saved!")}
                    className="px-6 py-2.5 bg-[#FF5200] hover:bg-[#e04800] text-white font-bold rounded-xl shadow-md text-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 py-2 px-3 flex items-center justify-around z-40 shadow-lg">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center gap-1 p-1 ${
            activeTab === "dashboard" ? "text-[#FF5200]" : "text-slate-400"
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px] font-bold">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`relative flex flex-col items-center gap-1 p-1 ${
            activeTab === "orders" ? "text-[#FF5200]" : "text-slate-400"
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] font-bold">Live KDS</span>
          {incomingOrders.length > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("menu")}
          className={`flex flex-col items-center gap-1 p-1 ${
            activeTab === "menu" ? "text-[#FF5200]" : "text-slate-400"
          }`}
        >
          <Utensils className="w-5 h-5" />
          <span className="text-[10px] font-bold">Menu</span>
        </button>

        <button
          onClick={() => setActiveTab("finance")}
          className={`flex flex-col items-center gap-1 p-1 ${
            activeTab === "finance" ? "text-[#FF5200]" : "text-slate-400"
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-[10px] font-bold">Finance</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 p-1 text-slate-400"
        >
          <MenuIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold">More</span>
        </button>
      </div>

      {/* MODAL: ADD / EDIT PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingProduct ? "Edit Food Dish" : "Add New Food Dish"}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shahi Paneer"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="280"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    placeholder="320"
                    value={newProdOriginalPrice}
                    onChange={(e) => setNewProdOriginalPrice(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Dietary Tag</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewProdVeg(true)}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 ${
                      newProdVeg
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 text-slate-500"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span>Pure Veg</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProdVeg(false)}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 ${
                      !newProdVeg
                        ? "border-red-600 bg-red-50 text-red-800"
                        : "border-slate-200 text-slate-500"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                    <span>Non-Veg</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Dish Description</label>
                <textarea
                  rows={2}
                  placeholder="Ingredients, culinary description, flavor notes..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(Number(e.target.value))}
                    className="w-full p-3 rounded-xl border border-slate-200 font-semibold bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Prep Time (Mins)</label>
                  <input
                    type="number"
                    value={newProdPrep}
                    onChange={(e) => setNewProdPrep(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 font-semibold"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#FF5200] hover:bg-[#e04800] text-white font-bold shadow-md"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CATEGORY */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Add Menu Category</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Biryanis & Rice"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#FF5200] hover:bg-[#e04800] text-white font-bold shadow-md"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REJECT ORDER REASON */}
      {isRejectModalOpen && orderToReject && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-black text-base text-red-700">Reject Order #{orderToReject.order_number}</h3>
            <p className="text-xs text-slate-500">Select reason for rejecting this booking:</p>

            <div className="space-y-2 text-xs font-semibold text-slate-700">
              {[
                "Key ingredients out of stock",
                "Kitchen queue is completely full",
                "Outlet closing down for the day",
                "Address beyond delivery capability"
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setRejectReason(reason)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    rejectReason === reason
                      ? "border-red-500 bg-red-50 text-red-900 font-bold"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setOrderToReject(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
              >
                Back
              </button>
              <button
                onClick={handleRejectOrder}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RIDER OTP HANDOVER */}
      {handoverOrderId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">Rider Handover Verification</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter the 4-digit handover OTP shown on delivery rider's Fiinway Captain App:
              </p>
            </div>

            <input
              type="text"
              maxLength={4}
              placeholder="4-Digit OTP"
              value={riderOtp}
              onChange={(e) => setRiderOtp(e.target.value)}
              className="w-full text-center tracking-widest text-2xl font-black py-3 rounded-2xl bg-slate-50 border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-600 font-mono"
            />

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  setHandoverOrderId(null);
                  setRiderOtp("");
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmHandover}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
              >
                Verify & Handover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
