import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Leaf,
  Plus,
  MessageSquare,
  Menu,
  X,
  Trash2,
  User,
  Bot,
  LogOut,
  Mic,
  MicOff,
  ChevronDown,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  MapPin,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { authFetch } from "../utils/api";
import { logout } from "../utils/auth";

export default function Chatbot() {
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chats, setChats] = useState({});
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : false
  );
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [showSources, setShowSources] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [weather, setWeather] = useState(null);
  const [showWeather, setShowWeather] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const skipHistoryFetchRef = useRef(null);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-IN";

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        if (event.error === "no-speech") {
          alert("No speech detected. Please try again.");
        } else if (event.error === "not-allowed") {
          alert("Microphone access denied. Please enable it in settings.");
        }
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      setVoiceSupported(true);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    authFetch("/chat/list")
      .then((r) => r.json())
      .then((data) => {
        setChatHistory(
          data.map((c) => ({
            id: c.id,
            title: c.title || "New Chat",
          }))
        );
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!currentChatId) return;

    if (skipHistoryFetchRef.current === currentChatId) {
      skipHistoryFetchRef.current = null;
      return;
    }

    authFetch(`/chat/history/${currentChatId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load chat");
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setChats((p) => ({
          ...p,
          [currentChatId]:
            d.messages?.length > 0
              ? d.messages
              : [
                {
                  role: "assistant",
                  content:
                    "🌱 Hi! I'm your Agriculture Assistant. Ask me anything about farming, crops, soil, or irrigation.",
                },
              ],
        }));
      })
      .catch(() => { });
  }, [currentChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, currentChatId, isLoading]);

  const toggleVoiceInput = () => {
    if (!voiceSupported) {
      alert(
        "Voice search is not supported in your browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const createNewChat = async () => {
    const id = Date.now().toString();

    try {
      await authFetch("/chat/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: id }),
      });

      setChatHistory((p) => [{ id, title: "New Chat" }, ...p]);
      setChats((p) => ({
        ...p,
        [id]: [
          {
            role: "assistant",
            content:
              "🌱 Hi! I'm your Agriculture Assistant. Ask me anything about farming, crops, soil, or irrigation.",
          },
        ],
      }));
      setCurrentChatId(id);
      setSidebarOpen(window.innerWidth < 1024);
    } catch {
      alert("Failed to create new chat. Please try again.");
    }
  };

  const deleteChat = async (id, e) => {
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this chat?")) return;

    try {
      const response = await authFetch(`/chat/${id}`, { method: "DELETE" });
      const result = await response.json();

      if (!result.success) {
        alert("Failed to delete chat. Please try again.");
        return;
      }

      setChatHistory((p) => p.filter((c) => c.id !== id));
      setChats((p) => {
        const c = { ...p };
        delete c[id];
        return c;
      });

      if (id === currentChatId) {
        setCurrentChatId(null);
      }
    } catch {
      alert("Failed to delete chat. Please try again.");
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    let chatId = currentChatId;
    const msg = input.trim();
    setInput("");

    if (!chatId) {
      chatId = Date.now().toString();

      try {
        await authFetch("/chat/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId }),
        });

        setChatHistory((p) => [{ id: chatId, title: msg }, ...p]);

        skipHistoryFetchRef.current = chatId;
        setCurrentChatId(chatId);
      } catch {
        alert("Failed to create chat. Please try again.");
        return;
      }
    }

    setChats((p) => ({
      ...p,
      [chatId]: [...(p[chatId] || []), { role: "user", content: msg }],
    }));

    setChats((p) => ({
      ...p,
      [chatId]: [
        ...(p[chatId] || []),
        {
          role: "assistant",
          content: "",
          sources: [],
        },
      ],
    }));

    setIsLoading(true);

    try {
      const res = await authFetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message: msg }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";
      let sources = [];
      let title = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.content) {
                accumulatedContent += data.content;
                await new Promise((resolve) => setTimeout(resolve, 30));

                setChats((p) => {
                  const messages = [...(p[chatId] || [])];
                  const lastIndex = messages.length - 1;
                  messages[lastIndex] = {
                    ...messages[lastIndex],
                    content: accumulatedContent,
                  };
                  return { ...p, [chatId]: messages };
                });
              }

              if (data.sources) {
                sources = data.sources;
              }

              if (data.title) {
                title = data.title;
              }

              if (data.done) {
                setChats((p) => {
                  const messages = [...(p[chatId] || [])];
                  const lastIndex = messages.length - 1;
                  messages[lastIndex] = {
                    ...messages[lastIndex],
                    sources: sources,
                  };
                  return { ...p, [chatId]: messages };
                });

                if (title) {
                  setChatHistory((p) =>
                    p.map((c) => (c.id === chatId ? { ...c, title: title } : c))
                  );
                }
              }
            } catch (e) { }
          }
        }
      }
    } catch {
      setChats((p) => {
        const messages = [...(p[chatId] || [])];
        const lastIndex = messages.length - 1;
        messages[lastIndex] = {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        };
        return { ...p, [chatId]: messages };
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeather = () => {
    setWeatherLoading(true);
    setShowWeather(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setWeatherLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=precipitation_sum,precipitation_probability_max&timezone=auto`
          );
          const data = await response.json();
          const current = data.current;
          const daily = data.daily;

          // Map WMO codes to text
          const getWeatherDesc = (code) => {
            if (code === 0) return "Clear sky";
            if (code >= 1 && code <= 3) return "Partly cloudy";
            if (code >= 45 && code <= 48) return "Foggy";
            if (code >= 51 && code <= 67) return "Rainy";
            if (code >= 71 && code <= 77) return "Snowy";
            if (code >= 80 && code <= 82) return "Showers";
            if (code >= 95 && code <= 99) return "Thunderstorm";
            return "Unknown";
          };

          setWeather({
            temp: current.temperature_2m,
            humidity: current.relative_humidity_2m,
            wind: current.wind_speed_10m,
            desc: getWeatherDesc(current.weather_code),
            code: current.weather_code,
            rainChance: daily.precipitation_probability_max[0],
            rainSum: daily.precipitation_sum[0],
          });
        } catch (error) {
          console.error("Error fetching weather:", error);
          alert("Failed to fetch weather data.");
        } finally {
          setWeatherLoading(false);
        }
      },
      () => {
        alert("Unable to retrieve your location");
        setWeatherLoading(false);
      }
    );
  };

  const currentMessages = chats[currentChatId] || [];

  return (
    <div
      className={`flex h-screen overflow-hidden relative ${darkMode
        ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
        : "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50"
        }`}
    >
      <div
        className={`absolute inset-0 z-0 pointer-events-none ${darkMode ? "opacity-10" : "opacity-30"
          }`}
        style={{
          backgroundImage: "url(/bg-agriculture.png)",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      />
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {showWeather && (
        <div
          onClick={() => setShowWeather(false)}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
              } rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200 border ${darkMode ? "border-gray-700" : "border-gray-100"
              }`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Cloud className="w-6 h-6 text-blue-500" /> Weather
              </h3>
              <button
                onClick={() => setShowWeather(false)}
                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {weatherLoading ? (
              <div className="flex flex-col items-center py-8">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm opacity-70">Fetching local weather...</p>
              </div>
            ) : weather ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">{weather.temp}°C</div>
                  <p className="text-lg font-medium text-blue-500">{weather.desc}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-blue-50"}`}>
                    <div className="flex items-center gap-2 mb-1 opacity-70">
                      <Droplets className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase">Humidity</span>
                    </div>
                    <p className="text-xl font-bold">{weather.humidity}%</p>
                  </div>
                  <div className={`p-4 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-blue-50"}`}>
                    <div className="flex items-center gap-2 mb-1 opacity-70">
                      <Wind className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase">Wind</span>
                    </div>
                    <p className="text-xl font-bold">{weather.wind} km/h</p>
                  </div>
                  <div className={`p-4 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-blue-50"}`}>
                    <div className="flex items-center gap-2 mb-1 opacity-70">
                      <CloudRain className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase">Rain Chance</span>
                    </div>
                    <p className="text-xl font-bold">{weather.rainChance}%</p>
                  </div>
                  <div className={`p-4 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-blue-50"}`}>
                    <div className="flex items-center gap-2 mb-1 opacity-70">
                      <CloudRain className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase">Rain Amt</span>
                    </div>
                    <p className="text-xl font-bold">{weather.rainSum} mm</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs opacity-50 justify-center">
                  <MapPin className="w-3 h-3" />
                  <span>Based on your current location</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 opacity-70">
                Failed to load weather data
              </div>
            )}
          </div>
        </div>
      )
      }

      <aside
        className={`fixed inset-y-0 left-0 z-50 ${darkMode ? "bg-gray-800/80" : "bg-white/80"
          } backdrop-blur-xl ${darkMode ? "border-gray-700" : "border-green-200"
          } border-r
        flex flex-col shadow-2xl transition-all duration-300 ease-in-out overflow-hidden
        ${sidebarOpen
            ? "translate-x-0 w-72"
            : "-translate-x-full w-72 lg:w-0 lg:p-0 lg:border-r-0 lg:translate-x-0"
          }
        lg:relative`}
      >
        <div className="w-72 h-full flex flex-col">
          <div className="p-5 border-b border-green-200 bg-gradient-to-r from-green-600 to-emerald-600">
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Leaf className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h1 className="font-bold text-lg">KisanAi</h1>
                <p className="text-xs text-white/80">Agriculture Assistant</p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden hover:bg-white/20 p-2 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4">
            <button
              onClick={createNewChat}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl flex gap-2 items-center justify-center hover:shadow-lg transition font-medium"
            >
              <Plus className="w-5 h-5" /> New Chat
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-3">
            <div className="space-y-2 py-2">
              {chatHistory.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setCurrentChatId(c.id);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={`group flex justify-between items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all ${c.id === currentChatId
                    ? darkMode
                      ? "bg-gradient-to-r from-gray-700 to-gray-600 shadow-md"
                      : "bg-gradient-to-r from-green-100 to-emerald-100 shadow-md"
                    : darkMode
                      ? "hover:bg-gray-700/60"
                      : "hover:bg-white/60"
                    }`}
                >
                  <div className="flex gap-3 items-center truncate flex-1 min-w-0">
                    <MessageSquare
                      className={`w-4 h-4 flex-shrink-0 ${c.id === currentChatId
                        ? darkMode
                          ? "text-green-400"
                          : "text-green-700"
                        : darkMode
                          ? "text-green-400"
                          : "text-green-600"
                        }`}
                    />
                    <span
                      className={`truncate text-sm ${darkMode ? "text-gray-200" : ""
                        } ${c.id === currentChatId ? "font-medium" : ""}`}
                    >
                      {c.title}
                    </span>
                  </div>
                  <button
                    onClick={(e) => deleteChat(c.id, e)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition hover:bg-red-100 rounded-lg p-1.5"
                    title="Delete chat"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`p-4 border-t ${darkMode ? "border-gray-700" : "border-green-200"
              }`}
          >
            <button
              onClick={logout}
              className="flex gap-2 items-center justify-center text-red-600 text-sm hover:text-red-700 transition font-medium w-full px-4 py-3 rounded-lg hover:bg-red-50 border border-red-200"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        <header
          className={`${darkMode
            ? "bg-gray-800/80 border-gray-700"
            : "bg-white/80 border-green-200"
            } backdrop-blur-xl border-b p-4 flex gap-3 items-center shadow-sm`}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`${darkMode ? "hover:bg-gray-700" : "hover:bg-green-100"
              } p-2 rounded-lg transition`}
          >
            <Menu
              className={`w-6 h-6 ${darkMode ? "text-green-400" : "text-green-700"
                }`}
            />
          </button>
          <div
            className={`flex items-center gap-2 ${darkMode ? "text-green-400" : "text-green-700"
              }`}
          >
            <Leaf className="w-6 h-6" />
            <span className="font-bold text-lg">KisanAi</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <button
              onClick={fetchWeather}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition ${darkMode
                ? "bg-gray-700 text-blue-400 hover:bg-gray-600"
                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                }`}
              title="Check Weather"
            >
              <Cloud className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Weather</span>
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition ${darkMode
                ? "bg-gray-700 text-yellow-400 hover:bg-gray-600"
                : "bg-green-50 text-green-600 hover:bg-green-100"
                }`}
            >
              {darkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {currentMessages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Leaf className="w-10 h-10 text-white" />
                </div>
                <h2
                  className={`text-2xl font-bold ${darkMode ? "text-gray-100" : "text-gray-800"
                    } mb-3`}
                >
                  Welcome to KisanAi
                </h2>
                <p
                  className={`${darkMode ? "text-gray-300" : "text-gray-600"
                    } mb-6`}
                >
                  Your intelligent agriculture assistant. Ask me anything about
                  farming, crops, soil, irrigation, or pest management.
                </p>
                <div className="grid grid-cols-1 gap-2 text-left">
                  {[
                    "What are the best crops for monsoon season?",
                    "How to prevent pest attacks on tomatoes?",
                    "Best irrigation methods for rice farming?",
                  ].map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(q)}
                      className={`text-sm text-left px-4 py-3 rounded-xl border transition ${darkMode
                        ? "bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-200 hover:border-green-500"
                        : "bg-white hover:bg-green-50 border-green-200 text-gray-700 hover:border-green-400"
                        }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentMessages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
            >
              {m.role === "assistant" && (
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex justify-center items-center flex-shrink-0 shadow-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="flex flex-col gap-2 max-w-xl sm:max-w-2xl">
                <div
                  className={`px-5 py-4 rounded-2xl ${m.role === "user"
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg"
                    : darkMode
                      ? "bg-gray-800 border border-gray-700 shadow-md text-gray-100"
                      : "bg-white border border-green-200 shadow-md"
                    } ${m.role === "assistant" && !m.content && isLoading
                      ? "thinking-bubble"
                      : ""
                    }`}
                >
                  {m.role === "assistant" && !m.content && isLoading ? (
                    <div className="flex gap-1.5 py-2">
                      <div
                        className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  ) : (
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => (
                          <p className="my-2" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="my-2 pl-6 list-disc" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="my-2 pl-6 list-decimal" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="my-1" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong className="font-semibold" {...props} />
                        ),
                        em: ({ node, ...props }) => (
                          <em className="italic" {...props} />
                        ),
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  )}
                </div>
                {m.role === "assistant" &&
                  m.sources &&
                  m.sources.length > 0 && (
                    <div className="ml-2">
                      <button
                        onClick={() =>
                          setShowSources((p) => ({ ...p, [i]: !p[i] }))
                        }
                        className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 font-medium"
                      >
                        <span>{m.sources.length} sources</span>
                        <ChevronDown
                          className={`w-3 h-3 transition ${showSources[i] ? "rotate-180" : ""
                            }`}
                        />
                      </button>
                      {showSources[i] && (
                        <div className="mt-2 space-y-2">
                          {m.sources.map((s, idx) => (
                            <div
                              key={idx}
                              className={`text-xs rounded-lg p-3 ${darkMode
                                ? "bg-gray-800 border border-gray-700"
                                : "bg-green-50 border border-green-200"
                                }`}
                            >
                              <p
                                className={`${darkMode ? "text-gray-300" : "text-gray-700"
                                  } line-clamp-2`}
                              >
                                {s.preview}...
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
              </div>
              {m.role === "user" && (
                <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl flex justify-center items-center flex-shrink-0 shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        <footer
          className={`border-t ${darkMode
            ? "border-gray-700 bg-gray-800/80"
            : "border-green-200 bg-white/80"
            } backdrop-blur-xl p-4 shadow-lg`}
        >
          <div className="max-w-4xl mx-auto">
            {isListening && (
              <div className="mb-3 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <div className="flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-red-600 rounded-full h-4"
                      style={{
                        animation: `pulse 0.8s ease-in-out infinite ${i * 0.1
                          }s`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-sm text-red-600 font-medium">
                  Listening... Speak now
                </span>
              </div>
            )}
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && handleSubmit()
                }
                placeholder="Ask about crops, soil, irrigation..."
                className={`flex-1 border-2 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm ${darkMode
                  ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                  : "bg-white border-green-200"
                  }`}
                disabled={isListening}
              />

              <button
                onClick={toggleVoiceInput}
                className={`px-5 rounded-2xl transition shadow-lg font-medium ${isListening
                  ? "bg-red-600 text-white"
                  : darkMode
                    ? "bg-gray-700 border-2 border-gray-600 text-green-400 hover:bg-gray-600"
                    : "bg-white border-2 border-green-200 text-green-600 hover:bg-green-50"
                  }`}
                title={isListening ? "Stop listening" : "Start voice search"}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 rounded-2xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p
              className={`text-xs text-center ${darkMode ? "text-gray-400" : "text-gray-500"
                } mt-3`}
            >
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </footer>
      </main>

      <style>{`
    ::-webkit-scrollbar {
      width: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: ${darkMode ? "#1f2937" : "#dcfce7"};
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #16a34a;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #15803d;
    }
    
    /* For Firefox */
    * {
      scrollbar-width: thin;
      scrollbar-color: #16a34a ${darkMode ? "#1f2937" : "#dcfce7"};
    }
    
    @keyframes pulse {
      0%, 100% { height: 8px; }
      50% { height: 16px; }
    }
  `}</style>
    </div>
  );
}
