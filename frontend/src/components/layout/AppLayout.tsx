import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { MobileNav } from "./MobileNav"

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-foreground transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Mobile Nav Drawer */}
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-h-screen overflow-hidden">
        {/* Header */}
        <Header onMenuClick={() => setMobileOpen(true)} />

        {/* Page Main Content Area */}
        <main className="flex-1 overflow-y-auto px-6 py-8 relative">
          {/* Outlet for nested routing views */}
          <div className="max-w-7xl mx-auto w-full page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
