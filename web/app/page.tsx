import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col w-full items-start justify-center gap-4">
          <h1 className="text-5xl w-5xl font-semibold text-white">Welcome</h1>
          <p className="text-2xl text-gray-50 font-light">Guess what? </p>
          <span className="text-2xl text-gray-50 font-light">Me too! lol</span>

          <p className="text-2xl text-gray-50 font-light">
            No worrys tho i have a small and simple solution
          </p>
        </div>
      </main>
    </div>
  );
}
