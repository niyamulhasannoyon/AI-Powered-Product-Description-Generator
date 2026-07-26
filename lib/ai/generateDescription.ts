import OpenAI from 'openai';

export const DEFAULT_SYSTEM_PROMPT_TEMPLATE = `You are an expert e-commerce copywriter and SEO specialist. Given a product image and these keywords: {{keywords}}, write in {{language}} with a {{tone}} tone. Return ONLY valid JSON with keys: title (max 60 chars, SEO-optimized), description (150-300 words, benefit-driven), tags (8-12 relevant SEO tags), seoMetaDescription (max 160 chars).`;

export interface GenerateDescriptionParams {
  imageUrl: string;
  keywords: string[];
  language: string;
  tone: string;
  systemPromptTemplate?: string;
}

export interface GeneratedProductResponse {
  title: string;
  description: string;
  tags: string[];
  seoMetaDescription: string;
  tokensUsed: number;
}

export interface PromptValidationResult {
  isValid: boolean;
  missingKeys: string[];
}

export function validatePromptTemplate(templateText: string): PromptValidationResult {
  const requiredKeys = ['title', 'description', 'tags', 'seoMetaDescription'];
  const missingKeys: string[] = [];
  const lowerText = (templateText || '').toLowerCase();

  for (const key of requiredKeys) {
    if (!lowerText.includes(key.toLowerCase())) {
      missingKeys.push(key);
    }
  }

  return {
    isValid: missingKeys.length === 0,
    missingKeys,
  };
}

export function buildSystemPrompt(
  templateText: string,
  keywords: string[],
  language: string,
  tone: string
): string {
  const keywordsStr = keywords.length > 0 ? keywords.join(', ') : 'N/A';
  return templateText
    .replace('{{keywords}}', keywordsStr)
    .replace('{{language}}', language)
    .replace('{{tone}}', tone);
}

function parseAndValidateJson(rawText: string) {
  let cleaned = rawText.trim();

  // Strip markdown code fences if present (e.g. ```json ... ```)
  if (cleaned.includes('```')) {
    cleaned = cleaned.replace(/^[\s\S]*?```(?:json)?\n?/, '').replace(/\n?```[\s\S]*$/, '').trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch (innerErr) {
        throw new Error(`Failed to parse AI JSON response: ${rawText}`);
      }
    } else {
      throw new Error(`Failed to parse AI JSON response: ${rawText}`);
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Parsed response is not a valid object');
  }

  // Unwrap nested wrapper objects (e.g., { "response": { ... } } or { "product": { ... } })
  if (!parsed.title && !parsed.Title && !parsed.product_title && !parsed.productTitle) {
    const keys = Object.keys(parsed);
    for (const key of keys) {
      if (parsed[key] && typeof parsed[key] === 'object' && !Array.isArray(parsed[key])) {
        const subObj = parsed[key];
        if (subObj.title || subObj.Title || subObj.product_title || subObj.productTitle || subObj.description) {
          parsed = subObj;
          break;
        }
      }
    }
  }

  const title = String(
    parsed.title || parsed.Title || parsed.product_title || parsed.productTitle || parsed.name || ''
  ).trim();

  const description = String(
    parsed.description || parsed.Description || parsed.product_description || parsed.productDescription || parsed.summary || ''
  ).trim();

  let tagsRaw = parsed.tags || parsed.Tags || parsed.seo_tags || parsed.seoTags || parsed.keywords;
  let tags: string[] = [];
  if (Array.isArray(tagsRaw)) {
    tags = tagsRaw.map((t) => String(t).trim()).filter(Boolean);
  } else if (typeof tagsRaw === 'string') {
    tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
  }
  if (tags.length === 0 && title) {
    tags = title.split(/\s+/).filter((w) => w.length > 3);
  }

  let seoMetaDescription = String(
    parsed.seoMetaDescription ||
      parsed.seo_meta_description ||
      parsed.metaDescription ||
      parsed.meta_description ||
      parsed.seoDescription ||
      description.slice(0, 160)
  ).trim();

  if (!title) {
    throw new Error('Invalid or missing "title" in AI response');
  }
  if (!description) {
    throw new Error('Invalid or missing "description" in AI response');
  }

  return {
    title,
    description,
    tags,
    seoMetaDescription,
  };
}

export async function generateDescription(
  params: GenerateDescriptionParams
): Promise<GeneratedProductResponse> {
  const provider = (process.env.AI_PROVIDER || (process.env.MISTRAL_API_KEY ? 'mistral' : 'openai')).toLowerCase();

  if (provider === 'gemini') {
    return generateWithGemini(params);
  }

  if (provider === 'mistral' || (!process.env.OPENAI_API_KEY && process.env.MISTRAL_API_KEY)) {
    return generateWithMistral(params);
  }

  return generateWithOpenAI(params);
}

async function generateWithOpenAI(
  params: GenerateDescriptionParams
): Promise<GeneratedProductResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'OPENAI_API_KEY is not configured in environment variables. Please add your key to .env file.'
    );
  }

  const openai = new OpenAI({ apiKey });

  const template = params.systemPromptTemplate || DEFAULT_SYSTEM_PROMPT_TEMPLATE;
  const systemPrompt = buildSystemPrompt(template, params.keywords, params.language, params.tone);

  let attempt = 0;
  let lastError: Error | null = null;
  let tokensUsed = 0;

  while (attempt < 2) {
    attempt++;
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this product image and generate the title, description, tags, and seoMetaDescription in JSON format following the system prompt instructions.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: params.imageUrl,
                },
              },
            ],
          },
        ],
        temperature: 0.7,
      });

      const usage = response.usage;
      if (usage) {
        tokensUsed += usage.total_tokens || (usage.prompt_tokens + usage.completion_tokens);
      } else {
        tokensUsed += 450;
      }

      const content = response.choices[0]?.message?.content || '';
      const parsed = parseAndValidateJson(content);
      return {
        ...parsed,
        tokensUsed,
      };
    } catch (err: any) {
      lastError = err;
      // If first attempt failed on JSON parsing error or unexpected output, loop will retry once.
      if (attempt >= 2) {
        throw new Error(`AI generation failed: ${err?.message || err}`);
      }
    }
  }

  throw lastError || new Error('AI generation failed after 2 attempts.');
}

async function generateWithMistral(
  params: GenerateDescriptionParams
): Promise<GeneratedProductResponse> {
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'MISTRAL_API_KEY is not configured in environment variables. Please add your key to .env file.'
    );
  }

  const mistral = new OpenAI({
    apiKey,
    baseURL: 'https://api.mistral.ai/v1',
  });

  const template = params.systemPromptTemplate || DEFAULT_SYSTEM_PROMPT_TEMPLATE;
  const systemPrompt = buildSystemPrompt(template, params.keywords, params.language, params.tone);

  let attempt = 0;
  let lastError: Error | null = null;
  let tokensUsed = 0;

  while (attempt < 2) {
    attempt++;
    try {
      const response = await mistral.chat.completions.create({
        model: process.env.MISTRAL_MODEL || 'pixtral-12b-2409',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this product image and generate the title, description, tags, and seoMetaDescription in JSON format following the system prompt instructions.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: params.imageUrl,
                },
              },
            ],
          },
        ],
        temperature: 0.7,
      });

      const usage = response.usage;
      if (usage) {
        tokensUsed += usage.total_tokens || ((usage.prompt_tokens || 0) + (usage.completion_tokens || 0));
      } else {
        tokensUsed += 450;
      }

      const content = response.choices[0]?.message?.content || '';
      const parsed = parseAndValidateJson(content);
      return {
        ...parsed,
        tokensUsed,
      };
    } catch (err: any) {
      lastError = err;
      if (attempt >= 2) {
        throw new Error(`AI generation failed: ${err?.message || err}`);
      }
    }
  }

  throw lastError || new Error('AI generation failed after 2 attempts.');
}

async function generateWithGemini(
  params: GenerateDescriptionParams
): Promise<GeneratedProductResponse> {
  // Stub for swapping in Gemini API provider via AI_PROVIDER="gemini"
  throw new Error(
    'Gemini AI Provider selected. Please set AI_PROVIDER="openai" or configure Gemini SDK credentials.'
  );
}
