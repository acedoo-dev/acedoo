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

  const { problem, imageBase64, mediaType } = await request.json();

  const prompt = `Tu es un professeur de niveau CEGEP en sciences. Voici un problème :

${problem}

L'étudiant a soumis sa démarche en photo.

Commence ta réponse par "**Score : X/100**" (remplace X par la note entière).

Évalue uniquement la démarche dans la photo selon ces critères :
- Compréhension du concept (40%)
- Justesse des étapes (30%)
- Justesse du résultat final (20%)
- Clarté et présentation (10%)

Sois précis et objectif. Si la démarche est manquante ou illisible, score = 0.

Ensuite :
1. Identifie les étapes correctes
2. Identifie les étapes incorrectes ou manquantes
3. Donne UN conseil constructif pour s'améliorer

Ton encourageant mais précis, comme un bon prof.
Format markdown, en français.`;

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      }],
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
      status === 401 ? 'Clé API invalide. Vérifiez ANTHROPIC_API_KEY dans .env.local.' :
      status === 429 ? "Limite de l'API Anthropic atteinte. Réessaie dans un moment." :
      'Erreur serveur inattendue.';
    return Response.json({ error: msg }, { status });
  }
}
