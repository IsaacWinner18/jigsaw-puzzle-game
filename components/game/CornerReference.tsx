'use client';

import React, { useState } from 'react';
import { Maximize2, Minimize2, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CornerReferenceProps {
  ghostImageUrl: string | null;
  title: string;
  isLevel5Plus: boolean;
  isComplete: boolean;
}

export const CornerReference: React.FC<CornerReferenceProps> = ({
  ghostImageUrl,
  title,
  isLevel5Plus,
  isComplete,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (!ghostImageUrl || isComplete) return null;

  return (
    <>
      {/* Floating Corner Reference: Desktop preview card, Mobile compact icon button */}
      <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-20 select-none animate-fade-in">
        {/* Mobile Mini Pill */}
        <button
          onClick={() => setIsExpanded(true)}
          className="sm:hidden flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/95 border border-amber-400/60 rounded-xl shadow-lg backdrop-blur-md text-amber-400 text-xs font-poppins font-medium cursor-pointer active:scale-95"
          title="View Original Artwork Reference"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Reference</span>
        </button>

        {/* Desktop Card Preview */}
        <div
          onClick={() => setIsExpanded(true)}
          className={`hidden sm:block group relative cursor-pointer rounded-2xl bg-slate-900/90 border-2 transition-all duration-300 shadow-xl backdrop-blur-md overflow-hidden ${
            isLevel5Plus
              ? 'border-amber-400/80 hover:border-amber-300 shadow-amber-500/10 hover:shadow-amber-500/20'
              : 'border-slate-700/80 hover:border-slate-500'
          }`}
          title="Click to enlarge original reference image"
        >
          {/* Thumbnail preview */}
          <div className="relative w-28 h-20 sm:w-36 sm:h-24 bg-slate-950 overflow-hidden">
            <img
              src={ghostImageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Hover overlay with Maximize icon */}
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="bg-slate-900/90 rounded-full p-1.5 text-amber-400 shadow-md">
                <Maximize2 className="w-4 h-4" />
              </div>
            </div>

            {/* Level 5+ Guide Badge */}
            {isLevel5Plus && (
              <div className="absolute top-1 left-1">
                <Badge variant="amber" className="text-[9px] uppercase tracking-wider font-anton">
                  Blank Board
                </Badge>
              </div>
            )}
          </div>

          {/* Bottom Bar Info */}
          <div className="px-2.5 py-1.5 bg-slate-900 flex items-center justify-between text-[10px] text-slate-300 font-poppins">
            <span className="truncate max-w-[85px] sm:max-w-[105px] font-medium">{title}</span>
            <span className="text-amber-400 font-semibold flex items-center gap-0.5">
              <Maximize2 className="w-2.5 h-2.5" /> Enlarge
            </span>
          </div>
        </div>
      </div>

      {/* High-Res Reference Modal Overlay powered by Radix Dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-slate-900 border-slate-700">
          <DialogHeader className="p-4 px-5 border-b border-slate-800 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <DialogTitle className="text-sm font-bold text-white truncate max-w-sm">
                {title} 
              </DialogTitle>
              <DialogDescription className="sr-only">
                Original artwork reference image for jigsaw assembly
              </DialogDescription>
            </div>
            
          </DialogHeader>

          <div className="relative aspect-[4/3] w-full bg-slate-950 flex items-center justify-center p-2">
            <img
              src={ghostImageUrl}
              alt={title}
              className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-inner"
            />
          </div>

         
        </DialogContent>
      </Dialog>
    </>
  );
};
