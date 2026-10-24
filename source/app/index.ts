import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { TTS } from "../services/TTS.js";

type RouterResponse = {
    should_execute: boolean;
    reply: string;
};

type Tool = { tool: OpenAI.Chat.Completions.ChatCompletionFunctionTool, function: (args: any) => any }

const client = new OpenAI({
    baseURL: 'http://127.0.0.1:11434/v1',
    apiKey: 'ollama',
});

const MODELS = {
    'router': 'qwen2.5:1.5b',
    'executer': 'llama3.1:8b',
}

let tools: OpenAI.Chat.Completions.ChatCompletionFunctionTool[] = [];
let functions = new Map<string, (args: any) => any>();

async function router(prompt: string): Promise<RouterResponse>{
    const response = await client.chat.completions.create({
        model: MODELS.router,
        messages: [
            {
                role: 'system',
                content: 'You are a router model that decides whether to route the prompt to the executer model or not. If the prompt requires writing code, executing code, creating files, or complex task planning, return should_execute as true. Otherwise, return should_execute as false and provide a reply answering the prompt. You are also an expert in Turkish language and culture.'
            },
            { role: 'user', content: prompt }
        ],
        response_format: {
            type: 'json_schema',
            json_schema: {
                name: 'router_response',
                strict: true,
                schema: {
                    type: 'object',
                    anyOf: [
                        {
                            properties: {
                                should_execute: { type: "boolean", enum: [true] },
                                reply: { type: "string", enum: [""] }
                            },
                            required: ["should_execute", "reply"],
                            additionalProperties: false
                        },
                        {
                            properties: {
                                should_execute: { type: "boolean", enum: [false] },
                                reply: { type: "string" }
                            },
                            required: ["should_execute", "reply"],
                            additionalProperties: false
                        }
                    ]
                },
            }
        }
    });
    try{
        const rawResponse = response.choices[0].message?.content;
        if (!rawResponse) throw new Error('No content in router response');
        const routerResponse: RouterResponse = JSON.parse(rawResponse);
        return routerResponse;
    }catch(error){
        console.error(`Error parsing router response: ${error}`);
        return {
            should_execute: false,
            reply: `Error parsing router response: ${error}`
        }
    }
}

async function executer(prompt: string): Promise<string | null>{
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =  [
        {
            role: 'system',
            content: 'You are an expert in executing code and solving programming problems. You are also an expert in Turkish language and culture.'
        },
        { role: 'user', content: prompt }
    ];
    const response = await client.chat.completions.create({
        model: MODELS.executer,
        messages: messages,
        tools: tools,
        tool_choice: 'auto',
    });
    const { message } = response.choices[0];
    if(message.tool_calls && message.tool_calls.length > 0){
        messages.push(message);
        function pushMessage(id: string, content: string){
            messages.push({
                role: 'tool',
                tool_call_id: id,
                content: content
            });
        }
        for(const toolCall of message.tool_calls){
            if(toolCall.type !== 'function') continue;
            let { name, arguments: args } = toolCall.function;
            try{
                args = JSON.parse(args);
            } catch (error) {
                console.error(`Error parsing tool call arguments: ${error}`);
                pushMessage(toolCall.id, JSON.stringify({ error: `Invalid JSON arguments: ${error}` }));
                continue;
            }
            const toolFunction = functions.get(name);
            if(!toolFunction){
                console.error(`No function found for tool: ${name}`);
                pushMessage(toolCall.id, JSON.stringify({ error: `No function found for tool: ${name}` }));
                continue;
            }
            const functionResult = await toolFunction(args);
            pushMessage(toolCall.id, (
                typeof functionResult === 'undefined' || functionResult === null
                ? JSON.stringify({ status: 'completed' })
                : (typeof functionResult === 'string' ? functionResult : JSON.stringify(functionResult))
            ));
        }
        const finalResponse = await client.chat.completions.create({
            model: MODELS.executer,
            messages: messages
        });
        return finalResponse.choices[0].message.content;
    } else {
        return message.content;
    }
}

async function handlePrompt(prompt: string): Promise<string>{
    console.log(`Received prompt: ${prompt}`);
    const routerResponse = await router(prompt);
    if(routerResponse.should_execute){
        console.log('Routing to executer...');
        const reply = await executer(prompt);
        if(reply){
            return reply;
        } else {
            return 'No reply from executer.';
        }
    } else {
        return routerResponse.reply;
    }
}

async function loadTools(){
    const toolsDir = path.join(__dirname, '../tools/executer');
    const toolFiles = fs.readdirSync(toolsDir).filter(file => file.endsWith('.js'));
    for(const file of toolFiles){
        const toolPath = path.join(toolsDir, file);
        const importedTool = await import(pathToFileURL(toolPath).href);
        const tool = importedTool.default.default as Tool;
        tools.push(tool.tool);
        functions.set(tool.tool.function.name, tool.function);
    }
}

async function run(){
    const tts = new TTS();
    await loadTools();
    const response1 = await handlePrompt("Merhaba, nasılsın?");
    console.log(response1);
    await tts.speak(response1);
    const response2 = await handlePrompt("JavaScript'te bir faktoriyel fonksiyonun nasıl tanımlandığını ve çağrıldığını gösteren bir örnek ver.");
    console.log(response2);
    await tts.speak(response2);
}

run();