import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function VRAMUsage(): Promise<{ total: number; used: number; } | void> {
    const psCommand = `powershell -NoProfile -Command "` +
  `$usedBytes = (Get-Counter '\\GPU Adapter Memory(*)\\Dedicated Usage').CounterSamples | Measure-Object -Property CookedValue -Sum | Select-Object -ExpandProperty Sum; ` +
  `$regPath = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\*'; ` +
  `$totalBytes = (Get-ItemProperty -Path $regPath -ErrorAction SilentlyContinue | Where-Object { $_.'HardwareInformation.qwMemorySize' -gt 0 } | Select-Object -First 1 -ExpandProperty 'HardwareInformation.qwMemorySize'); ` +
  `if (-not $totalBytes) { $totalBytes = (Get-ItemProperty -Path $regPath -ErrorAction SilentlyContinue | Where-Object { $_.HardwareInformation_qwMemorySize -gt 0 } | Select-Object -First 1 -ExpandProperty HardwareInformation_qwMemorySize) }; ` +
  `$totalVramMB = if ($totalBytes) { [int64]($totalBytes / 1MB) } else { 0 }; ` +
  `$usedVramMB = [int64]($usedBytes / 1MB); ` +
  `[PSCustomObject]@{ TotalMB = $totalVramMB; UsedMB = $usedVramMB } | ConvertTo-Json"`;
  
    try{
        const { stdout } = await execAsync(psCommand);
        const data = JSON.parse(stdout.trim());
        const total = Array.isArray(data.TotalMB) ? data.TotalMB[0] : data.TotalMB;
        const used = Array.isArray(data.UsedMB) ? data.UsedMB[0] : data.UsedMB;
        return { total, used };
    } catch (error) {
        console.error("VRAM bilgisi okunamadı:", error);
    }
}