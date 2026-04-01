
import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, TrendingDown, Lightbulb, Zap } from 'lucide-react';
import { MenuItem, Ingredient, Sale, Expense } from '../types';
import { getSmartInsights } from '../services/geminiService';

interface SmartInsightsProps {
  menuItems: MenuItem[];
  ingredients: Ingredient[];
  sales: Sale[];
  expenses: Expense[];
}

const SmartInsights: React.FC<SmartInsightsProps> = ({ menuItems, ingredients, sales, expenses }) => {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    const data = await getSmartInsights(menuItems, ingredients, sales, expenses);
    setInsights(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2 flex items-center">
            <Sparkles className="mr-3" />
            AI Business Partner
          </h2>
          <p className="text-amber-50 opacity-90 max-w-xl">
            Our Gemini-powered engine analyzes your real-time costs, sales patterns, and inventory levels to help you maximize your restaurant's profitability.
          </p>
          <button 
            onClick={fetchInsights}
            disabled={loading}
            className="mt-6 flex items-center space-x-2 bg-white text-amber-600 px-6 py-3 rounded-full font-bold hover:bg-amber-50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Analyzing Data...' : 'Refresh AI Analysis'}</span>
          </button>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles size={120} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl animate-pulse border border-slate-100 h-48" />
          ))
        ) : (
          insights.map((insight, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                  <Lightbulb size={24} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                  insight.impact === 'High' ? 'bg-rose-100 text-rose-600' : 
                  insight.impact === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {insight.impact} Impact
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{insight.title}</h3>
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">{insight.description}</p>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-start space-x-3">
                <Zap size={18} className="text-amber-500 mt-1 flex-shrink-0" />
                <p className="text-sm font-medium text-slate-700 italic">"{insight.suggestion}"</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SmartInsights;
