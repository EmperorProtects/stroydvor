import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 w-full overflow-x-hidden pb-14 sm:pb-0">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}