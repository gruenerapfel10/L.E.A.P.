import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { tools, NodeCreationSchema } from './tools';

// Response schema for AI actions
export const AIResponseSchema = z.object({
  action: z.enum(['create_node', 'update_node', 'delete_node', 'connect_nodes', 'none']),
  parameters: z.any(),
  reasoning: z.string(),
  nextAction: z.string().optional(),
});

export type AIResponse = z.infer<typeof AIResponseSchema>;

export async function processAIRequest(prompt: string): Promise<AIResponse> {
  try {
    const { object } = await generateObject({
      model: google('gemini-1.5-pro'),
      schema: AIResponseSchema,
      prompt: `You are an AI assistant helping users manage a canvas of nodes. Available tools: ${JSON.stringify(tools)}. 
      Based on the user's request: "${prompt}", determine the appropriate action to take.
      If no action is needed, return action: "none". Include your reasoning.`,
      temperature: 0.7,
    });

    return object;
  } catch (error) {
    console.error('Error processing AI request:', error);
    return {
      action: 'none',
      parameters: {},
      reasoning: 'Failed to process request due to an error.',
    };
  }
} 