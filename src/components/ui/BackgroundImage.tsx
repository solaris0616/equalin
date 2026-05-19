import Image from "next/image";

interface BackgroundImageProps {
  src: string;
  priority?: boolean;
}

export function BackgroundImage({ src, priority = false }: BackgroundImageProps) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <Image
        src={src}
        alt="Background"
        fill
        priority={priority}
        className="object-cover"
        quality={85}
      />
      <div className="absolute inset-0 bg-[#f0f0f0]/60" />
    </div>
  );
}
