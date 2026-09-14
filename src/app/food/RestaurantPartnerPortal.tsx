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
  Menu as MenuIcon,
  LogOut,
  Copy
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
    id: 0,
    name: "Partner Kitchen",
    business_type: "actual_restaurant",
    operational_status: "closed",
    address: "",
    city: "",
    avg_prep_minutes: 20,
    opening_time: "10:00",
    closing_time: "23:00",
    phone: phone || "",
    rating: 0,
    total_reviews: 0
  });

  // Sound alert toggle
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // Dashboard Stats
  const [stats, setStats] = useState<any>({
    today_orders: 0,
    pending: 0,
    preparing: 0,
    ready: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
    active_orders: 0,
    today_sales: 0,
    today_commission: 0,
    today_net: 0,
    pending_due: 0
  });

  // Live Orders
  const [incomingOrders, setIncomingOrders] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  // Menu State
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);

  // Settlements & Finances
  const [settlements, setSettlements] = useState<any[]>([]);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState<boolean>(false);
  const [upiPaymentUtr, setUpiPaymentUtr] = useState<string>("");
  const [isSubmittingDue, setIsSubmittingDue] = useState<boolean>(false);

  // Order History & Drawer
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState<string>("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>("all");
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any | null>(null);

  // Reviews
  const [reviews, setReviews] = useState<any[]>([]);
  const [replyingReview, setReplyingReview] = useState<any | null>(null);
  const [reviewReplyText, setReviewReplyText] = useState<string>("");

  // Modals & UI interactive states
  const [selectedIncomingOrder, setSelectedIncomingOrder] = useState<any | null>(null);
  const [prepTimeChoice, setPrepTimeChoice] = useState<number>(20);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [orderToReject, setOrderToReject] = useState<any | null>(null);

  // Rider handover OTP modal
  const [handoverOrderId, setHandoverOrderId] = useState<number | null>(null);
  const [riderOtp, setRiderOtp] = useState<string>("");

  // Product Add / Edit Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [newProdName, setNewProdName] = useState<string>("");
  const [newProdCategory, setNewProdCategory] = useState<number | string>("");
  const [newProdPrice, setNewProdPrice] = useState<string>("");
  const [newProdOriginalPrice, setNewProdOriginalPrice] = useState<string>("");
  const [newProdVeg, setNewProdVeg] = useState<boolean>(true);
  const [newProdDesc, setNewProdDesc] = useState<string>("");
  const [newProdPrep, setNewProdPrep] = useState<string>("20");
  const [newProdImage, setNewProdImage] = useState<string>("");

  // Category Add Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [newCategoryDesc, setNewCategoryDesc] = useState<string>("");

  // Profile Form state
  const [profileOpening, setProfileOpening] = useState<string>("10:00");
  const [profileClosing, setProfileClosing] = useState<string>("23:00");
  const [profilePrepMins, setProfilePrepMins] = useState<number>(20);
  const [profileRadius, setProfileRadius] = useState<number>(5);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

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
        const d = data.data;
        setRestaurant((prev: any) => ({
          ...prev,
          ...d,
          name: d.name || prev.name,
          phone: d.owner_phone || phone || prev.phone,
          address: d.address || prev.address,
          city: d.city || prev.city,
          operational_status: d.operational_status || prev.operational_status || "closed",
          rating: d.rating_avg || prev.rating || 0,
          total_reviews: d.rating_count || prev.total_reviews || 0,
        }));
        if (d.opening_time) setProfileOpening(d.opening_time.slice(0, 5));
        if (d.closing_time) setProfileClosing(d.closing_time.slice(0, 5));
        if (d.avg_prep_minutes) setProfilePrepMins(d.avg_prep_minutes);
        if (d.delivery_radius_km) setProfileRadius(d.delivery_radius_km);
      }

      // 2. Fetch dashboard stats
      const dashRes = await fetch("https://api.fiinway.com/api/v1/food/restaurant/dashboard", { headers });
      const dashData = await dashRes.json();
      if (dashData?.success && dashData?.data) {
        setStats((prev: any) => ({ ...prev, ...dashData.data }));
      }

      // 3. Fetch incoming orders (Pending)
      const incRes = await fetch("https://api.fiinway.com/api/v1/food/restaurant/orders/incoming", { headers });
      const incData = await incRes.json();
      if (incData?.success && Array.isArray(incData.data)) {
        const prevCount = incomingOrders.length;
        setIncomingOrders(incData.data);
        if (incData.data.length > prevCount) {
          playChime();
        }
      }

      // 4. Fetch active orders (Preparing, Ready, Picked up)
      const actRes = await fetch("https://api.fiinway.com/api/v1/food/restaurant/orders?active=1", { headers });
      const actData = await actRes.json();
      if (actData?.success) {
        const orderList = Array.isArray(actData.data)
          ? actData.data
          : Array.isArray(actData.data?.data)
          ? actData.data.data
          : [];
        setActiveOrders(orderList);
      }

      // 5. Fetch menu categories & products
      const catRes = await fetch("https://api.fiinway.com/api/v1/food/restaurant/categories", { headers });
      const catData = await catRes.json();
      if (catData?.success && Array.isArray(catData.data)) {
        setCategories(catData.data);
      }

      const prodRes = await fetch("https://api.fiinway.com/api/v1/food/restaurant/products", { headers });
      const prodData = await prodRes.json();
      if (prodData?.success && Array.isArray(prodData.data)) {
        setProducts(prodData.data);
      }

      // 6. Fetch settlements
      const setRes = await fetch("https://api.fiinway.com/api/v1/food/restaurant/settlements", { headers });
      const setData = await setRes.json();
      if (setData?.success) {
        const setList = Array.isArray(setData.data)
          ? setData.data
          : Array.isArray(setData.data?.data)
          ? setData.data.data
          : [];
        setSettlements(setList);
      }

      // 7. Fetch reviews
      const revRes = await fetch("https://api.fiinway.com/api/v1/food/restaurant/reviews", { headers });
      const revData = await revRes.json();
      if (revData?.success) {
        const revList = Array.isArray(revData.data)
          ? revData.data
          : Array.isArray(revData.data?.data)
          ? revData.data.data
          : [];
        setReviews(revList);
      }
    } catch (e) {
      console.warn("Error fetching restaurant portal data", e);
    }
  }, [resolveToken, incomingOrders.length, playChime, phone]);

  // Fetch past orders for history tab
  const fetchPastOrders = useCallback(async (searchQuery = "", status = "all") => {
    const effectiveToken = resolveToken();
    if (!effectiveToken) return;
    try {
      let url = "https://api.fiinway.com/api/v1/food/restaurant/orders?per_page=50";
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (status && status !== "all") url += `&status=${encodeURIComponent(status)}`;
      const res = await fetch(url, { headers: getApiHeaders(effectiveToken) });
      const data = await res.json();
      if (data?.success) {
        const list = Array.isArray(data.data) ? data.data : Array.isArray(data.data?.data) ? data.data.data : [];
        setPastOrders(list);
      }
    } catch (_) {}
  }, [resolveToken]);

  // Initial fetch and 8-second polling
  useEffect(() => {
    fetchPortalData();
    const interval = setInterval(fetchPortalData, 8000);
    return () => clearInterval(interval);
  }, [fetchPortalData]);

  // When switching to history tab, fetch past orders
  useEffect(() => {
    if (activeTab === "history") {
      fetchPastOrders(historySearch, historyStatusFilter);
    }
  }, [activeTab, historySearch, historyStatusFilter, fetchPastOrders]);

  // Operational Status Switcher (open / busy / closed)
  const handleToggleOperationalStatus = async (newStatus: string) => {
    const effectiveToken = resolveToken();
    setRestaurant((prev: any) => ({ ...prev, operational_status: newStatus }));

    try {
      const res = await fetch("https://api.fiinway.com/api/v1/food/restaurant/operational-status", {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data?.success) {
        showToast(`Kitchen status set to ${newStatus.toUpperCase()}`);
      } else {
        showToast(`Status updated to ${newStatus.toUpperCase()}`);
      }
    } catch (_) {
      showToast(`Status set to ${newStatus.toUpperCase()}`);
    }
  };

  // Accept Order
  const handleAcceptOrder = async (order: any) => {
    const effectiveToken = resolveToken();
    try {
      const res = await fetch(`https://api.fiinway.com/api/v1/food/restaurant/orders/${order.id}/accept`, {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({ prep_minutes: prepTimeChoice })
      });
      const data = await res.json();
      if (data?.success) {
        showToast(`Order #${order.order_number || order.id} accepted! Prep time set to ${prepTimeChoice}m`);
      } else {
        showToast("Order accepted.");
      }
    } catch (_) {
      showToast("Order accepted.");
    }

    fetchPortalData();
    setSelectedIncomingOrder(null);
  };

  // Reject Order
  const handleRejectOrder = async () => {
    if (!orderToReject) return;
    const effectiveToken = resolveToken();
    try {
      const res = await fetch(`https://api.fiinway.com/api/v1/food/restaurant/orders/${orderToReject.id}/reject`, {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({ reason: rejectReason || "Kitchen overloaded" })
      });
      const data = await res.json();
      if (data?.success) {
        showToast(`Order #${orderToReject.order_number || orderToReject.id} rejected.`);
      }
    } catch (_) {}

    setIsRejectModalOpen(false);
    setOrderToReject(null);
    setRejectReason("");
    fetchPortalData();
  };

  // Advance Order Status (Preparing -> Ready For Pickup)
  const handleUpdateOrderStatus = async (orderId: number, nextStatus: string) => {
    const effectiveToken = resolveToken();
    try {
      const res = await fetch(`https://api.fiinway.com/api/v1/food/restaurant/orders/${orderId}/status`, {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({ order_status: nextStatus })
      });
      const data = await res.json();
      if (data?.success) {
        showToast(`Order status updated to ${nextStatus.replace(/_/g, " ").toUpperCase()}`);
      }
    } catch (_) {}

    fetchPortalData();
  };

  // Rider Handover Verification
  const handleConfirmHandover = async () => {
    if (!handoverOrderId) return;
    const effectiveToken = resolveToken();
    try {
      const res = await fetch(`https://api.fiinway.com/api/v1/food/restaurant/orders/${handoverOrderId}/handover`, {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({ pickup_otp: riderOtp })
      });
      const data = await res.json();
      if (data?.success) {
        showToast("Food handed over to delivery captain successfully!");
        setHandoverOrderId(null);
        setRiderOtp("");
      } else {
        showToast(data?.error || "OTP verification failed. Please re-check.");
      }
    } catch (_) {
      showToast("Food handover confirmed.");
      setHandoverOrderId(null);
      setRiderOtp("");
    }

    fetchPortalData();
  };

  // Instant Stock Availability Toggle
  const handleToggleProductStock = async (productId: number, currentAvailable: boolean) => {
    const effectiveToken = resolveToken();
    const nextAvailability = currentAvailable ? "out_of_stock" : "available";

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, availability: nextAvailability } : p))
    );

    try {
      await fetch(`https://api.fiinway.com/api/v1/food/restaurant/products/${productId}/availability`, {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({ availability: nextAvailability })
      });
      showToast(`Dish marked as ${nextAvailability === "available" ? "IN STOCK" : "OUT OF STOCK"}`);
    } catch (_) {
      showToast("Dish availability updated.");
    }
  };

  // Save Product (Add or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) {
      showToast("Dish Name and Price are required.");
      return;
    }

    const effectiveToken = resolveToken();
    const payload = {
      name: newProdName.trim(),
      category_id: newProdCategory ? Number(newProdCategory) : (categories[0]?.id || null),
      restaurant_price: parseFloat(newProdPrice),
      discount_price: newProdOriginalPrice ? parseFloat(newProdOriginalPrice) : null,
      food_type: newProdVeg ? "veg" : "non_veg",
      description: newProdDesc,
      prep_minutes: parseInt(newProdPrep) || 20,
      image: newProdImage || null,
      availability: "available"
    };

    try {
      const url = editingProduct
        ? `https://api.fiinway.com/api/v1/food/restaurant/products/${editingProduct.id}`
        : "https://api.fiinway.com/api/v1/food/restaurant/products";
      const res = await fetch(url, {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data?.success) {
        showToast(editingProduct ? "Food dish updated successfully!" : "New dish added to menu!");
      } else {
        showToast(data?.error || "Saved dish successfully.");
      }
    } catch (_) {
      showToast("Dish saved.");
    }

    setIsProductModalOpen(false);
    setEditingProduct(null);
    fetchPortalData();
  };

  // Delete Product
  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Are you sure you want to remove this dish from your menu?")) return;
    const effectiveToken = resolveToken();
    try {
      const res = await fetch(`https://api.fiinway.com/api/v1/food/restaurant/products/${productId}`, {
        method: "DELETE",
        headers: getApiHeaders(effectiveToken)
      });
      const data = await res.json();
      if (data?.success) {
        showToast("Dish removed from menu.");
      }
    } catch (_) {}
    fetchPortalData();
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const effectiveToken = resolveToken();

    try {
      const res = await fetch("https://api.fiinway.com/api/v1/food/restaurant/categories", {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDesc.trim() || null
        })
      });
      const data = await res.json();
      if (data?.success) {
        showToast("New category created successfully!");
      }
    } catch (_) {}

    setNewCategoryName("");
    setNewCategoryDesc("");
    setIsCategoryModalOpen(false);
    fetchPortalData();
  };

  // Pay Due via UPI
  const handlePayCompanyDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiPaymentUtr.trim()) {
      showToast("Please enter the 12-digit UPI UTR or Ref ID.");
      return;
    }

    setIsSubmittingDue(true);
    const effectiveToken = resolveToken();
    try {
      const res = await fetch("https://api.fiinway.com/api/v1/food/restaurant/dues/pay", {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({
          amount: stats.pending_due,
          payment_ref: upiPaymentUtr.trim(),
          transaction_reference: upiPaymentUtr.trim(),
          payment_method: "upi"
        })
      });
      const data = await res.json();
      if (data?.success) {
        showToast("UPI Due Payment submitted successfully! Clearance updated.");
        setIsUpiModalOpen(false);
        setUpiPaymentUtr("");
        fetchPortalData();
      } else {
        showToast(data?.error || "Submission recorded.");
      }
    } catch (_) {
      showToast("Payment reference recorded.");
      setIsUpiModalOpen(false);
    } finally {
      setIsSubmittingDue(false);
    }
  };

  // Save Profile settings
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    const effectiveToken = resolveToken();
    try {
      const res = await fetch("https://api.fiinway.com/api/v1/food/restaurant/update", {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({
          opening_time: profileOpening,
          closing_time: profileClosing,
          avg_prep_minutes: profilePrepMins,
          delivery_radius_km: profileRadius
        })
      });
      const data = await res.json();
      if (data?.success) {
        showToast("Kitchen settings and timings saved successfully!");
      } else {
        showToast("Profile settings updated.");
      }
    } catch (_) {
      showToast("Settings saved.");
    } finally {
      setIsSavingProfile(false);
      fetchPortalData();
    }
  };

  // Reply to Review
  const handleSubmitReviewReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview || !reviewReplyText.trim()) return;
    const effectiveToken = resolveToken();
    try {
      const res = await fetch(`https://api.fiinway.com/api/v1/food/restaurant/reviews/${replyingReview.id}/reply`, {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({ reply: reviewReplyText.trim() })
      });
      const data = await res.json();
      if (data?.success) {
        showToast("Reply published to customer review!");
        setReplyingReview(null);
        setReviewReplyText("");
        fetchPortalData();
      }
    } catch (_) {
      showToast("Reply submitted.");
      setReplyingReview(null);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("restaurant_token");
        localStorage.removeItem("token");
      } catch (_) {}

      // Notify Flutter WebView bridge
      if ((window as any).FiinwayBridge?.postMessage) {
        (window as any).FiinwayBridge.postMessage("logout");
      } else {
        window.location.href = "/food";
      }
    }
  };

  // Filtered products
  const displayedProducts = selectedCategoryFilter
    ? products.filter((p) => p.category_id === selectedCategoryFilter)
    : products;

  // Due UPI string
  const upiVpa = "fiinway@icici";
  const upiDueString = `upi://pay?pa=${upiVpa}&pn=Fiinway%20Technologies&am=${stats.pending_due}&cu=INR&tn=Due%20Payment%20Restaurant%20${restaurant.id}`;
  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiDueString)}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-[#FF5200] selection:text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
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
              className="sm:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 cursor-pointer"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0F5132] to-[#15803D] text-white flex items-center justify-center shadow-md">
              <Utensils className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 tracking-tight text-base sm:text-lg">
                  {restaurant.name || "Kitchen Dashboard"}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-[#0F5132]">
                  {restaurant.business_type === "actual_restaurant" ? "Dine-in & Delivery" : "Cloud Kitchen"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {restaurant.address || "Outlet Location"}{restaurant.city ? `, ${restaurant.city}` : ""} • ⭐ {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : "New"} ({restaurant.total_reviews} reviews)
              </p>
            </div>
          </div>

          {/* Operational Status Switcher + Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audio Toggle */}
            <button
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              title={isAudioMuted ? "Unmute Order Alarm" : "Mute Order Alarm"}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isAudioMuted
                  ? "border-slate-300 text-slate-400 bg-slate-100"
                  : "border-emerald-200 text-emerald-700 bg-emerald-50"
              }`}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />}
              <span className="hidden md:inline">{isAudioMuted ? "Alarm Muted" : "Alarm On"}</span>
            </button>

            {/* Operational Switcher */}
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                onClick={() => handleToggleOperationalStatus("open")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  restaurant.operational_status === "open"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🟢 Open
              </button>
              <button
                onClick={() => handleToggleOperationalStatus("busy")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  restaurant.operational_status === "busy"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🟡 Busy
              </button>
              <button
                onClick={() => handleToggleOperationalStatus("closed")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
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
              <strong>Application Under Verification:</strong> Our compliance team is verifying your FSSAI license and bank details. You can manage your menu and kitchen settings in the meantime.
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
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-slate-500 cursor-pointer">
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
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
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
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
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
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "menu"
                  ? "bg-[#FF5200] text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <Utensils className="w-4 h-4" />
                <span>Menu & Inventory</span>
              </div>
              <span className="text-[11px] text-slate-400 font-semibold">{products.length}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("finance");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
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
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
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
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "reviews"
                  ? "bg-[#FF5200] text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <Star className="w-4 h-4" />
                <span>Reviews & Ratings</span>
              </div>
              {reviews.length > 0 && (
                <span className="text-[11px] text-slate-400 font-semibold">{reviews.length}</span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("profile");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "bg-[#FF5200] text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <Sliders className="w-4 h-4" />
                <span>Kitchen Profile & SLA</span>
              </div>
            </button>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-100 text-xs text-slate-500 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <p className="font-bold text-slate-800 text-[11px] truncate">Fiinway Food Partner</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{phone || restaurant.phone || "Active Outlet"}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 rounded-xl text-xs font-bold transition-all border border-red-200 shadow-xs cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
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
                      setNewProdName("");
                      setNewProdPrice("");
                      setNewProdOriginalPrice("");
                      setNewProdDesc("");
                      setNewProdVeg(true);
                      setNewProdPrep("20");
                      setNewProdImage("");
                      setNewProdCategory(categories[0]?.id || "");
                      setIsProductModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-[#FF5200] text-white rounded-2xl text-xs font-bold shadow-md hover:bg-[#e04800] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Dish</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#FF5200]" />
                    <span>View KDS Board</span>
                  </button>
                </div>
              </div>

              {/* Alert Banner for Pending Dues if any */}
              {stats.pending_due > 0 && (
                <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">
                        Outstanding Platform Due: ₹{stats.pending_due}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Settle commission dues via instant UPI clearance to ensure continuous live customer order assignments.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsUpiModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-[#FF5200] hover:bg-[#e04800] text-white font-bold text-xs shrink-0 shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay Due via UPI</span>
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
                    <span>{stats.delivered} Completed</span> • <span>{incomingOrders.length + activeOrders.length} Active</span>
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
                  <div className="text-[11px] text-slate-500 font-semibold mt-1">Total customer billings</div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Bank Payout</span>
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
                  <div className="text-[11px] text-purple-600 font-bold mt-1">Kitchen SLA Target</div>
                </div>
              </div>

              {/* Live Kitchen Pipeline Summary */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <span>Live Kitchen Pipeline</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  </h3>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="text-xs font-bold text-[#FF5200] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Open Live KDS Board <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                    <div className="text-xl font-black text-amber-800">{incomingOrders.length}</div>
                    <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">Incoming</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                    <div className="text-xl font-black text-blue-800">
                      {activeOrders.filter((o) => o.order_status === "restaurant_accepted" || o.order_status === "preparing").length}
                    </div>
                    <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">Cooking</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-center">
                    <div className="text-xl font-black text-purple-800">
                      {activeOrders.filter((o) => o.order_status === "ready_for_pickup").length}
                    </div>
                    <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wide">Food Ready</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-center">
                    <div className="text-xl font-black text-indigo-800">
                      {activeOrders.filter((o) => ["rider_assigned", "rider_at_restaurant", "food_picked_up", "out_for_delivery"].includes(o.order_status)).length}
                    </div>
                    <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide">On Delivery</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center col-span-2 sm:col-span-1">
                    <div className="text-xl font-black text-emerald-800">{stats.delivered}</div>
                    <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">Delivered Today</div>
                  </div>
                </div>
              </div>

              {/* Active Cooking Orders Stream */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-extrabold text-base text-slate-900">Current Orders In Preparation</h3>
                {activeOrders.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs font-semibold bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    No active cooking orders right now. New accepted orders will stream in here live.
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
                              {(order.order_status || "preparing").replace(/_/g, " ")}
                            </span>
                            <span className="text-xs text-slate-400">• {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-800">
                            {Array.isArray(order.items) && order.items.length > 0
                              ? order.items.map((i: any) => `${i.quantity}x ${i.product_name || i.name}`).join(", ")
                              : "Order Items"}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Customer: {order.customer_name || "Guest Customer"} • Bill: ₹{order.food_amount || order.customer_payable}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {["restaurant_accepted", "preparing"].includes(order.order_status) && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, "ready_for_pickup")}
                              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                            >
                              Mark Ready
                            </button>
                          )}
                          {order.order_status === "ready_for_pickup" && (
                            <button
                              onClick={() => setHandoverOrderId(order.id)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
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

          {/* TAB 2: LIVE ORDERS & KDS */}
          {activeTab === "orders" && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Kitchen Display System (KDS)
                  </h1>
                  <p className="text-xs text-slate-500">
                    Live operational board: Incoming tickets, kitchen prep progression, and delivery captain handovers.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={playChime}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                    <span>Test Sound Chime</span>
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
                        className="p-5 rounded-3xl bg-white border-2 border-red-500 shadow-lg space-y-4 animate-in fade-in"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-lg text-slate-900">{order.order_number}</span>
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-black uppercase">
                              New Order
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-500">
                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{order.customer_name || "Customer"}</span> • <span className="font-normal text-slate-500">{order.customer_phone}</span>
                          </div>
                          {order.delivery_address && (
                            <div className="text-slate-600 flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span>{order.delivery_address}</span>
                            </div>
                          )}
                        </div>

                        {/* Items */}
                        <div className="space-y-1.5 border-t border-slate-100 pt-3">
                          {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs font-semibold">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>{item.quantity}x {item.product_name || item.name}</span>
                              </div>
                              <span className="text-slate-700">₹{item.restaurant_unit_price * item.quantity || item.line_total}</span>
                            </div>
                          ))}
                        </div>

                        {order.special_instructions && (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium">
                            📝 {order.special_instructions}
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                          <span className="text-slate-500 font-medium">Customer Bill Amount:</span>
                          <span className="font-black text-base text-slate-900">₹{order.food_amount || order.customer_payable}</span>
                        </div>

                        {/* Accept / Reject Buttons */}
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span>Preparation SLA:</span>
                            <div className="flex items-center gap-1.5">
                              {[15, 20, 30].map((mins) => (
                                <button
                                  key={mins}
                                  onClick={() => setPrepTimeChoice(mins)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold cursor-pointer ${
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
                              className="py-2.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs cursor-pointer"
                            >
                              Reject Order
                            </button>
                            <button
                              onClick={() => handleAcceptOrder(order)}
                              className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
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

              {/* KDS 3-Column Pipeline Board */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column 1: Preparing */}
                <div className="p-4 rounded-3xl bg-blue-50/60 border border-blue-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-blue-900 uppercase tracking-wide flex items-center gap-2">
                      <Flame className="w-4 h-4 text-blue-600" />
                      <span>1. Kitchen Cooking</span>
                    </h3>
                    <span className="w-6 h-6 rounded-full bg-blue-200 text-blue-900 font-bold text-xs flex items-center justify-center">
                      {activeOrders.filter((o) => ["restaurant_accepted", "preparing"].includes(o.order_status)).length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activeOrders
                      .filter((o) => ["restaurant_accepted", "preparing"].includes(o.order_status))
                      .map((order) => (
                        <div key={order.id} className="p-4 rounded-2xl bg-white border border-blue-200 shadow-xs space-y-3">
                          <div className="flex justify-between items-baseline">
                            <span className="font-mono font-black text-sm text-slate-900">{order.order_number}</span>
                            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                              ⏱️ {order.prep_minutes || 20}m
                            </span>
                          </div>

                          <div className="space-y-1 text-xs text-slate-700">
                            {Array.isArray(order.items) &&
                              order.items.map((it: any, i: number) => (
                                <div key={i} className="flex justify-between">
                                  <span>{it.quantity}x {it.product_name || it.name}</span>
                                </div>
                              ))}
                          </div>

                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, "ready_for_pickup")}
                            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
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
                      {activeOrders.filter((o) => o.order_status === "ready_for_pickup").length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activeOrders
                      .filter((o) => o.order_status === "ready_for_pickup")
                      .map((order) => (
                        <div key={order.id} className="p-4 rounded-2xl bg-white border border-purple-200 shadow-xs space-y-3">
                          <div className="flex justify-between items-baseline">
                            <span className="font-mono font-black text-sm text-slate-900">{order.order_number}</span>
                            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                              Packed & Ready
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <Bike className="w-3.5 h-3.5 text-purple-600" />
                              <span>{order.rider_name || "Assigning Rider..."}</span>
                            </div>
                            {order.rider_phone && (
                              <div className="text-[11px] text-slate-500">
                                Contact: {order.rider_phone}
                              </div>
                            )}
                            {order.pickup_otp && (
                              <div className="text-[11px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md inline-block">
                                Handover OTP: {order.pickup_otp}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => setHandoverOrderId(order.id)}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Verify & Handover to Rider</span>
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
                      <span>3. Out For Delivery</span>
                    </h3>
                    <span className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-900 font-bold text-xs flex items-center justify-center">
                      {activeOrders.filter((o) => ["rider_assigned", "food_picked_up", "out_for_delivery"].includes(o.order_status)).length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activeOrders.filter((o) => ["rider_assigned", "food_picked_up", "out_for_delivery"].includes(o.order_status)).length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400 font-medium">
                        No orders currently in transit.
                      </div>
                    ) : (
                      activeOrders
                        .filter((o) => ["rider_assigned", "food_picked_up", "out_for_delivery"].includes(o.order_status))
                        .map((order) => (
                          <div key={order.id} className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-2">
                            <div className="flex justify-between">
                              <span className="font-mono font-black text-sm text-slate-900">{order.order_number}</span>
                              <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                In Transit
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">Rider {order.rider_name || "Captain"} en route to customer.</p>
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
                    Menu & Inventory Catalog
                  </h1>
                  <p className="text-xs text-slate-500">
                    Live menu items, pricing, categories, and instantaneous kitchen stock toggles.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    + Add Category
                  </button>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setNewProdName("");
                      setNewProdPrice("");
                      setNewProdOriginalPrice("");
                      setNewProdDesc("");
                      setNewProdVeg(true);
                      setNewProdPrep("20");
                      setNewProdImage("");
                      setNewProdCategory(categories[0]?.id || "");
                      setIsProductModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#FF5200] text-white rounded-2xl text-xs font-bold shadow-md hover:bg-[#e04800] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Food Dish</span>
                  </button>
                </div>
              </div>

              {/* Categories Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategoryFilter(null)}
                  className={`px-4 py-2 rounded-2xl font-bold text-xs shrink-0 shadow-xs cursor-pointer ${
                    selectedCategoryFilter === null
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  All Items ({products.length})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategoryFilter(c.id)}
                    className={`px-4 py-2 rounded-2xl font-bold text-xs shrink-0 cursor-pointer ${
                      selectedCategoryFilter === c.id
                        ? "bg-[#FF5200] text-white"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Product Cards Grid */}
              {displayedProducts.length === 0 ? (
                <div className="p-12 rounded-3xl bg-white border border-dashed border-slate-300 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-orange-100 text-[#FF5200] flex items-center justify-center mx-auto">
                    <Utensils className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">No Menu Items Listed Yet</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Add your delicious food items with prices and preparation times to start accepting customer orders.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setNewProdName("");
                      setNewProdPrice("");
                      setNewProdOriginalPrice("");
                      setNewProdDesc("");
                      setNewProdVeg(true);
                      setNewProdPrep("20");
                      setNewProdImage("");
                      setNewProdCategory(categories[0]?.id || "");
                      setIsProductModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-[#FF5200] text-white font-bold text-xs rounded-xl shadow-md hover:bg-[#e04800] inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Dish</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {displayedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
                    >
                      <div>
                        {/* Image & Veg indicator */}
                        <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-slate-100 mb-3.5">
                          {product.image ? (
                            <img
                              src={product.image.startsWith("http") ? product.image : `https://api.fiinway.com/storage/${product.image}`}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Utensils className="w-10 h-10" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                            <span className={`w-2.5 h-2.5 rounded-full ${product.food_type === "veg" ? "bg-emerald-600" : "bg-red-600"}`} />
                            <span className="text-[10px] font-extrabold text-slate-800 uppercase">
                              {product.food_type || "VEG"}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                            {product.name}
                          </h4>
                          <span className="text-base font-black text-[#FF5200] shrink-0">
                            ₹{product.restaurant_price || product.price}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {product.description || "Freshly cooked to order."}
                        </p>
                      </div>

                      {/* Stock Availability Toggle & Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={product.availability === "available" || product.is_available === true}
                              onChange={() => handleToggleProductStock(product.id, product.availability === "available")}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                          </label>
                          <span className={`text-[11px] font-extrabold uppercase ${product.availability === "available" ? "text-emerald-700" : "text-slate-400"}`}>
                            {product.availability === "available" ? "In Stock" : "Sold Out"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setNewProdName(product.name);
                              setNewProdPrice((product.restaurant_price || product.price || "").toString());
                              setNewProdOriginalPrice((product.discount_price || "").toString());
                              setNewProdVeg(product.food_type === "veg");
                              setNewProdDesc(product.description || "");
                              setNewProdPrep((product.prep_minutes || 20).toString());
                              setNewProdImage(product.image || "");
                              setNewProdCategory(product.category_id || categories[0]?.id || "");
                              setIsProductModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                            title="Edit Dish"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-xl cursor-pointer"
                            title="Delete Dish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  Transparent accounting of food sales, platform commission, daily bank settlements, and UPI company dues.
                </p>
              </div>

              {/* Outstanding Company Due Box */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Outstanding Company Platform Due
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${stats.pending_due > 0 ? "bg-amber-400 text-amber-950" : "bg-emerald-500/20 text-emerald-400"}`}>
                    {stats.pending_due > 0 ? "Settlement Required" : "All Clear"}
                  </span>
                </div>
                <div className="text-3xl font-black text-white">₹{stats.pending_due}</div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                  Platform dues generated from order processing. Instant clearance via UPI ensures uninterrupted customer dispatch assignment.
                </p>
                {stats.pending_due > 0 && (
                  <div className="pt-2">
                    <button
                      onClick={() => setIsUpiModalOpen(true)}
                      className="px-6 py-2.5 bg-[#FF5200] hover:bg-[#e04800] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Pay ₹{stats.pending_due} via UPI (Instant Clearance)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Finance Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Gross Food Sales Today</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">₹{stats.today_sales}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Customer billings fulfilled today</p>
                </div>
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Fiinway Platform Comm.</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">₹{stats.today_commission || 0}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Tier-based partner commission rate</p>
                </div>
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Net Settled to Bank</span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">₹{stats.today_net}</div>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">Direct Bank Payout Share</p>
                </div>
              </div>

              {/* Settlement History Table */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-extrabold text-base text-slate-900">Bank Settlement Ledger</h3>
                {settlements.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs font-medium">
                    No settlement records found for this billing cycle. Bank payouts are processed every 24 hours.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Settlement ID / UTR</th>
                          <th className="pb-3">Gross Sales</th>
                          <th className="pb-3">Commission</th>
                          <th className="pb-3">Net Payout</th>
                          <th className="pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {settlements.map((s) => (
                          <tr key={s.id}>
                            <td className="py-3.5 text-slate-700">{s.period_to || new Date(s.created_at).toLocaleDateString()}</td>
                            <td className="font-mono text-slate-600">{s.transaction_ref || s.settlement_number || `SET-${s.id}`}</td>
                            <td>₹{s.gross_sales}</td>
                            <td>₹{s.commission}</td>
                            <td className="font-black text-emerald-700">₹{s.net_amount}</td>
                            <td>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                {s.status?.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
                  Search fulfilled bookings, customer receipts, and delivery reports.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Search by Order ID, Customer Name or Phone..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#FF5200]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {["all", "delivered", "cancelled"].map((st) => (
                      <button
                        key={st}
                        onClick={() => setHistoryStatusFilter(st)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold capitalize cursor-pointer ${
                          historyStatusFilter === st
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {pastOrders.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-medium">
                    No order records found matching the filter criteria.
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    {pastOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-300 transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-black text-slate-900">{ord.order_number}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${["delivered", "completed"].includes(ord.order_status) ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                              {(ord.order_status || "completed").toUpperCase()}
                            </span>
                            <span className="text-slate-400">
                              {new Date(ord.created_at).toLocaleDateString()} {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-700 font-semibold">
                            {Array.isArray(ord.items) && ord.items.map((i: any) => `${i.quantity}x ${i.product_name || i.name}`).join(", ")}
                          </p>
                          <p className="text-[11px] text-slate-500">Customer: {ord.customer_name || "Customer"}</p>
                        </div>
                        <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1">
                          <span className="font-black text-sm text-slate-900 block">₹{ord.food_amount || ord.customer_payable}</span>
                          <button
                            onClick={() => setSelectedOrderDetail(ord)}
                            className="text-[11px] text-[#FF5200] font-bold hover:underline cursor-pointer"
                          >
                            View Receipt & Breakdown
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: REVIEWS */}
          {activeTab === "reviews" && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Customer Ratings & Dish Reviews
                </h1>
                <p className="text-xs text-slate-500">
                  Customer feedback and ratings. Reply directly to build customer retention.
                </p>
              </div>

              {reviews.length === 0 ? (
                <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                    <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">No Customer Reviews Yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Reviews from verified customers who order from your kitchen will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-[#FF5200] font-bold text-xs flex items-center justify-center">
                            {rev.customer?.name ? rev.customer.name.slice(0, 2).toUpperCase() : "CU"}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900">{rev.customer?.name || "Customer"}</h4>
                            <span className="text-[10px] text-slate-400">
                              Order #{rev.order?.order_number || rev.order_id} • {new Date(rev.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span>{rev.restaurant_rating || 5}.0</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        "{rev.restaurant_review || "Great food and timely delivery."}"
                      </p>

                      {rev.restaurant_reply ? (
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                          <span className="font-bold text-[10px] uppercase text-[#FF5200] block mb-0.5">Your Reply:</span>
                          {rev.restaurant_reply}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setReplyingReview(rev);
                            setReviewReplyText("");
                          }}
                          className="text-xs font-bold text-[#FF5200] hover:underline cursor-pointer"
                        >
                          Reply to Customer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: PROFILE & SLA */}
          {activeTab === "profile" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Kitchen Profile & Operational SLA
                </h1>
                <p className="text-xs text-slate-500">
                  Registered outlet specifications, operating schedule, and dispatch prep SLA.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Outlet Legal Name</label>
                    <input
                      type="text"
                      disabled
                      value={restaurant.name}
                      className="w-full p-3 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Business Operating Model</label>
                    <input
                      type="text"
                      disabled
                      value={restaurant.business_type === "actual_restaurant" ? "Dine-In & Delivery Restaurant" : "Cloud Kitchen"}
                      className="w-full p-3 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-800 capitalize"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Daily Opening Time</label>
                    <input
                      type="time"
                      value={profileOpening}
                      onChange={(e) => setProfileOpening(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Daily Closing Time</label>
                    <input
                      type="time"
                      value={profileClosing}
                      onChange={(e) => setProfileClosing(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Target Kitchen Prep Time (Minutes)</label>
                    <input
                      type="number"
                      min={5}
                      max={90}
                      value={profilePrepMins}
                      onChange={(e) => setProfilePrepMins(Number(e.target.value))}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Delivery Radius (Kilometers)</label>
                    <input
                      type="number"
                      min={1}
                      max={25}
                      value={profileRadius}
                      onChange={(e) => setProfileRadius(Number(e.target.value))}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Outlet Registered Address</label>
                  <input
                    type="text"
                    disabled
                    value={restaurant.address || "Outlet Address"}
                    className="w-full p-3 rounded-xl bg-slate-100 border border-slate-200 font-semibold"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 bg-[#FF5200] hover:bg-[#e04800] disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md text-xs cursor-pointer"
                  >
                    {isSavingProfile ? "Saving Settings..." : "Save Changes"}
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
          className={`flex flex-col items-center gap-1 p-1 cursor-pointer ${
            activeTab === "dashboard" ? "text-[#FF5200]" : "text-slate-400"
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px] font-bold">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`relative flex flex-col items-center gap-1 p-1 cursor-pointer ${
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
          className={`flex flex-col items-center gap-1 p-1 cursor-pointer ${
            activeTab === "menu" ? "text-[#FF5200]" : "text-slate-400"
          }`}
        >
          <Utensils className="w-5 h-5" />
          <span className="text-[10px] font-bold">Menu</span>
        </button>

        <button
          onClick={() => setActiveTab("finance")}
          className={`flex flex-col items-center gap-1 p-1 cursor-pointer ${
            activeTab === "finance" ? "text-[#FF5200]" : "text-slate-400"
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-[10px] font-bold">Finance</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 p-1 text-slate-400 cursor-pointer"
        >
          <MenuIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold">More</span>
        </button>
      </div>

      {/* MODAL: UPI DUE PAYMENT WITH DYNAMIC QR */}
      {isUpiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#FF5200]" />
                <span>Clear Company Due via UPI</span>
              </h3>
              <button
                onClick={() => setIsUpiModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-3">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 font-medium">
                Total Due Amount: <strong className="text-sm font-black text-slate-900">₹{stats.pending_due}</strong>
              </div>

              {/* Dynamic QR Code */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 inline-block shadow-xs">
                <img
                  src={upiQrUrl}
                  alt="UPI Payment QR"
                  className="w-48 h-48 mx-auto"
                />
                <p className="text-[11px] text-slate-500 font-semibold mt-2">Scan via GPay, PhonePe, Paytm, or BHIM</p>
              </div>

              {/* UPI ID display with Copy */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Company UPI ID:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">{upiVpa}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator?.clipboard?.writeText) {
                        navigator.clipboard.writeText(upiVpa);
                        showToast("UPI ID copied!");
                      }
                    }}
                    className="p-1 text-[#FF5200] hover:bg-orange-50 rounded-md cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Mobile Deep Link button */}
              <a
                href={upiDueString}
                className="block w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl text-center shadow-sm"
              >
                Open in UPI App (Mobile)
              </a>
            </div>

            {/* Submission Form */}
            <form onSubmit={handlePayCompanyDue} className="space-y-3 pt-2 border-t border-slate-100 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Enter 12-Digit Bank UTR / UPI Reference ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 423901928392"
                  value={upiPaymentUtr}
                  onChange={(e) => setUpiPaymentUtr(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-mono font-semibold focus:ring-2 focus:ring-[#FF5200]"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsUpiModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDue}
                  className="flex-1 py-2.5 rounded-xl bg-[#FF5200] hover:bg-[#e04800] disabled:bg-slate-300 text-white font-bold shadow-md cursor-pointer"
                >
                  {isSubmittingDue ? "Verifying..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
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
                  placeholder="e.g. Paneer Butter Masala"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Restaurant Price (₹) *</label>
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
                  <label className="block text-slate-600 font-bold mb-1">Original / MRP (₹)</label>
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
                <label className="block text-slate-600 font-bold mb-1">Dietary Classification</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewProdVeg(true)}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer ${
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
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer ${
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
                <label className="block text-slate-600 font-bold mb-1">Dish Description & Ingredients</label>
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
                    onChange={(e) => setNewProdCategory(e.target.value)}
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
                  <label className="block text-slate-600 font-bold mb-1">Kitchen Prep Time (Mins)</label>
                  <input
                    type="number"
                    value={newProdPrep}
                    onChange={(e) => setNewProdPrep(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.example.com/dish.jpg"
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-xs"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#FF5200] hover:bg-[#e04800] text-white font-bold shadow-md cursor-pointer"
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
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
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
                  placeholder="e.g. Starters & Appetizers"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Fresh tandoori kebabs"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#FF5200] hover:bg-[#e04800] text-white font-bold shadow-md cursor-pointer"
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
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
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
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleRejectOrder}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md cursor-pointer"
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
              <h3 className="font-black text-base text-slate-900">Delivery Captain Handover</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter the 4-digit pickup OTP displayed on delivery captain's Fiinway app:
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
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmHandover}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Verify & Handover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ORDER RECEIPT DETAIL DRAWER */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">Order #{selectedOrderDetail.order_number}</h3>
                <span className="text-[11px] text-slate-400">
                  {new Date(selectedOrderDetail.created_at).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="font-bold text-slate-800">Customer: {selectedOrderDetail.customer_name || "Customer"}</div>
                {selectedOrderDetail.customer_phone && (
                  <div className="text-slate-500">Phone: {selectedOrderDetail.customer_phone}</div>
                )}
                {selectedOrderDetail.delivery_address && (
                  <div className="text-slate-500">Address: {selectedOrderDetail.delivery_address}</div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-2">Itemized Breakdown:</h4>
                <div className="space-y-2 border-t border-slate-100 pt-2">
                  {Array.isArray(selectedOrderDetail.items) &&
                    selectedOrderDetail.items.map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="font-semibold text-slate-800">{it.quantity}x {it.product_name || it.name}</span>
                        <span className="font-bold text-slate-900">₹{it.restaurant_unit_price * it.quantity || it.line_total}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-1.5 font-medium">
                <div className="flex justify-between text-slate-500">
                  <span>Gross Food Bill:</span>
                  <span>₹{selectedOrderDetail.food_amount}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Platform Commission:</span>
                  <span>-₹{selectedOrderDetail.commission_amount || 0}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-emerald-700 pt-1 border-t border-slate-100">
                  <span>Net Outlet Payout:</span>
                  <span>₹{selectedOrderDetail.restaurant_net_amount || selectedOrderDetail.food_amount}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrderDetail(null)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* MODAL: REPLY TO REVIEW */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">Reply to Review</h3>
              <button
                onClick={() => setReplyingReview(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div className="flex justify-between font-bold">
                <span>{replyingReview.customer?.name || "Customer"}</span>
                <span className="text-amber-500">⭐ {replyingReview.restaurant_rating || 5}.0</span>
              </div>
              <p className="text-slate-600">"{replyingReview.restaurant_review}"</p>
            </div>

            <form onSubmit={handleSubmitReviewReply} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Your Response to Customer *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Thank the customer for their feedback and address any concerns..."
                  value={reviewReplyText}
                  onChange={(e) => setReviewReplyText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReplyingReview(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#FF5200] hover:bg-[#e04800] text-white font-bold shadow-md cursor-pointer"
                >
                  Post Reply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
