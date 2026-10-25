type modelsDataResponse = {
    models: {
        name: string;
        model: string;
        size: number;
        size_vram: number; //rest is unnecessary
    }[]
}

export async function modelsData(): Promise<modelsDataResponse | void>{
    try{
        const response = await fetch('http://127.0.0.1:11434/api/ps');
        if(!response.ok) return;
        const data: modelsDataResponse = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching model VRAM usage: ${error}`);
        return;
    }
}