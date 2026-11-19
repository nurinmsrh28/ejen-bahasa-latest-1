import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  compact?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Ralat paparan berlaku.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[EjenBahasa ErrorBoundary]', error, info);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.compact) {
        return (
          <div className="w-full h-full min-h-[240px] flex flex-col items-center justify-center bg-[#092D27] text-[#F5F0E5] p-6 text-center space-y-3 rounded-xl border border-[#D9B45B]/40">
            <AlertTriangle className="w-8 h-8 text-[#D9B45B]" />
            <p className="font-display text-base font-bold">
              {this.props.fallbackTitle || 'Paparan Komponen Tergendala'}
            </p>
            <p className="text-xs text-[#DCE9DF]/85 max-w-md">
              {this.props.fallbackMessage ||
                'Komponen ini mengalami ralat sementara. Anda boleh mencuba memuatkan semula paparan ini.'}
            </p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#D9B45B] text-[#092D27] text-xs font-extrabold hover:bg-[#F7DA82] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Muat Semula Paparan</span>
            </button>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-[#092D27] text-[#F5F0E5] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl bg-[#123E34] border-2 border-[#D9B45B]/70 p-6 text-center space-y-4 shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-[#D9B45B] mx-auto" />
            <h1 className="font-display text-xl font-bold text-[#F5F0E5]">
              {this.props.fallbackTitle || 'Gangguan Sementara Sistem'}
            </h1>
            <p className="text-xs text-[#DCE9DF]/85 leading-relaxed">
              {this.props.fallbackMessage ||
                'Sistem mengesan ralat paparan yang tidak dijangka. Klik butang di bawah untuk memulihkan sesi anda.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={this.handleRetry}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D9B45B] text-[#092D27] text-xs font-extrabold hover:bg-[#F7DA82] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cuba Semula</span>
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#092D27] border border-[#36D9FF]/45 text-[#F5F0E5] text-xs font-bold hover:border-[#36D9FF] transition-colors"
              >
                Muat Semula Halaman
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
