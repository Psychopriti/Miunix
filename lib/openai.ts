import OpenAI from "openai";

import { getServerEnv } from "@/lib/env/server";

const serverEnv = getServerEnv();

export const openai = new OpenAI({
  apiKey: serverEnv.openAiApiKey,
});

export const OPENAI_DEFAULT_MODEL = serverEnv.openAiModelDefault;
