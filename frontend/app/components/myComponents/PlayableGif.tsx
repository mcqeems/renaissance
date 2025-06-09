import { useState, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface PlayableGifProps {
  src: string;
  staticSrc: string; // A static version (e.g., the first frame) of the GIF
  alt: string;
  className?: string;
}

export default function PlayableGif({ src, staticSrc, alt, className }: PlayableGifProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const gifRef = useRef<HTMLImageElement>(null);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={`relative w-full max-w-[550px] cursor-pointer group ${className}`}>
      <img
        ref={gifRef}
        src={isPlaying ? src : staticSrc}
        alt={alt}
        className="m-0 w-full rounded-md"
        onClick={togglePlay}
      />
      <div
        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 group-hover:opacity-80 transition-opacity duration-300 rounded-md"
        onClick={togglePlay}
      >
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
          {isPlaying ? <Pause size={48} /> : <Play size={48} />}
        </Button>
      </div>
    </div>
  );
}
