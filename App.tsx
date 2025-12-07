import React, { useState } from 'react';
import Header from './components/Header';
import SafetyForm from './components/SafetyForm';
import ReportView from './components/ReportView';
import { analyzeSafetyImage } from './services/geminiService';
import { AnalysisState } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AnalysisState>({
    isLoading: false,
    error: null,
    result: null,
  });

  const handleAnalyze = async (file: File, description: string) => {
    setState({ isLoading: true, error: null, result: null });
    
    try {
      const result = await analyzeSafetyImage(file, description);
      setState({ isLoading: false, error: null, result });
    } catch (err: any) {
      setState({ 
        isLoading: false, 
        error: err.message || "Произошла ошибка при анализе.", 
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
        
        {/* Intro Text */}
        {!state.result && !state.isLoading && (
          <div className="mb-8 text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">Проверка соблюдения ФНП</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Загрузите фото объекта и добавьте описание. ИИ проанализирует изображение на соответствие Федеральным нормам и правилам в области промышленной безопасности.
            </p>
          </div>
        )}

        {/* Error Message */}
        {state.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{state.error}</span>
            <button 
              onClick={() => setState(prev => ({ ...prev, error: null }))}
              className="text-red-900 font-bold hover:underline ml-4"
            >
              Закрыть
            </button>
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
            Внимание: Результаты анализа носят рекомендательный характер. Для официального заключения требуется экспертиза аттестованным специалистом.
            <br/>
            Сервис использует законодательную базу docs.cntd.ru в качестве справочного контекста.
          </p>
        </div>

      </main>
    </div>
  );
};

export default App;
