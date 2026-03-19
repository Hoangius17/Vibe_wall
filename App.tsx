import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Image as ImageIcon, Download, RefreshCw, Settings, X, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ASPECT_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9'];

const PLACEHOLDER_WALLPAPERS = [
  { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop', vibe: 'Abstract Silk' },
  { url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000&auto=format&fit=crop', vibe: 'Pastel Gradient' },
  { url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop', vibe: 'Cyberpunk Neon' },
  { url: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=1000&auto=format&fit=crop', vibe: 'Minimalist Flow' },
];

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [images, setImages] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImages = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const promises = Array.from({ length: 4 }).map(async (_, i) => {
        const parts: any[] = [];
        if (referenceImage) {
          const [prefix, base64] = referenceImage.split(',');
          const mimeType = prefix.match(/:(.*?);/)?.[1] || 'image/png';
          parts.push({
            inlineData: {
              data: base64,
              mimeType
            }
          });
        }
        parts.push({ text: `${prompt}. High quality wallpaper. Variation ${i + 1}` });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts },
          config: {
            imageConfig: {
              aspectRatio
            }
          }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
        throw new Error("No image generated in response");
      });

      const results = await Promise.all(promises);
      setImages(prev => [...results, ...prev]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "Failed to generate images.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibewall-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRemix = (url: string) => {
    setReferenceImage(url);
    setSelectedImage(null);
    const inputElement = document.getElementById('vibe-input-field');
    inputElement?.focus();
    inputElement?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[140px] rounded-full" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 py-6 flex items-center justify-between bg-black/20 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">VibeWall</h1>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2.5 rounded-full transition-all ${showSettings ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-48">
        {/* 1. Gallery of Wallpapers */}
        <section className="mb-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Gallery</h2>
              <p className="text-white/40 text-sm">Explore your generated vibes and trending styles.</p>
            </div>
            {images.length > 0 && (
              <button 
                onClick={() => setImages([])}
                className="text-xs font-semibold text-white/40 hover:text-white transition-colors uppercase tracking-widest"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Generated Images */}
            {images.map((img, idx) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                key={`gen-${idx}`}
                className="relative aspect-[9/16] rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 cursor-pointer group shadow-2xl"
                onClick={() => setSelectedImage(img)}
              >
                <img 
                  src={img} 
                  alt={`Generated variation ${idx + 1}`} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-6">
                  <div className="w-full">
                    <p className="text-xs font-medium text-white/60 mb-1">Generated Vibe</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">View Detail</span>
                      <ChevronRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Placeholder / Trending Images */}
            {PLACEHOLDER_WALLPAPERS.map((item, idx) => (
              <div
                key={`placeholder-${idx}`}
                className="relative aspect-[9/16] rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 cursor-pointer group shadow-xl opacity-60 hover:opacity-100 transition-all"
                onClick={() => setSelectedImage(item.url)}
              >
                <img 
                  src={item.url} 
                  alt={item.vibe} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Trending</p>
                    <p className="text-sm font-bold text-white/80">{item.vibe}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. CTA Section */}
        <section className="flex flex-col items-center justify-center mb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-blue-400 uppercase tracking-widest mb-6">
            <Sparkles className="w-3 h-3" />
            AI Powered Creativity
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 max-w-2xl">
            Transform your screen with a unique <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">visual vibe.</span>
          </h2>
          <button 
            onClick={() => document.getElementById('vibe-input-field')?.focus()}
            className="group relative px-8 py-4 bg-white text-black font-bold rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Generating <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        </section>

        {/* 3. Input Area */}
        <section id="vibe-input" className="fixed bottom-8 left-6 right-6 z-30 max-w-2xl mx-auto">
          <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-3 shadow-2xl">
            {referenceImage && (
              <div className="absolute -top-16 left-4 flex items-center gap-2 bg-white/10 backdrop-blur-xl p-1.5 rounded-2xl border border-white/20 animate-in fade-in slide-in-from-bottom-4">
                <img src={referenceImage} alt="Ref" className="w-8 h-8 object-cover rounded-xl" />
                <span className="text-[10px] font-bold uppercase tracking-widest pr-2">Remix Mode</span>
                <button onClick={() => setReferenceImage(null)} className="p-1 hover:bg-white/10 rounded-full">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  id="vibe-input-field"
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your desired vibe..."
                  className="w-full bg-transparent border-none px-5 py-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-0 text-lg font-medium"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') generateImages();
                  }}
                />
              </div>
              <button
                onClick={generateImages}
                disabled={generating || !prompt.trim()}
                className="flex items-center justify-center w-14 h-14 bg-white text-black rounded-full hover:bg-blue-50 disabled:opacity-30 transition-all shadow-xl"
              >
                {generating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
              </button>
            </div>

            {/* Settings Overlay */}
            <AnimatePresence>
              {showSettings && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-full mb-4 left-0 right-0 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">Configuration</h3>
                    <button onClick={() => setShowSettings(false)}><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Aspect Ratio</label>
                      <div className="flex flex-wrap gap-2">
                        {ASPECT_RATIOS.map(ar => (
                          <button
                            key={ar}
                            onClick={() => setAspectRatio(ar)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${aspectRatio === ar ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                          >
                            {ar}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {error && (
            <div className="absolute -top-12 left-0 right-0 text-center">
              <span className="bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full">
                {error}
              </span>
            </div>
          )}
        </section>
      </main>

      {/* Full Screen Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-3xl flex flex-col"
          >
            <div className="flex justify-between items-center p-6">
              <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Wallpaper Preview</div>
              <button 
                onClick={() => setSelectedImage(null)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden flex items-center justify-center p-8">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative max-w-full max-h-full aspect-[9/16] shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden border border-white/10"
              >
                <img 
                  src={selectedImage} 
                  alt="Full screen preview" 
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>
            
            <div className="p-8 pb-12 flex gap-4 justify-center">
              <button 
                onClick={() => handleDownload(selectedImage)}
                className="flex-1 max-w-[200px] py-5 px-8 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl"
              >
                <Download className="w-5 h-5" />
                Save
              </button>
              <button 
                onClick={() => handleRemix(selectedImage)}
                className="flex-1 max-w-[200px] py-5 px-8 bg-white/10 border border-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-white/20 transition-all backdrop-blur-xl"
              >
                <RefreshCw className="w-5 h-5" />
                Remix
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
