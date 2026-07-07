"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function MoreContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("accesstoken");
  const driverId = searchParams.get("driver_id");
  const userId = searchParams.get("user_id");

  const [driverServices, setDriverServices] = useState<any[]>([]);
  const [userCategories, setUserCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        if (driverId) {
          const res = await fetch(`https://api.fiinway.com/api/v1/driver/services?driver_id=${driverId}`, {
            headers: {
              apikey: "4a282fdf-9736-476c-941d-d4ccfcb665fa",
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
              apikey: "4a282fdf-9736-476c-941d-d4ccfcb665fa",
              accesstoken: token,
            }
          });
          const data = await res.json();
          if (data.success === 'success' && data.data) {
             setUserCategories(data.data);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [driverId, userId, token]);

  if (!token) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center p-6 font-sans">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl font-medium shadow-sm border border-red-100">
          Unauthorized access. Missing valid session token.
        </div>
      </div>
    );
  }

  // Helper function to build image url securely
  const getImageUrl = (path: string) => {
    if (!path) return "https://api.fiinway.com/assets/images/placeholder_image.jpg";
    if (path.startsWith("http")) return path;
    return `https://api.fiinway.com/assets/images/service_type_images/${path}`;
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col p-6 font-sans">
      <div className="max-w-xl mx-auto w-full mt-4">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            {driverId ? "My Services" : "Available Services"}
          </h1>
          <p className="text-slate-500 font-medium text-[15px]">
            {driverId ? "Your authorized service categories." : "Explore all services available in the system."}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Dynamic List */}
        {!loading && (
          <div className="space-y-4 mb-8">
            
            {/* Driver View */}
            {driverId && driverServices.length === 0 && (
              <div className="p-6 bg-white rounded-2xl text-center text-slate-500 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
                You haven't selected any services yet.
              </div>
            )}

            {driverId && driverServices.map((service) => (
              <div key={service.id} className="group relative p-6 bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-blue-100 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500 z-0"></div>
                <div className="relative z-10 flex items-center gap-5">
                  <div className="w-16 h-16 bg-blue-100/50 rounded-xl overflow-hidden flex-shrink-0 border border-blue-100">
                    <img src={getImageUrl(service.image)} alt={service.title} className="w-full h-full object-cover p-2 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800">{service.title}</h3>
                    <p className="text-slate-500 text-sm mt-1">Status: <span className={service.statut === 'yes' ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>{service.statut === 'yes' ? 'Active' : 'Pending/Inactive'}</span></p>
                  </div>
                </div>
              </div>
            ))}

            {/* User View */}
            {userId && userCategories.length === 0 && (
              <div className="p-6 bg-white rounded-2xl text-center text-slate-500 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
                No services currently available.
              </div>
            )}

            {userId && userCategories.map((category) => (
              <div key={category.id} className="group p-6 bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 mb-6 last:mb-0 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-indigo-100">
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-50">
                  <div className="w-14 h-14 bg-indigo-50/50 rounded-xl overflow-hidden p-2 flex-shrink-0 border border-indigo-100/50">
                    <img src={getImageUrl(category.image)} alt={category.libelle} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">{category.libelle}</h3>
                  </div>
                </div>
                
                {category.subcategories && category.subcategories.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {category.subcategories.map((sub: any) => (
                      <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-100/50 transition-colors cursor-pointer">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shadow-sm flex-shrink-0 p-1.5 border border-slate-100">
                          <img src={getImageUrl(sub.image)} alt={sub.libelle} className="w-full h-full object-contain" />
                        </div>
                        <span className="font-medium text-sm text-slate-700">{sub.libelle}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic px-2">No sub-categories available.</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Existing Static Options block - Kept at bottom so user doesn't lose access to them */}
        <div className="space-y-4">
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

        {/* Diagnostic info silently rendered */}
        {token && (userId || driverId) && (
          <div className="mt-12 text-center opacity-30 text-[10px] text-slate-400 font-mono">
            Session: {userId || driverId} | Secured
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
