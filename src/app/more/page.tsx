"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useRef } from "react";

function MoreContent() {
  const [token, setToken] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const [driverServices, setDriverServices] = useState<any[]>([]);
  const [homeServices, setHomeServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation State
  const [view, setView] = useState<'SERVICES' | 'BOOKING' | 'HISTORY' | 'HISTORY_DETAIL' | 'SUCCESS'>('SERVICES');
  const [activeTab, setActiveTab] = useState<'SERVICES' | 'HISTORY'>('SERVICES');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Booking Form State
  const [addressType, setAddressType] = useState<string>("Current Location");
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [description, setDescription] = useState("");
  const [mediaFiles, setMediaFiles] = useState<{name: string, type: string, base64: string}[]>([]);
  
  // History State
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setToken(params.get("accesstoken"));
      setDriverId(params.get("driver_id"));
      setUserId(params.get("user_id"));
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchHomeServices = async () => {
      try {
        setLoading(true);
        const svcsRes = await fetch(`https://api.fiinway.com/api/v1/home-services`, {
          headers: {
            apikey: "base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU=",
            accesstoken: token,
          }
        });
        const svcsData = await svcsRes.json();
        if (svcsData.success === 'success' && svcsData.data) {
          setHomeServices(svcsData.data);
        }
      } catch (err) {
        console.error("Error fetching services:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeServices();

    if (typeof window !== "undefined") {
      (window as any).receiveLocation = (lat: number, lng: number) => {
        setLocationCoords({ lat, lng });
      };
      (window as any).receiveLocationError = (err: string) => {
        alert("Failed to get location: " + err);
        setLocationCoords(null);
      };
    }
  }, [driverId, userId, token]);

  const handleFetchGPS = () => {
    if (typeof window !== "undefined" && (window as any).AppBridge) {
      (window as any).AppBridge.postMessage('getLocation');
    } else {
      alert("GPS tracking is only available inside the mobile application.");
    }
  };

  useEffect(() => {
    if (addressType === "Current Location" && view === 'BOOKING') {
      handleFetchGPS();
    }
  }, [addressType, view]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setMediaFiles(prev => [...prev, {
          name: file.name,
          type: file.type,
          base64: base64String
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (indexToRemove: number) => {
    setMediaFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('https://api.fiinway.com/api/v1/book-service', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'apikey': "base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU=",
          'accesstoken': token || ""
        },
        body: JSON.stringify({
          user_id: userId,
          driver_id: driverId,
          service_name: selectedService?.libelle || "Custom Service",
          address_type: addressType,
          lat: locationCoords?.lat,
          lng: locationCoords?.lng,
          date: bookingDate,
          time: bookingTime,
          description,
          media: mediaFiles
        })
      });
      
      const data = await res.json();
      if (data.success === 'success') {
        setView('SUCCESS');
      } else {
        alert("Booking failed: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setBookingDate("");
    setBookingTime("");
    setDescription("");
    setLocationCoords(null);
    setMediaFiles([]);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#F7F7F9] flex items-center justify-center p-6 font-sans">
        <div className="w-8 h-8 border-[3px] border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#F7F7F9] flex items-center justify-center p-6 font-sans">
        <div className="bg-red-50/80 text-red-700 px-5 py-4 rounded-2xl font-medium shadow-sm border border-red-100/50 backdrop-blur-md">
          Unauthorized access. Missing valid session token.
        </div>
      </div>
    );
  }

  const getImageUrl = (path: string) => {
    if (!path) return "https://api.fiinway.com/assets/images/placeholder_image.jpg";
    if (path.startsWith("http")) return path;
    return `https://api.fiinway.com/assets/images/service_type_images/${path}`;
  };

  const fetchHistory = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const histRes = await fetch(`https://api.fiinway.com/api/v1/service-history?user_id=${userId || driverId}`, {
        headers: {
          apikey: "base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU=",
          accesstoken: token,
        }
      });
      const histData = await histRes.json();
      if (histData.success === 'success' && histData.data) {
        setHistory(histData.data);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // RENDERING HELPERS - Urban Quartz & Obsidian Theme
  // -------------------------------------------------------------

  const renderTabs = () => {
    if (!userId) return null;
    return (
      <div className="flex bg-slate-200/50 p-1.5 rounded-2xl mb-8 backdrop-blur-sm border border-slate-200/50">
        <button
          onClick={() => { setActiveTab('SERVICES'); setView('SERVICES'); }}
          className={`flex-1 py-3 text-[13px] font-bold rounded-xl transition-all duration-300 ${activeTab === 'SERVICES' ? 'bg-white text-slate-900 shadow-[0_2px_12px_rgb(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/30'}`}
        >
          Explore
        </button>
        <button
          onClick={() => { setActiveTab('HISTORY'); setView('HISTORY'); fetchHistory(); }}
          className={`flex-1 py-3 text-[13px] font-bold rounded-xl transition-all duration-300 ${activeTab === 'HISTORY' ? 'bg-white text-slate-900 shadow-[0_2px_12px_rgb(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/30'}`}
        >
          Bookings
        </button>
      </div>
    );
  };

  const renderServices = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="mb-8">
        <h1 className="text-[32px] font-black text-slate-900 tracking-tight leading-tight mb-2">
          {driverId ? "Your Services" : "Discover."}
        </h1>
        <p className="text-slate-500 font-medium text-[15px]">
          {driverId ? "Categories you are authorized for." : "Find the right professional for your needs."}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-[3px] border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-12 mb-8">
          {driverId && driverServices.length === 0 && (
            <div className="p-8 bg-white/60 rounded-3xl text-center text-slate-500 border border-slate-200/60 backdrop-blur-md">
              No active services found.
            </div>
          )}

          {driverId && driverServices.map((service) => (
            <div key={service.id} className="group p-5 bg-white rounded-3xl border border-slate-200/60 hover:border-slate-300 transition-all duration-300 shadow-[0_2px_20px_rgb(0,0,0,0.02)]">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100">
                  <img src={getImageUrl(service.image)} alt={service.title} className="w-full h-full object-cover p-2" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{service.title}</h3>
                  <span className={`inline-block mt-2 px-2.5 py-1 text-[11px] font-bold rounded-lg ${service.statut === 'yes' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {service.statut === 'yes' ? 'ACTIVE' : 'PENDING'}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {!driverId && homeServices.map((category, idx) => (
            <div key={idx} className="relative">
              <div className="flex items-center gap-3 mb-5 pl-1">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-lg border border-slate-200/50">
                  {category.icon}
                </div>
                <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">{category.title}</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {category.services.map((svc: any, sIdx: number) => (
                  <div 
                    key={sIdx} 
                    onClick={() => { setSelectedService({ libelle: svc.libelle, image: svc.image }); setView('BOOKING'); }}
                    className="group relative p-4 bg-white rounded-[20px] border border-slate-200/60 hover:border-slate-800 transition-all duration-300 cursor-pointer shadow-[0_2px_12px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgb(0,0,0,0.08)] active:scale-[0.98] flex flex-col justify-between min-h-[100px]"
                  >
                    {svc.image && (
                      <div className="w-full h-16 mb-3 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                        <img src={getImageUrl(svc.image)} alt={svc.libelle} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <span className="font-bold text-[14px] text-slate-800 leading-snug group-hover:text-slate-900">{svc.libelle}</span>
                    <div className="flex justify-end mt-2">
                      <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:border-slate-900 transition-colors duration-300">
                        <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderBookingForm = () => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
      <div className="mb-8">
        <button 
          onClick={() => { setView('SERVICES'); resetForm(); }} 
          className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 active:scale-95 transition-all mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <h1 className="text-[28px] font-black text-slate-900 tracking-tight leading-tight mb-2">Request {selectedService?.libelle}.</h1>
        <p className="text-slate-500 font-medium text-[14px]">Provide details so we can assign the best professional.</p>
      </div>

      <form onSubmit={handleSubmitBooking} className="space-y-8">
        <div className="space-y-4">
          <label className="block text-[13px] font-bold text-slate-900 uppercase tracking-wide">1. Service Location</label>
          <div className="grid grid-cols-2 gap-3">
            {['Current Location', 'Home', 'Office', 'Other Address'].map(opt => (
              <label key={opt} className={`flex items-center justify-center text-center p-3.5 border-2 rounded-[16px] cursor-pointer transition-all active:scale-[0.98] ${addressType === opt ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200/60 bg-white text-slate-600 hover:border-slate-300'}`}>
                <input type="radio" name="address" value={opt} checked={addressType === opt} onChange={(e) => setAddressType(e.target.value)} className="hidden" />
                <span className="font-bold text-[13px]">{opt}</span>
              </label>
            ))}
          </div>
          
          {addressType === 'Current Location' && (
            <div className="p-4 bg-slate-100/50 rounded-[16px] border border-slate-200/50 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-slate-900 mb-0.5">GPS Coordinates</p>
                {locationCoords ? (
                  <p className="text-[12px] font-medium text-slate-500 font-mono">
                    {locationCoords.lat.toFixed(5)}, {locationCoords.lng.toFixed(5)}
                  </p>
                ) : (
                  <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
                    <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin"></div>
                    Locating...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <label className="block text-[13px] font-bold text-slate-900 uppercase tracking-wide">2. Date & Time</label>
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="date" 
              required 
              value={bookingDate} 
              onChange={e => setBookingDate(e.target.value)} 
              className="w-full bg-white border border-slate-200/80 text-slate-900 text-[14px] rounded-[16px] focus:ring-0 focus:border-slate-900 block p-4 font-semibold shadow-sm transition-all outline-none" 
            />
            <input 
              type="time" 
              required 
              value={bookingTime} 
              onChange={e => setBookingTime(e.target.value)} 
              className="w-full bg-white border border-slate-200/80 text-slate-900 text-[14px] rounded-[16px] focus:ring-0 focus:border-slate-900 block p-4 font-semibold shadow-sm transition-all outline-none" 
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-[13px] font-bold text-slate-900 uppercase tracking-wide">3. Details</label>
          <textarea 
            required 
            rows={4} 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="Describe what you need help with..." 
            className="w-full bg-white border border-slate-200/80 text-slate-900 text-[14px] rounded-[16px] focus:ring-0 focus:border-slate-900 block p-4 font-medium shadow-sm transition-all outline-none resize-none"
          ></textarea>
        </div>

        <div className="space-y-4">
          <label className="block text-[13px] font-bold text-slate-900 uppercase tracking-wide">4. Media (Optional)</label>
          <label className="flex items-center justify-center w-full py-6 bg-slate-50 border-2 border-slate-200 border-dashed rounded-[16px] cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all group">
            <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              <p className="text-[13px] font-bold">Attach Photos / Video</p>
            </div>
            <input type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleFileChange} />
          </label>
          
          {mediaFiles.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              {mediaFiles.map((file, idx) => (
                <div key={idx} className="relative w-[72px] h-[72px] rounded-[12px] overflow-hidden border border-slate-200 shadow-sm group">
                  <img src={file.base64} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeFile(idx)} className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-slate-900">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4">
          <button type="submit" disabled={loading} className="w-full text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:active:scale-100 font-bold rounded-[16px] text-[15px] px-5 py-4.5 h-[56px] text-center transition-all shadow-[0_4px_14px_rgb(0,0,0,0.1)] active:scale-[0.98] flex justify-center items-center">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Confirm Request'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderHistory = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="mb-8">
        <h1 className="text-[32px] font-black text-slate-900 tracking-tight leading-tight mb-2">History.</h1>
        <p className="text-slate-500 font-medium text-[15px]">Review your past and active requests.</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-[3px] border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 bg-white/60 rounded-3xl text-center text-slate-500 border border-slate-200/60 backdrop-blur-md">
            No booking history found.
          </div>
        ) : (
          history.map((booking: any) => (
            <div 
              key={booking.id} 
              onClick={() => { setSelectedBooking(booking); setView('HISTORY_DETAIL'); }}
              className="p-5 bg-white rounded-[24px] border border-slate-200/60 hover:border-slate-400 transition-all duration-300 shadow-[0_2px_12px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgb(0,0,0,0.06)] cursor-pointer active:scale-[0.98]"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-[16px] font-bold text-slate-900">{booking.service_name}</h3>
                <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${
                  booking.status === 'completed' || booking.status === 'Completed' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                  booking.status === 'On the way' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                  'bg-slate-900 text-white border-slate-900'
                }`}>
                  {booking.status}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-[13px] font-medium text-slate-500">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  {booking.preferred_date}
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  {booking.preferred_time}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderHistoryDetail = () => {
    if (!selectedBooking) return null;
    
    let mediaUrls: string[] = [];
    if (selectedBooking.media) {
      try {
        mediaUrls = typeof selectedBooking.media === 'string' ? JSON.parse(selectedBooking.media) : selectedBooking.media;
      } catch (e) {
        mediaUrls = [];
      }
    }

    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
        <div className="mb-8">
          <button 
            onClick={() => { setView('HISTORY'); setSelectedBooking(null); }} 
            className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 active:scale-95 transition-all mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-[28px] font-black text-slate-900 tracking-tight leading-tight">{selectedBooking.service_name}</h1>
          </div>
          <span className={`inline-block px-3 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-[8px] border ${
            selectedBooking.status === 'completed' || selectedBooking.status === 'Completed' ? 'bg-slate-50 text-slate-700 border-slate-200' :
            selectedBooking.status === 'On the way' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
            'bg-slate-900 text-white border-slate-900'
          }`}>
            {selectedBooking.status}
          </span>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[24px] border border-slate-200/60 shadow-[0_2px_12px_rgb(0,0,0,0.02)] space-y-5">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date & Time</p>
              <p className="text-[15px] font-semibold text-slate-900">{selectedBooking.preferred_date} • {selectedBooking.preferred_time}</p>
            </div>
            
            <div className="h-px bg-slate-100"></div>
            
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location</p>
              <p className="text-[15px] font-semibold text-slate-900">{selectedBooking.address_type}</p>
              {selectedBooking.address_type === 'Current Location' && selectedBooking.lat && (
                <p className="text-[13px] text-slate-500 font-mono mt-1 bg-slate-50 inline-block px-2 py-0.5 rounded border border-slate-100">
                  {selectedBooking.lat}, {selectedBooking.lng}
                </p>
              )}
            </div>

            <div className="h-px bg-slate-100"></div>
            
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Problem Description</p>
              <p className="text-[14px] font-medium text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-[16px] border border-slate-100 whitespace-pre-wrap">
                {selectedBooking.description}
              </p>
            </div>

            {mediaUrls.length > 0 && (
              <>
                <div className="h-px bg-slate-100"></div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Attachments</p>
                  <div className="grid grid-cols-3 gap-3">
                    {mediaUrls.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer" className="block relative pt-[100%] rounded-[12px] overflow-hidden border border-slate-200 group">
                        <img src={url} alt="Attachment" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSuccess = () => (
    <div className="animate-in zoom-in-95 duration-500 flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-slate-900 text-white rounded-[24px] flex items-center justify-center mb-6 shadow-[0_8px_24px_rgb(0,0,0,0.12)]">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
      </div>
      <h2 className="text-[28px] font-black text-slate-900 tracking-tight mb-3">Request Sent.</h2>
      <p className="text-slate-500 font-medium text-[15px] max-w-sm mb-10 leading-relaxed">
        Your booking for <span className="text-slate-800 font-bold">{selectedService?.libelle}</span> has been confirmed. A professional will be assigned shortly.
      </p>
      <button 
        onClick={() => { resetForm(); setActiveTab('HISTORY'); setView('HISTORY'); fetchHistory(); }}
        className="w-full text-white bg-slate-900 hover:bg-slate-800 font-bold rounded-[16px] text-[15px] px-8 py-4.5 h-[56px] transition-all shadow-[0_4px_14px_rgb(0,0,0,0.1)] active:scale-[0.98]"
      >
        View My Bookings
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F9] flex flex-col p-5 font-sans pb-24 selection:bg-slate-200">
      <div className="max-w-md mx-auto w-full mt-2">
        {view !== 'BOOKING' && view !== 'HISTORY_DETAIL' && view !== 'SUCCESS' && renderTabs()}

        {view === 'SERVICES' && renderServices()}
        {view === 'BOOKING' && renderBookingForm()}
        {view === 'HISTORY' && renderHistory()}
        {view === 'HISTORY_DETAIL' && renderHistoryDetail()}
        {view === 'SUCCESS' && renderSuccess()}
      </div>
    </div>
  );
}

export default function MorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F7F7F9] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
      </div>
    }>
      <MoreContent />
    </Suspense>
  );
}
