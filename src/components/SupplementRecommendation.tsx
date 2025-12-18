import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Pill, ShoppingCart, Info, ExternalLink, Settings, Sparkles, Tag, DollarSign } from 'lucide-react';

interface RecommendedProduct {
  productName: string;
  brand: string;
  features: string;
  estimatedPrice: string;
}

interface Supplement {
  name: string;
  description: string;
  benefits: string[];
  dosage: string;
  recommendedProducts: RecommendedProduct[];
}

interface LLMRecommendation {
  supplements: Supplement[];
  generalAdvice: string;
  precautions: string[];
}

export function SupplementRecommendation({ 
  supplements,
  accessToken 
}: { 
  supplements: LLMRecommendation;
  accessToken: string;
}) {
  const [selectedSupplement, setSelectedSupplement] = useState<Supplement | null>(null);

  const handleSupplementClick = (supplement: Supplement) => {
    setSelectedSupplement(supplement);
  };

  return (
    <div className="space-y-6">
      {/* General Advice */}
      {supplements.generalAdvice && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Info className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-blue-900 mb-1">전문가 조언</h3>
              <p className="text-blue-700 text-sm leading-relaxed">{supplements.generalAdvice}</p>
            </div>
          </div>
        </div>
      )}

      {/* Precautions */}
      {supplements.precautions && supplements.precautions.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-yellow-900 mb-2">주의사항</h3>
              <ul className="space-y-1">
                {supplements.precautions.map((precaution, index) => (
                  <li key={index} className="flex items-start gap-2 text-yellow-700 text-sm">
                    <span className="mt-1">•</span>
                    <span>{precaution}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Supplements */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <Pill className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-gray-900">추천 영양제</h2>
            <p className="text-gray-600">AI가 분석한 {supplements.supplements.length}개의 맞춤 영양제</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supplements.supplements.map((supplement, index) => (
            <button
              key={index}
              onClick={() => handleSupplementClick(supplement)}
              className={`p-5 rounded-xl border-2 transition-all text-left ${
                selectedSupplement?.name === supplement.name
                  ? 'border-green-500 bg-green-50 shadow-lg'
                  : 'border-gray-200 hover:border-green-300 bg-white hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="text-3xl">💊</div>
                <div className="flex-1">
                  <p className="text-gray-900 mb-1">{supplement.name}</p>
                  <p className="text-gray-600 text-sm line-clamp-2">{supplement.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-green-600">
                <Sparkles className="w-3 h-3" />
                <span>{supplement.recommendedProducts.length}개 제품 추천</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Supplement Details */}
      {selectedSupplement && (
        <>
          {/* Supplement Info */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Info className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-gray-900">{selectedSupplement.name} 정보</h2>
                <p className="text-gray-600">영양 성분 및 효능</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-xl p-6">
                <h3 className="text-gray-900 mb-2">설명</h3>
                <p className="text-gray-700 leading-relaxed">{selectedSupplement.description}</p>
              </div>

              {selectedSupplement.benefits.length > 0 && (
                <div className="bg-white rounded-xl p-6">
                  <h3 className="text-gray-900 mb-3">주요 효능</h3>
                  <ul className="space-y-2">
                    {selectedSupplement.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-white rounded-xl p-6">
                <h3 className="text-gray-900 mb-2">권장 복용량</h3>
                <p className="text-gray-700">{selectedSupplement.dosage}</p>
              </div>
            </div>
          </div>

          {/* Recommended Products */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-gray-900">{selectedSupplement.name} 추천 제품</h2>
                <p className="text-gray-600">AI가 선별한 {selectedSupplement.recommendedProducts.length}개의 추천 제품</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedSupplement.recommendedProducts.map((product, index) => (
                <div
                  key={index}
                  className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow hover:border-orange-300 bg-gradient-to-br from-white to-orange-50"
                >
                  <div className="flex items-start gap-2 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Tag className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-900 mb-1 leading-tight">{product.productName}</h3>
                      <p className="text-orange-600 text-sm">{product.brand}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <p className="text-gray-700 text-sm leading-relaxed">{product.features}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <p className="text-green-700">{product.estimatedPrice}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-blue-900 text-sm">
                💡 <strong>팁:</strong> 온라인 쇼핑몰(쿠팡, 네이버 쇼핑, iHerb 등)에서 제품명을 검색하여 가격을 비교해보세요.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}