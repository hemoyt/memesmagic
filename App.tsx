import React, { useState, useCallback, useMemo } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { TemplateSelector } from './components/TemplateSelector';
import { MemeCanvas } from './components/MemeCanvas';
import { CaptionSuggestions } from './components/CaptionSuggestions';
import { ImageEditor } from './components/ImageEditor';
import { AdPlaceholder } from './components/AdPlaceholder';
import { CaptionStyleSelector, CAPTION_STYLES } from './components/CaptionStyleSelector';
import { TextControls, TextSettings } from './components/TextControls';
import { generateCaptions, generateSingleCaption, editImageWithGemini } from './services/geminiService';
import { MemeFeed, MemePost } from './components/MemeFeed';
import type { Template } from './types';
import { LogoIcon, MagicWandIcon, EditIcon, DownloadIcon, ShareIcon, HomeIcon, GlobeIcon } from './components/icons';

/**
 * Draws word-wrapped text on a canvas context.
 * Anchors the bottom of the entire text block to the provided Y coordinate.
 */
const drawWrappedText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  strokeColor: string,
  textColor: string
) => {
  const words = text.split(' '); 
  
  let line = '';
  const lines = [];

  // Create lines with word wrapping
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());

  // Calculate starting Y position to anchor the text block at the bottom
  const totalTextHeight = (lines.length - 1) * lineHeight;
  let currentY = y - totalTextHeight;

  // Draw each line
  ctx.fillStyle = textColor;
  ctx.strokeStyle = strokeColor;
  
  for (const l of lines) {
    ctx.strokeText(l, x, currentY);
    ctx.fillText(l, x, currentY);
    currentY += lineHeight;
  }
};

// Solid color logo SVG for canvas use to avoid gradient issues
const WATERMARK_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#d946ef"/><path d="M12 17.5C10.03 17.5 8.35 16.44 7.5 14.85C7.3 14.45 7.63 14 8.06 14H15.94C16.37 14 16.7 14.45 16.5 14.85C15.65 16.44 13.97 17.5 12 17.5Z" fill="#d946ef"/><circle cx="9" cy="10.5" r="1.5" fill="#d946ef"/><circle cx="15" cy="10.5" r="1.5" fill="#d946ef"/></svg>`;

// Mock data for the feed
const INITIAL_POSTS: MemePost[] = [
    { id: '1', imageUrl: 'https://picsum.photos/id/102/600/600', likes: 1205, views: 5403, timestamp: Date.now() - 3600000, isLiked: false },
    { id: '2', imageUrl: 'https://picsum.photos/id/237/600/600', likes: 856, views: 2300, timestamp: Date.now() - 7200000, isLiked: true },
    { id: '3', imageUrl: 'https://picsum.photos/id/1084/600/600', likes: 234, views: 1102, timestamp: Date.now() - 120000, isLiked: false },
];

type View = 'create' | 'feed';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('create');
  const [feedPosts, setFeedPosts] = useState<MemePost[]>(INITIAL_POSTS);

  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [templateImage, setTemplateImage] = useState<string | null>(null);
  const [captions, setCaptions] = useState<string[]>([]);
  const [selectedCaption, setSelectedCaption] = useState<string | null>(null);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [captionStyleId, setCaptionStyleId] = useState<string>(CAPTION_STYLES[0].id);
  const [isLoading, setIsLoading] = useState({ captions: false, editing: false, publishing: false });
  const [loadingCaptionIndices, setLoadingCaptionIndices] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isWatermarkRemoved, setIsWatermarkRemoved] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  
  const [textSettings, setTextSettings] = useState<TextSettings>({
    fontFamily: 'Impact',
    fontSizeMultiplier: 1,
    textColor: '#FFFFFF',
    strokeColor: '#000000'
  });

  const handleImageUpload = (file: File) => {
    setOriginalImage(file);
    setTemplateImage(null);
    resetState();
  };

  const handleTemplateSelect = (template: Template) => {
    setTemplateImage(template.url);
    setOriginalImage(null);
    resetState();
  };
  
  const resetState = () => {
    setCaptions([]);
    setSelectedCaption(null);
    setEditedImageUrl(null);
    setError(null);
    setNotification(null);
    setIsWatermarkRemoved(false);
  };

  const currentImageSource = useMemo(() => {
    if (editedImageUrl) return editedImageUrl;
    if (originalImage) return URL.createObjectURL(originalImage);
    if (templateImage) return templateImage;
    return null;
  }, [editedImageUrl, originalImage, templateImage]);

  const getBase64FromSrc = async (src: string): Promise<string> => {
    const response = await fetch(src);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const getImageData = async (): Promise<string> => {
    let imageDataSource: File | string | null = originalImage || templateImage;
    if (!imageDataSource) throw new Error("No image selected");

    if (typeof imageDataSource === 'string') {
      return await getBase64FromSrc(imageDataSource);
    } else {
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(imageDataSource);
      });
    }
  };

  const handleGenerateCaptions = useCallback(async () => {
    if (!originalImage && !templateImage) {
      setError("Please upload an image or select a template first.");
      return;
    }

    setIsLoading(prev => ({ ...prev, captions: true }));
    setError(null);
    // Don't clear captions if we are regenerating, just maybe deselect if the selected one is gone (but here we replace all)
    setCaptions([]);
    setSelectedCaption(null);

    try {
      const base64Data = await getImageData();
      const stylePrompt = CAPTION_STYLES.find(s => s.id === captionStyleId)?.prompt || 'funny and witty';
      const generated = await generateCaptions(base64Data, stylePrompt);
      setCaptions(generated);
    } catch (err) {
      console.error(err);
      setError("Failed to generate captions. Please try again.");
    } finally {
      setIsLoading(prev => ({ ...prev, captions: false }));
    }
  }, [originalImage, templateImage, captionStyleId]);

  const handleRegenerateSingleCaption = useCallback(async (index: number) => {
    if (!originalImage && !templateImage) return;
    
    setLoadingCaptionIndices(prev => [...prev, index]);
    
    try {
      const base64Data = await getImageData();
      const stylePrompt = CAPTION_STYLES.find(s => s.id === captionStyleId)?.prompt || 'funny and witty';
      const newCaption = await generateSingleCaption(base64Data, stylePrompt);
      
      setCaptions(prev => {
        const newCaptions = [...prev];
        newCaptions[index] = newCaption;
        return newCaptions;
      });

      // If the regenerated caption was currently selected, update the selection
      if (selectedCaption === captions[index]) {
        setSelectedCaption(newCaption);
      }

    } catch (err) {
      console.error("Failed to regenerate single caption", err);
      setError("Could not regenerate specific caption.");
    } finally {
      setLoadingCaptionIndices(prev => prev.filter(i => i !== index));
    }
  }, [originalImage, templateImage, captionStyleId, captions, selectedCaption]);

  const handleEditImage = useCallback(async (prompt: string) => {
    let imageDataSource: File | string | null = originalImage || templateImage;
    if (!imageDataSource) {
      setError("Cannot edit: No base image selected.");
      return;
    }
    
    setIsLoading(prev => ({ ...prev, editing: true }));
    setError(null);

    try {
      const base64Data = await getImageData();
      const newImageBase64 = await editImageWithGemini(base64Data, prompt);
      setEditedImageUrl(`data:image/png;base64,${newImageBase64}`);
    } catch (err) {
      console.error(err);
      setError("Failed to edit the image. Please try again.");
    } finally {
      setIsLoading(prev => ({ ...prev, editing: false }));
    }
  }, [originalImage, templateImage]);

  const handleWatchAd = () => {
    setIsWatchingAd(true);
    // Simulate ad duration
    setTimeout(() => {
      setIsWatchingAd(false);
      setIsWatermarkRemoved(true);
      setNotification("Watermark removed! Thanks for supporting us.");
      setTimeout(() => setNotification(null), 3000);
    }, 3000);
  };

  const generateMemeCanvas = useCallback(async (): Promise<HTMLCanvasElement> => {
    if (!currentImageSource) {
      throw new Error("No image source available");
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error("Could not create canvas context");
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    return new Promise((resolve, reject) => {
      img.onload = async () => {
        const MAX_WIDTH = 1200;
        const scale = img.naturalWidth > MAX_WIDTH ? MAX_WIDTH / img.naturalWidth : 1;
        canvas.width = img.naturalWidth * scale;
        canvas.height = img.naturalHeight * scale;

        // 1. Draw main image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 2. Draw Caption
        if (selectedCaption) {
          const baseFontSize = canvas.width / 12;
          const fontSize = Math.floor(baseFontSize * textSettings.fontSizeMultiplier);
          const lineHeight = fontSize * 1.1;
          
          ctx.font = `bold ${fontSize}px '${textSettings.fontFamily}', sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.lineWidth = Math.max(2, Math.floor(fontSize / 15));
          
          const x = canvas.width / 2;
          const y = canvas.height - (canvas.height * 0.05);
          const maxWidth = canvas.width * 0.9;
          
          drawWrappedText(
            ctx, 
            selectedCaption, 
            x, 
            y, 
            maxWidth, 
            lineHeight, 
            textSettings.strokeColor, 
            textSettings.textColor
          );
        }

        // 3. Draw Watermark (only if not removed)
        if (!isWatermarkRemoved) {
          try {
              const logoImg = new Image();
              await new Promise<void>((resolveLogo) => {
                  logoImg.onload = () => resolveLogo();
                  logoImg.onerror = () => resolveLogo(); // proceed even if logo fails
                  logoImg.src = `data:image/svg+xml;base64,${btoa(WATERMARK_LOGO_SVG)}`;
              });

              const wmSize = Math.max(24, canvas.width * 0.05);
              const wmPadding = Math.max(12, canvas.width * 0.02);
              const wmX = canvas.width - wmSize - wmPadding;
              const wmY = canvas.height - wmSize - wmPadding;

              ctx.save();
              ctx.globalAlpha = 0.6; // Semi-transparent
              
              // Draw Logo Icon
              ctx.drawImage(logoImg, wmX, wmY, wmSize, wmSize);

              // Draw Watermark Text
              const wmFontSize = wmSize * 0.5;
              ctx.font = `bold ${wmFontSize}px sans-serif`;
              ctx.fillStyle = 'white';
              ctx.textAlign = 'right';
              ctx.textBaseline = 'middle';
              // Add text shadow for visibility on bright backgrounds
              ctx.shadowColor = 'rgba(0,0,0,0.7)';
              ctx.shadowBlur = 3;
              ctx.shadowOffsetX = 1;
              ctx.shadowOffsetY = 1;
              
              ctx.fillText('Meme Magic', wmX - (wmPadding / 2), wmY + (wmSize / 2));
              
              ctx.restore();
          } catch (e) {
              console.warn("Could not draw watermark", e);
          }
        }

        resolve(canvas);
      };

      img.onerror = () => {
        reject(new Error("Failed to load image. Cross-origin issues may be preventing loading."));
      };
      
      img.src = currentImageSource;
    });
  }, [currentImageSource, selectedCaption, textSettings, isWatermarkRemoved]);

  const handleDownload = useCallback(async () => {
    try {
      const canvas = await generateMemeCanvas();
      const link = document.createElement('a');
      link.download = 'meme-magic.png';
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      setError("Failed to download image.");
    }
  }, [generateMemeCanvas]);

  const handleShare = useCallback(async () => {
    setError(null);
    setNotification(null);
    try {
      const canvas = await generateMemeCanvas();
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setError("Failed to create image blob.");
          return;
        }

        const file = new File([blob], 'meme.png', { type: 'image/png' });
        const shareData = {
          files: [file],
          title: 'Meme Magic',
          text: 'Check out this meme I generated with Meme Magic!',
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
          } catch (err) {
            if ((err as Error).name !== 'AbortError') {
              console.error("Share failed:", err);
              try {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                setNotification("Sharing failed, but image was copied to clipboard!");
                setTimeout(() => setNotification(null), 3000);
              } catch {
                setError("Failed to share.");
              }
            }
          }
        } else {
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            setNotification("Image copied to clipboard!");
            setTimeout(() => setNotification(null), 3000);
          } catch (err) {
            console.error(err);
            setError("Sharing not supported. Please download the image.");
          }
        }
      }, 'image/png');
    } catch (err) {
      console.error(err);
      setError("Failed to prepare share.");
    }
  }, [generateMemeCanvas]);

  const handlePublishToFeed = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, publishing: true }));
    try {
      const canvas = await generateMemeCanvas();
      const dataUrl = canvas.toDataURL('image/png');
      
      const newPost: MemePost = {
        id: Date.now().toString(),
        imageUrl: dataUrl,
        likes: 0,
        views: Math.floor(Math.random() * 500) + 50, // Start with some fake "initial exposure" views
        timestamp: Date.now(),
        isLiked: false
      };

      setFeedPosts(prev => [newPost, ...prev]);
      setCurrentView('feed');
      setNotification("Meme published to the community!");
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to publish meme.");
    } finally {
      setIsLoading(prev => ({ ...prev, publishing: false }));
    }
  }, [generateMemeCanvas]);

  const handleLike = (id: string) => {
    setFeedPosts(prev => prev.map(post => {
      if (post.id === id) {
        return {
          ...post,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          isLiked: !post.isLiked
        };
      }
      return post;
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8 relative">
      {/* Ad Overlay */}
      {isWatchingAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Advertisement">
          <div className="text-center w-full max-w-md p-8 bg-gray-800 rounded-2xl border border-purple-500 shadow-2xl relative overflow-hidden mx-4">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-700">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-full origin-left animate-[scale-x_3s_linear_forwards]" 
                style={{ animationName: 'slideRight', animationDuration: '3s', animationTimingFunction: 'linear', animationFillMode: 'forwards' }}
              />
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes slideRight {
                  from { transform: scaleX(0); }
                  to { transform: scaleX(1); }
                }
              `}} />
            </div>
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 bg-gray-700 px-2 py-1 rounded">Advertisement</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">Amazing Product</h3>
            <p className="text-gray-400 mb-6">This is a simulated ad. In a real app, a video would play here.</p>
            <div className="w-full aspect-video bg-gray-900 flex flex-col items-center justify-center mb-6 rounded-lg border border-gray-700 shadow-inner">
               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-3"></div>
               <p className="text-purple-400 font-mono text-sm animate-pulse">Loading Reward...</p>
            </div>
            <p className="text-gray-300 text-sm">Removing watermark in 3 seconds...</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col items-center justify-center mb-10 gap-6 pt-8 w-full" role="banner">
          <div className="flex flex-col items-center text-center w-full">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-3">
              <LogoIcon className="w-12 h-12 sm:w-16 sm:h-16" />
              <h1 className="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 drop-shadow-lg text-center">
                Meme Magic
              </h1>
            </div>
            <p className="text-gray-300 text-lg sm:text-xl max-w-2xl leading-relaxed text-center mx-auto">
              The ultimate <span className="text-purple-400 font-semibold">AI-Powered</span> Meme Generator & Community.
              <br className="hidden sm:block" />
              Create, Edit, and Laugh in seconds.
            </p>
          </div>
          
          <nav className="flex p-1.5 bg-gray-800/80 backdrop-blur-md rounded-2xl border border-gray-700 shadow-2xl transform hover:scale-105 transition-transform duration-300" role="navigation" aria-label="Main Navigation">
             <button 
                onClick={() => setCurrentView('create')}
                aria-current={currentView === 'create' ? 'page' : undefined}
                aria-label="Go to Create Page"
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-bold ${currentView === 'create' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
             >
                <HomeIcon />
                <span>Create</span>
             </button>
             <button 
                onClick={() => setCurrentView('feed')}
                aria-current={currentView === 'feed' ? 'page' : undefined}
                aria-label="Go to Community Feed"
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-bold ${currentView === 'feed' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
             >
                <GlobeIcon />
                <span>Community</span>
             </button>
          </nav>
        </header>

        {/* Top Ad Placement */}
        <AdPlaceholder className="w-full h-32 mb-8" text="Leaderboard Banner (728x90)" />

        {currentView === 'feed' ? (
            <main role="main">
                <MemeFeed posts={feedPosts} onLike={handleLike} />
                <AdPlaceholder className="w-full h-32 mt-8" text="Feed Banner (728x90)" />
            </main>
        ) : (
            <main className="grid grid-cols-1 lg:grid-cols-2 gap-8" role="main">
            {/* Left Column: Controls */}
            <div className="flex flex-col space-y-8">
                <section aria-label="Image Selection">
                <h2 className="text-2xl font-semibold mb-4 border-b-2 border-purple-500 pb-2">1. Choose Your Canvas</h2>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <ImageUploader onImageUpload={handleImageUpload} />
                    <div className="my-6 text-center text-gray-400">OR</div>
                    <TemplateSelector onSelect={handleTemplateSelect} />
                </div>
                </section>

                {currentImageSource && (
                <section aria-label="Caption Generation">
                    <h2 className="text-2xl font-semibold mb-4 border-b-2 border-purple-500 pb-2">2. Generate Captions</h2>
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <CaptionStyleSelector 
                        selectedStyleId={captionStyleId} 
                        onSelect={setCaptionStyleId} 
                    />
                    <button
                        onClick={handleGenerateCaptions}
                        disabled={isLoading.captions}
                        aria-label={captions.length > 0 ? 'Refresh All Captions' : 'Generate Magic Caption'}
                        className="w-full flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
                    >
                        {isLoading.captions ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                        <MagicWandIcon />
                        )}
                        <span>{isLoading.captions ? 'Conjuring...' : (captions.length > 0 ? 'Refresh All Captions' : 'Magic Caption')}</span>
                    </button>
                    <CaptionSuggestions
                        captions={captions}
                        onSelect={setSelectedCaption}
                        onRegenerate={handleRegenerateSingleCaption}
                        isLoading={isLoading.captions}
                        loadingIndices={loadingCaptionIndices}
                    />
                    </div>
                </section>
                )}
                
                {selectedCaption && currentImageSource && (
                <section aria-label="AI Image Editing">
                    <h2 className="text-2xl font-semibold mb-4 border-b-2 border-purple-500 pb-2">3. Edit with AI</h2>
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <ImageEditor onEdit={handleEditImage} isLoading={isLoading.editing} />
                    </div>
                </section>
                )}
            </div>

            {/* Right Column: Meme Preview */}
            <div className="sticky top-8 self-start">
                <section aria-label="Meme Preview and Export">
                <h2 className="text-2xl font-semibold mb-4 border-b-2 border-pink-500 pb-2">Your Masterpiece</h2>
                <div className="bg-gray-800 p-4 rounded-lg shadow-lg mb-4">
                    <div className="aspect-square flex items-center justify-center mb-4" role="img" aria-label="Meme Preview">
                        {currentImageSource ? (
                            <MemeCanvas 
                                imageUrl={currentImageSource} 
                                caption={selectedCaption} 
                                textSettings={textSettings}
                                showWatermark={!isWatermarkRemoved}
                            />
                        ) : (
                            <div className="text-center text-gray-400 flex flex-col items-center">
                            <EditIcon />
                            <p className="mt-2">Your meme will appear here</p>
                            </div>
                        )}
                    </div>

                    {currentImageSource && (
                        <TextControls settings={textSettings} onChange={setTextSettings} />
                    )}
                </div>

                {currentImageSource && (
                    <div className="space-y-3">
                        {/* Watermark Removal Button */}
                        {!isWatermarkRemoved && (
                            <button
                                onClick={handleWatchAd}
                                aria-label="Watch Ad to Remove Watermark"
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition-all shadow-lg transform hover:-translate-y-0.5"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <span>Watch Ad to Remove Watermark</span>
                            </button>
                        )}
                        
                        <button
                            onClick={handlePublishToFeed}
                            disabled={isLoading.publishing}
                            aria-label="Post meme to community feed"
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg"
                        >
                            {isLoading.publishing ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <GlobeIcon />
                            )}
                            <span>Post to Community</span>
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleShare}
                                aria-label="Share meme"
                                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
                            >
                                <ShareIcon />
                                <span>Share</span>
                            </button>
                            <button
                                onClick={handleDownload}
                                aria-label="Download meme"
                                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
                            >
                                <DownloadIcon />
                                <span>Download</span>
                            </button>
                        </div>
                    </div>
                )}
                {notification && (
                    <div className="mt-4 bg-blue-800/50 border border-blue-600 text-blue-200 p-3 rounded-lg text-center animate-pulse" role="alert">
                        {notification}
                    </div>
                )}
                {error && <div className="mt-4 bg-red-800/50 border border-red-600 text-red-300 p-3 rounded-lg" role="alert">{error}</div>}
                </section>

                {/* Sidebar Ad Placement */}
                <AdPlaceholder className="w-full h-72 mt-8" text="Medium Rectangle (300x250)" />
            </div>
            </main>
        )}
      </div>
    </div>
  );
}