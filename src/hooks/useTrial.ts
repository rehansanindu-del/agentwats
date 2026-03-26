"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getDaysLeft, isTrialActive } from "@/lib/trial";

interface TrialState {
  isActive: boolean;
  daysLeft: number;
  isPro: boolean;
  loading: boolean;
}

const initialState: TrialState = {
  isActive: false,
  daysLeft: 0,
  isPro: false,
  loading: true,
};

let cachedState: TrialState | null = null;
let inflight: Promise<TrialState> | null = null;

async function fetchTrialState(): Promise<TrialState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ...initialState, loading: false };
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("is_pro, trial_end")
    .eq("id", user.id)
    .maybeSingle();

  if (!appUser) {
    return { ...initialState, loading: false };
  }

  return {
    isActive: isTrialActive(appUser),
    daysLeft: getDaysLeft(appUser.trial_end),
    isPro: appUser.is_pro === true,
    loading: false,
  };
}

export function useTrial(): TrialState {
  const [state, setState] = useState<TrialState>(cachedState ?? initialState);

  useEffect(() => {
    if (cachedState) {
      setState(cachedState);
      return;
    }

    if (!inflight) {
      inflight = fetchTrialState().then((res) => {
        cachedState = res;
        return res;
      });
    }

    void inflight
      .then((res) => setState(res))
      .finally(() => {
        inflight = null;
      });
  }, []);

  return state;
}
