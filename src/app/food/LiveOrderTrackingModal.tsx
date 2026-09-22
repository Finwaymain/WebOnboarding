'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  X,
  Bike,
  Store,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  Navigation,
  ShieldCheck,
  RefreshCw,
  AlertCircle
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
  items?: Array<{ id: number; product_name: string; quantity: number }>;
  restaurant?: RestaurantInfo;
  rider?: RiderInfo | null;
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

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const restaurantMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);

  // Poll /api/v1/food/customer/orders/{id}/track
  const fetchTrackingData = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/food/customer/orders/${orderId}/track`, {
        headers: {
          Accept: 'application/json',
          apikey: apiKey,
        },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setOrder(data.data);
        setLastUpdated(new Date());
        setError('');
      } else {
        if (!order) setError(data.error || 'Failed to load live tracking details.');
      }
    } catch (err: any) {
      if (!order) setError('Network error loading live tracking.');
    } finally {
      setLoading(false);
    }
  }, [orderId, apiKey, order]);

  useEffect(() => {
    fetchTrackingData();
    // 5-second polling interval for real-time rider tracking
    const interval = setInterval(fetchTrackingData, 5000);
    return () => clearInterval(interval);
  }, [fetchTrackingData]);

  // Load Google Maps JavaScript API
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
          zoomControl: true,
          styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          ],
        });
      }

      const map = mapInstanceRef.current;
      const bounds = new (window as any).google.maps.LatLngBounds();

      // 1. Restaurant Marker
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
              scale: 8,
              fillColor: '#EA580C',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            },
          });
        } else {
          restaurantMarkerRef.current.setPosition(rPos);
        }
      }

      // 2. Customer Destination Marker
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
              scale: 8,
              fillColor: '#16A34A',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            },
          });
        } else {
          customerMarkerRef.current.setPosition(cPos);
        }
      }

      // 3. Live Rider Marker (if coordinates available)
      const riderLat = Number(order?.rider?.latitude);
      const riderLng = Number(order?.rider?.longitude);

      if (riderLat && riderLng && !isNaN(riderLat) && !isNaN(riderLng)) {
        const riderPos = { lat: riderLat, lng: riderLng };
        bounds.extend(riderPos);

        if (!riderMarkerRef.current) {
          riderMarkerRef.current = new (window as any).google.maps.Marker({
            position: riderPos,
            map,
            title: `Rider: ${order?.rider?.name || 'Delivery Partner'}`,
            icon: {
              path: (window as any).google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: '#0284C7',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              rotation: 0,
            },
          });
        } else {
          riderMarkerRef.current.setPosition(riderPos);
        }

        // Draw active path from Rider to Destination
        const pathCoords = [
          riderPos,
          { lat: cLat, lng: cLng }
        ];
        if (!routeLineRef.current) {
          routeLineRef.current = new (window as any).google.maps.Polyline({
            path: pathCoords,
            geodesic: true,
            strokeColor: '#0284C7',
            strokeOpacity: 0.8,
            strokeWeight: 3,
            map,
          });
        } else {
          routeLineRef.current.setPath(pathCoords);
        }
      }

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 50);
      }
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

  // Milestone Progress Helpers
  const status = order?.order_status || 'pending';

  const getStepIndex = (s: string) => {
    switch (s) {
      case 'pending':
        return 0;
      case 'restaurant_accepted':
      case 'preparing':
        return 1;
      case 'ready_for_pickup':
      case 'rider_assigned':
      case 'rider_at_restaurant':
        return 2;
      case 'food_picked_up':
      case 'out_for_delivery':
        return 3;
      case 'rider_at_location':
        return 4;
      case 'delivered':
        return 5;
      default:
        return 1;
    }
  };

  const currentStep = getStepIndex(status);

  const getStatusText = (s: string) => {
    switch (s) {
      case 'pending':
        return 'Order Placed, Waiting for Restaurant';
      case 'restaurant_accepted':
        return 'Restaurant Accepted Order';
      case 'preparing':
        return 'Chef is Preparing Your Meal';
      case 'ready_for_pickup':
        return 'Food is Packed & Waiting for Pickup';
      case 'rider_assigned':
        return `${order?.rider?.name || 'Rider'} is Heading to Restaurant`;
      case 'rider_at_restaurant':
        return 'Rider has Arrived at Restaurant';
      case 'food_picked_up':
      case 'out_for_delivery':
        return 'Food Picked Up — On the Way to Your Doorstep!';
      case 'rider_at_location':
        return 'Rider is at Your Doorstep!';
      case 'delivered':
        return 'Order Delivered! Enjoy Your Meal!';
      default:
        return s.replace(/_/g, ' ').toUpperCase();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gray-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm leading-tight">
                Live Food Tracking #{order?.order_number || orderId}
              </h3>
              <p className="text-[11px] text-gray-400">
                Auto-refreshing every 5s • {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading && !order ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-xs font-semibold text-gray-500">Loading live tracking details...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <p className="text-xs font-bold text-gray-800">{error}</p>
            <button
              onClick={fetchTrackingData}
              className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 p-4 space-y-4">
            {/* Interactive Live Map */}
            <div className="relative w-full h-56 rounded-2xl overflow-hidden shadow-inner border border-gray-100 bg-gray-100">
              <div ref={mapContainerRef} className="w-full h-full" />

              {/* Status Overlay Badge */}
              <div className="absolute top-2.5 left-2.5 right-2.5 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md flex items-center justify-between border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-gray-900 truncate">
                    {getStatusText(status)}
                  </span>
                </div>
                {order?.rider?.latitude && (
                  <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md shrink-0">
                    Live GPS
                  </span>
                )}
              </div>
            </div>

            {/* Delivery Verification PIN (Delivery OTP) */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl p-4 text-white shadow-md flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-100 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Delivery Verification PIN
                </p>
                <div className="text-3xl font-black tracking-widest mt-0.5 font-mono">
                  {order?.delivery_otp || '----'}
                </div>
                <p className="text-[11px] text-emerald-100 mt-0.5">
                  Share this 4-digit PIN with rider at doorstep
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider block text-emerald-100 font-bold">Payable</span>
                <span className="text-xl font-black">₹{order?.customer_payable}</span>
                <span className="text-[10px] block text-emerald-200 uppercase font-semibold">
                  {order?.payment_method === 'cod' ? 'Cash on Delivery' : 'Prepaid (Paid)'}
                </span>
              </div>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <span>Progress Milestone</span>
                <span className="text-emerald-700">{Math.min(100, Math.round((currentStep / 5) * 100))}%</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(15, (currentStep / 5) * 100))}%` }}
                />
              </div>
              <div className="grid grid-cols-5 text-center text-[10px] font-semibold text-gray-500 gap-1 pt-1">
                <span className={currentStep >= 0 ? 'text-emerald-700 font-bold' : ''}>Placed</span>
                <span className={currentStep >= 1 ? 'text-emerald-700 font-bold' : ''}>Cooking</span>
                <span className={currentStep >= 2 ? 'text-emerald-700 font-bold' : ''}>Rider Assigned</span>
                <span className={currentStep >= 3 ? 'text-emerald-700 font-bold' : ''}>On the Way</span>
                <span className={currentStep >= 5 ? 'text-emerald-700 font-bold' : ''}>Delivered</span>
              </div>
            </div>

            {/* Delivery Partner Details (If Assigned) */}
            {order?.rider && (
              <div className="p-3.5 rounded-2xl border border-blue-100 bg-blue-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-900">{order.rider.name}</h4>
                    <p className="text-[11px] text-gray-500">
                      Food Delivery Partner {order.rider.vehicle_number ? `• ${order.rider.vehicle_number}` : ''}
                    </p>
                  </div>
                </div>
                {order.rider.phone && (
                  <a
                    href={`tel:${order.rider.phone}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Rider</span>
                  </a>
                )}
              </div>
            )}

            {/* Restaurant & Destination Details */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Store className="w-4 h-4 text-orange-600 shrink-0" />
                  <div>
                    <span className="font-extrabold text-gray-900 block">{order?.restaurant?.name || 'Restaurant'}</span>
                    <span className="text-[11px] text-gray-500 truncate block max-w-[240px]">
                      {order?.restaurant?.address || 'Pickup Point'}
                    </span>
                  </div>
                </div>
                {(order?.restaurant?.owner_phone || order?.restaurant?.phone) && (
                  <a
                    href={`tel:${order.restaurant.owner_phone || order.restaurant.phone}`}
                    className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    Call
                  </a>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-gray-50 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-gray-900 block">Delivery Address</span>
                  <span className="text-[11px] text-gray-600 block">
                    {order?.delivery_address || 'Customer doorstep'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl shadow transition-colors text-xs"
          >
            Back to Food Discovery
          </button>
        </div>
      </div>
    </div>
  );
}
