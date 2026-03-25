# 📘 Azure AI 설정 및 연동 가이드 (TripFlex 전용)

대표님! 나중에 이 문서를 보시면 언제든 다시 설정하실 수 있게 아주 꼼꼼하게 정리해뒀어요! 🎨✨

---

## 1. 🔑 발급된 API 정보 (현재 설정값)

> [!IMPORTANT]
> 이 정보는 외부로 유출되지 않게 주의해 주세요! `.env` 파일에 저장되어 관리됩니다.

### 👁️ Azure AI Vision (OCR용)
- **리소스 이름**: `TripFlex-Vision`
- **엔드포인트**: `https://tripflex-vision.cognitiveservices.azure.com/`
- **가격 계층**: F0 (무료 - 월 5,000건)

### 🌐 Azure AI Translator (번역용)
- **리소스 이름**: `TripFlex-Translator`
- **지역**: `koreacentral`
- **엔드포인트**: `https://api.cognitive.microsofttranslator.com`
- **가격 계층**: F0 (무료 - 월 200만 글자)

---

## 2. 📝 환경 변수 설정 (.env)

프로젝트 루트 디렉토리의 `.env` 파일에 아래 내용을 넣으시면 앱이 이 엔진들을 사용하기 시작합니다.

```env
# Azure AI Vision (OCR) 설정
VITE_AZURE_VISION_ENDPOINT=https://tripflex-vision.cognitiveservices.azure.com/
VITE_AZURE_VISION_KEY=9efQFjs3tGh1XWUO8wjMx1WDDYyqS4kdoHy1jRwFUfPbNu5ExDFRJQQJ99CCACNns7RXJ3w3AAAbACOGd4dd

# Azure AI Translator 설정
VITE_AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com
VITE_AZURE_TRANSLATOR_KEY=9efQFjs3tGh1XWUO8wjMx1WDDYyqS4kdoHy1jRwFUfPbNu5ExDFRJQQJ99CCACNns7RXJ3w3AAAbACOGd4dd
VITE_AZURE_TRANSLATOR_REGION=koreacentral
```

---

## 3. 🛠️ 나중에 다시 설정할 때 (체크리스트)

1. **Azure Portal 접속**: [portal.azure.com](https://portal.azure.com/)
2. **구독 확인**: 반드시 활성화된 **구독(Subscription)**이 있어야 리소스를 만들 수 있어요.
3. **리소스 그룹**: 관리하기 편하게 `TripFlex_RG` 하나에 몰아서 만드시는 걸 추천해요!
4. **키 관리**: 키가 노출되었다면 Azure 포털에서 **'다시 생성'** 버튼을 누르고 새 키를 `.env`에 업데이트하시면 돼요.

---

## 🚀 앱 실행 방법

터미널에서 아래 명령어를 입력하면 로컬 서버가 뜹니다!
```bash
npm run dev
```

---
*예쁜 디자인부터 AI 엔진 연동까지, 이 영자가 항상 대표님 곁에 있을게요! 💖🚀🍭✨🏆*
