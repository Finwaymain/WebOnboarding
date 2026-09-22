'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  X,
  Bike,
  Store,
  MapPin,
  Phone,
  Clock,
  Navigation,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Check
} from 'lucide-react';

interface RiderInfo {
  id: number;
  name: string;
  phone: string;
  photo?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  vehicle_number?: string | null;
}

interface RestaurantInfo {
  id: number;
  name: string;
  address?: string;
  owner_phone?: string;
  phone?: string;
  latitude?: number | string;
  longitude?: number | string;
}

interface OrderData {
  id: number;
  order_number: string;
  order_status: string;
  delivery_otp?: string;
  delivery_address?: string;
  delivery_lat?: number;
  delivery_lng?: number;
  customer_payable: number;
  payment_method?: string;
  payment_status?: string;
  items?: Array<{ id: number; product_name: string; quantity: number; line_total?: number; customer_unit_price?: number }>;
  restaurant?: RestaurantInfo;
  rider?: RiderInfo | null;
  created_at?: string;
}

interface Props {
  orderId: number;
  initialOrder?: Partial<OrderData> | null;
  apiKey: string;
  googleMapsKey: string;
  onClose: () => void;
}

export default function LiveOrderTrackingModal({
  orderId,
  initialOrder,
  apiKey,
  googleMapsKey,
  onClose,
}: Props) {
  const [order, setOrder] = useState<OrderData | null>(initialOrder as OrderData | null);
  const [loading, setLoading] = useState<boolean>(!initialOrder?.order_status);
  const [error, setError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showItems, setShowItems] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const restaurantMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);

  // Poll tracking endpoint
  const fetchTrackingData = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/food/customer/orders/${orderId}/track`, {
        headers: { Accept: 'application/json', apikey: apiKey },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setOrder(data.data);
        setLastUpdated(new Date());
        setError('');
      } else {
        if (!order) setError(data.error || 'Unable to fetch tracking update');
      }
    } catch {
      if (!order) setError('Network error loading live tracking');
    } finally {
      setLoading(false);
    }
  }, [orderId, apiKey, order]);

  useEffect(() => {
    fetchTrackingData();
    const interval = setInterval(fetchTrackingData, 5000);
    return () => clearInterval(interval);
  }, [fetchTrackingData]);

  // Load Google Maps API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initMap = () => {
      if (!mapContainerRef.current || !(window as any).google?.maps) return;

      const rLat = Number(order?.restaurant?.latitude) || 28.6315;
      const rLng = Number(order?.restaurant?.longitude) || 77.2167;
      const cLat = Number(order?.delivery_lat) || rLat + 0.005;
      const cLng = Number(order?.delivery_lng) || rLng + 0.005;

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new (window as any).google.maps.Map(mapContainerRef.current, {
          center: { lat: (rLat + cLat) / 2, lng: (rLng + cLng) / 2 },
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: false,
          styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          ],
        });
      }

      const map = mapInstanceRef.current;
      const bounds = new (window as any).google.maps.LatLngBounds();

      // Restaurant Marker
      if (rLat && rLng) {
        const rPos = { lat: rLat, lng: rLng };
        bounds.extend(rPos);
        if (!restaurantMarkerRef.current) {
          restaurantMarkerRef.current = new (window as any).google.maps.Marker({
            position: rPos,
            map,
            title: order?.restaurant?.name || 'Restaurant',
            icon: {
              path: (window as any).google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: '#09090b',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2.5,
            },
          });
        } else {
          restaurantMarkerRef.current.setPosition(rPos);
        }
      }

      // Customer Destination Marker
      if (cLat && cLng) {
        const cPos = { lat: cLat, lng: cLng };
        bounds.extend(cPos);
        if (!customerMarkerRef.current) {
          customerMarkerRef.current = new (window as any).google.maps.Marker({
            position: cPos,
            map,
            title: 'Delivery Address',
            icon: {
              path: (window as any).google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: '#059669',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2.5,
            },
          });
        } else {
          customerMarkerRef.current.setPosition(cPos);
        }
      }

      // Rider Live Position
      if (order?.rider?.latitude && order?.rider?.longitude) {
        const riderPos = {
          lat: Number(order.rider.latitude),
          lng: Number(order.rider.longitude),
        };
        bounds.extend(riderPos);

        if (!riderMarkerRef.current) {
          riderMarkerRef.current = new (window as any).google.maps.Marker({
            position: riderPos,
            map,
            title: order.rider.name,
            icon: {
              path: (window as any).google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 5,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              rotation: 45,
            },
          });
        } else {
          riderMarkerRef.current.setPosition(riderPos);
        }
      }

      try {
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { top: 30, right: 30, bottom: 30, left: 30 });
        }
      } catch (_) {}
    };

    if ((window as any).google?.maps) {
      initMap();
    } else {
      const existingScript = document.getElementById('google-maps-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}`;
        script.async = true;
        script.onload = initMap;
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', initMap);
      }
    }
  }, [order, googleMapsKey]);

  const status = String(order?.order_status || 'pending').toLowerCase();

  // 4 Clean Milestones: 0=Placed, 1=Kitchen, 2=On the Way, 3=Delivered
  const getProgressStage = (s: string): number => {
    switch (s) {
      case 'pending':
        return 0;
      case 'restaurant_accepted':
      case 'preparing':
      case 'ready_for_pickup':
        return 1;
      case 'rider_assigned':
      case 'rider_at_restaurant':
      case 'food_picked_up':
      case 'out_for_delivery':
      case 'rider_at_location':
        return 2;
      case 'delivered':
      case 'completed':
        return 3;
      default:
        return 0;
    }
  };

  const currentStage = getProgressStage(status);

  const getHeroStatusInfo = (s: string) => {
    switch (s) {
      case 'pending':
        return {
          title: 'Order Confirmed',
          subtitle: 'Sending details to restaurant kitchen...',
          eta: '~30-35 mins',
        };
      case 'restaurant_accepted':
      case 'preparing':
        return {
          title: 'Preparing Your Meal',
          subtitle: `${order?.restaurant?.name || 'Kitchen'} is cooking your food fresh`,
          eta: '~20-25 mins',
        };
      case 'ready_for_pickup':
        return {
          title: 'Packed & Ready',
          subtitle: 'Meal is prepared and waiting for delivery partner',
          eta: '~15-20 mins',
        };
      case 'rider_assigned':
      case 'rider_at_restaurant':
        return {
          title: 'Delivery Partner Assigned',
          subtitle: `${order?.rider?.name || 'Rider'} is at restaurant picking up order`,
          eta: '~15 mins',
        };
      case 'food_picked_up':
      case 'out_for_delivery':
        return {
          title: 'Out for Delivery',
          subtitle: `${order?.rider?.name || 'Rider'} is on the way to your address`,
          eta: '~8-12 mins',
        };
      case 'rider_at_location':
        return {
          title: 'Rider Arrived',
          subtitle: 'Your delivery partner is at your doorstep',
          eta: 'Arrived',
        };
      case 'delivered':
      case 'completed':
        return {
          title: 'Order Delivered',
          subtitle: 'Enjoy your freshly delivered meal!',
          eta: 'Delivered',
        };
      case 'cancelled':
      case 'rejected':
        return {
          title: 'Order Cancelled',
          subtitle: 'This order was declined or cancelled',
          eta: 'Cancelled',
        };
      default:
        return {
          title: s.replace(/_/g, ' ').toUpperCase(),
          subtitle: 'Processing your order',
          eta: '~25 mins',
        };
    }
  };

  const heroInfo = getHeroStatusInfo(status);
  const pinDigits = String(order?.delivery_otp || '----').split('');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-lg rounded-t-[32px] sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-zinc-100">
        {/* Top Drag Handle (Mobile) & Close Bar */}
        <div className="pt-3 px-5 pb-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-zinc-400 tracking-wider uppercase">
              ORD-#{order?.order_number || orderId}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading && !order ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-7 h-7 animate-spin text-zinc-900" />
            <p className="text-xs font-semibold text-zinc-500">Connecting to live dispatch...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-xs font-semibold text-zinc-800">{error}</p>
            <button
              onClick={fetchTrackingData}
              className="px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-4">
            {/* Hero ETA Headline */}
            <div className="pt-1">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-2xl font-black text-zinc-950 tracking-tight">
                  {heroInfo.title}
                </h2>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg shrink-0">
                  {heroInfo.eta}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1 font-medium">
                {heroInfo.subtitle}
              </p>
            </div>

            {/* Segmented Lean Progress Bar */}
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 1, 2, 3].map((step) => {
                  const isComplete = currentStage >= step;
                  const isCurrent = currentStage === step;
                  return (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        isComplete ? 'bg-zinc-900' : 'bg-zinc-100'
                      } ${isCurrent ? 'ring-2 ring-zinc-900/20' : ''}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-zinc-400">
                <span className={currentStage >= 0 ? 'text-zinc-900 font-bold' : ''}>Placed</span>
                <span className={currentStage >= 1 ? 'text-zinc-900 font-bold' : ''}>Cooking</span>
                <span className={currentStage >= 2 ? 'text-zinc-900 font-bold' : ''}>On the way</span>
                <span className={currentStage >= 3 ? 'text-zinc-900 font-bold' : ''}>Delivered</span>
              </div>
            </div>

            {/* Minimalist Delivery PIN Card */}
            {order?.delivery_otp && (
              <div className="bg-zinc-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-xs">
                <div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      Delivery PIN
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-0.5 font-medium">
                    Share with rider at your door
                  </p>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  {pinDigits.map((d, i) => (
                    <div
                      key={i}
                      className="w-8 h-9 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-base font-black text-white"
                    >
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Map Frame */}
            <div className="relative w-full h-48 sm:h-52 rounded-2xl overflow-hidden border border-zinc-200/80 bg-zinc-50 shadow-inner">
              <div ref={mapContainerRef} className="w-full h-full" />
              {/* Floating Pill Status */}
              <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-zinc-200/60 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-zinc-800">
                  {order?.rider ? 'Rider on route' : 'Assigning driver'}
                </span>
              </div>
            </div>

            {/* Delivery Partner Row (When Assigned) */}
            {order?.rider ? (
              <div className="p-3.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-black text-sm">
                    {order.rider.name?.charAt(0) || 'R'}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-zinc-900">{order.rider.name}</h4>
                    <p className="text-[11px] text-zinc-500 font-medium">
                      Delivery Partner {order.rider.vehicle_number ? `• ${order.rider.vehicle_number}` : ''}
                    </p>
                  </div>
                </div>
                {order.rider.phone && (
                  <a
                    href={`tel:${order.rider.phone}`}
                    className="w-9 h-9 rounded-full bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-800 transition-colors shadow-2xs"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>
            ) : null}

            {/* Restaurant & Destination Timeline */}
            <div className="rounded-2xl border border-zinc-200/80 p-3.5 space-y-3 bg-white">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Store className="w-3.5 h-3.5 text-zinc-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 truncate">
                      {order?.restaurant?.name || 'Restaurant'}
                    </span>
                    {(order?.restaurant?.owner_phone || order?.restaurant?.phone) && (
                      <a
                        href={`tel:${order.restaurant.owner_phone || order.restaurant.phone}`}
                        className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-900 underline"
                      >
                        Contact
                      </a>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {order?.restaurant?.address || 'Pickup Point'}
                  </p>
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-2.5 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-zinc-900 block">Deliver to</span>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {order?.delivery_address || 'Customer doorstep'}
                  </p>
                </div>
              </div>
            </div>

            {/* Items & Payment Accordion */}
            <div className="rounded-2xl border border-zinc-200/80 overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setShowItems(!showItems)}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-50/50 transition-colors"
              >
                <div>
                  <span className="text-xs font-bold text-zinc-900 block">
                    {order?.items?.length || 0} {order?.items?.length === 1 ? 'Item' : 'Items'} • ₹{order?.customer_payable}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {order?.payment_method === 'wallet' ? 'Paid via Fiinway Wallet' : 'Online / UPI Payment'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
                  <span>{showItems ? 'Hide' : 'Details'}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showItems ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {showItems && order?.items && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-zinc-100 space-y-1.5 text-xs">
                  {order.items.map((it: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-zinc-700">
                      <span className="font-medium truncate max-w-[240px]">
                        {it.quantity}x {it.product_name}
                      </span>
                      <span className="font-mono text-zinc-900 font-semibold">
                        ₹{it.line_total || (Number(it.customer_unit_price || 0) * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lean Footer Button */}
        <div className="p-4 border-t border-zinc-100 bg-white shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 rounded-2xl transition-colors text-xs shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
