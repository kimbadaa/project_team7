import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// 증상 기반 영양제 추천 (LLM 기반)
app.post('/make-server-4ff4137c/recommend', async (c) => {
  try {
    const { symptom } = await c.req.json();
    
    console.log(`[LLM Recommendation] Request for symptom: ${symptom}`);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      console.log('[LLM Recommendation] ERROR: OpenAI API key not found');
      return c.json({ 
        error: 'OpenAI API key not configured',
        hint: 'OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.'
      }, 500);
    }

    // OpenAI API 호출
    const prompt = `사용자가 다음과 같은 증상을 호소하고 있습니다: "${symptom}"

이 증상에 도움이 될 수 있는 영양제를 추천하고, 각 영양제에 대한 구체적인 제품명(브랜드 포함)도 함께 제시해주세요.

응답 형식 (반드시 JSON):
{
  "supplements": [
    {
      "name": "영양제 성분명 (예: 비타민D)",
      "description": "이 영양제가 증상에 도움이 되는 이유",
      "benefits": ["효능1", "효능2", "효능3"],
      "dosage": "권장 복용량",
      "recommendedProducts": [
        {
          "productName": "구체적인 제품명 (예: 종근당 비타민D 2000IU)",
          "brand": "브랜드명",
          "features": "제품 특징",
          "estimatedPrice": "예상 가격대 (예: 15,000-20,000원)"
        }
      ]
    }
  ],
  "generalAdvice": "전반적인 건강 조언",
  "precautions": ["주의사항1", "주의사항2"]
}

- 실제 한국 시장에서 구매 가능한 유명 브랜드 제품을 추천하세요 (센트룸, 종근당, 뉴트리코어, 솔가, 닥터스베스트, 나우푸드, 쏜리서치, 라이프익스텐션 등)
- 각 영양제당 2-3개의 구체적인 제품을 추천하세요
- 가격대도 현실적으로 제시하세요`;

    console.log('[LLM Recommendation] Sending request to OpenAI...');

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey.trim()}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 영양제 및 건강 보조 식품 전문가입니다. 사용자의 증상을 분석하고 적절한 영양제와 구체적인 제품을 추천합니다. 항상 JSON 형식으로만 응답하세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.log(`[LLM Recommendation] OpenAI API error: ${openaiResponse.status} - ${errorText}`);
      return c.json({ 
        error: `OpenAI API error: ${openaiResponse.status}`,
        details: errorText
      }, openaiResponse.status);
    }

    const openaiData = await openaiResponse.json();
    console.log(`[LLM Recommendation] OpenAI response received`);

    const result = JSON.parse(openaiData.choices[0].message.content);
    
    console.log(`[LLM Recommendation] Recommended ${result.supplements?.length || 0} supplements`);
    
    return c.json(result);
  } catch (error: any) {
    console.log(`[LLM Recommendation] Exception: ${error.message || error}`);
    return c.json({ 
      error: 'Internal server error during LLM recommendation',
      details: error.message 
    }, 500);
  }
});

// 회원가입
app.post('/make-server-4ff4137c/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    console.log(`[Signup] Attempting to create user with email: ${email}`);

    // 이메일이 이미 존재하는지 확인
    try {
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.log(`[Signup] Error checking existing users: ${listError.message}`);
      } else if (existingUsers?.users) {
        const emailExists = existingUsers.users.some(user => user.email === email);
        
        if (emailExists) {
          console.log(`[Signup] Email already exists: ${email}`);
          return c.json({ error: '이미 사용 중인 이메일입니다.' }, 400);
        }
      }
    } catch (listError: any) {
      console.log(`[Signup] Exception checking existing users: ${listError.message || listError}`);
      // 리스트 조회가 실패해도 계속 진행
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // 이메일 서버가 구성되지 않았으므로 자동으로 이메일 확인
      email_confirm: true
    });

    if (error) {
      console.log(`[Signup] Supabase error for ${email}: ${JSON.stringify(error)}`);
      
      // 특정 에러 메시지를 사용자 친화적으로 변환
      let errorMessage = error.message;
      
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        errorMessage = '이미 사용 중인 이메일입니다.';
      } else if (error.message.includes('password')) {
        errorMessage = '비밀번호는 최소 6자 이상이어야 합니다.';
      } else if (error.message.includes('email')) {
        errorMessage = '유효한 이메일 주소를 입력해주세요.';
      } else if (error.message.includes('Database') || error.message.includes('destination')) {
        errorMessage = '회원가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      }
      
      return c.json({ error: errorMessage, details: error.message }, 400);
    }

    console.log(`[Signup] User created successfully: ${email}, ID: ${data.user?.id}`);
    return c.json({ success: true, user: data.user });
  } catch (error: any) {
    console.log(`[Signup] Exception: ${error.message || error}`);
    return c.json({ error: '회원가입 중 오류가 발생했습니다.', details: error.message }, 500);
  }
});

// 네이버 쇼핑 API 프록시
app.post('/make-server-4ff4137c/naver-shopping', async (c) => {
  try {
    const { query, display = 10 } = await c.req.json();
    
    const clientId = Deno.env.get('NAVER_CLIENT_ID');
    const clientSecret = Deno.env.get('NAVER_CLIENT_SECRET');

    console.log(`[Naver API] Starting search for: \"${query}\"`);
    console.log(`[Naver API] Client ID exists: ${!!clientId} (length: ${clientId?.length || 0})`);
    console.log(`[Naver API] Client Secret exists: ${!!clientSecret} (length: ${clientSecret?.length || 0})`);
    console.log(`[Naver API] Client ID value: "${clientId}"`);
    console.log(`[Naver API] Client Secret value: "${clientSecret}"`);

    if (!clientId || !clientSecret) {
      console.log('[Naver API] ERROR: Credentials not found');
      return c.json({ 
        error: 'Naver API credentials not configured',
        details: `Client ID: ${!!clientId}, Client Secret: ${!!clientSecret}`,
        hint: '환경 변수 NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET이 설정되지 않았습니다.'
      }, 500);
    }

    // 공백 제거 및 검증
    const trimmedClientId = clientId.trim();
    const trimmedClientSecret = clientSecret.trim();

    console.log(`[Naver API] Using Client ID: "${trimmedClientId}"`);
    console.log(`[Naver API] Client Secret first 10 chars: "${trimmedClientSecret.substring(0, 10)}..."`);

    const encodedQuery = encodeURIComponent(query);
    const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodedQuery}&display=${display}&sort=sim`;

    console.log(`[Naver API] Request URL: ${url}`);

    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': trimmedClientId,
        'X-Naver-Client-Secret': trimmedClientSecret,
      },
    });

    console.log(`[Naver API] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[Naver API] ERROR Response: ${errorText}`);
      return c.json({ 
        error: `Naver API error: ${response.status}`,
        details: errorText,
        hint: '네이버 개발자 센터(https://developers.naver.com/apps)에서 애플리케이션 설정을 확인하세요. 1) Client ID와 Secret이 올바른지 2) 쇼핑 API가 활성화되어 있는지 확인해주세요.',
        debugInfo: {
          clientIdLength: trimmedClientId.length,
          clientSecretLength: trimmedClientSecret.length
        }
      }, response.status);
    }

    const data = await response.json();
    console.log(`[Naver API] SUCCESS: ${data.items?.length || 0} items returned`);
    
    return c.json(data);
  } catch (error: any) {
    console.log(`[Naver API] Exception: ${error.message || error}`);
    return c.json({ error: 'Internal server error during Naver API call', details: error.message }, 500);
  }
});

// 식품안전나라 API 프록시 (영양제 정보)
app.post('/make-server-4ff4137c/food-safety', async (c) => {
  try {
    const { productName } = await c.req.json();
    
    const apiKey = Deno.env.get('FOOD_SAFETY_API_KEY');

    if (!apiKey) {
      console.log('Food Safety API key not found');
      return c.json({ error: 'Food Safety API key not configured' }, 500);
    }

    console.log(`Food Safety API search for: ${productName}`);

    const encodedProduct = encodeURIComponent(productName);
    // 건강기능식품 정보 API
    const url = `http://openapi.foodsafetykorea.go.kr/api/${apiKey}/C003/json/1/10/PRDLST_NM=${encodedProduct}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.log(`Food Safety API error: ${response.status}`);
      return c.json({ error: `Food Safety API error: ${response.status}` }, response.status);
    }

    const data = await response.json();
    console.log(`Food Safety API response for ${productName}:`, JSON.stringify(data).substring(0, 200));
    
    return c.json(data);
  } catch (error) {
    console.log(`Food Safety API proxy error: ${error}`);
    return c.json({ error: 'Internal server error during Food Safety API call' }, 500);
  }
});

// 영양제 상호작용 체크 (LLM 기반)
app.post('/make-server-4ff4137c/check-interactions', async (c) => {
  try {
    const { supplements } = await c.req.json();
    
    console.log(`[LLM Interaction Check] Checking interactions for products: ${supplements.join(', ')}`);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      console.log('[LLM Interaction Check] ERROR: OpenAI API key not found');
      return c.json({ 
        error: 'OpenAI API key not configured',
        hint: 'OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.'
      }, 500);
    }

    // OpenAI API 호출
    const prompt = `다음 영양제 제품들을 분석해주세요:
${supplements.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}

각 제품명에서 주요 영양 성분을 추출하고, 이들 성분 간의 상호작용을 분석해주세요.

응답 형식 (반드시 JSON):
{
  "interactions": [
    {
      "supplement": "제품명",
      "extractedIngredients": ["성분1", "성분2"],
      "conflicts": ["충돌하는 다른 제품명"],
      "conflictIngredients": ["충돌하는 성분"],
      "warning": "상세한 경고 메시지 (한국어)",
      "severity": "high|medium|low",
      "recommendation": "복용 권장사항 (한국어)"
    }
  ],
  "overallSafety": "safe|caution|warning",
  "generalAdvice": "전반적인 조언 (한국어)"
}

상호작용이 없으면 interactions 배열을 비워주세요.
주의사항:
- 같이 복용하면 흡수율이 감소하는 경우 (예: 칼슘+철분, 칼슘+마그네슘)
- 출혈 위험이 증가하는 경우 (예: 오메가3+은행잎, 비타민E+혈액응고제)
- 독성이 증가하는 경우 (예: 고용량 비타민A+비타민D)
- 다른 약물의 효과를 변경시키는 경우`;

    console.log('[LLM Interaction Check] Sending request to OpenAI...');

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey.trim()}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 영양제 상호작용 전문가입니다. 여러 영양제를 동시에 복용할 때의 안전성을 평가하고, 성분 간 상호작용을 분석합니다. 항상 JSON 형식으로만 응답하세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.log(`[LLM Interaction Check] OpenAI API error: ${openaiResponse.status} - ${errorText}`);
      return c.json({ 
        error: `OpenAI API error: ${openaiResponse.status}`,
        details: errorText
      }, openaiResponse.status);
    }

    const openaiData = await openaiResponse.json();
    console.log(`[LLM Interaction Check] OpenAI response received`);

    const result = JSON.parse(openaiData.choices[0].message.content);
    
    console.log(`[LLM Interaction Check] Found ${result.interactions?.length || 0} interactions`);
    console.log(`[LLM Interaction Check] Overall safety: ${result.overallSafety}`);
    
    return c.json(result);
  } catch (error: any) {
    console.log(`[LLM Interaction Check] Exception: ${error.message || error}`);
    return c.json({ 
      error: 'Internal server error during LLM interaction check',
      details: error.message 
    }, 500);
  }
});

// AI 기반 제품명에서 영양제 성분 추출
app.post('/make-server-4ff4137c/extract-ingredients', async (c) => {
  try {
    const { productName } = await c.req.json();
    
    console.log(`Extracting ingredients from product: ${productName}`);

    const productLower = productName.toLowerCase();
    const extractedIngredients: string[] = [];

    // 주요 영양제 성분 키워드 목록 (우선순위 순서로 정렬 - 긴 키워드가 먼저)
    const ingredientKeywords = [
      // 복합 성분 먼저
      '코엔자임q10', 'coenzyme q10', 'coq10', '코큐텐',
      '히알루론산', '히알루론', 'hyaluronic acid', 'hyaluronic',
      '세인트존스워트', 'st john\'s wort', 'st johns wort',
      'b컴플렉스', 'b complex', 'b-complex',
      '종합비타민', '멀티비타민', 'multivitamin', 'multi vitamin',
      '글루코사민', 'glucosamine',
      '콘드로이틴', 'chondroitin',
      '프로바이오틱스', 'probiotics', 'probiotic',
      '프로폴리스', 'propolis',
      '에키네시아', 'echinacea',
      '베타카로틴', 'beta carotene', 'betacarotene',
      '지아잔틴', 'zeaxanthin',
      '발레리안', 'valerian',
      '멜라토닌', 'melatonin',
      '피크노제놀', 'pycnogenol',
      // 단일 비타민
      '비타민 b12', 'vitamin b12', 'b12',
      '비타민 b6', 'vitamin b6', 'b6',
      '비타민 b1', 'vitamin b1', 'b1',
      '비타민 b2', 'vitamin b2', 'b2',
      '비타민 b3', 'vitamin b3', 'b3',
      '비타민 b5', 'vitamin b5', 'b5',
      '비타민b', '비타민 b', 'vitamin b', 'b군', 'b-군',
      '비타민c', '비타민 c', 'vitamin c', 'vit c', 'vitc',
      '비타민d', '비타민 d', 'vitamin d', 'vit d', 'vitd',
      '비타민e', '비타민 e', 'vitamin e', 'vit e', 'vite',
      '비타민a', '비타민 a', 'vitamin a', 'vit a', 'vita',
      '비타민k', '비타민 k', 'vitamin k',
      // 미네랄
      '마그네슘', 'magnesium', 'mg',
      '칼슘', 'calcium', 'ca',
      '철분', 'iron', '철', 'fe',
      '아연', 'zinc', 'zn',
      '구리', 'copper',
      '셀레늄', 'selenium',
      // 오메가 (긴 것부터)
      '오메가-3', 'omega-3', 'omega 3', '오메가3',
      '오메가6', 'omega-6', 'omega 6',
      'dha', 'epa',
      // 기타 성분
      '루테인', 'lutein',
      '유산균', '락토',
      '콜라겐', 'collagen',
      '커큐민', '강황', 'curcumin', 'turmeric',
      '테아닌', 'theanine', 'l-theanine',
      '비오틴', 'biotin',
      '엽산', 'folic acid', 'folate',
      '은행잎', 'ginkgo biloba', 'ginkgo',
      '인삼', 'ginseng',
      '마카', 'maca',
      'msm',
      '알파리포산', 'alpha lipoic acid', 'ala',
      '레스베라트롤', 'resveratrol'
    ];

    // 매핑 테이블 (검색어 -> 표준 성분명)
    const ingredientMapping: Record<string, string> = {
      // 비타민
      '비타민c': '비타민C', '비타민 c': '비타민C', 'vitamin c': '비타민C', 'vit c': '비타민C', 'vitc': '비타민C',
      '비타민d': '비타민D', '비타민 d': '비타민D', 'vitamin d': '비타민D', 'vit d': '비타민D', 'vitd': '비타민D',
      '비타민e': '비타민E', '비타민 e': '비타민E', 'vitamin e': '비타민E', 'vit e': '비타민E', 'vite': '비타민E',
      '비타민a': '비타민A', '비타민 a': '비타민A', 'vitamin a': '비타민A', 'vit a': '비타민A', 'vita': '비타민A',
      '비타민k': '비타민K', '비타민 k': '비타민K', 'vitamin k': '비타민K',
      '비타민b': '비타민B', '비타민 b': '비타민B', 'vitamin b': '비타민B', 'b군': '비타민B', 'b-군': '비타민B',
      'b컴플렉스': '비타민B', 'b complex': '비타민B', 'b-complex': '비타민B',
      '비타민 b12': '비타민B12', 'vitamin b12': '비타민B12', 'b12': '비타민B12',
      '비타민 b6': '비타민B6', 'vitamin b6': '비타민B6', 'b6': '비타민B6',
      '비타민 b1': '비타민B1', 'vitamin b1': '비타민B1', 'b1': '비타민B1',
      '비타민 b2': '비타민B2', 'vitamin b2': '비타민B2', 'b2': '비타민B2',
      '비타민 b3': '비타민B3', 'vitamin b3': '비타민B3', 'b3': '비타민B3',
      '비타민 b5': '비타민B5', 'vitamin b5': '비타민B5', 'b5': '비타민B5',
      // 오메가
      '오메가3': '오메가3', '오메가 3': '오메가3', 'omega 3': '오메가3', 'omega-3': '오메가3', '오메가-3': '오메가3',
      '오메가6': '오메가6', 'omega-6': '오메가6', 'omega 6': '오메가6',
      'dha': '오메가3', 'epa': '오메가3',
      // 미네랄
      '마그네슘': '마그네슘', 'magnesium': '마그네슘',
      '칼슘': '칼슘', 'calcium': '칼슘',
      '철분': '철분', 'iron': '철분', '철': '철분',
      '아연': '아연', 'zinc': '아연',
      '구리': '구리', 'copper': '구리',
      '셀레늄': '셀레늄', 'selenium': '셀레늄',
      // 기타 주요 성분
      '글루코사민': '글루코사민', 'glucosamine': '글루코사민',
      '콘드로이틴': '콘드로이틴', 'chondroitin': '콘드로이틴',
      '루테인': '루테인', 'lutein': '루테인',
      '지아잔틴': '지아잔틴', 'zeaxanthin': '지아잔틴',
      '유산균': '유산균', '락토': '유산균',
      '프로바이오틱스': '유산균', 'probiotics': '유산균', 'probiotic': '유산균',
      '프로폴리스': '프로폴리스', 'propolis': '프로폴리스',
      '코엔자임q10': '코엔자임Q10', 'coenzyme q10': '코엔자임Q10', 'coq10': '코엔자임Q10', '코큐텐': '코엔자임Q10',
      '콜라겐': '콜라겐', 'collagen': '콜라겐',
      '히알루론산': '히알루론산', '히알루론': '히알루론산', 'hyaluronic': '히알루론산', 'hyaluronic acid': '히알루론산',
      '커큐민': '커큐민', '강황': '커큐민', 'curcumin': '커큐민', 'turmeric': '커큐민',
      '에키네시아': '에키네시아', 'echinacea': '에키네시아',
      '멜라토닌': '멜라토닌', 'melatonin': '멜라토닌',
      '테아닌': '테아닌', 'theanine': '테아닌', 'l-theanine': '테아닌',
      '발레리안': '발레리안', 'valerian': '발레리안',
      '비오틴': '비오틴', 'biotin': '비오틴',
      '엽산': '엽산', 'folic acid': '엽산', 'folate': '엽산',
      '종합비타민': '종합비타민', '멀티비타민': '종합비타민', 'multivitamin': '종합비타민', 'multi vitamin': '종합비타민',
      '은행잎': '은행잎', 'ginkgo': '은행잎', 'ginkgo biloba': '은행잎',
      '인삼': '인삼', 'ginseng': '인삼',
      '마카': '마카', 'maca': '마카',
      '베타카로틴': '베타카로틴', 'beta carotene': '베타카로틴', 'betacarotene': '베타카로틴',
      '세인트존스워트': '세인트존스워트', 'st john\'s wort': '세인트존스워트', 'st johns wort': '세인트존스워트',
      '피크노제놀': '피크노제놀', 'pycnogenol': '피크노제놀',
      'msm': 'MSM',
      '알파리포산': '알파리포산', 'alpha lipoic acid': '알파리포산', 'ala': '알파리포산',
      '레스베라트롤': '레스베라트롤', 'resveratrol': '레스베라트롤'
    };

    // 제품명에서 성분 추출 (긴 키워드부터 매칭하여 중복 방지)
    for (const keyword of ingredientKeywords) {
      if (productLower.includes(keyword)) {
        const standardName = ingredientMapping[keyword];
        if (standardName && !extractedIngredients.includes(standardName)) {
          extractedIngredients.push(standardName);
        }
      }
    }

    // 특별 처리: '쏜리서치', '솔가', '나우푸드', '라이프익스텐션' 등 브랜드명 뒤의 제품명 분석
    const brandPatterns = [
      'thorne', '쏜리서치', 'solgar', '솔가', 'now', '나우', 'life extension', '라이프익스텐션',
      'doctor\'s best', '닥터스베스트', 'garden of life', '가든오브라이프', 'jarrow', '자로우',
      '종근당', '뉴트리', 'nutri', '센트룸', 'centrum', 'gnc'
    ];

    console.log(`Extracted ingredients: ${extractedIngredients.join(', ')}`);
    
    return c.json({ 
      productName,
      ingredients: extractedIngredients,
      message: extractedIngredients.length > 0 
        ? `${extractedIngredients.length}개의 영양 성분을 찾았습니다.`
        : '영양 성분을 찾을 수 없습니다. 제품명을 다시 확인해주세요.'
    });
  } catch (error) {
    console.log(`Extract ingredients error: ${error}`);
    return c.json({ error: 'Internal server error during ingredient extraction' }, 500);
  }
});

// 영양제 정보 조회
app.post('/make-server-4ff4137c/supplement-info', async (c) => {
  try {
    const { supplement } = await c.req.json();
    
    console.log(`Getting info for: ${supplement}`);

    const suppLower = supplement.toLowerCase();
    
    // 키 매칭 (부분 일치)
    const matchedKey = Object.keys(supplementInfo).find(key => 
      suppLower.includes(key.toLowerCase()) || key.toLowerCase().includes(suppLower)
    );

    if (matchedKey) {
      console.log(`Found info for ${matchedKey}`);
      return c.json({ 
        supplement,
        info: supplementInfo[matchedKey]
      });
    } else {
      console.log(`No info found for ${supplement}`);
      return c.json({ 
        supplement,
        info: {
          description: '해당 영양제에 대한 정보를 찾을 수 없습니다.',
          benefits: [],
          dosage: '제품 라벨을 참조하세요.'
        }
      });
    }
  } catch (error) {
    console.log(`Supplement info error: ${error}`);
    return c.json({ error: 'Internal server error during supplement info lookup' }, 500);
  }
});

// 복용 알림 저장
app.post('/make-server-4ff4137c/reminders', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized - No token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.log(`Authorization error while saving reminder: ${authError?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { supplement, time, days } = await c.req.json();
    
    console.log(`Saving reminder for user ${user.id}: ${supplement} at ${time}`);

    // 사용자의 알림 목록 가져오기
    const remindersKey = `reminders:${user.id}`;
    const existingReminders = await kv.get(remindersKey) || [];

    const newReminder = {
      id: crypto.randomUUID(),
      supplement,
      time,
      days,
      createdAt: new Date().toISOString()
    };

    existingReminders.push(newReminder);
    await kv.set(remindersKey, existingReminders);

    console.log(`Reminder saved successfully for user ${user.id}`);
    
    return c.json({ success: true, reminder: newReminder });
  } catch (error) {
    console.log(`Save reminder error: ${error}`);
    return c.json({ error: 'Internal server error during reminder save' }, 500);
  }
});

// 복용 알림 조회
app.get('/make-server-4ff4137c/reminders', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized - No token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.log(`Authorization error while fetching reminders: ${authError?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const remindersKey = `reminders:${user.id}`;
    const reminders = await kv.get(remindersKey) || [];

    console.log(`Retrieved ${reminders.length} reminders for user ${user.id}`);
    
    return c.json({ reminders });
  } catch (error) {
    console.log(`Get reminders error: ${error}`);
    return c.json({ error: 'Internal server error during reminder fetch' }, 500);
  }
});

// 복용 알림 삭제
app.delete('/make-server-4ff4137c/reminders/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized - No token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.log(`Authorization error while deleting reminder: ${authError?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const reminderId = c.req.param('id');
    const remindersKey = `reminders:${user.id}`;
    const reminders = await kv.get(remindersKey) || [];

    const filteredReminders = reminders.filter((r: any) => r.id !== reminderId);
    await kv.set(remindersKey, filteredReminders);

    console.log(`Reminder ${reminderId} deleted for user ${user.id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Delete reminder error: ${error}`);
    return c.json({ error: 'Internal server error during reminder deletion' }, 500);
  }
});

// 환경 변수 확인 (디버깅용)
app.get('/make-server-4ff4137c/debug/env-check', async (c) => {
  const clientId = Deno.env.get('NAVER_CLIENT_ID');
  const clientSecret = Deno.env.get('NAVER_CLIENT_SECRET');
  
  return c.json({
    naverClientId: {
      exists: !!clientId,
      length: clientId?.length || 0,
      firstChars: clientId?.substring(0, 3) || '',
      lastChars: clientId?.substring(clientId.length - 3) || ''
    },
    naverClientSecret: {
      exists: !!clientSecret,
      length: clientSecret?.length || 0,
      firstChars: clientSecret?.substring(0, 3) || '',
      lastChars: clientSecret?.substring(clientSecret.length - 3) || ''
    }
  });
});

Deno.serve(app.fetch);
