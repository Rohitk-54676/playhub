export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <div className="mx-auto flex h-full w-full max-w-2xl flex-col px-3 py-2">
        {children}
      </div>
    </div>
  );
}