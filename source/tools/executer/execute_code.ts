import type { ChatCompletionFunctionTool } from "openai/resources/chat/completions";

async function executeCode(args: { code: string }){
    console.log(`Running code: ${args.code}`);
    return 'Code executed successfully.';
}

const tool: ChatCompletionFunctionTool = {
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
};

export default {
    tool: tool,
    function: executeCode
}