import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Constants for image compression to avoid payload size limits
const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.8;

export const analyzeSafetyImage = async (
  imageFile: File,
  userDescription: string
): Promise<AnalysisResult> => {
  try {
    // Compress and convert file to base64
    // This avoids "Rpc failed due to xhr error" (code 6) caused by large payloads
    const { base64, mimeType } = await compressImage(imageFile);
    
    const systemInstruction = `
Ты — эксперт высшей категории по промышленной безопасности и требованиям российского законодательства, в частности Федеральных норм и правил (ФНП) в области промышленной безопасности.
Твоя задача — анализировать предоставленное изображение и описание на предмет нарушений.
Опирайся на актуальные нормы, доступные в базе https://docs.cntd.ru.

Структура твоего ответа ДОЛЖНА быть строго следующей:

1.  **Анализ изображения**: Кратко опиши, что ты видишь, и какие технические элементы присутствуют.
2.  **Соответствие требованиям ФНП**: Укажи, какие нормы регулируют данный объект/ситуацию.
3.  **Перечень нарушений**:
    *   Если есть нарушения: перечисли их списком, указывая точное название документа, номер пункта/подпункта ФНП и суть нарушения.
    *   Если нарушений нет: явно напиши "Нарушений визуально не выявлено" и укажи, какие требования соблюдены.
4.  **Рекомендации**: Конкретные шаги для устранения нарушений или поддержания безопасности.
5.  **Уровень риска**: Напиши только одно слово из трех: "Низкий", "Средний" или "Высокий". После этого слова через тире напиши краткое обоснование.

ВАЖНО: Будь объективен. Если по фото нельзя сделать однозначный вывод, укажи на необходимость дополнительной инструментальной проверки.
    `;

    const prompt = `
Описание от пользователя: "${userDescription}".
Проанализируй приложенное изображение на предмет нарушений ФНП.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Low temperature for more factual/analytical responses
      },
    });

    const text = response.text || "Не удалось получить ответ от модели.";
    
    // Basic heuristic to determine risk level for UI coloring
    let riskLevel: AnalysisResult['riskLevel'] = 'unknown';
    if (text.toLowerCase().includes('уровень риска: высокий') || text.toLowerCase().includes('риск: высокий')) {
      riskLevel = 'high';
    } else if (text.toLowerCase().includes('уровень риска: средний') || text.toLowerCase().includes('риск: средний')) {
      riskLevel = 'medium';
    } else if (text.toLowerCase().includes('уровень риска: низкий') || text.toLowerCase().includes('риск: низкий')) {
      riskLevel = 'low';
    }

    return {
      markdown: text,
      riskLevel,
    };

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    
    let errorMessage = "Не удалось выполнить анализ.";
    // Handle specific RPC/XHR errors commonly caused by size or network
    if (error.message?.includes("500") || error.message?.includes("xhr error")) {
        errorMessage = "Ошибка передачи данных. Возможно, файл слишком сложный для обработки или произошел сбой сети. Мы автоматически сжали изображение, но если ошибка повторяется, попробуйте другое фото.";
    } else {
        errorMessage = error.message || "Произошла неизвестная ошибка при обращении к ИИ.";
    }

    throw new Error(errorMessage);
  }
};

/**
 * Compresses and resizes an image file to reduce payload size.
 * Returns base64 string and mime type (always image/jpeg).
 */
const compressImage = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if larger than max dimension
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round((height *= MAX_DIMENSION / width));
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round((width *= MAX_DIMENSION / height));
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            // If canvas context fails, fallback to original (risky but better than crashing)
            const result = event.target?.result as string;
            const base64 = result.split(',')[1];
            resolve({ base64, mimeType: file.type });
            return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with reduced quality
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, JPEG_QUALITY);
        // Remove prefix "data:image/jpeg;base64,"
        const base64 = dataUrl.split(',')[1];

        resolve({ base64, mimeType });
      };
      img.onerror = () => reject(new Error("Failed to load image for compression"));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
  });
};
