import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import { performOCR } from './api/vision';
import { translateTexts } from './api/translate';
// import translatedData from './original_jp_14.json'; // 더 이상 정적 데이터에 의존하지 않음

function App() {
  const [annotations, setAnnotations] = useState([]);
  const [imageRect, setImageRect] = useState({ left: 0, top: 0, width: 0, scale: 1 });
  const [activeTab, setActiveTab] = useState('home');
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const imageRef = useRef(null);

  // 초기 샘플 데이터 로딩 대신 빈 배열로 시작하거나 
  // 필요 시 초기 이미지를 처리하는 로직을 추가할 수 있습니다.
  useEffect(() => {
    // 초기 설정 (필요 시)
  }, []);

  useEffect(() => {
    const updatePosition = () => {
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        const container = imageRef.current.parentElement.getBoundingClientRect();
        
        // 실제 이미지의 원본 크기를 기준으로 비율 계산
        const naturalWidth = imageRef.current.naturalWidth || 750;
        setImageRect({
          left: rect.left - container.left,
          top: rect.top - container.top,
          width: rect.width,
          scale: rect.width / naturalWidth
        });
      }
    };

    window.addEventListener('resize', updatePosition);
    const timer = setInterval(updatePosition, 500);
    return () => {
      window.removeEventListener('resize', updatePosition);
      clearInterval(timer);
    };
  }, [annotations]);

  const handleScan = async () => {
    if (isScanning) return;

    try {
      setIsScanning(true);
      setStatusMessage('이미지 분석 중...');

      // 1. 현재 이미지를 Blob으로 변환 (실제 서비스에서는 파일 업로드 또는 카메라 캡처)
      const response = await fetch('/sample_menu_14.jpg');
      const blob = await response.blob();

      // 2. OCR 수행
      const ocrResults = await performOCR(blob);
      setStatusMessage('번역 중...');

      // 3. 번역 수행
      const textsToTranslate = ocrResults.map(item => item.text);
      const translations = await translateTexts(textsToTranslate);

      // 4. 데이터 매핑 및 상태 업데이트
      const newAnnotations = ocrResults.map((item, index) => ({
        description: translations[index].translatedText,
        // Azure Read API의 boundingPolygon은 [x1, y1, x2, y2, x3, y3, x4, y4] 형식임
        // 단순화를 위해 좌상단 좌표와 너비/높이 계산
        vertices: [
          { x: item.boundingPolygon[0], y: item.boundingPolygon[1] },
          { x: item.boundingPolygon[2], y: item.boundingPolygon[3] },
          { x: item.boundingPolygon[4], y: item.boundingPolygon[5] },
          { x: item.boundingPolygon[6], y: item.boundingPolygon[7] }
        ]
      }));

      setAnnotations(newAnnotations);
      setStatusMessage('완료!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      console.error('Scan process failed:', error);
      setStatusMessage('오류 발생! 설정을 확인해주세요.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="app-container">
      {/* App Header */}
      <header className="app-header">
        <div className="app-logo">TripFlex</div>
        {statusMessage && <div className="status-indicator">{statusMessage}</div>}
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="viewfinder-container">
          <img 
            ref={imageRef}
            src="/sample_menu_14.jpg" 
            alt="Scan area" 
            className="scanner-image"
            onLoad={() => {
              if (imageRef.current) {
                const rect = imageRef.current.getBoundingClientRect();
                const container = imageRef.current.parentElement.getBoundingClientRect();
                const naturalWidth = imageRef.current.naturalWidth || 750;
                setImageRect({
                  left: rect.left - container.left,
                  top: rect.top - container.top,
                  width: rect.width,
                  scale: rect.width / naturalWidth
                });
              }
            }}
          />
          
          {/* Overlays */}
          {annotations.map((item, index) => {
            const v = item.vertices;
            const left = v[0].x * imageRect.scale;
            const top = v[0].y * imageRect.scale;
            const width = (v[1].x - v[0].x) * imageRect.scale;
            const height = (v[2].y - v[1].y) * imageRect.scale;

            return (
              <div 
                key={index}
                className="overlay-bubble"
                style={{
                  left: `${imageRect.left + left}px`,
                  top: `${imageRect.top + top}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                  fontSize: `${Math.max(8, 14 * imageRect.scale)}px`
                }}
              >
                {item.description}
              </div>
            );
          })}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <span style={{ fontSize: '1.2rem' }}>🕒</span>
          <span>History</span>
        </div>
        <div className="scan-button-container" onClick={handleScan}>
          <div className={`scan-button ${isScanning ? 'scanning' : ''}`}>
            <span>{isScanning ? '⏳' : '🔍'}</span>
          </div>
        </div>
        <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <span style={{ fontSize: '1.2rem' }}>⚙️</span>
          <span>Settings</span>
        </div>
      </nav>
    </div>
  );
}

export default App;
