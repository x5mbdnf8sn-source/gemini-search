/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Search, Loader2, ExternalLink, Globe, Sparkles } from "lucide-react";
import { useState, useEffect, useRef, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface SearchResult {
  title: string;
  uri: string;
}

export default function App() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setHasSearched(true);
    setAnswer(null);
    setSources([]);

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      setAnswer(response.text || "No answer found.");
      
      // Extract grounding sources
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const extractedSources = chunks
          .filter(chunk => chunk.web)
          .map(chunk => ({
            title: chunk.web?.title || "Source",
            uri: chunk.web?.uri || "",
          }));
        setSources(extractedSources);
      }
    } catch (error) {
      console.error("Search error:", error);
      setAnswer("An error occurred while searching. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#202124] font-sans selection:bg-blue-100">
      {/* Header / Search Bar Section */}
      <header className={`transition-all duration-500 ease-in-out flex flex-col items-center justify-center ${hasSearched ? 'pt-8 pb-4 border-b bg-white sticky top-0 z-10' : 'h-screen'}`}>
        <motion.div 
          layout
          className={`flex flex-col items-center w-full max-w-2xl px-4 ${hasSearched ? 'flex-row gap-8 max-w-7xl' : ''}`}
        >
          <motion.div 
            layout
            className={`flex items-center gap-2 mb-8 ${hasSearched ? 'mb-0 shrink-0' : ''}`}
          >
            <div className="bg-blue-600 p-2 rounded-lg">
              <Sparkles className="text-white w-8 h-8" />
            </div>
            <h1 className={`text-3xl font-bold tracking-tight text-blue-600 ${hasSearched ? 'hidden md:block' : ''}`}>
              Gemini Search
            </h1>
          </motion.div>

          <form 
            onSubmit={handleSearch}
            className={`relative w-full group ${hasSearched ? 'max-w-2xl' : ''}`}
          >
            <div className={`flex items-center bg-white border border-gray-200 rounded-full hover:shadow-md focus-within:shadow-md transition-shadow duration-200 px-5 py-3 ${isSearching ? 'opacity-80' : ''}`}>
              <Search className="text-gray-400 w-5 h-5 mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the web with AI..."
                className="flex-1 bg-transparent outline-none text-lg"
                disabled={isSearching}
              />
              {isSearching && (
                <Loader2 className="animate-spin text-blue-600 w-5 h-5 ml-2" />
              )}
            </div>
          </form>
        </motion.div>
      </header>

      {/* Results Section */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {hasSearched && !isSearching && answer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* AI Answer Card */}
              <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-blue-600 font-semibold uppercase tracking-wider text-xs">
                  <Sparkles className="w-4 h-4" />
                  AI Overview
                </div>
                <div className="prose prose-blue max-w-none text-lg leading-relaxed text-gray-800">
                  {answer.split('\n').map((line, i) => (
                    <p key={i} className="mb-4 last:mb-0">{line}</p>
                  ))}
                </div>
              </section>

              {/* Sources Section */}
              {sources.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Sources
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sources.map((source, index) => (
                      <a
                        key={index}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all duration-200"
                      >
                        <span className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          {new URL(source.uri).hostname}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                        <span className="font-medium text-blue-600 group-hover:underline line-clamp-1">
                          {source.title}
                        </span>
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          )}

          {isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 space-y-4"
            >
              <div className="flex gap-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                  className="w-2 h-2 bg-blue-600 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                  className="w-2 h-2 bg-red-500 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                  className="w-2 h-2 bg-yellow-500 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.6 }}
                  className="w-2 h-2 bg-green-500 rounded-full"
                />
              </div>
              <p className="text-gray-500 font-medium animate-pulse">Consulting the web...</p>
            </motion.div>
          )}

          {!hasSearched && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center text-center space-y-6 mt-12"
            >
              <p className="text-gray-500 max-w-md">
                Ask anything. Gemini will search the web and provide a cited overview of the results.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {["Latest tech news", "Weather in Tokyo", "Best pasta recipes", "How do black holes work?"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setQuery(suggestion);
                      // We can't trigger handleSearch directly because query state hasn't updated yet
                      // but we can pass it
                    }}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      {!isSearching && (
        <footer className="mt-auto py-8 text-center text-xs text-gray-400">
          <p>Powered by Gemini 3 Flash with Google Search Grounding</p>
        </footer>
      )}
    </div>
  );
}
