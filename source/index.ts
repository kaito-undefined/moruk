import OpenAI from "openai";
import fs from "fs";
import path from "path";

const client = new OpenAI({
    baseURL: 'http://127.0.0.1:11434/v1',
    apiKey: 'ollama',
});

const MODELS = {
    'router': 'qwen2.5:1.5b',
    'executer': 'llama3.1:8b',
}

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
        type: 'function',
        function: {
            name: 'execute_code',
            description: 'Execute code in a secure sandbox environment',
            parameters: {
                type: 'object',
                properties: {
                    code: {
                        type: 'string',
                        description: 'The code to execute'
                    }
                },
                required: ['code']
            }
        }
    }
];

async function router(prompt: string): Promise<boolean>{
    const response = await client.chat.completions.create({
        model: MODELS.router,
        messages: [],
        response_format: {
            type: 'json_object',
        }
    });
    return true;
}

async function executer(prompt: string){

}

async function handlePrompt(prompt: string){
    console.log(`Received prompt: ${prompt}`);
    const shouldExecute = await router(prompt);
    if(shouldExecute){
        console.log('Routing to executer...');
        await executer(prompt);
    }
}

async function run(){
    await handlePrompt("Hi, how are you?");
    await handlePrompt("Write a function that calculates the factorial of a number in Python.");
}

run();