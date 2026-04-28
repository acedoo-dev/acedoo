import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit } from '../../../lib/rateLimit.js';

const client = new Anthropic();

export async function POST(request) {
  const { allowed, retryAfter } = checkRateLimit(request);
  if (!allowed) {
    return Response.json(
      { error: 'Trop de requêtes. Réessaie dans ' + retryAfter + ' secondes.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  const { subject, problem } = await request.json();

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Tu es un professeur de CÉGEP en Sciences de la Nature au Québec. Voici un problème du cours "${subject}" :

${problem}

Donne UN seul indice qui aide l'étudiant à débloquer sans révéler la réponse. L'indice doit :
- Nommer le concept ou la loi clé à appliquer
- Suggérer par où commencer sans donner les étapes
- Tenir en 2-3 phrases maximum
En français, Markdown, LaTeX si nécessaire ($...$ ou $$...$$).`,
        },
      ],
    });

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    const status = err.status ?? 500;
    const msg =
      status === 401 ? 'Clé API invalide.' :
      status === 429 ? 'Limite de l\'API Anthropic atteinte.' :
      'Erreur serveur inattendue.';
    return Response.json({ error: msg }, { status });
  }
}
