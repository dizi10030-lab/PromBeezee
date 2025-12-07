import React, { useState, useCallback } from 'react';
import { Upload, X, Camera, FileText, ArrowRight } from 'lucide-react';

interface SafetyFormProps {
  onAnalyze: (file: File, description: string) => void;
  isLoading: boolean;
}

const SafetyForm: React.FC<SafetyFormProps> = ({ onAnalyze, isLoading }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      onAnalyze(selectedFile, description);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 space-y-6">
        
        {/* Image Upload Section */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            1. Фотография объекта / нарушения
          </label>
          
          {!previewUrl ? (
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={isLoading}
              />
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center bg-slate-50 transition-colors group-hover:bg-slate-100 group-hover:border-slate-400 text-center">
                <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                  <Camera className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-sm font-medium text-slate-900">Нажмите для загрузки фото</p>
                <p className="text-xs text-slate-500 mt-1">JPEG, PNG (Макс. 10MB)</p>
              </div>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-200">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-64 object-contain mx-auto" 
              />
              <button
                type="button"
                onClick={handleClearFile}
                disabled={isLoading}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-slate-700 p-1.5 rounded-full shadow-md transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Text Description Section */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            2. Описание ситуации (контекст)
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 text-slate-400">
              <FileText className="w-5 h-5" />
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Например: Запорная арматура на паропроводе, отсутствует изоляция..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-[100px] text-slate-700 resize-y"
              disabled={isLoading}
            />
          </div>
        </div>

      </div>

      {/* Action Bar */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
        <button
          type="submit"
          disabled={!selectedFile || isLoading}
          className={`
            flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white shadow-sm transition-all
            ${!selectedFile || isLoading 
              ? 'bg-slate-300 cursor-not-allowed' 
              : 'bg-orange-600 hover:bg-orange-700 active:scale-95 shadow-orange-200'}
          `}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Анализ...
            </>
          ) : (
            <>
              Выполнить проверку
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default SafetyForm;
