import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function KaspiQR({ orderData }) {
  const [paymentDone, setPaymentDone] = useState(false);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {!paymentDone ? (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Order Summary */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 h-fit">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Ваш заказ</h2>
              <div className="space-y-3 text-sm mb-4 max-h-64 overflow-y-auto">
                {orderData?.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-gray-700">
                    <span className="flex-1">{item.product_title} x {item.quantity}</span>
                    <span className="font-semibold ml-2">{(item.price * item.quantity).toLocaleString("ru-RU")} ₸</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-lg">
                <span>Итого:</span>
                <span style={{ color: "#C0392B" }}>{(orderData?.total || 0).toLocaleString("ru-RU")} ₸</span>
              </div>
              {orderData?.discount > 0 && (
                <p className="text-sm text-green-600 mt-2">Скидка: {orderData.discount} ₸</p>
              )}
            </div>

            {/* Right: Kaspi QR Payment Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col items-center">
              {/* Kaspi QR Header */}
              <div className="mb-6 text-center w-full">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <svg className="w-10 h-10" viewBox="0 0 100 100">
                    <rect x="15" y="15" width="20" height="20" fill="#C0392B" />
                    <rect x="40" y="15" width="20" height="20" fill="#C0392B" />
                    <rect x="65" y="15" width="20" height="20" fill="#C0392B" />
                    <rect x="15" y="40" width="20" height="20" fill="#C0392B" />
                    <rect x="65" y="40" width="20" height="20" fill="#C0392B" />
                    <rect x="15" y="65" width="20" height="20" fill="#C0392B" />
                    <rect x="40" y="65" width="20" height="20" fill="#C0392B" />
                    <rect x="65" y="65" width="20" height="20" fill="#C0392B" />
                  </svg>
                  <span className="text-3xl font-bold text-gray-900">Kaspi QR</span>
                </div>
                <p className="text-gray-600 text-sm font-semibold">Сканируйте и платите</p>
              </div>

              {/* QR Code */}
              <div className="bg-gray-50 p-8 rounded-2xl mb-6 border-2 border-gray-200">
                <a
                  href="https://pay.kaspi.kz/pay/pxh2kcgq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-56 h-56 rounded-lg flex items-center justify-center bg-white border-2 border-gray-300 hover:shadow-lg transition-shadow"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/QR_code_for_mobile_English_Wikipedia%27s_homepage.svg/1200px-QR_code_for_mobile_English_Wikipedia%27s_homepage.svg.png"
                    alt="Kaspi QR Code"
                    className="w-full h-full object-cover rounded"
                  />
                </a>
              </div>

              {/* Company Info */}
              <div className="text-center mb-6 w-full border-b border-gray-200 pb-6">
                <div className="w-14 h-14 rounded-full bg-blue-900 flex items-center justify-center mx-auto mb-2">
                  <span className="text-white text-sm font-bold">SIT</span>
                </div>
                <p className="font-bold text-gray-900 text-lg">Tankstore</p>
                <p className="text-xs text-gray-600">ИП TANKSTORE</p>
                <p className="text-xs text-gray-500 leading-tight mt-1">Астана, Шокана Уалиханова 25/2, 2</p>
              </div>

              {/* Payment Methods */}
              <div className="w-full mb-6 text-center">
                <p className="text-xs font-semibold text-gray-700 mb-3">Способы оплаты</p>
                <div className="flex gap-2 justify-center">
                  <div className="px-4 py-2 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: "#D4AF37" }}>
                    GOLD
                  </div>
                  <div className="px-4 py-2 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: "#C0392B" }}>
                    Red+
                  </div>
                  <div className="px-4 py-2 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: "#C0392B" }}>
                    KREDIT
                  </div>
                </div>
              </div>

              {/* Confirmation Button */}
              <Button
                onClick={() => setPaymentDone(true)}
                className="w-full h-11 font-semibold text-white"
                style={{ backgroundColor: "#27ae60" }}
              >
                ✓ Оплата произведена
              </Button>
              <p className="text-xs text-gray-500 text-center mt-3">
                Нажмите кнопку после успешной оплаты
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Success screen */}
            <div className="text-center mb-8">
              <div className="h-16 w-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#E8F5E9" }}>
                <CheckCircle className="h-8 w-8" style={{ color: "#27ae60" }} />
              </div>
              <h1 className="text-2xl font-bold mb-2">Спасибо за покупку!</h1>
              <p className="text-muted-foreground text-sm">Ожидайте звонка менеджера</p>
            </div>

            {/* Success notification */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-green-900 font-medium mb-1">
                ✓ Платёж успешно обработан
              </p>
              <p className="text-xs text-green-800">
                Менеджер свяжется с вами в ближайшее время для подтверждения доставки
              </p>
            </div>

            {/* Order details */}
            <div className="bg-card border border-border rounded-xl p-5 mb-6 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Сумма заказа</p>
                <p className="text-2xl font-bold" style={{ color: "#C0392B" }}>
                  {(orderData?.total || 0).toLocaleString("ru-RU")} ₸
                </p>
              </div>

              {orderData?.customer_name && (
                <>
                  <div className="border-t border-border pt-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Получатель</p>
                        <p className="font-medium">{orderData.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> Телефон
                        </p>
                        <p className="font-medium">{orderData.customer_phone}</p>
                      </div>
                      {orderData.customer_address && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Адрес доставки</p>
                          <p className="font-medium">{orderData.customer_address}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <Link to="/">
              <Button className="w-full font-semibold text-white" style={{ backgroundColor: "#C0392B" }}>
                На главную
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}