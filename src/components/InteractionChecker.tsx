import { useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Shield, Plus, X, AlertTriangle, CheckCircle, Sparkles, Package, AlertCircle, Info } from 'lucide-react';

interface Product {
  name: string;
  ingredients: string[];
}

interface LLMInteraction {
  supplement: string;
  extractedIngredients: string[];
  conflicts: string[];
  conflictIngredients: string[];
  warning: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
}

interface LLMResult {
  interactions: LLMInteraction[];
  overallSafety: 'safe' | 'caution' | 'warning';
  generalAdvice: string;
}

export function InteractionChecker() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [interactions, setInteractions] = useState<LLMInteraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [checked, setChecked] = useState(false);
  const [llmResult, setLlmResult] = useState<LLMResult | null>(null);

  const handleAddProduct = async () => {
    if (!inputValue.trim()) return;

    setExtracting(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4ff4137c/extract-ingredients`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ productName: inputValue.trim() }),
        }
      );

      const data = await response.json();

      if (response.ok && data.ingredients.length > 0) {
        const newProduct: Product = {
          name: inputValue.trim(),
          ingredients: data.ingredients
        };
        setProducts([...products, newProduct]);
        setInputValue('');
        setChecked(false);
      } else {
        alert(data.message || '영양 성분을 찾을 수 없습니다. 제품명을 다시 확인해주세요.');
      }
    } catch (err) {
      console.error('Extract ingredients exception:', err);
      alert('성분 분석 중 오류가 발생했습니다.');
    } finally {
      setExtracting(false);
    }
  };

  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
    setChecked(false);
  };

  const handleCheckInteractions = async () => {
    if (products.length < 2) {
      alert('최소 2개 이상의 제품이 필요합니다.');
      return;
    }

    setLoading(true);
    setChecked(false);

    try {
      // 제품명 리스트를 LLM에 전송
      const productNames = products.map(p => p.name);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4ff4137c/check-interactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ supplements: productNames }),
        }
      );

      const data: LLMResult = await response.json();

      if (response.ok) {
        setInteractions(data.interactions || []);
        // LLM 결과 저장 (전체 안전성과 조언)
        setLlmResult(data);
        setChecked(true);
      } else {
        console.error('LLM Interaction check error:', data);
        alert(`상호작용 확인 중 오류가 발생했습니다: ${data.error || '알 수 없는 오류'}`);
      }
    } catch (err) {
      console.error('Interaction check exception:', err);
      alert('상호작용 확인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const commonProducts = [
    '센트룸 종합비타민',
    '뉴트리디데이 칼슘 마그네슘 아연 비타민D',
    '종근당건강 락토핏',
    '닥터스베스트 오메가3',
    '솔가 비타민D 1000IU',
    '뉴트리코어 철분',
    '쏜리서치 종합비타민',
    '라이프익스텐션 피크노제놀',
  ];

  const totalIngredients = products.flatMap(p => p.ingredients);
  const uniqueIngredients = [...new Set(totalIngredients)];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-gray-900">영양제 상호작용 체크</h2>
          <p className="text-gray-600">여러 제품을 입력하면 AI가 성분을 분석하여 상호작용을 확인합니다</p>
        </div>
      </div>

      {/* Usage Example */}
      {products.length === 0 && (
        <div className="mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xl">💡</span>
            </div>
            <div>
              <p className="text-indigo-900 mb-2">사용 방법</p>
              <p className="text-indigo-700 text-sm mb-2">
                복용 중인 영양제 제품명을 <strong>각각 입력</strong>하면 됩니다.
              </p>
              <div className="bg-white rounded-lg p-3 text-sm space-y-1">
                <p className="text-gray-700">예시:</p>
                <p className="text-gray-600">1️⃣ "쏜리서치 종합비타민" 입력 → AI 분석</p>
                <p className="text-gray-600">2️⃣ "라이프익스텐션 피크노제놀" 입력 → AI 분석</p>
                <p className="text-gray-600">3️⃣ "상호작용 확인하기" 버튼 클릭</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="space-y-4 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !extracting && handleAddProduct()}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="제품명을 입력하세요 (예: 센트룸 종합비타민)"
              disabled={extracting}
            />
          </div>
          <button
            onClick={handleAddProduct}
            disabled={extracting}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
          >
            {extracting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>분석 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>AI 분석</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Add */}
        <div>
          <p className="text-gray-700 mb-2 text-sm">자주 찾는 제품:</p>
          <div className="flex flex-wrap gap-2">
            {commonProducts.map((product, index) => (
              <button
                key={index}
                onClick={() => {
                  setInputValue(product);
                }}
                className="px-3 py-1 bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-lg transition-colors text-sm border-2 border-gray-200 hover:border-blue-300"
              >
                + {product}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Added Products */}
      {products.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl p-5 shadow-lg">
          <p className="text-gray-900 mb-4">추가된 제품 ({products.length}개)</p>
          <div className="space-y-3">
            {products.map((product, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <h4 className="text-gray-900">{product.name}</h4>
                  </div>
                  <button
                    onClick={() => handleRemoveProduct(index)}
                    className="p-1 hover:bg-red-100 rounded-lg transition-colors text-red-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 ml-7">
                  {product.ingredients.map((ingredient, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-blue-200 text-blue-800 rounded-md text-sm"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Ingredients Summary */}
          <div className="mt-4 pt-4 border-t-2 border-gray-200">
            <p className="text-gray-700 mb-2 text-sm">분석된 영양 성분 ({uniqueIngredients.length}개):</p>
            <div className="flex flex-wrap gap-2">
              {uniqueIngredients.map((ingredient, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg text-sm shadow-sm"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Check Button */}
      {products.length > 0 && uniqueIngredients.length >= 2 && (
        <button
          onClick={handleCheckInteractions}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-4 rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>확인 중...</span>
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              <span>상호작용 확인하기</span>
            </>
          )}
        </button>
      )}

      {/* Info Notice */}
      {products.length === 0 && (
        <div className="bg-gradient-to-r from-blue-100 to-cyan-100 border-2 border-blue-200 rounded-2xl p-5 text-center">
          <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <p className="text-blue-900 mb-2">AI 성분 분석 시스템</p>
          <p className="text-blue-700 text-sm">
            제품명만 입력하면 AI가 자동으로 영양 성분을 분석합니다.
          </p>
        </div>
      )}

      {/* Results */}
      {checked && llmResult && (
        <div className="mt-6">
          {/* Overall Safety Badge */}
          {llmResult.overallSafety === 'safe' ? (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 text-center shadow-lg mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-green-900 mb-2">안전합니다!</h3>
              <p className="text-green-700">
                {llmResult.generalAdvice || '분석된 영양 성분들 간에 알려진 상호작용이 없습니다.'}
              </p>
            </div>
          ) : (
            <div
              className={`border-2 rounded-2xl p-5 shadow-lg mb-4 ${
                llmResult.overallSafety === 'warning'
                  ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
                  : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                    llmResult.overallSafety === 'warning'
                      ? 'bg-gradient-to-br from-red-400 to-pink-500'
                      : 'bg-gradient-to-br from-yellow-400 to-orange-500'
                  }`}
                >
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3
                    className={
                      llmResult.overallSafety === 'warning'
                        ? 'text-red-900 mb-1'
                        : 'text-yellow-900 mb-1'
                    }
                  >
                    {llmResult.overallSafety === 'warning' ? '주의 필요' : '확인 필요'}
                  </h3>
                  <p
                    className={
                      llmResult.overallSafety === 'warning'
                        ? 'text-red-700 text-sm'
                        : 'text-yellow-700 text-sm'
                    }
                  >
                    {interactions.length}개의 상호작용이 발견되었습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Interactions Details */}
          {interactions.length > 0 && (
            <div className="space-y-4 mb-4">
              {interactions.map((interaction, index) => {
                const severityColor = {
                  high: { bg: 'from-red-50 to-pink-50', border: 'border-red-300', icon: 'from-red-500 to-pink-600', text: 'text-red-900', badge: 'bg-red-500' },
                  medium: { bg: 'from-orange-50 to-yellow-50', border: 'border-orange-300', icon: 'from-orange-500 to-yellow-600', text: 'text-orange-900', badge: 'bg-orange-500' },
                  low: { bg: 'from-yellow-50 to-amber-50', border: 'border-yellow-300', icon: 'from-yellow-500 to-amber-600', text: 'text-yellow-900', badge: 'bg-yellow-500' }
                }[interaction.severity];

                return (
                  <div key={index} className={`bg-gradient-to-r ${severityColor.bg} border-2 ${severityColor.border} rounded-2xl p-6 shadow-lg`}>
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${severityColor.icon} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                        <AlertCircle className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className={severityColor.text}>{interaction.supplement}</h4>
                          <span className={`px-2 py-0.5 ${severityColor.badge} text-white rounded-full text-xs uppercase`}>
                            {interaction.severity === 'high' ? '높음' : interaction.severity === 'medium' ? '중간' : '낮음'}
                          </span>
                        </div>
                        
                        {/* Extracted Ingredients */}
                        {interaction.extractedIngredients.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-600 mb-1">분석된 성분:</p>
                            <div className="flex flex-wrap gap-1">
                              {interaction.extractedIngredients.map((ing, i) => (
                                <span key={i} className="px-2 py-0.5 bg-white/80 text-gray-700 rounded-md text-xs border border-gray-200">
                                  {ing}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Conflicts */}
                        <p className={`${severityColor.text} text-sm mb-2`}>
                          <strong>충돌 제품:</strong> {interaction.conflicts.join(', ')}
                        </p>
                        
                        {/* Conflict Ingredients */}
                        {interaction.conflictIngredients && interaction.conflictIngredients.length > 0 && (
                          <p className={`${severityColor.text} text-sm mb-3`}>
                            <strong>충돌 성분:</strong> {interaction.conflictIngredients.join(', ')}
                          </p>
                        )}

                        {/* Warning */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-3">
                          <p className="text-gray-700 text-sm leading-relaxed">{interaction.warning}</p>
                        </div>

                        {/* Recommendation */}
                        {interaction.recommendation && (
                          <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                            <div className="flex items-start gap-2">
                              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                              <p className="text-blue-900 text-sm">
                                <strong>권장사항:</strong> {interaction.recommendation}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* General Advice */}
          {llmResult.generalAdvice && interactions.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-blue-900 mb-1">전문가 조언</p>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    {llmResult.generalAdvice}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}