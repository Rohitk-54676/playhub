import { Nav } from "@/components/nav/Nav";
import { AnnouncementBanner } from "@/components/shared/AnnouncementBanner";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="pb-20 md:pb-0 md:pl-64">
        <AnnouncementBanner />
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}