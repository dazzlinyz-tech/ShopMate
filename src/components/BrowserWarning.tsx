import React from 'react';
import { AlertCircle, ExternalLink, MicOff } from 'lucide-react';
import { detectInAppBrowser, isSpeechRecognitionSupported } from '../services/speechService';

interface BrowserWarningProps {
  micPermissionDenied?: boolean;
  onDismissMicError?: () => void;
}

export const BrowserWarning: React.FC<BrowserWarningProps> = ({
  micPermissionDenied,
  onDismissMicError,
}) => {
  const isInApp = detectInAppBrowser();
  const isSupported = isSpeechRecognitionSupported();

  if (isInApp) {
    return (
      <div className="mx-4 mb-4 p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-3 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-600 mt-0.5">
          <ExternalLink className="w-4 h-4" />
        </div>
        <div className="text-xs text-amber-900 leading-relaxed flex-1">
          <p className="font-bold text-amber-950 mb-0.5">브라우저 안내 (Browser Notice)</p>
          <p>
            인앱 브라우저(카카오톡, 인스타그램 등)에서는 마이크 음성 인식이 제한될 수 있습니다. 원활한 음성 연습을 위해 <span className="font-semibold underline">Chrome 또는 Safari</span>로 열어주세요.
          </p>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="mx-4 mb-4 p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-3 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-600 mt-0.5">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="text-xs text-amber-900 leading-relaxed flex-1">
          <p className="font-bold text-amber-950 mb-0.5">Please open in Chrome</p>
          <p>
            현재 브라우저에서는 음성 인식이 지원되지 않습니다. Chrome(크롬) 브라우저에서 실행하시면 음성으로 쇼핑 연습을 하실 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  if (micPermissionDenied) {
    return (
      <div className="mx-4 mb-4 p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in">
        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-rose-600 mt-0.5">
          <MicOff className="w-4 h-4" />
        </div>
        <div className="text-xs text-rose-900 leading-relaxed flex-1">
          <p className="font-bold text-rose-950 mb-0.5">마이크 권한 필요 (Microphone Needed)</p>
          <p>
            브라우저 상단 주소창 왼쪽의 자물쇠 또는 설정 아이콘을 눌러 <span className="font-bold">마이크 권한을 허용</span>해 주세요.
          </p>
          {onDismissMicError && (
            <button
              onClick={onDismissMicError}
              className="mt-2 text-[11px] font-bold text-rose-700 underline hover:text-rose-900 cursor-pointer"
            >
              닫기 (Close)
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
};
