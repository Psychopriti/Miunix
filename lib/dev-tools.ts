import type { Json } from "@/types/database";
import type { OpenAIModelId } from "@/types/openai";

export const SUPPORTED_DEV_MODELS: OpenAIModelId[] = [
  "gpt-5.4",
  "gpt-5.4-mini",
  "gpt-5",
  "gpt-5-mini",
  "gpt-4o-mini",
  "gpt-4.1",
  "gpt-4.1-mini",
];

export const DEV_MODEL_BASE_COST_USD: Partial<Record<OpenAIModelId, number>> = {
  "gpt-5.4": 25,
  "gpt-5.4-mini": 10,
  "gpt-5": 19,
  "gpt-5-mini": 7,
  "gpt-4o-mini": 5,
  "gpt-4.1": 15,
  "gpt-4.1-mini": 6,
};

export type ToolSourceType = "native" | "rest" | "openapi" | "webhook";
export type ToolAuthType =
  | "none"
  | "api_key"
  | "bearer"
  | "header_custom"
  | "oauth";
export type AgentReviewStatus =
  | "draft"
  | "ready_for_review"
  | "in_review"
  | "changes_requested"
  | "approved";
export type AgentTestRunStatus = "not_run" | "passed" | "failed";
export type CheckStatus = "passed" | "failed";

export type DevToolDefinition = {
  tool_name: string;
  description: string;
  source_type: ToolSourceType;
  base_url: string | null;
  method: string | null;
  path_template: string | null;
  headers_template: Record<string, string>;
  auth_type: ToolAuthType;
  auth_header_name: string | null;
  auth_prefix: string | null;
  input_schema: Record<string, Json>;
  output_schema: Record<string, Json>;
  rate_limit_per_minute: number;
  timeout_ms: number;
  openapi_spec_url: string | null;
  webhook_url: string | null;
};

export type AgentValidationReport = {
  checks: {
    contentSafety: CheckStatus;
    promptSafety: CheckStatus;
    security: CheckStatus;
    schemas: CheckStatus;
  };
  issues: string[];
};

export type OpenApiImportResult = {
  title: string;
  version: string | null;
  sourceUrl: string;
  toolDefinitions: DevToolDefinition[];
};

export type DeveloperPricingGuidance = {
  baseModelCostUsd: number;
  toolComplexityCostUsd: number;
  minimumPriceUsd: number;
  recommendedPriceUsd: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function requireObject(
  value: unknown,
  fieldName: string,
): Record<string, Json> {
  if (!isRecord(value)) {
    throw new Error(`${fieldName} must be a JSON object.`);
  }

  return value as Record<string, Json>;
}

function validateHttpsUrl(value: string | null, fieldName: string) {
  if (!value) {
    return;
  }

  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${fieldName} must be a valid URL.`);
  }

  if (parsed.protocol !== "https:") {
    throw new Error(`${fieldName} must use https.`);
  }

  if (
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname.endsWith(".local")
  ) {
    throw new Error(`${fieldName} cannot point to localhost.`);
  }
}

function slugifyToolName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_/.-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function validatePathTemplate(pathTemplate: string | null) {
  if (!pathTemplate) {
    return;
  }

  if (!pathTemplate.startsWith("/")) {
    throw new Error("path_template must start with /.");
  }
}

function validateHttpMethod(method: string | null) {
  if (!method) {
    return;
  }

  const allowed = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

  if (!allowed.has(method.toUpperCase())) {
    throw new Error("method must be one of GET, POST, PUT, PATCH or DELETE.");
  }
}

function roundPrice(value: number) {
  return Number(value.toFixed(2));
}

export function getDeveloperPricingGuidance({
  model,
  toolCount,
}: {
  model: string;
  toolCount: number;
}): DeveloperPricingGuidance {
  const baseModelCostUsd =
    DEV_MODEL_BASE_COST_USD[model as OpenAIModelId] ??
    DEV_MODEL_BASE_COST_USD["gpt-5-mini"] ??
    7;
  const normalizedToolCount = Math.max(0, toolCount);
  const toolComplexityCostUsd =
    normalizedToolCount === 0
      ? 0
      : normalizedToolCount === 1
        ? 2
        : Math.min(8, 2 + (normalizedToolCount - 1) * 1.5);
  const minimumPriceUsd = roundPrice(baseModelCostUsd + toolComplexityCostUsd);
  const recommendedPriceUsd = roundPrice(minimumPriceUsd * 1.45);

  return {
    baseModelCostUsd,
    toolComplexityCostUsd: roundPrice(toolComplexityCostUsd),
    minimumPriceUsd,
    recommendedPriceUsd,
  };
}

export function parseToolDefinitions(value: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("tool definitions must be valid JSON.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("tool definitions must be a JSON array.");
  }

  const toolNames = new Set<string>();

  return parsed.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`tool definition ${index + 1} must be an object.`);
    }

    const toolName = normalizeOptionalString(item.tool_name);
    const description = normalizeOptionalString(item.description);
    const sourceType = normalizeOptionalString(item.source_type) as
      | ToolSourceType
      | null;
    const authType = normalizeOptionalString(item.auth_type) as
      | ToolAuthType
      | null;
    const baseUrl = normalizeOptionalString(item.base_url);
    const method = normalizeOptionalString(item.method)?.toUpperCase() ?? null;
    const pathTemplate = normalizeOptionalString(item.path_template);
    const openapiSpecUrl = normalizeOptionalString(item.openapi_spec_url);
    const webhookUrl = normalizeOptionalString(item.webhook_url);

    if (!toolName) {
      throw new Error(`tool definition ${index + 1} is missing tool_name.`);
    }

    if (toolNames.has(toolName)) {
      throw new Error(`tool_name "${toolName}" is duplicated.`);
    }

    toolNames.add(toolName);

    if (!description || description.length < 12) {
      throw new Error(`tool "${toolName}" needs a richer description.`);
    }

    if (!sourceType || !["native", "rest", "openapi", "webhook"].includes(sourceType)) {
      throw new Error(`tool "${toolName}" has an invalid source_type.`);
    }

    if (
      !authType ||
      !["none", "api_key", "bearer", "header_custom", "oauth"].includes(authType)
    ) {
      throw new Error(`tool "${toolName}" has an invalid auth_type.`);
    }

    validateHttpsUrl(baseUrl, `tool "${toolName}" base_url`);
    validateHttpsUrl(openapiSpecUrl, `tool "${toolName}" openapi_spec_url`);
    validateHttpsUrl(webhookUrl, `tool "${toolName}" webhook_url`);
    validatePathTemplate(pathTemplate);
    validateHttpMethod(method);

    if (sourceType === "rest" || sourceType === "openapi") {
      if (!baseUrl || !method || !pathTemplate) {
        throw new Error(
          `tool "${toolName}" needs base_url, method and path_template.`,
        );
      }
    }

    if (sourceType === "webhook" && !webhookUrl) {
      throw new Error(`tool "${toolName}" needs webhook_url.`);
    }

    if (sourceType === "openapi" && !openapiSpecUrl) {
      throw new Error(`tool "${toolName}" needs openapi_spec_url.`);
    }

    const rateLimit = Number(item.rate_limit_per_minute);
    const timeoutMs = Number(item.timeout_ms);

    if (!Number.isInteger(rateLimit) || rateLimit <= 0 || rateLimit > 120) {
      throw new Error(
        `tool "${toolName}" rate_limit_per_minute must be between 1 and 120.`,
      );
    }

    if (
      !Number.isInteger(timeoutMs) ||
      timeoutMs < 1000 ||
      timeoutMs > 30000
    ) {
      throw new Error(
        `tool "${toolName}" timeout_ms must be between 1000 and 30000.`,
      );
    }

    const headersTemplate = item.headers_template ?? {};
    const authHeaderName = normalizeOptionalString(item.auth_header_name);
    const authPrefix = normalizeOptionalString(item.auth_prefix);

    if (!isRecord(headersTemplate)) {
      throw new Error(`tool "${toolName}" headers_template must be an object.`);
    }

    if (authType === "header_custom" && !authHeaderName) {
      throw new Error(
        `tool "${toolName}" needs auth_header_name for header_custom auth.`,
      );
    }

    if (authType === "oauth") {
      throw new Error(
        `tool "${toolName}" uses oauth, which is reserved for a later phase.`,
      );
    }

    return {
      tool_name: toolName,
      description,
      source_type: sourceType,
      base_url: baseUrl,
      method,
      path_template: pathTemplate,
      headers_template: headersTemplate as Record<string, string>,
      auth_type: authType,
      auth_header_name: authHeaderName,
      auth_prefix: authPrefix,
      input_schema: requireObject(item.input_schema, `tool "${toolName}" input_schema`),
      output_schema: requireObject(
        item.output_schema,
        `tool "${toolName}" output_schema`,
      ),
      rate_limit_per_minute: rateLimit,
      timeout_ms: timeoutMs,
      openapi_spec_url: openapiSpecUrl,
      webhook_url: webhookUrl,
    } satisfies DevToolDefinition;
  });
}

function createParameterSchema(
  parameters: unknown,
  requestBody: unknown,
): Record<string, Json> {
  const properties: Record<string, Json> = {};
  const required: string[] = [];

  if (Array.isArray(parameters)) {
    for (const parameter of parameters) {
      if (!isRecord(parameter)) {
        continue;
      }

      const name = normalizeOptionalString(parameter.name);

      if (!name) {
        continue;
      }

      const schema = isRecord(parameter.schema)
        ? (parameter.schema as Json)
        : ({ type: "string" } as Json);

      properties[name] = schema;

      if (parameter.required === true) {
        required.push(name);
      }
    }
  }

  if (isRecord(requestBody)) {
    const content = requestBody.content;

    if (isRecord(content)) {
      const jsonContent = content["application/json"];

      if (isRecord(jsonContent) && isRecord(jsonContent.schema)) {
        properties.body = jsonContent.schema as Json;

        if (requestBody.required === true) {
          required.push("body");
        }
      }
    }
  }

  return {
    type: "object",
    properties,
    ...(required.length > 0 ? { required } : {}),
  };
}

function createResponseSchema(responses: unknown): Record<string, Json> {
  if (!isRecord(responses)) {
    return {
      type: "object",
      properties: {},
    };
  }

  const successEntry = Object.entries(responses).find(([statusCode]) =>
    /^2\d\d$/.test(statusCode),
  );

  if (!successEntry) {
    return {
      type: "object",
      properties: {},
    };
  }

  const [, responseValue] = successEntry;

  if (!isRecord(responseValue) || !isRecord(responseValue.content)) {
    return {
      type: "object",
      properties: {},
    };
  }

  const jsonContent = responseValue.content["application/json"];

  if (isRecord(jsonContent) && isRecord(jsonContent.schema)) {
    return jsonContent.schema as Record<string, Json>;
  }

  return {
    type: "object",
    properties: {},
  };
}

function inferAuthTypeFromOpenApi(operation: Record<string, unknown>, spec: Record<string, unknown>): ToolAuthType {
  const security = Array.isArray(operation.security)
    ? operation.security
    : Array.isArray(spec.security)
      ? spec.security
      : [];
  const components = isRecord(spec.components) ? spec.components : null;
  const securitySchemes =
    components && isRecord(components.securitySchemes)
      ? components.securitySchemes
      : null;

  if (!security.length || !securitySchemes) {
    return "none";
  }

  for (const entry of security) {
    if (!isRecord(entry)) {
      continue;
    }

    for (const schemeName of Object.keys(entry)) {
      const scheme = securitySchemes[schemeName];

      if (!isRecord(scheme)) {
        continue;
      }

      if (scheme.type === "http" && scheme.scheme === "bearer") {
        return "bearer";
      }

      if (scheme.type === "apiKey") {
        return "api_key";
      }

      if (scheme.type === "oauth2") {
        return "oauth";
      }
    }
  }

  return "header_custom";
}

function getAuthHeaderName(operation: Record<string, unknown>, spec: Record<string, unknown>) {
  const security = Array.isArray(operation.security)
    ? operation.security
    : Array.isArray(spec.security)
      ? spec.security
      : [];
  const components = isRecord(spec.components) ? spec.components : null;
  const securitySchemes =
    components && isRecord(components.securitySchemes)
      ? components.securitySchemes
      : null;

  if (!security.length || !securitySchemes) {
    return null;
  }

  for (const entry of security) {
    if (!isRecord(entry)) {
      continue;
    }

    for (const schemeName of Object.keys(entry)) {
      const scheme = securitySchemes[schemeName];

      if (!isRecord(scheme)) {
        continue;
      }

      if (scheme.type === "apiKey" && scheme.in === "header") {
        return normalizeOptionalString(scheme.name);
      }
    }
  }

  return null;
}

export async function importOpenApiFromUrl(sourceUrl: string) {
  validateHttpsUrl(sourceUrl, "openapi url");

  const response = await fetch(sourceUrl, {
    method: "GET",
    headers: {
      Accept: "application/json, application/vnd.oai.openapi+json",
    },
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No se pudo descargar el OpenAPI (${response.status}).`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = await response.text();

  if (!contentType.includes("json") && !rawBody.trim().startsWith("{")) {
    throw new Error(
      "Por ahora el import soporta OpenAPI en JSON desde URL.",
    );
  }

  let spec: unknown;

  try {
    spec = JSON.parse(rawBody);
  } catch {
    throw new Error("El archivo OpenAPI no es JSON valido.");
  }

  if (!isRecord(spec) || !isRecord(spec.info) || !isRecord(spec.paths)) {
    throw new Error("El archivo no parece ser un OpenAPI valido.");
  }

  const title = normalizeOptionalString(spec.info.title) ?? "OpenAPI Import";
  const version = normalizeOptionalString(spec.info.version);
  const servers = Array.isArray(spec.servers) ? spec.servers : [];
  const firstServer = servers.find((server) => isRecord(server) && typeof server.url === "string");
  const baseUrl =
    firstServer && isRecord(firstServer) ? normalizeOptionalString(firstServer.url) : null;

  validateHttpsUrl(baseUrl, "openapi server url");

  if (!baseUrl) {
    throw new Error("El spec necesita al menos un server https para importar tools.");
  }

  const toolDefinitions: DevToolDefinition[] = [];

  for (const [pathKey, pathValue] of Object.entries(spec.paths)) {
    if (!isRecord(pathValue)) {
      continue;
    }

    for (const methodName of ["get", "post", "put", "patch", "delete"] as const) {
      const operation = pathValue[methodName];

      if (!isRecord(operation)) {
        continue;
      }

      const operationId =
        normalizeOptionalString(operation.operationId) ??
        slugifyToolName(`${methodName}_${pathKey}`);
      const description =
        normalizeOptionalString(operation.summary) ??
        normalizeOptionalString(operation.description) ??
        `Call ${methodName.toUpperCase()} ${pathKey}`;
      const authType = inferAuthTypeFromOpenApi(operation, spec);
      const authHeaderName = getAuthHeaderName(operation, spec);
      const parameters = [
        ...(Array.isArray(pathValue.parameters) ? pathValue.parameters : []),
        ...(Array.isArray(operation.parameters) ? operation.parameters : []),
      ];

      toolDefinitions.push({
        tool_name: operationId,
        description,
        source_type: "openapi",
        base_url: baseUrl,
        method: methodName.toUpperCase(),
        path_template: pathKey.replace(/\{([^}]+)\}/g, "{$1}"),
        headers_template: {
          Accept: "application/json",
        },
        auth_type: authType,
        auth_header_name: authHeaderName,
        auth_prefix: null,
        input_schema: createParameterSchema(parameters, operation.requestBody),
        output_schema: createResponseSchema(operation.responses),
        rate_limit_per_minute: 30,
        timeout_ms: 10000,
        openapi_spec_url: sourceUrl,
        webhook_url: null,
      });
    }
  }

  if (toolDefinitions.length === 0) {
    throw new Error("No se encontraron operaciones HTTP importables en el spec.");
  }

  return {
    title,
    version,
    sourceUrl,
    toolDefinitions,
  } satisfies OpenApiImportResult;
}

export function parseToolSecrets(
  value: string,
  toolDefinitions: DevToolDefinition[],
) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("tool secrets must be valid JSON.");
  }

  if (!isRecord(parsed)) {
    throw new Error("tool secrets must be a JSON object.");
  }

  const secretsByTool = new Map<string, string>();

  for (const tool of toolDefinitions) {
    if (tool.auth_type === "none") {
      continue;
    }

    const candidate = parsed[tool.tool_name];

    if (typeof candidate !== "string" || !candidate.trim()) {
      throw new Error(`tool "${tool.tool_name}" needs a secret value.`);
    }

    secretsByTool.set(tool.tool_name, candidate.trim());
  }

  return secretsByTool;
}

export function validateDeveloperAgentSubmission({
  name,
  shortDescription,
  description,
  promptTemplate,
  model,
  toolDefinitions,
}: {
  name: string;
  shortDescription: string;
  description: string;
  promptTemplate: string;
  model: string;
  toolDefinitions: DevToolDefinition[];
}): AgentValidationReport {
  const issues: string[] = [];

  if (!name.trim()) {
    issues.push("Nombre obligatorio.");
  }

  if (shortDescription.trim().length < 24) {
    issues.push("La descripcion corta debe tener al menos 24 caracteres.");
  }

  if (description.trim().length < 80) {
    issues.push("La descripcion completa debe tener al menos 80 caracteres.");
  }

  if (!promptTemplate.trim()) {
    issues.push("El prompt no puede estar vacio.");
  }

  if (!SUPPORTED_DEV_MODELS.includes(model as OpenAIModelId)) {
    issues.push("El modelo seleccionado no es valido.");
  }

  const prohibitedContentPatterns = [
    /sexual\s*minor/i,
    /child\s*abuse/i,
    /credential\s*stuffing/i,
    /malware/i,
    /ransomware/i,
  ];

  const dangerousPromptPatterns = [
    /ignore previous instructions/i,
    /reveal.*secret/i,
    /exfiltrat/i,
    /bypass/i,
    /steal/i,
  ];

  const combinedText = `${name}\n${shortDescription}\n${description}\n${promptTemplate}`;

  const contentSafetyFailed = prohibitedContentPatterns.some((pattern) =>
    pattern.test(combinedText),
  );
  const promptSafetyFailed = dangerousPromptPatterns.some((pattern) =>
    pattern.test(promptTemplate),
  );
  const securityFailed = toolDefinitions.some((tool) => {
    const target = tool.base_url ?? tool.openapi_spec_url ?? tool.webhook_url;
    return !target || !target.startsWith("https://");
  });

  if (contentSafetyFailed) {
    issues.push("Se detecto contenido prohibido en la submission.");
  }

  if (promptSafetyFailed) {
    issues.push("Se detectaron patrones de prompt peligrosos.");
  }

  if (securityFailed) {
    issues.push("Alguna tool no cumple los requisitos minimos de seguridad.");
  }

  return {
    checks: {
      contentSafety: contentSafetyFailed ? "failed" : "passed",
      promptSafety: promptSafetyFailed ? "failed" : "passed",
      security: securityFailed ? "failed" : "passed",
      schemas: issues.length > 0 ? "failed" : "passed",
    },
    issues,
  };
}
