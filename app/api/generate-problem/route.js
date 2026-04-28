import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(request) {
  const { subject, difficulty, similarTo } = await request.json();

  const similarClause = similarTo
    ? `\n- Génère un problème DIFFÉRENT mais sur un concept similaire à celui-ci (ne pas répéter les mêmes valeurs numériques ni le même énoncé) :\n${similarTo.slice(0, 300)}`
    : '';

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Tu es un professeur de CÉGEP en Sciences de la Nature au Québec. Génère UN problème de pratique pour le cours "${subject}".

Exigences :
- En français
- Niveau CÉGEP (première ou deuxième session)
- Difficulté : ${difficulty}
- Formules mathématiques en LaTeX : $...$ pour l'inline, $$...$$ pour le display
- Format Markdown (utilise **gras**, listes si nécessaire)
- Inclure seulement la question, sans la solution
- Être précis, réaliste et pédagogique${similarClause}`,
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
}
