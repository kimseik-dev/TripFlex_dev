"use client";

import React, { useState } from 'react';
import { Navigation, Sparkles, ChevronRight, Camera, Globe, MapPin, Settings, Banknote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Scanner from '../components/Scanner';

export default function Home() {
  const [showScanner, setShowScanner] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapUrl, setMapUrl] = useState('');

  // v34: Currency Converter States
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [rates, setRates] = useState<any>(null);
  const [amount, setAmount] = useState<string>('1000');
  const [fromCurrency, setFromCurrency] = useState('KRW');
  const [toCurrency, setToCurrency] = useState('JPY');

  // Fetch rates on mount
  React.useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/KRW')
      .then(res => res.json())
      .then(data => setRates(data.rates))
      .catch(err => console.error("Exchange API failed:", err));
  }, []);

  const currencies = [
    { code: 'KRW', name: '대한민국 원', flag: '🇰🇷' },
    { code: 'JPY', name: '일본 엔', flag: '🇯🇵' },
    { code: 'USD', name: '미국 달러', flag: '🇺🇸' },
    { code: 'CNY', name: '중국 위안', flag: '🇨🇳' },
    { code: 'EUR', name: '유로', flag: '🇪🇺' },
    { code: 'THB', name: '태국 바트', flag: '🇹🇭' },
    { code: 'VND', name: '베트남 동', flag: '🇻🇳' },
    { code: 'TWD', name: '대만 달러', flag: '🇹🇼' },
    { code: 'HKD', name: '홍콩 달러', flag: '🇭🇰' },
  ];

  const supportedLanguages = [
    { name: '한국어', code: 'KO', flag: '🇰🇷' },
    { name: '일본어', code: 'JA', flag: '🇯🇵' },
    { name: '영어', code: 'EN', flag: '🇺🇸' },
    { name: '중국어(간체)', code: 'ZH-S', flag: '🇨🇳' },
    { name: '중국어(번체)', code: 'ZH-T', flag: '🇹🇼' },
    { name: '광둥어', code: 'YUE', flag: '🇭🇰' },
    { name: '태국어', code: 'TH', flag: '🇹🇭' },
    { name: '베트남어', code: 'VI', flag: '🇻🇳' },
    { name: '프랑스어', code: 'FR', flag: '🇫🇷' },
    { name: '스페인어', code: 'ES', flag: '🇪🇸' },
    { name: '독일어', code: 'DE', flag: '🇩🇪' },
    { name: '이탈리아어', code: 'IT', flag: '🇮🇹' },
    { name: '포르투갈어', code: 'PT', flag: '🇵🇹' },
    { name: '튀르키예어', code: 'TR', flag: '🇹🇷' },
    { name: '네덜란드어', code: 'NL', flag: '🇳🇱' },
    { name: '스웨덴어', code: 'SV', flag: '🇸🇪' },
    { name: '핀란드어', code: 'FI', flag: '🇫🇮' },
    { name: '그리스어', code: 'EL', flag: '🇬🇷' },
    { name: '체코어', code: 'CS', flag: '🇨🇿' },
    { name: '헝가리어', code: 'HU', flag: '🇭🇺' },
    { name: '슬로베니아어', code: 'SL', flag: '🇸🇮' },
    { name: '말레이어', code: 'MS', flag: '🇲🇾' },
    { name: '타갈로그어', code: 'TL', flag: '🇵🇭' },
    { name: '마오리어', code: 'MI', flag: '🇳🇿' },
    { name: '타밀어', code: 'TA', flag: '🇱🇰' },
  ];

  const handleNearbySearch = () => {
    // v30: In-App Map Bridge (using output=embed for iframe support)
    const baseSearch = 'https://maps.google.com/maps?q=restaurants&hl=ko&output=embed';

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Google Maps Embed Search URL
          setMapUrl(`https://maps.google.com/maps?q=restaurants&ll=${latitude},${longitude}&z=15&hl=ko&output=embed`);
          setShowMapModal(true);
        },
        (error) => {
          console.warn("Geolocation failed, using default search:", error);
          setMapUrl(baseSearch);
          setShowMapModal(true);
        }
      );
    } else {
      setMapUrl(baseSearch);
      setShowMapModal(true);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start py-12 px-6 overflow-hidden bg-[#0A0B12] text-white">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]" />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-[430px] flex flex-col items-center">

        {/* Logo / Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex items-center justify-between mb-12"
        >
          <div className="flex items-center gap-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
              <Navigation className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tighter text-white">
              TripFlex <span className="text-cyan-400">NexGen</span>
            </span>
          </div>

          {/* AI Guide Button (v62: Intuitive Text Label) */}
          <motion.div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center gap-2 text-amber-400 shadow-lg backdrop-blur-md"
            >
              <span className="text-xs font-bold tracking-tight">듀토리얼</span>
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Ad Banner Container (v24: Relocated below Title) */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full mb-8 py-3 px-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-400/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Top Banner</span>
              <span className="text-sm font-medium text-white/80 leading-tight">대표님의 특별한 광고가 여기에!</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
        </motion.div>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full bg-white/5 backdrop-blur-xl rounded-[40px] p-8 mb-8 flex flex-col items-center text-center border border-white/10 shadow-2xl relative overflow-hidden group"
        >
          {/* Hero Icon Removed for Cleaner Look (v61) */}

          <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            세상의 모든 메뉴를 <br />
            <span className="text-cyan-400">한눈에 담으세요</span>
          </h1>

          <p className="text-gray-400 text-lg mb-8 leading-relaxed px-4">
            AI 실시간 번역으로 낯선 여행지도 <br />
            내 동네처럼 편안하게 즐기세요.
          </p>

          <button
            onClick={() => setShowScanner(true)}
            className="w-full bg-white text-black py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-2 hover:bg-cyan-50 transition-all active:scale-95 shadow-xl shadow-white/5"
          >
            시작하기
            <ChevronRight className="w-6 h-6" />
          </button>
        </motion.div>

        {/* Feature Trays */}
        <div className="grid grid-cols-2 gap-4 w-full">
          {[
            { icon: Banknote, label: '환율 계산', color: 'text-amber-400', action: () => setShowCurrencyModal(true) },
            { icon: Globe, label: '다국어 지원', color: 'text-purple-400', action: () => setShowLanguageModal(true) },
            { icon: MapPin, label: '인근 탐색', color: 'text-emerald-400', action: handleNearbySearch },
            { icon: Settings, label: '설정', color: 'text-gray-400', action: () => { } },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (idx * 0.1) }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={feature.action}
              className={`bg-black/20 backdrop-blur-md rounded-3xl p-4 flex flex-col items-center justify-center gap-3 border border-white/5 ${feature.action ? 'cursor-pointer hover:bg-white/5' : ''}`}
            >
              <feature.icon className={`w-8 h-8 ${feature.color}`} />
              <span className="text-white font-medium text-sm">{feature.label}</span>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-gray-500 text-sm font-medium"
        >
          Designed by <span className="text-gray-300">Stitch AI</span> & <span className="text-cyan-500/80">Youngja</span>
        </motion.p>
      </div>

      {/* Currency Converter Modal (v34) */}
      <AnimatePresence>
        {showCurrencyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCurrencyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-[#1A1B23] border border-white/10 rounded-[40px] p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <Banknote className="w-6 h-6 text-amber-400" />
                  환율 계산기
                </h2>
                <button
                  onClick={() => setShowCurrencyModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* From Section */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">From</span>
                    <select
                      value={fromCurrency}
                      onChange={(e) => setFromCurrency(e.target.value)}
                      className="bg-transparent text-white text-sm font-bold border-0 focus:ring-0 cursor-pointer"
                    >
                      {currencies.map(c => <option key={c.code} value={c.code} className="bg-[#1A1B23]">{c.flag} {c.code}</option>)}
                    </select>
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-3xl font-bold text-white border-0 p-0 focus:ring-0 placeholder:text-white/10"
                  />
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">
                    {currencies.find(c => c.code === fromCurrency)?.name}
                  </p>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center -my-3 relative z-10">
                  <button
                    onClick={() => {
                      const temp = fromCurrency;
                      setFromCurrency(toCurrency);
                      setToCurrency(temp);
                    }}
                    className="w-10 h-10 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all outline outline-4 outline-[#1A1B23]"
                  >
                    ↑↓
                  </button>
                </div>

                {/* To Section */}
                <div className="bg-amber-400/10 rounded-2xl p-4 border border-amber-400/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-amber-500/80 font-bold">To</span>
                    <select
                      value={toCurrency}
                      onChange={(e) => setToCurrency(e.target.value)}
                      className="bg-transparent text-amber-400 text-sm font-bold border-0 focus:ring-0 cursor-pointer"
                    >
                      {currencies.map(c => <option key={c.code} value={c.code} className="bg-[#1A1B23]">{c.flag} {c.code}</option>)}
                    </select>
                  </div>
                  <div className="text-3xl font-bold text-amber-400 py-1">
                    {rates ? (
                      ((Number(amount) / (rates[fromCurrency] || 1)) * (rates[toCurrency] || 1)).toLocaleString(undefined, { maximumFractionDigits: 2 })
                    ) : '---'}
                  </div>
                  <p className="text-[10px] text-amber-500/60 mt-2 font-medium italic">
                    {currencies.find(c => c.code === toCurrency)?.name}
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 text-center">
                <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                  실시간 환율 기반 (Powered by ER-API)<br />
                  오차 범위가 발생할 수 있으니 여행 참고용으로만 사용하세요.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Modal (v30) */}
      <AnimatePresence>
        {showMapModal && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[110] flex flex-col bg-[#0A0B12]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#1A1B23]/80 backdrop-blur-xl border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base">인근 맛집 탐색</h2>
                  <p className="text-[10px] text-gray-500">NexGen GPS Precision Engine</p>
                </div>
              </div>
              <button
                onClick={() => setShowMapModal(false)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all font-bold"
              >
                ✕
              </button>
            </div>

            {/* Map Iframe */}
            <div className="flex-1 w-full bg-[#1A1B23] relative">
              <iframe
                src={mapUrl}
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                title="Nearby Search Map"
              ></iframe>

              {/* Optional: Loading indicator or overlay if needed */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language Modal (v26) */}
      <AnimatePresence>
        {showLanguageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLanguageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#1A1B23] border border-white/10 rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-2xl custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h2 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2 md:gap-3">
                  <Globe className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
                  지원 언어 안내
                </h2>
                <button
                  onClick={() => setShowLanguageModal(false)}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {supportedLanguages.map((lang) => (
                  <div
                    key={lang.code}
                    className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex flex-col items-center justify-center gap-2 border border-white/5 hover:border-purple-500/50 transition-all group"
                  >
                    <span className="text-xl md:text-2xl group-hover:scale-110 transition-transform">{lang.flag}</span>
                    <span className="text-white font-semibold text-[10px] md:text-xs whitespace-nowrap">{lang.name}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 md:mt-10 pt-6 border-t border-white/5">
                <p className="text-gray-500 text-xs md:text-sm text-center font-medium leading-relaxed">
                  TripFlex NexGen은 현재 <span className="text-purple-400 font-bold underline decoration-purple-400/30 underline-offset-4">총 25개 언어</span>를 <br />
                  실시간으로 완벽하게 번역하고 분석합니다.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanner Overlay */}
      <AnimatePresence>
        {showScanner && (
          <Scanner onClose={() => setShowScanner(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}
