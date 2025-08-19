import { ReactNode } from "react";
import BottomNavigation from "./bottom-navigation";
import FloatingActionButtons from "./floating-action-buttons";

interface MobileLayoutProps {
  children: ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 max-w-sm mx-auto relative overflow-x-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-heartbeat text-white text-sm"></i>
              </div>
              <h1 className="text-lg font-semibold text-gray-900">DigestTrack</h1>
            </div>
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <i className="fas fa-user-circle text-gray-600 text-lg"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-24">
        {children}
      </main>

      {/* Navigation */}
      <BottomNavigation />
      <FloatingActionButtons />
    </div>
  );
}
