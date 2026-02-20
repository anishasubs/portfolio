interface ChatBubbleProps {
  text: string;
  cursor: boolean;
}

export default function ChatBubble({ text, cursor }: ChatBubbleProps) {
  return (
    <div className="bg-white/[0.93] rounded-[22px] p-[18px_22px] mb-6 shadow-[0_4px_20px_rgba(0,40,80,0.08)]">
      <p className="text-[15px] text-[#1B3A5C] leading-[1.7] m-0 font-medium">
        {text}
        {cursor && (
          <span className="inline-block w-0.5 h-[1.1em] bg-[#4A8EC2] ml-0.5 align-text-bottom animate-blink" />
        )}
      </p>
    </div>
  );
}
