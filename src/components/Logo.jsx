
export function Logo({ className = '', size = 24, showText = true }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className="flex items-center justify-center bg-foreground text-background" 
        style={{ width: size + 14, height: size + 14 }}
      >
        <svg 
          viewBox="0 0 24 24" 
          width={size} 
          height={size} 
          className="fill-none stroke-current stroke-[4] stroke-square"
        >
          <path d="M3 20L12 4L21 20M12 4V20" />
        </svg>
      </div>
      {showText && (
        <span className="font-heading font-black text-2xl tracking-tighter text-foreground uppercase italic">
          VANTAGE
        </span>
      )}
    </div>
  );
}
