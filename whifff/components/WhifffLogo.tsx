import Sparkle from "./Sparkle";

export default function WhifffLogo() {
  return (
    <div className="text-center pt-10 pb-0 px-5 animate-fadeUp relative">
      <div className="absolute top-7 left-1/2 -ml-[120px]">
        <Sparkle size={14} color="white" className="opacity-60 animate-twinkle" />
      </div>
      <div className="absolute top-[55px] left-1/2 ml-[110px]">
        <Sparkle size={10} color="white" className="opacity-50 animate-twinkle [animation-delay:0.5s]" />
      </div>
      <div className="absolute top-[85px] left-1/2 -ml-[95px]">
        <Sparkle size={8} color="white" className="opacity-40 animate-twinkle [animation-delay:1s]" />
      </div>
      <div className="absolute top-[30px] left-1/2 ml-[80px]">
        <Sparkle size={11} color="white" className="opacity-50 animate-twinkle [animation-delay:1.5s]" />
      </div>

      <h1 className="font-caprasimo text-[clamp(56px,14vw,80px)] text-white m-0 leading-none tracking-wider [text-shadow:0_4px_20px_rgba(0,40,80,0.15)]">
        whifff
      </h1>
      <p className="font-pacifico text-[clamp(14px,3.5vw,18px)] text-white mt-1.5 opacity-85 [text-shadow:0_2px_10px_rgba(0,40,80,0.1)]">
        your next favorite scent is one quiz away
      </p>
    </div>
  );
}
