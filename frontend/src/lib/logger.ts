/**
 * ✨ TripFlex Premium Logger
 * 1인 기업 대표님을 위한 가독성 만점 API 로거! 🎨
 */

const isBrowser = typeof window !== 'undefined';

const COLORS = {
  API: '#22d3ee', // Cyan 400
  SUCCESS: '#4ade80', // Green 400
  ERROR: '#f87171', // Red 400
  INFO: '#a78bfa', // Purple 400
  IMG: '#fbbf24', // Amber 400
};

export const logger = {
  api: (msg: string, data?: any) => {
    if (isBrowser) {
      console.group(`%c[API] ${msg}`, `color: ${COLORS.API}; font-weight: bold; font-size: 12px;`);
      if (data) console.log(data);
      console.groupEnd();
    } else {
      console.log(`\x1b[36m[API]\x1b[0m ${msg}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },

  success: (msg: string, data?: any) => {
    if (isBrowser) {
      console.log(`%c[SUCCESS] ${msg}`, `color: ${COLORS.SUCCESS}; font-weight: bold;`, data || '');
    } else {
      console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },

  error: (msg: string, error?: any) => {
    if (isBrowser) {
      console.group(`%c[ERROR] ${msg}`, `color: ${COLORS.ERROR}; font-weight: bold;`);
      console.error(error);
      console.groupEnd();
    } else {
      console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`, error || '');
    }
  },

  scanner: (msg: string, data?: any) => {
    if (isBrowser) {
      console.group(`%c[SCANNER] ${msg}`, `color: ${COLORS.IMG}; font-weight: bold;`);
      if (data) console.log(data);
      console.groupEnd();
    } else {
        console.log(`\x1b[33m[SCANNER]\x1b[0m ${msg}`, data || '');
    }
  },
  
  info: (msg: string, data?: any) => {
    if (isBrowser) {
      console.log(`%c[INFO] ${msg}`, `color: ${COLORS.INFO}; font-weight: bold;`, data || '');
    } else {
      console.log(`\x1b[35m[INFO]\x1b[0m ${msg}`, data || '');
    }
  }
};
