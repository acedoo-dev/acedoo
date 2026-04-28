import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(request) {
  const { subject, problem } = await request.json();

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-5',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Tu es un professeur de CÉGEP en Sciences de la Nature au Québec. Voici un problème du cours "${subject}" :

${problem}

Fournis la solution complète et détaillée, étape par étape. En français, avec les formules mathématiques en LaTeX ($...$ pour l'inline, $$...$$ pour le display). Format Markdown.`,
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
