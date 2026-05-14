import { useEffect, useState } from "react";
import { X, Tag } from "lucide-react";
import { Link } from "react-router-dom";

export default function PromoPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-xs w-full animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Top accent */}
        <div className="h-1.5 w-full" style={{ backgroundColor: "#C0392B" }} />
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#FDECEA" }}>
                <Tag className="h-4 w-4" style={{ color: "#C0392B" }} />
              </div>
              <div>
                <p className="font-bold text-sm text-[#1A1A1A]">Специальные акции!</p>
                <p className="text-xs text-[#5C5C5C] mt-0.5 leading-relaxed">
                  Используйте промокод <span className="font-mono font-bold text-[#C0392B]">OVER9000</span> и получите скидку <span className="font-semibold">−20%</span> на заказ от 9 000 ₸
                </p>
              </div>
            </div>
            <button
              onClick={() => setVisible(false)}
              className="text-gray-400 hover:text-gray-600 shrink-0 mt-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Link
            to="/cart"
            onClick={() => setVisible(false)}
            className="mt-3 block text-center text-xs font-semibold text-white py-2 rounded-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#C0392B" }}
          >
            Применить промокод →
          </Link>
        </div>
      </div>
    </div>
  );
}