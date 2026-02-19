interface ChatBubbleProps {
  text: string;
  cursor: boolean;
}

export default function ChatBubble({ text, cursor }: ChatBubbleProps) {
  return (
    <div className="bg-white/[0.93] rounded-[22px_22px_22px_6px] p-[18px_22px] mb-6 shadow-[0_4px_20px_rgba(0,40,80,0.08)]">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#5BA3D9] to-[#4A8EC2] flex items-center justify-center text-xs text-white font-black font-caprasimo">
          w
        </div>
        <span className="text-[10px] text-[#4A8EC2] font-extrabold tracking-[2px] uppercase">whifff</span>
      </div>
      <p className="text-[15px] text-[#1B3A5C] leading-[1.7] m-0 font-medium">
        {text}
        {cursor && (
          <span className="inline-block w-0.5 h-[1.1em] bg-[#4A8EC2] ml-0.5 align-text-bottom animate-blink" />
        )}
      </p>
    </div>
  );
}
