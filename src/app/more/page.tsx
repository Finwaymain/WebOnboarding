"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useRef } from "react";

function MoreContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("accesstoken");
  const driverId = searchParams.get("driver_id");
  const userId = searchParams.get("user_id");

  const [driverServices, setDriverServices] = useState<any[]>([]);
  const [userCategories, setUserCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation State
  const [view, setView] = useState<'SERVICES' | 'BOOKING' | 'HISTORY' | 'SUCCESS'>('SERVICES');
  const [activeTab, setActiveTab] = useState<'SERVICES' | 'HISTORY'>('SERVICES');
  const [selectedService, setSelectedService] = useState<any>(null);

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
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        if (driverId) {
          const res = await fetch(`https://api.fiinway.com/api/v1/driver/services?driver_id=${driverId}`, {
            headers: {
              apikey: "base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU=",
              accesstoken: token,
            }
          });
          const data = await res.json();
          if (data.success === 'success' && data.data) {
            setDriverServices(data.data);
          }
        } else if (userId) {
          const res = await fetch(`https://api.fiinway.com/api/v1/user-categories`, {
            headers: {
              apikey: "base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU=",
              accesstoken: token,
            }
          });
          const data = await res.json();
          if (data.success === 'success' && data.data) {
             setUserCategories(data.data);
          }
        }
        
        // Fetch History
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
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Setup GPS bridge
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
          base64: base64String // This will be sent to the backend to be uploaded to ImageKit
        }]);
      };
      reader.readAsDataURL(file);
    });
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

  if (!token) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center p-6 font-sans">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl font-medium shadow-sm border border-red-100">
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

  // -------------------------------------------------------------
  // RENDERING HELPERS
  // -------------------------------------------------------------

  const renderTabs = () => {
    if (!userId) return null; // Only users have history for now
    return (
      <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
        <button
          onClick={() => { setActiveTab('SERVICES'); setView('SERVICES'); }}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'SERVICES' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Explore Services
        </button>
        <button
          onClick={() => { setActiveTab('HISTORY'); setView('HISTORY'); }}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'HISTORY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          My Bookings
        </button>
      </div>
    );
  };

  const renderServices = () => (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          {driverId ? "My Services" : "Available Services"}
        </h1>
        <p className="text-slate-500 font-medium text-[15px]">
          {driverId ? "Your authorized service categories." : "Select a service to request a booking."}
        </p>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}

      {!loading && (
        <div className="space-y-4 mb-8">
          {/* Driver View */}
          {driverId && driverServices.length === 0 && (
            <div className="p-6 bg-white rounded-2xl text-center text-slate-500 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
              You haven't selected any services yet.
            </div>
          )}
          {driverId && driverServices.map((service) => (
            <div key={service.id} className="group relative p-6 bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-blue-100/50 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={getImageUrl(service.image)} alt={service.title} className="w-full h-full object-cover p-2" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800">{service.title}</h3>
                  <p className="text-slate-500 text-sm mt-1">Status: <span className={service.statut === 'yes' ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>{service.statut === 'yes' ? 'Active' : 'Pending'}</span></p>
                </div>
              </div>
            </div>
          ))}

          {/* User View */}
          {userId && userCategories.length === 0 && (
            <div className="p-8 bg-white rounded-2xl text-center text-slate-500 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
              No services currently available.
            </div>
          )}
          {userId && userCategories.map((category) => (
            <div key={category.id} className="mb-10 last:mb-0">
              <div className="flex items-center gap-3 mb-5 px-1">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center p-2">
                  <img src={getImageUrl(category.image)} alt={category.libelle} className="w-full h-full object-contain opacity-80" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{category.libelle}</h2>
              </div>
              
              {category.subcategories && category.subcategories.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {category.subcategories.map((sub: any) => (
                    <div 
                      key={sub.id} 
                      onClick={() => { setSelectedService(sub); setView('BOOKING'); }}
                      className="group flex flex-col items-center p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-slate-50/80 flex items-center justify-center p-3 mb-4 group-hover:bg-blue-50/50 transition-colors">
                        <img src={getImageUrl(sub.image)} alt={sub.libelle} className="w-full h-full object-contain" />
                      </div>
                      <span className="font-bold text-[14px] text-center text-slate-800 leading-snug">{sub.libelle}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-200 border-dashed text-center">
                  <p className="text-sm text-slate-400 font-medium">No services listed yet.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderBookingForm = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => setView('SERVICES')} 
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-6 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        Back to Services
      </button>

      <div className="mb-8 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center p-3 border border-blue-100">
          <img src={getImageUrl(selectedService?.image)} alt={selectedService?.libelle} className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Book {selectedService?.libelle}</h1>
          <p className="text-slate-500 font-medium text-[15px]">Fill out the details to request this service.</p>
        </div>
      </div>

      <form onSubmit={handleSubmitBooking} className="space-y-6">
        {/* Address Selection */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Select Address</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {['Current Location', 'Home', 'Office', 'Other Address'].map(opt => (
              <label key={opt} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${addressType === opt ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'}`}>
                <input type="radio" name="address" value={opt} checked={addressType === opt} onChange={(e) => setAddressType(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                <span className={`ml-3 font-medium text-sm ${addressType === opt ? 'text-blue-900' : 'text-slate-700'}`}>{opt}</span>
              </label>
            ))}
          </div>
          {addressType === 'Current Location' && (
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-900">GPS Auto-Fetch Active</p>
                  <p className="text-xs text-emerald-700 font-medium">{locationCoords ? `Location captured (${locationCoords.lat.toFixed(4)}, ${locationCoords.lng.toFixed(4)})` : "Waiting for location..."}</p>
                </div>
              </div>
              {!locationCoords && (
                <div className="w-5 h-5 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
              )}
            </div>
          )}
        </div>

        {/* Booking Details */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Booking Details</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Preferred Date</label>
              <input type="date" required value={bookingDate} onChange={e => setBookingDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Preferred Time</label>
              <input type="time" required value={bookingTime} onChange={e => setBookingTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none transition-all" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold text-slate-700 mb-2">Problem Description</label>
            <textarea required rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Please describe the issue in detail..." className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-4 outline-none transition-all resize-none"></textarea>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Upload Photos (Optional)</label>
              <input type="file" multiple accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Upload Video (Optional)</label>
              <input type="file" accept="video/*" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Voice Note (Optional)</label>
              <input type="file" accept="audio/*" capture="environment" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer border border-slate-200 rounded-xl" />
            </div>
          </div>
          
          {mediaFiles.length > 0 && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-sm font-semibold text-slate-700 mb-2">{mediaFiles.length} file(s) attached</p>
              <ul className="text-xs text-slate-500 space-y-1">
                {mediaFiles.map((file, idx) => (
                  <li key={idx}>• {file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button type="submit" className="w-full text-white bg-slate-900 hover:bg-slate-800 focus:ring-4 focus:outline-none focus:ring-slate-300 font-bold rounded-xl text-lg px-5 py-4 text-center transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98]">
          Submit Booking Request
        </button>
      </form>
    </div>
  );

  const renderHistory = () => (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">My Bookings</h1>
        <p className="text-slate-500 font-medium text-[15px]">View and manage your service history.</p>
      </div>

      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl text-center text-slate-500 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
            You don't have any bookings yet.
          </div>
        ) : (
          history.map((booking: any) => (
            <div key={booking.id} className="p-5 bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{booking.serviceName}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm font-medium text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    {booking.date} at {booking.time}
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                  booking.status === 'Completed' ? 'bg-slate-100 text-slate-700' :
                  booking.status === 'On the way' ? 'bg-blue-100 text-blue-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {booking.status}
                </span>
              </div>
              
              {booking.status === 'On the way' && (
                <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  </div>
                  <p className="text-sm font-bold text-blue-900">Provider is on the way. ETA: 15 mins</p>
                </div>
              )}

              {booking.status === 'Completed' && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(star => (
                      <svg key={star} className={`w-5 h-5 ${booking.rate && star <= booking.rate ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    ))}
                  </div>
                  {!booking.rate && (
                    <button className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">Rate Provider</button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="animate-in zoom-in-95 duration-500 flex flex-col items-center justify-center py-12 text-center">
      <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
      </div>
      <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Request Submitted!</h2>
      <p className="text-slate-500 font-medium text-lg max-w-sm mb-8 leading-relaxed">
        We have received your request for <span className="text-slate-800 font-bold">{selectedService?.libelle}</span>. We will notify you as soon as a service provider is available to you.
      </p>
      <button 
        onClick={() => { resetForm(); setActiveTab('HISTORY'); setView('HISTORY'); }}
        className="w-full sm:w-auto text-white bg-slate-900 hover:bg-slate-800 focus:ring-4 focus:outline-none focus:ring-slate-300 font-bold rounded-xl text-lg px-8 py-4 text-center transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98]"
      >
        View My Bookings
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col p-6 font-sans pb-24">
      <div className="max-w-xl mx-auto w-full mt-2">
        {renderTabs()}

        {view === 'SERVICES' && renderServices()}
        {view === 'BOOKING' && renderBookingForm()}
        {view === 'HISTORY' && renderHistory()}
        {view === 'SUCCESS' && renderSuccess()}

        {/* Existing Static Options block - Only in Services view */}
        {view === 'SERVICES' && (
          <div className="space-y-4 mt-8 pt-8 border-t border-slate-200/60">
            <div className="group relative p-6 bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-slate-200 transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="relative z-10 flex items-center gap-5">
                <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center group-hover:bg-slate-100 group-hover:text-slate-800 transition-colors duration-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Support & Help</h3>
                  <p className="text-slate-500 text-sm mt-1">Get assistance with your account</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafbfc] flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>}>
      <MoreContent />
    </Suspense>
  );
}
