/** @type {import('next').NextConfig} */
const nextConfig = {
  // v300: 대용량 이미지 업로드를 위한 설정 보강 📸🚀
  experimental: {
    // Server Actions의 경우 용량 제한을 늘려줍니다.
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // API Routes 등 일반적인 요청의 바디 사이즈는 기본적으로 4MB 내외이나,
  // 클라이언트 사이드 압축(v300)을 통해 수백 KB 수준으로 줄였으므로 안정적입니다! ✨
};

module.exports = nextConfig;
