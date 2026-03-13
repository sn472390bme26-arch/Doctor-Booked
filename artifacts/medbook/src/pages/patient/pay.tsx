import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useProcessPayment, useGetMyBookings } from "@workspace/api-client-react";
import { CreditCard, Smartphone, Building, Wallet, ShieldCheck, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Payment() {
  const [, params] = useRoute("/patient/pay/:id");
  const bookingId = parseInt(params?.id || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [method, setMethod] = useState<"card" | "upi" | "netbanking" | "wallet">("upi");
  
  // We need booking details, easiest is to get from bookings list since there's no single getBooking endpoint in schema
  const { data: bookings } = useGetMyBookings();
  const booking = bookings?.find(b => b.id === bookingId);
  const amount = (booking as any)?.consultationFee ?? booking?.amountPaid ?? 0;

  const payMutation = useProcessPayment();

  const handlePay = () => {
    payMutation.mutate({
      bookingId,
      data: { method, amount }
    }, {
      onSuccess: () => {
        setLocation(`/patient/token/${bookingId}`);
      },
      onError: () => {
        toast({ title: "Payment Failed", description: "Try again.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-lg">
        <div className="bg-muted p-8 text-center border-b border-border">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Secure Payment</h1>
          <p className="text-muted-foreground mt-2">Complete payment to confirm your token</p>
          <div className="mt-6 text-4xl font-display font-bold text-foreground">
            ₹{amount}
          </div>
        </div>

        <div className="p-8">
          <h3 className="font-semibold text-lg mb-4">Select Payment Method</h3>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <PaymentOption icon={<Smartphone />} label="UPI" id="upi" selected={method} onSelect={setMethod} />
            <PaymentOption icon={<CreditCard />} label="Card" id="card" selected={method} onSelect={setMethod} />
            <PaymentOption icon={<Building />} label="Net Banking" id="netbanking" selected={method} onSelect={setMethod} />
            <PaymentOption icon={<Wallet />} label="Wallet" id="wallet" selected={method} onSelect={setMethod} />
          </div>

          {method === 'card' && (
            <div className="space-y-4 mb-8 animate-in fade-in slide-in-from-top-2">
              <input type="text" placeholder="Card Number" className="w-full p-3 rounded-xl border border-border bg-background" />
              <div className="flex gap-4">
                <input type="text" placeholder="MM/YY" className="w-1/2 p-3 rounded-xl border border-border bg-background" />
                <input type="text" placeholder="CVV" className="w-1/2 p-3 rounded-xl border border-border bg-background" />
              </div>
            </div>
          )}

          {method === 'upi' && (
            <div className="space-y-4 mb-8 animate-in fade-in slide-in-from-top-2">
              <input type="text" placeholder="Enter UPI ID (e.g. name@bank)" className="w-full p-3 rounded-xl border border-border bg-background" />
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={payMutation.isPending}
            className="w-full py-4 bg-foreground text-background font-bold rounded-xl shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-lg"
          >
            {payMutation.isPending ? "Processing..." : `Pay ₹${amount}`}
            <Lock className="w-4 h-4 ml-1 opacity-70" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentOption({ icon, label, id, selected, onSelect }: any) {
  const isSelected = selected === id;
  return (
    <button
      onClick={() => onSelect(id)}
      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all
        ${isSelected ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted text-muted-foreground hover:text-foreground'}`}
    >
      <div className="mb-2">{icon}</div>
      <span className="font-semibold">{label}</span>
    </button>
  );
}
