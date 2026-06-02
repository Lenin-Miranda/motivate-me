import Image from "next/image";

type BrandLogoProps = {
  className?: string;
};

export default function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <Image
      src="/motivate-me_wordmark_cream.png"
      alt="Motivate Me"
      width={1264}
      height={242}
      priority
      className={`h-auto w-[136px] sm:w-[156px] ${className}`}
    />
  );
}
