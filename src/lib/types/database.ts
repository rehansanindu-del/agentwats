export type ContactTag = "hot" | "warm" | "cold";
export type MessageDirection = "incoming" | "outgoing";

export interface User {
  id: string;
  email: string;
  created_at: string;
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
  tag: ContactTag;
  last_message: string | null;
  custom_fields: Record<string, unknown>;
  created_at: string;
}

export interface Message {
  id: string;
  user_id: string;
  contact_id: string;
  content: string;
  direction: MessageDirection;
  created_at: string;
}

export interface Bot {
  id: string;
  user_id: string;
  prompt: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
