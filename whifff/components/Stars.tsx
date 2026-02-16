interface StarsProps {
  rating: number;
}

export default function Stars({ rating }: StarsProps) {
  return (
    <div className="flex items-center gap-[1px]" aria-label={`${rating} out of 5`}>
      {[...Array(5)].map((_, i) => {
        const f = Math.min(1, Math.max(0, rating - i));
        const id = `star-${i}-${rating}`;
        return (
          <svg key={i} width="12" height="12" viewBox="0 0 20 20">
            <defs>
              <linearGradient id={id}>
                <stop offset={`${f * 100}%`} stopColor="#FFD666" />
                <stop offset={`${f * 100}%`} stopColor="rgba(200,200,200,0.3)" />
              </linearGradient>
            </defs>
            <polygon
              points="10,1.5 12.6,7 18.5,7.6 14,11.8 15.3,17.5 10,14.5 4.7,17.5 6,11.8 1.5,7.6 7.4,7"
              fill={`url(#${id})`}
            />
          </svg>
        );
      })}
      <span className="text-[11px] text-[#1B3A5C] ml-1 font-bold">{rating}</span>
    </div>
  );
}
