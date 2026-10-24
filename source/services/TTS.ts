import { spawn } from "child_process";
import { EdgeTTS } from "node-edge-tts";
import path from "path";
import sound from "sound-play";
import fs from "fs";
import { cleanTextForTTS } from "../utilities/cleanForTTS";

type Provider = "piper" | "edge";

export class TTS {
    private piperPath: string;
    private piperModelPath: string;
    private edgeTTS: EdgeTTS;
    private tempAudioDir: string;
    
    constructor(){
        this.piperPath = path.join(__dirname, "../../bin/piper/piper.exe");
        this.piperModelPath = path.join(__dirname, "../../bin/piper/models/tr_TR-dfki-medium.onnx");

        this.edgeTTS = new EdgeTTS({
            voice: "tr-TR-AhmetNeural",
            lang: "tr-TR",
            outputFormat: "audio-24khz-48kbitrate-mono-mp3"
        });

        this.tempAudioDir = path.join(__dirname, "../../temp/TTS");
        if(!fs.existsSync(this.tempAudioDir)) fs.mkdirSync(this.tempAudioDir, { recursive: true });
    }

    public async speak(text: string, provider: Provider, cleanText: boolean = true): Promise<void>{
        const textToSpeak = cleanText ? cleanTextForTTS(text) : text;
        const timestamp = Date.now();
        if(provider === 'edge'){
            const filePath = path.join(this.tempAudioDir, `speech_${timestamp}.mp3`);
            try{
                await this.edgeTTS.ttsPromise(textToSpeak, filePath);
                await sound.play(filePath);
            }finally{
                if(fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        } else {
            const filePath = path.join(this.tempAudioDir, `speech_${timestamp}.wav`);
            try{
                await this.generatePiperAudio(textToSpeak, filePath);
                await sound.play(filePath);
            }finally{
                if(fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        }
    }

    private generatePiperAudio(text: string, outputPath: string): Promise<void> {
        return new Promise((res, rej) => {
            const piper = spawn(this.piperPath, [
                '--model', this.piperModelPath,
                '--output_file', outputPath,
                "--length_scale", "0.95",
            ]);

            piper.stdin.write(text);
            piper.stdin.end();

            piper.on('close', code => {
                if(code === 0){
                    res();
                } else {
                    rej(new Error(`Piper process exited with code ${code}`));
                }
            });

            piper.on('error', error => rej(error));
        });
    }
}