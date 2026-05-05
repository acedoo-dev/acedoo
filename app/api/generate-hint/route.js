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
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Tu es un tuteur de niveau CÉGEP en sciences. Voici un problème :
${problem}

Donne UN indice court (1-3 phrases max) qui aide l'étudiant à démarrer la résolution SANS révéler la réponse. Identifie le concept clé ou la formule à utiliser. Ton encourageant, comme un bon prof. En français. Markdown et LaTeX si nécessaire ($...$ ou $$...$$).`,
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
