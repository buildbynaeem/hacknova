import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

interface PaymentOptions {
  amount: number;
  receipt: string;
  notes?: Record<string, string>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onError: (error: any) => void;
}

// Load Razorpay SDK
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Create order via edge function
export const createRazorpayOrder = async (
  amount: number,
  receipt: string,
  notes?: Record<string, string>
): Promise<RazorpayOrderResponse> => {
  const { data, error } = await supabase.functions.invoke("razorpay-create-order", {
    body: { amount, currency: "INR", receipt, notes },
  });

  if (error) {
    throw new Error(error.message || "Failed to create order");
  }

  return data;
};

// Verify payment via edge function
export const verifyRazorpayPayment = async (
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
  shipmentId?: string
): Promise<{ success: boolean; paymentId: string }> => {
  const { data, error } = await supabase.functions.invoke("razorpay-verify-payment", {
    body: {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      shipmentId,
    },
  });

  if (error) {
    throw new Error(error.message || "Payment verification failed");
  }

  return data;
};

// Open Razorpay checkout
export const openRazorpayCheckout = async (options: PaymentOptions) => {
  const isLoaded = await loadRazorpayScript();
  
  if (!isLoaded) {
    throw new Error("Failed to load Razorpay SDK");
  }

  // Create order first
  const orderData = await createRazorpayOrder(
    options.amount,
    options.receipt,
    options.notes
  );

  const razorpayOptions = {
    key: orderData.keyId,
    amount: orderData.amount,
    currency: orderData.currency,
    name: "Raptorize Logistics",
    description: "Fleet Booking Payment",
    order_id: orderData.orderId,
    prefill: options.prefill,
    theme: {
      color: "#f97316", // accent color
    },
    handler: function (response: any) {
      options.onSuccess(response);
    },
    modal: {
      ondismiss: function () {
        options.onError({ message: "Payment cancelled by user" });
      },
    },
  };

  const razorpay = new window.Razorpay(razorpayOptions);
  razorpay.on("payment.failed", function (response: any) {
    options.onError(response.error);
  });
  razorpay.open();
};
