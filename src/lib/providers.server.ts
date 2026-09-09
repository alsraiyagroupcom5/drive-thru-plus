/**
 * Provider abstraction layer.
 * Every external integration goes through an adapter so the real provider can
 * be swapped in later without touching business logic.
 */

export type MessagingChannel = "whatsapp" | "sms";

export interface MessagingAdapter {
  name: string;
  sendOtp(phone: string, code: string, channel: MessagingChannel): Promise<{ delivered: boolean }>;
  sendOrderUpdate(phone: string, message: string): Promise<{ delivered: boolean }>;
}

export interface PaymentAdapter {
  name: string;
  charge(input: {
    amount: number;
    method: string;
    reference: string;
  }): Promise<{ status: "PAID" | "FAILED"; reference: string }>;
}

export interface PosAdapter {
  name: string;
  pushOrder(orderId: string): Promise<{ accepted: boolean }>;
}

const mockMessaging: MessagingAdapter = {
  name: "mock-whatsapp",
  async sendOtp(phone, code, channel) {
    console.info(`[${channel}] OTP for ${phone}: ${code}`);
    return { delivered: true };
  },
  async sendOrderUpdate(phone, message) {
    console.info(`[whatsapp] ${phone}: ${message}`);
    return { delivered: true };
  },
};

const mockPayment: PaymentAdapter = {
  name: "mock-gateway",
  async charge({ method, reference }) {
    if (method === "PAY_AT_PICKUP") return { status: "PAID", reference };
    return { status: "PAID", reference };
  },
};

const mockPos: PosAdapter = {
  name: "mock-pos",
  async pushOrder(orderId) {
    console.info(`[pos] order pushed: ${orderId}`);
    return { accepted: true };
  },
};

export function messagingProvider(): MessagingAdapter {
  return mockMessaging;
}

export function paymentProvider(): PaymentAdapter {
  return mockPayment;
}

export function posProvider(): PosAdapter {
  return mockPos;
}
