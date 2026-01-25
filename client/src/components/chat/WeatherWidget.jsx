import { motion, AnimatePresence } from "framer-motion";
import { Cloud, X, Droplets, Wind, CloudRain, MapPin, ArrowRight, CloudOff as CloudOffIcon } from "lucide-react";

export default function WeatherWidget({
    showWeather,
    setShowWeather,
    weather,
    darkMode,
    weatherLoading,
    showDailyForecast,
    setShowDailyForecast
}) {
    return (
        <>
            <AnimatePresence mode="wait">
                {showWeather && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowWeather(false)}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`${darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-800 border-white/50"
                                } rounded-3xl shadow-2xl p-6 max-w-sm w-full border backdrop-blur-xl relative z-50`}
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <div className="p-2 bg-blue-500/10 rounded-xl">
                                        <Cloud className="w-5 h-5 text-blue-500" />
                                    </div>
                                    Weather
                                </h3>
                                <button
                                    onClick={() => setShowWeather(false)}
                                    className={`p-2 rounded-full transition-colors ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {weatherLoading ? (
                                <div className="flex flex-col items-center py-10">
                                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
                                    <p className="text-sm font-medium opacity-60">Fetching forecast...</p>
                                </div>
                            ) : weather ? (
                                <div className="space-y-8">
                                    <div className="text-center relative py-4">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -z-10" />
                                        <h2 className="text-6xl font-bold mb-2 tracking-tighter">{Math.round(weather.temp)}°</h2>
                                        <p className="text-lg font-medium text-blue-500">{weather.desc}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className={`p-4 rounded-2xl ${darkMode ? "bg-gray-700/50" : "bg-blue-50/50"} flex flex-col gap-1`}>
                                            <div className="flex items-center gap-2 opacity-60 mb-1">
                                                <Droplets className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Humidity</span>
                                            </div>
                                            <p className="text-xl font-bold">{weather.humidity}%</p>
                                        </div>
                                        <div className={`p-4 rounded-2xl ${darkMode ? "bg-gray-700/50" : "bg-blue-50/50"} flex flex-col gap-1`}>
                                            <div className="flex items-center gap-2 opacity-60 mb-1">
                                                <Wind className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Wind</span>
                                            </div>
                                            <p className="text-xl font-bold">{weather.wind} <span className="text-xs font-normal">km/h</span></p>
                                        </div>
                                        <div className={`p-4 rounded-2xl ${darkMode ? "bg-gray-700/50" : "bg-blue-50/50"} flex flex-col gap-1`}>
                                            <div className="flex items-center gap-2 opacity-60 mb-1">
                                                <CloudRain className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Rain %</span>
                                            </div>
                                            <p className="text-xl font-bold">{weather.rainChance}%</p>
                                        </div>
                                        <div className={`p-4 rounded-2xl ${darkMode ? "bg-gray-700/50" : "bg-blue-50/50"} flex flex-col gap-1`}>
                                            <div className="flex items-center gap-2 opacity-60 mb-1">
                                                <CloudRain className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Rain Vol</span>
                                            </div>
                                            <p className="text-xl font-bold">{weather.rainSum} <span className="text-xs font-normal">mm</span></p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs font-medium opacity-40 justify-center">
                                        <MapPin className="w-3 h-3" />
                                        <span>Local Forecast</span>
                                    </div>

                                    {weather.daily && (
                                        <motion.button
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setShowDailyForecast(true)}
                                            className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="text-sm">View 7-Day Forecast</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </motion.button>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-10 opacity-60">
                                    <CloudOffIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Weather unavailable</p>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {showDailyForecast && weather && weather.daily && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowDailyForecast(false)}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`${darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-800 border-white/50"
                                } rounded-3xl shadow-2xl p-6 max-w-md w-full border backdrop-blur-xl max-h-[80vh] flex flex-col relative z-50`}
                        >
                            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <div className="p-2 bg-blue-500/10 rounded-xl">
                                        <Cloud className="w-5 h-5 text-blue-500" />
                                    </div>
                                    7-Day Forecast
                                </h3>
                                <button
                                    onClick={() => setShowDailyForecast(false)}
                                    className={`p-2 rounded-full transition-colors ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                                {weather.daily.map((day, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={idx}
                                        className={`p-4 rounded-2xl flex items-center justify-between ${darkMode ? "bg-gray-700/30" : "bg-blue-50/50"
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? "bg-gray-700" : "bg-white"} shadow-sm text-sm font-bold`}>
                                                {idx === 0 ? "Today" : day.date.split(',')[0]}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold">{day.date}</span>
                                                <span className="text-xs opacity-60 font-medium">{day.desc}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-5 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold text-lg">{Math.round(day.maxTemp)}°</span>
                                                <span className="text-xs opacity-50 font-medium">{Math.round(day.minTemp)}°</span>
                                            </div>
                                            <div className="flex flex-col items-center w-8 bg-blue-100/50 rounded-lg py-1 dark:bg-blue-900/20">
                                                <span className="text-[10px] font-bold text-blue-500">{day.rainChance}%</span>
                                                <CloudRain className="w-3 h-3 text-blue-500 opacity-60" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
