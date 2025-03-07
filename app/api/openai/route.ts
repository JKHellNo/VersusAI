import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

interface DebateRequest {
  topic: string;
  messages: ChatCompletionMessageParam[];
  round: number;
  isProTurn: boolean;
}

// Generate a system prompt for the debate based on turn number
const generateDebatePrompt = (topic: string, round: number, isProTurn: boolean, messageCount: number) => {
  // Hard-coded order of speakers: Pro, Con, Con, Pro, Pro, Con, Con, Pro
  const speakerOrder = [
    'pro', 'con', 'con', 'pro', 'pro', 'con', 'con', 'pro'
  ];
  
  // Calculate which turn we're on (1-8)
  // We need to determine the turn number based on the message count
  // Each visible message is one turn, and we're about to generate the next one
  const turnNumber = messageCount + 1;
  
  // Determine if this is a Pro or Con turn based on the hard-coded order
  const isPro = turnNumber <= speakerOrder.length ? speakerOrder[turnNumber - 1] === 'pro' : turnNumber % 2 === 1;
  
  const baseContext = `You are participating in a structured debate about: '${topic}'.
Your role is to ${isPro ? 'support (Pro)' : 'oppose (Con)'} this topic.
Keep responses concise (max 2-3 sentences) and focused on key points.`;

  switch(turnNumber) {
    case 1:
      return `${baseContext}
You are giving the Pro opening argument. Present your initial supporting arguments clearly and persuasively.`;
    
    case 2:
      return `${baseContext}
You are giving the Con opening argument. Present your initial opposing arguments and address the Pro's points.`;
    
    case 3:
      return `${baseContext}
You are giving the Con rebuttal. Respond directly to the Pro's opening arguments with counterpoints.`;
    
    case 4:
      return `${baseContext}
You are giving the Pro rebuttal. Counter the Con's arguments and defend your original points.`;
    
    case 5:
      return `${baseContext}
You are giving the Pro reinforcement. Introduce additional supporting evidence and strengthen your position.`;
    
    case 6:
      return `${baseContext}
You are reinforcing your position. Strengthen your arguments with additional evidence.`;
    
    case 7:
      return `${baseContext}
    You are delivering your closing argument for your position in a professional debate tournament or club. Summarize your strongest points in a compelling final statement that clearly marks the conclusion of your argument.`;

    case 8:
      return `${baseContext}
    You are delivering your closing argument for the opposing position in a professional debate tournament or club. Address key counterarguments and reinforce your stance with a definitive final statement that marks the end of your debate.`;

  default:
    return baseContext;
  }
};

export async function POST(req: Request) {
  try {
    const { topic, messages, round = 1, isProTurn }: DebateRequest = await req.json();

    // Filter out system messages from the conversation history
    const conversationHistory = messages.filter(m => m.role !== 'system');
    
    const systemPrompt = generateDebatePrompt(topic, round, isProTurn, conversationHistory.length);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...conversationHistory,
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 150,
    });

    // Convert the response into a text-stream
    const stream = OpenAIStream(response);
    
    // Respond with the stream
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate response' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
