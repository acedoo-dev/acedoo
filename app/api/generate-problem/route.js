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

  const { subject, course, chapter, concept, manuel, difficulty, mode, similarTo } = await request.json();

  const similarClause = similarTo
    ? `\n\nGénère un contenu DIFFÉRENT mais sur le même concept (ne pas répéter les mêmes valeurs numériques ni le même énoncé) :\n${similarTo.slice(0, 300)}`
    : '';

  let prompt;
  let maxTokens;

  if (mode === 'apprendre') {
    maxTokens = 2048;
    prompt = `Tu es un tuteur pédagogique pour étudiants en sciences de la nature au CEGEP au Québec. Explique en détail le concept suivant : '${concept}'.

Cours : ${subject} — ${course}
Chapitre : ${chapter}
Manuel de référence : ${manuel}

Ton explication doit :
- Définir clairement le concept
- Expliquer l'intuition physique ou mathématique sous-jacente
- Présenter les formules clés avec LaTeX (entre $ ... $ pour l'inline, et $$ ... $$ pour les équations display)
- Donner un ou deux exemples concrets avec des valeurs numériques
- Souligner les erreurs fréquentes des étudiants
- Être claire, structurée et adaptée au niveau CEGEP

Format markdown.${similarClause}`;
  } else {
    const lengthInstr = mode === 'longues'
      ? "Le problème doit être multi-étapes, approfondi, et représentatif d'un problème de synthèse ou d'examen final."
      : 'Le problème doit être court et direct, avec une ou deux étapes de calcul maximum.';
    maxTokens = mode === 'longues' ? 1536 : 1024;

    prompt = `Tu es un générateur de problèmes pour étudiants en sciences de la nature au CEGEP au Québec. Génère UN problème de niveau CEGEP en français sur le concept précis suivant : '${concept}'.

Cours : ${subject} — ${course}
Chapitre : ${chapter}
Manuel de référence : ${manuel}

Le problème doit :
- Inclure des données numériques concrètes
- Demander une résolution étape par étape
- Utiliser LaTeX (entre $ ... $ pour l'inline, et $$ ... $$ pour les équations display)
- Être de difficulté ${difficulty}
- ${lengthInstr}

Retourne uniquement le problème, sans solution. Format markdown.${similarClause}`;
  }

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
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
