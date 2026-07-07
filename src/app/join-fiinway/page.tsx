export default function JoinFiinway() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 flex flex-col items-center text-center relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-50 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-60"></div>

        <div className="relative z-10 w-20 h-20 bg-gradient-to-tr from-green-500 to-green-400 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20 mb-8 transform -rotate-3 transition-transform hover:rotate-0 duration-300">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3 relative z-10">
          Join Fiinway
        </h1>
        
        <p className="text-gray-500 font-medium leading-relaxed mb-10 relative z-10 text-[15px]">
          Become a partner today and start earning on your own schedule.
        </p>

        <button className="relative z-10 w-full py-4 bg-gray-900 text-white font-semibold rounded-xl transition-all duration-300 hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-900/10 active:scale-[0.98] flex items-center justify-center gap-2">
          <span>Get Started</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
