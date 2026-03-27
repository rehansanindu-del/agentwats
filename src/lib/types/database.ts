export type ContactTag = "hot" | "warm" | "cold";
export type MessageDirection = "incoming" | "outgoing";

export interface User {
  id: string;
  email: string;
  created_at: string;
  lead_fields?: string[] | null;
  /** Keys to show in Leads table; null/undefined = show all keys present in custom_fields */
  lead_display_fields?: string[] | null;
}

export interface WhatsappAccount {
  id: string;
  user_id: string;
  phone_number_id: string;
  access_token: string;
  business_account_id: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  phone: string;
  name: string | null;
  service_interest?: string | null;
  budget?: string | null;
  tag: ContactTag;
  last_message: string | null;
  custom_fields: Record<string, unknown>;
  created_at: string;
  /** When false, AI does not auto-reply for this contact (manual takeover). */
  auto_reply_enabled?: boolean;
}

export interface Message {
  id: string;
  user_id: string;
  contact_id: string;
  content: string;
  direction: MessageDirection;
  created_at: string;
  /** WhatsApp Cloud API message id (incoming); used for webhook idempotency */
  wa_message_id?: string | null;
}

export interface Bot {
  id: string;
  user_id: string;
  prompt: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
