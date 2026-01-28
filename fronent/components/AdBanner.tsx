
import React, { useEffect } from 'react';
import { cn } from '../utils';

// 你的 AdSense Publisher ID
const AD_CLIENT = 'ca-pub-7916680908337610';

interface AdBannerProps {
  slot?: string;   // data-ad-slot (從 AdSense 後台取得)
  format?: string; // auto
  responsive?: string; // true
  className?: string;
  testMode?: boolean; // Force show placeholder
}

export const AdBanner: React.FC<AdBannerProps> = ({
  slot,
  format = 'auto',
  responsive = 'true',
  className,
  testMode = false
}) => {
  const client = AD_CLIENT;
  useEffect(() => {
    if (client && slot && !testMode) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense Error:", e);
      }
    }
  }, [client, slot, testMode]);

  // Show placeholder if no IDs provided or in test mode
  if (!client || !slot || testMode) {
    return (
      <div className={cn(
        "w-full p-4 my-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-1 select-none transition-all hover:bg-slate-100 hover:border-slate-300", 
        className
      )}>
        <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-200 text-slate-500 px-2 py-0.5 rounded shadow-sm">
            ADVERTISEMENT
        </span>
        <p className="text-xs font-medium mt-1">Google AdSense 廣告將顯示於此處</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full my-2 overflow-hidden text-center min-h-[100px] flex justify-center", className)}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
};
