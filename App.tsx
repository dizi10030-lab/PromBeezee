import React, { useState } from 'react';
import Header from './components/Header';
import SafetyForm from './components/SafetyForm';
import ReportView from './components/ReportView';
import { analyzeSafetyImage } from './services/geminiService';
import { AnalysisState } from './types';
import { Settings, Save } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AnalysisState>({
    isLoading: false,
    error: null,
    result: null,
  });

  const [baseUrl, setBaseUrl] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isRegionBlocked, setIsRegionBlocked] = useState<boolean>(false);

  const handleAnalyze = async (file: File, description: string) => {
    setState({ isLoading: true, error: null, result: null });
    setIsRegionBlocked(false);
    
    try {
      const result = await analyzeSafetyImage(file, description, baseUrl);
      setState({ isLoading: false, error: null, result });
    } catch (err: any) {
      let errorMessage = err.message || "Произошла ошибка при анализе.";
      
      if (errorMessage === "REGION_BLOCKED") {
        errorMessage = "Доступ к API ограничен в вашем регионе (Error 400). Пожалуйста, настройте адрес прокси-сервера (Base URL) ниже.";
        setIsRegionBlocked(true);
        setShowSettings(true);
      }

      setState({ 
        isLoading: false, 
        error: errorMessage, 
        result: null 
      });
    }
  };

  const handleReset = () => {
    setState({ isLoading: false, error: null, result: null });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Header />

      <main className="flex-grow container max-w-4xl mx-auto px-4 py-8">
        
        {/* Intro Text & Settings Toggle */}
        {!state.result && (
          <div className="mb-6 flex flex-col items-center">
             {!state.isLoading && (
               <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Проверка соблюдения ФНП</h2>
                <p className="text-slate-600 max-w-2xl mx-auto">
                  Загрузите фото объекта и добавьте описание. ИИ проанализирует изображение на соответствие Федеральным нормам и правилам.
                </p>
               </div>
             )}
             
             <button 
               onClick={() => setShowSettings(!showSettings)}
               className="text-xs flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
             >
               <Settings className="w-3 h-3" />
               Настройки соединения (Proxy)
             </button>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-8 bg-white p-4 rounded-lg border border-slate-200 shadow-sm animate-fade-in">
            <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-500" />
              Настройка прокси (Base URL)
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Если сервис недоступен в вашем регионе, укажите альтернативный адрес API (Proxy). 
              Оставьте пустым для использования стандартного адреса Google.
            </p>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://generativelanguage.googleapis.com"
                className="flex-grow text-sm border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
              <button 
                onClick={() => setShowSettings(false)}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Сохранить
              </button>
            </div>
            {isRegionBlocked && (
              <p className="text-xs text-orange-600 mt-2 font-medium">
                💡 Попробуйте найти рабочий адрес прокси для Gemini API в интернете и вставьте его выше.
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {state.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-sm">{state.error}</span>
            <div className="flex gap-4">
              {isRegionBlocked && !showSettings && (
                <button 
                  onClick={() => setShowSettings(true)}
                  className="text-red-900 font-bold hover:underline text-sm whitespace-nowrap"
                >
                  Настроить Proxy
                </button>
              )}
              <button 
                onClick={() => setState(prev => ({ ...prev, error: null }))}
                className="text-red-900 font-bold hover:underline text-sm whitespace-nowrap"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}

        {/* Content Switcher */}
        {state.result ? (
          <ReportView result={state.result} onReset={handleReset} />
        ) : (
          <SafetyForm onAnalyze={handleAnalyze} isLoading={state.isLoading} />
        )}

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            Внимание: Результаты анализа носят рекомендательный характер.
            <br/>
            Сервис использует законодательную базу docs.cntd.ru в качестве справочного контекста.
          </p>
        </div>

      </main>
    </div>
  );
};

export default App;