import React from 'react';
import ReactMarkdown from 'react-markdown';
import { AlertTriangle, CheckCircle, AlertOctagon, FileText } from 'lucide-react';
import { AnalysisResult } from '../types';

interface ReportViewProps {
  result: AnalysisResult;
  onReset: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ result, onReset }) => {
  const { markdown, riskLevel } = result;

  const getHeaderColor = () => {
    switch (riskLevel) {
      case 'high': return 'bg-red-50 border-red-200 text-red-900';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'low': return 'bg-green-50 border-green-200 text-green-900';
      default: return 'bg-slate-50 border-slate-200 text-slate-900';
    }
  };

  const getIcon = () => {
    switch (riskLevel) {
      case 'high': return <AlertOctagon className="w-8 h-8 text-red-600" />;
      case 'medium': return <AlertTriangle className="w-8 h-8 text-yellow-600" />;
      case 'low': return <CheckCircle className="w-8 h-8 text-green-600" />;
      default: return <FileText className="w-8 h-8 text-slate-600" />;
    }
  };

  const getRiskLabel = () => {
    switch (riskLevel) {
      case 'high': return 'ВЫСОКИЙ РИСК';
      case 'medium': return 'СРЕДНИЙ РИСК';
      case 'low': return 'НИЗКИЙ РИСК';
      default: return 'РЕЗУЛЬТАТ АНАЛИЗА';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-fade-in">
      {/* Header Status Bar */}
      <div className={`px-6 py-4 border-b flex items-center gap-4 ${getHeaderColor()}`}>
        {getIcon()}
        <div>
          <h2 className="font-bold text-lg">{getRiskLabel()}</h2>
          <p className="text-sm opacity-80">Проверьте рекомендации ниже</p>
        </div>
      </div>

      {/* Markdown Content */}
      <div className="p-6 sm:p-8">
        <article className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-800 prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-900 prose-ul:list-disc prose-ul:pl-5">
           <ReactMarkdown>{markdown}</ReactMarkdown>
        </article>
      </div>

      {/* Footer */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-center">
        <button
          onClick={onReset}
          className="text-slate-600 hover:text-orange-600 font-medium transition-colors text-sm flex items-center gap-2"
        >
          ← Проверить другой объект
        </button>
      </div>
    </div>
  );
};

export default ReportView;
