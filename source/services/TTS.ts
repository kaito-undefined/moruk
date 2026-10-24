import { spawn } from "child_process";
import path from "path";
import Speaker from "speaker";
import { cleanTextForTTS } from "../utilities/cleanForTTS";

export class TTS {
    private piperPath: string;
    private modelPath: string;
    
    constructor(){
        this.piperPath = path.join(__dirname, "../../bin/piper/piper.exe");
        this.modelPath = path.join(__dirname, "../../bin/piper/models/tr_TR-dfki-medium.onnx");
    }

    public speak(text: string, cleanText: boolean = true): Promise<void>{
        return new Promise((res, rej) => {
            const piper = spawn(this.piperPath, [
                '--model', this.modelPath,
                '--output_raw'
            ]);

            const speaker = new Speaker({
                channels: 1,
                bitDepth: 16,
                sampleRate: 22050
            });

            piper.stdout.pipe(speaker);
            const textToSpeak = cleanText ? cleanTextForTTS(text) : text;
            piper.stdin.write(textToSpeak);
            piper.stdin.end();

            speaker.on('close', () => {
                res();
            });

            speaker.on('error', error => {
                rej(error);
            });

            piper.on('error', error => {
                rej(error);
            });
        });
    }
}