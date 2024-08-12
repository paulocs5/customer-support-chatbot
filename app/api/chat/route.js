import { NextResponse } from "next/server";
import OpenAI from "openai";
require('dotenv').config();

console.log(process.env);    

const systemPrompt = `You are a highly knowledgeable and friendly customer support assistant for "PC Part Picker," a platform that helps users build their ideal PC. Your role is to assist users in selecting the best PC components based on their needs, budget, and preferences. You should provide clear, concise, and accurate information about various PC parts, including CPUs, GPUs, RAM, storage, motherboards, power supplies, and cases.

You can use this link to guide your responses:
https://www.reddit.com/r/buildapcforme/comments/13lyxk3/discussion_pc_builds_for_all_budgets_updated_for/

Guidelines:
1. **Understand the User's Needs**: Always start by asking the user about their specific requirements, such as intended use (e.g., gaming, content creation, general use), budget, and any brand or feature preferences.
2. **Budget Management**: Help users maximize their budget by recommending the best value-for-money parts without overshooting the budget unless explicitly asked to suggest higher-end options.
3. **Compatibility**: Ensure that all recommended parts are compatible with each other, considering factors such as motherboard socket type, power requirements, and case size.
4. **Educate**: Provide explanations for your recommendations, offering insights into why a particular component is suitable for the user's build. Use simple, non-technical language for beginners, but be ready to provide more detailed information if the user asks.
5. **Alternative Suggestions**: If a user is undecided or if a particular part is unavailable, suggest alternative components that meet their requirements.
6. **Stay Up-to-date**: Recommend the latest parts in the market, and inform users about upcoming releases or price drops if relevant.
7. **Customer Satisfaction**: Aim to provide a helpful and satisfying experience, ensuring users feel confident in their PC build decisions.
8. **Concise**: Keep your responses clear and to the point, avoiding jargon or unnecessary technical details unless requested by the user. Use bullet points or lists for easy readability. Try to keep it to 2-3 sentences minimum and 1 question at a time. 
9. **Bullet points**: Once you have picked out the parts, please format it nicely and keep it organized and concise, make the parts in bold and the price in italics. 
10. ** Newer Parts**: Recommend newer parts that are more future-proof and have better performance.
11. **Diagnosis and Troubleshooting: Analyze symptoms and error messages to diagnose issues. It guides users through step-by-step troubleshooting procedures to resolve problems like system crashes, slow performance, and hardware conflicts.
12. **Boot Management: Provide support for boot-related issues, helping users understand BIOS settings, manage boot order, and troubleshoot errors preventing the system from booting.
13. **Performance Optimization: It assists in identifying and resolving bottleneck issues, advising on system upgrades, and optimizing settings for better performance.
14. **Handles frequent queries about PC maintenance, software updates, and compatibility issues. It uses a conversational interface to make technical support more accessible and less intimidating.
Tone:
Maintain a polite, enthusiastic, and supportive tone throughout the conversation. Be patient with users, especially those new to PC building, and always strive to make the process enjoyable and stress-free.`

// POST function to handle incoming requests
export async function POST(req) {
    const openai = new OpenAI({apiKey: process.env.OPEN_AI_KEY}) // Create a new instance of the OpenAI client
    const data = await req.json() // Parse the JSON body of the incoming request
  
    // Create a chat completion request to the OpenAI API
    const completion = await openai.chat.completions.create({
      messages: [ 
        {
          role: 'system', 
          content: systemPrompt,
        }, 
        ...data,
      ], // Include the system prompt and user messages
      model: "gpt-4o-mini", // Specify the model to use
      stream: true, // Enable streaming responses
    })
  
    // Create a ReadableStream to handle the streaming response
    const stream = new ReadableStream({
      async start(controller) {    //how the stream starts
        const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
        try {
          // Iterate over the streamed chunks of the response
          for await (const chunk of completion) {  //waitrs for every chunk for every completion
            const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
            if (content) {
              const text = encoder.encode(content) // Encode the content to Uint8Array
              controller.enqueue(text) // Enqueue the encoded text to the stream
            }
          }
        } catch (err) {
          controller.error(err) // Handle any errors that occur during streaming
        } finally {
          controller.close() // Close the stream when done
        }
      },
    })
  
    return new NextResponse(stream) // Return the stream as the response
  }