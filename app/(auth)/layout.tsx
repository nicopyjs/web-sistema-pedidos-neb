export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-brand-steel flex items-center justify-center p-4">
      {children}
    </div>
  )
}
