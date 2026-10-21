import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from "../types";

// Constants for image compression to avoid payload size limits
const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.8;

export const analyzeSafetyImage = async (
  imageFile: File,
  userDescription: string,
  baseUrl?: string
): Promise<AnalysisResult> => {
  try {
    // Compress and convert file to base64
    const { base64, mimeType } = await compressImage(imageFile);
    
    // Initialize AI client
    const aiConfig: any = {
      apiKey: process.env.API_KEY || (process.env as any).GEMINI_API_KEY,
    };
    if (baseUrl && baseUrl.trim() !== '') {
      aiConfig.baseUrl = baseUrl.trim();
    }
    const ai = new GoogleGenAI(aiConfig);

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

    // Helper for executing generateContent with retry
    const executeWithRetry = async (retries = 3, delay = 1500): Promise<any> => {
      try {
        return await ai.models.generateContent({
          model: "gemini-3.5-flash",
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
      } catch (err: any) {
        const errorStr = (err.message || "").toLowerCase() + (JSON.stringify(err) || "").toLowerCase();
        const isTransient = 
          errorStr.includes("503") || 
          errorStr.includes("unavailable") || 
          errorStr.includes("high demand") || 
          errorStr.includes("spikes in demand") ||
          errorStr.includes("rate limit") ||
          errorStr.includes("429");
          
        if (retries > 0 && isTransient) {
          console.warn(`Gemini API is busy. Retrying in ${delay}ms... (${retries} attempts left)`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return executeWithRetry(retries - 1, delay * 2);
        }
        throw err;
      }
    };

    const response = await executeWithRetry();

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
    const errorStr = (error.message || "").toLowerCase() + (JSON.stringify(error) || "").toLowerCase();

    // Handle specific Region/Location errors
    if (errorStr.includes("location is not supported") || errorStr.includes("precondition") || errorStr.includes("400")) {
        errorMessage = "REGION_BLOCKED"; // Specific code to trigger UI handling
    } 
    // Handle 503 / High demand spikes
    else if (errorStr.includes("503") || errorStr.includes("unavailable") || errorStr.includes("high demand") || errorStr.includes("spikes in demand")) {
        errorMessage = "Модель Gemini 3.5 Flash сейчас испытывает высокую нагрузку (503 Service Unavailable). Пожалуйста, повторите попытку через пару секунд.";
    }
    // Handle specific RPC/XHR errors
    else if (errorStr.includes("500") || errorStr.includes("xhr error")) {
        errorMessage = "Ошибка передачи данных. Возможно, сбой сети или файл слишком велик.";
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
            const result = event.target?.result as string;
            const base64 = result.split(',')[1];
            resolve({ base64, mimeType: file.type });
            return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, JPEG_QUALITY);
        const base64 = dataUrl.split(',')[1];

        resolve({ base64, mimeType });
      };
      img.onerror = () => reject(new Error("Failed to load image for compression"));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
  });
};