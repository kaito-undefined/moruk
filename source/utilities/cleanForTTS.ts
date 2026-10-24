export function cleanTextForTTS(text: string): string {
  return (
    text
      .replace(/```[\s\S]*?```/g, " Kod bloğunu ekrana yazdırdım. ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[#*_\-\>~]/g, " ")
      .replace(/https?:\/\/\S+/g, " bağlantı ")
      .replace(/%(\d+)/g, " yüzde $1 ")
      .replace(/%/g, " yüzde ")
      .replace(/\+/g, " artı ")
      .replace(/\-/g, " eksi ")
      .replace(/\*/g, " çarpı ")
      .replace(/\//g, " bölü ")
      .replace(/=/g, " eşittir ")
      .replace(/&/g, " ve ")
      .replace(/@/g, " et ")
      .replace(/\$/g, " dolar ")
      .replace(/€/g, " euro ")
      .replace(/₺/g, " lira ")
      .replace(/\s+/g, " ")
      .trim()
  );
}