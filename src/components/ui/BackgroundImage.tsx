import Image from "next/image";

interface BackgroundImageProps {
  src: string;
  priority?: boolean;
}

export function BackgroundImage({
  src,
  priority = false,
}: BackgroundImageProps) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <Image
        src={src}
        alt="Background"
        fill
        priority={priority}
        className="object-cover"
        quality={75}
      />
      {/* 上部のフェード */}
      <div
        className="absolute top-0 left-0 right-0 h-32 z-10"
        style={{
          background:
            "linear-gradient(to bottom, var(--theme-bg-color) 0%, transparent 100%)",
        }}
      />
      {/* 下部のフェード */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 z-10"
        style={{
          background:
            "linear-gradient(to top, var(--theme-bg-color) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
