import { base44 } from "@/api/base44Client";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Link, useNavigate } from "react-router-dom";

export default function PurchaseOptions({ product }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleKaspi = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await base44.entities.CartItem.create({
      product_id: product.id,
      product_title: product.title,
      product_image: product.image,
      product_price: product.price,
      quantity: 1,
      unit: product.unit || "шт",
    });
    queryClient.invalidateQueries({ queryKey: ["cartItems"] });
    toast.success("Товар добавлен в корзину");

    navigate("/checkout");
  };

  // const handleKaspi = () => {
  //   addToCart();
  //   navigate("/checkout");
  //   toast.success("Переход в Kaspi.kz...");
  // };


  return (
    <div className="border-t border-border pt-6 mt-6">
      <p className="text-sm font-semibold text-foreground mb-3">Способ покупки:</p>
      <button
        onClick={handleKaspi}
        className="flex items-center gap-4 w-full p-4 rounded-xl border-2 border-[#ef4123]/30 bg-[#ef4123]/5 hover:bg-[#ef4123]/10 hover:border-[#ef4123] transition-all group"
      >
        <div className="h-12 w-12 rounded-lg bg-[#ef4123] flex items-center justify-center flex-shrink-0">
          <ShoppingBag className="h-6 w-6 text-white" />
        </div>
        <div className="text-left">
          <div className="font-bold text-sm text-[#ef4123]">Kaspi QR</div>
          <div className="text-xs text-muted-foreground">Оплата через Kaspi.kz · Рассрочка 0%</div>
        </div>
      </button>
    </div>
  );
}
