import OpenAI from "openai";

import { getOpenAiEnv } from "@/lib/env/server";

const serverEnv = getOpenAiEnv();

export const openai = new OpenAI({
  apiKey: serverEnv.openAiApiKey,
});

export const OPENAI_DEFAULT_MODEL = serverEnv.openAiModelDefault;
