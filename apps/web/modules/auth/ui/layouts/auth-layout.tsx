export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-5 px-3 sm:px-5">
      {children}
    </div>
  );
}
