import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, X, Send, Sparkles, RefreshCw, ChevronDown, User, Bot, Globe } from 'lucide-react';

export default function ChatBot({ activeRole = 'admin', onNavigate }) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Initialize welcome message when language changes
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: t('welcome_msg'),
        source: 'welcome',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [i18n.language]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
  };

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Call backend /api/chat
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language: i18n.language,
          role: activeRole,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: data.reply,
            source: data.source || 'ai-provider',
            navAction: data.navAction,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        throw new Error('API returned error');
      }
    } catch (err) {
      // Robust client-side fallback engine matching requirements
      const fallbackReply = generateFallbackReply(text, i18n.language, activeRole);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: fallbackReply.text,
          source: 'rule-based-fallback',
          navAction: fallbackReply.navAction,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackReply = (query, lang, role) => {
    const lower = query.toLowerCase();

    if (lang === 'hi') {
      if (lower.includes('जनरेशन') || lower.includes('टाइमटेबल') || lower.includes('बन')) {
        return {
          text: 'टाइमटेबल जनरेट करने के लिए "Generate" पेज पर जाएँ और "Generate Clash-Free Timetable" बटन दबाएँ। हमारा सॉल्वर इंजन सभी अध्यापकों और कमरों के क्लैश को स्वतः हल करता है।',
          navAction: { label: 'जनरेट पेज पर जाएँ', page: 'generate' },
        };
      }
      if (lower.includes('विवाद') || lower.includes('conflict') || lower.includes('क्लैश')) {
        return {
          text: 'विवाद (Conflicts) तब होते हैं जब एक ही समय स्लॉट में एक शिक्षक या रूम को दो अलग-अलग कक्षाओं के लिए असाइन कर दिया जाता है। आप History पेज पर कमिट डिफ़ में क्लैश का विश्लेषण कर सकते हैं।',
          navAction: { label: 'हिस्ट्री और डिफ देखें', page: 'history' },
        };
      }
      if (lower.includes('क्लास') || lower.includes('कहाँ') || lower.includes('कमरा')) {
        return {
          text: `आपके ${role} खाते के अनुसार, आपकी अगली निर्धारित कक्षा रूम 102 में "Computer Networks" है (सोमवार, पीरियड 2)।`,
          navAction: { label: 'टाइमटेबल ग्रिड देखें', page: 'timetable' },
        };
      }
      return {
        text: `मैं CampusSprout हूँ! आपके रोल (${role}) के अनुसार मैं टाइमटेबल देखने, जनरेट करने और क्लैश हल करने में मदद कर सकता हूँ। ऊपर दिए गए सुझाव चिप्स पर क्लिक करें!`,
      };
    }

    // English
    if (lower.includes('generate') || lower.includes('create') || lower.includes('how')) {
      return {
        text: 'To generate a clash-free schedule, navigate to the "Generate" page and click "Generate Clash-Free Timetable". The CSP solver optimizes teacher workloads, room allocations, and student batches.',
        navAction: { label: 'Go to Generator', page: 'generate' },
      };
    }
    if (lower.includes('conflict') || lower.includes('clash')) {
      return {
        text: 'Conflicts occur if a teacher or room is double-booked across batches. CampusWeave uses atomic VCS commits to track and validate every slot edit, preventing conflicts before publishing.',
        navAction: { label: 'Inspect Conflicts in History', page: 'history' },
      };
    }
    if (lower.includes('class') || lower.includes('where') || lower.includes('next') || lower.includes('today')) {
      return {
        text: `Based on your ${role} schedule, your next lecture is "Data Structures & Algorithms" in Room 201 (Mon, Period 2).`,
        navAction: { label: 'Open Timetable View', page: 'timetable' },
      };
    }
    return {
      text: `CampusSprout here! As a ${role}, you can explore schedules, run solver generations, or inspect commit histories. Try asking: "How does timetable generation work?" or "Where is my next class?".`,
    };
  };

  const chips = [
    t('chips.0') || 'Show my timetable for today',
    t('chips.1') || 'Where is my next class?',
    t('chips.2') || 'How does timetable generation work?',
    t('chips.3') || 'How can I understand scheduling conflicts?',
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Button with Botanical Leaf Badge */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-3 bg-gradient-to-r from-leaf to-forest hover:from-forest hover:to-deep_forest text-white px-4 py-3.5 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-fresh_mint"
          aria-label="Open CampusSprout Chatbot"
        >
          {/* Sprout SVG Mascot */}
          <div className="w-8 h-8 rounded-full bg-fresh_mint/25 flex items-center justify-center p-1 border border-white/30">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-fresh_mint" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 20h10" />
              <path d="M10 20c0-4.5 1.5-8 5-11-2.5 0-6 1.5-7 5" />
              <path d="M12 20c0-6 2-10 7-14-3 0-8 2-9 7" />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-wide pr-1">CampusSprout AI</span>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sunshine_yellow opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sunshine_yellow"></span>
          </span>
        </button>
      )}

      {/* Expanded Botanical Chat Window */}
      {isOpen && (
        <div className="w-96 max-w-[calc(100vw-2rem)] h-[560px] max-h-[85vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-fresh_mint/60 dark:border-gray-700 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Botanical Header */}
          <div className="bg-gradient-to-r from-deep_forest via-forest to-leaf text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-fresh_mint/20 border border-white/40 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-fresh_mint" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 20h10" />
                  <path d="M10 20c0-4.5 1.5-8 5-11-2.5 0-6 1.5-7 5" />
                  <path d="M12 20c0-6 2-10 7-14-3 0-8 2-9 7" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-wide">CampusSprout</h3>
                  <span className="text-[10px] bg-fresh_mint/25 text-fresh_mint border border-fresh_mint/40 px-1.5 py-0.5 rounded-full font-medium">Multilingual</span>
                </div>
                <p className="text-[11px] text-fresh_mint/90 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-fresh_mint rounded-full"></span>
                  Active Role: <span className="capitalize font-semibold text-white">{activeRole}</span>
                </p>
              </div>
            </div>

            {/* Language Selector & Close */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-black/20 rounded-lg p-0.5 border border-white/20">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`px-2 py-0.5 text-xs rounded font-medium transition ${i18n.language === 'en' ? 'bg-white text-deep_forest shadow-sm' : 'text-white/80 hover:text-white'}`}
                >
                  EN
                </button>
                <button
                  onClick={() => handleLanguageChange('hi')}
                  className={`px-2 py-0.5 text-xs rounded font-medium transition ${i18n.language === 'hi' ? 'bg-white text-deep_forest shadow-sm' : 'text-white/80 hover:text-white'}`}
                >
                  हिन्दी
                </button>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mode Sub-banner */}
          <div className="bg-light_mint/90 dark:bg-gray-800 text-deep_forest dark:text-fresh_mint text-[11px] px-3 py-1 border-b border-fresh_mint/40 flex items-center justify-between">
            <span className="truncate">{t('basic_mode')}</span>
            <button
              onClick={() => setMessages([messages[0]])}
              title="Clear Chat"
              className="hover:text-forest flex items-center gap-1 font-medium text-[10px]"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-botanical_cream/40 dark:bg-gray-950">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-forest to-leaf text-white rounded-br-none'
                      : 'bg-white dark:bg-gray-800 text-deep_forest dark:text-gray-100 border border-fresh_mint/60 dark:border-gray-700 rounded-bl-none'
                  }`}
                >
                  <p>{m.text}</p>
                  {m.navAction && onNavigate && (
                    <button
                      onClick={() => onNavigate(m.navAction.page)}
                      className="mt-2 inline-flex items-center gap-1.5 bg-fresh_mint hover:bg-leaf text-forest hover:text-white font-medium text-[11px] px-2.5 py-1 rounded-md transition shadow-xs"
                    >
                      <span>→</span> {m.navAction.label}
                    </button>
                  )}
                </div>
                <span className="text-[9px] text-gray-400 mt-0.5 px-1">{m.time}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-forest dark:text-fresh_mint bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-fresh_mint/40 w-fit">
                <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full"></span>
                <span>Thinking in {i18n.language === 'hi' ? 'हिन्दी' : 'English'}...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="p-2.5 bg-white dark:bg-gray-900 border-t border-fresh_mint/40 dark:border-gray-800">
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              {chips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  className="whitespace-nowrap bg-light_mint dark:bg-gray-800 text-forest dark:text-fresh_mint hover:bg-fresh_mint/60 border border-fresh_mint/60 px-2.5 py-1 rounded-full font-medium transition"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Input & Send Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white dark:bg-gray-900 border-t border-fresh_mint/40 dark:border-gray-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chat_placeholder')}
              className="flex-1 bg-botanical_cream/70 dark:bg-gray-800 text-deep_forest dark:text-gray-100 text-xs px-3.5 py-2.5 rounded-xl border border-fresh_mint/60 focus:outline-none focus:ring-2 focus:ring-leaf placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-leaf hover:bg-forest disabled:opacity-50 text-white p-2.5 rounded-xl transition shadow-md focus:outline-none"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
