import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Leaf,
  Loader2,
  Plus,
  MessageSquare,
  Menu,
  X,
  Trash2,
  User,
  Bot,
  LogOut,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { authFetch } from "../utils/api";
import { logout } from "../utils/auth";

export default function AgricultureChatbot() {
  const [chatHistory, setChatHistory] = useState([
    { id: "default", title: "New Chat" },
  ]);
  const [currentChatId, setCurrentChatId] = useState("default");
  const [chats, setChats] = useState({});
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, currentChatId]);

  useEffect(() => {
    const loadChat = async () => {
      try {
        const res = await authFetch(`/chat/history/${currentChatId}`);
        const data = await res.json();

        setChats((prev) => ({
          ...prev,
          [currentChatId]:
            data?.messages?.length > 0
              ? data.messages
              : [
                  {
                    role: "assistant",
                    content:
                      "🌱 Hi! I'm your Agriculture Assistant. Ask me anything about farming.",
                  },
                ],
        }));
      } catch {}
    };

    loadChat();
  }, [currentChatId]);

  const updateChatTitleIfNeeded = (message) => {
    setChatHistory((prev) =>
      prev.map((c) =>
        c.id === currentChatId && c.title === "New Chat"
          ? { ...c, title: message.slice(0, 30) }
          : c
      )
    );
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    updateChatTitleIfNeeded(userMessage);

    setChats((prev) => ({
      ...prev,
      [currentChatId]: [
        ...(prev[currentChatId] || []),
        { role: "user", content: userMessage },
      ],
    }));

    setIsLoading(true);

    try {
      const res = await authFetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: currentChatId,
          message: userMessage,
        }),
      });

      const data = await res.json();

      setChats((prev) => ({
        ...prev,
        [currentChatId]: [
          ...(prev[currentChatId] || []),
          {
            role: "assistant",
            content: data.message || "I don't know",
          },
        ],
      }));
    } catch {
      setChats((prev) => ({
        ...prev,
        [currentChatId]: [
          ...(prev[currentChatId] || []),
          { role: "assistant", content: "Server error. Please try again." },
        ],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = () => {
    const id = Date.now().toString();
    setChatHistory((prev) => [{ id, title: "New Chat" }, ...prev]);
    setChats((prev) => ({
      ...prev,
      [id]: [
        {
          role: "assistant",
          content:
            "🌱 Hi! I'm your Agriculture Assistant. Ask me anything about farming.",
        },
      ],
    }));
    setCurrentChatId(id);
    setSidebarOpen(false);
  };

  const deleteChat = (id, e) => {
    e.stopPropagation();
    if (chatHistory.length === 1) return;

    setChatHistory((prev) => prev.filter((c) => c.id !== id));
    setChats((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    if (id === currentChatId) {
      setCurrentChatId(chatHistory.find((c) => c.id !== id)?.id);
    }
  };

  const currentMessages = chats[currentChatId] || [];

  return (
    <div className="flex h-screen bg-gradient-to-br from-green-50 to-white overflow-hidden">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 text-green-700 font-semibold">
            <Leaf className="text-green-600" />
            KisanAi
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden"
            >
              <X />
            </button>
          </div>
          <div className="text-xs text-gray-500 ml-6">
            Agriculture Chat Assistant
          </div>
        </div>

        <div className="p-3">
          <button
            onClick={createNewChat}
            className="w-full bg-green-600 text-white py-2 rounded-lg
            flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              onClick={() => {
                setCurrentChatId(chat.id);
                setSidebarOpen(false);
              }}
              className={`group flex items-center justify-between px-3 py-2 rounded cursor-pointer
              ${
                chat.id === currentChatId ? "bg-green-100" : "hover:bg-green-50"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <MessageSquare className="w-4 h-4 text-green-700" />
                <span className="text-sm truncate">{chat.title}</span>
              </div>

              <Trash2
                onClick={(e) => deleteChat(chat.id, e)}
                className="w-4 h-4 text-green-600 opacity-0 group-hover:opacity-100"
              />
            </div>
          ))}
        </div>

        <div className="p-4 border-t mt-auto">
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className={`flex-1 flex flex-col ${sidebarOpen ? "lg:ml-64" : ""}`}>
        <header className="bg-green-600 text-white p-4 flex items-center gap-3 shadow">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu />
          </button>
          <Leaf />
          <h1 className="font-semibold text-lg">KisanAi</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence>
            {currentMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-end gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-green-700" />
                  </div>
                )}

                <div
                  className={`max-w-xl px-4 py-3 rounded-2xl shadow-sm text-sm ${
                    msg.role === "user"
                      ? "bg-green-600 text-white rounded-br-none"
                      : "bg-white border rounded-bl-none"
                  }`}
                >
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>
                      {typeof msg.content === "string" ? msg.content : ""}
                    </ReactMarkdown>
                  </div>
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <div className="flex gap-2 items-center text-green-600">
              <Loader2 className="animate-spin" /> Thinking…
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <footer className="border-t bg-white p-4 flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Ask about crops, soil, irrigation..."
            className="flex-1 border rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleSubmit}
            disabled={!input || isLoading}
            className="bg-green-600 text-white px-5 rounded-full disabled:opacity-50 shadow"
          >
            <Send />
          </button>
        </footer>
      </main>
    </div>
  );
}
