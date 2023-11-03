import { Search } from "./_components/search";
import { Flow } from "./_components/flow";
import { ThemeToggle } from "@/components/ui/themetoggle";

export default async function Home() {
  return (
    <main className="relative h-screen w-screen">
      <div className="absolute left-1/2 top-10 z-20 w-80 -translate-x-1/2">
        <Search />
      </div>
      <div className="absolute right-10 top-10 z-20">
        <ThemeToggle />
      </div>
      <Flow />
    </main>
  );
}
