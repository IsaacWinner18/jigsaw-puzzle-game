/**
 * Passizy Mini-App SDK Ambient Types
 * For apps integrating via CDN: <script src="https://passizy.com/sdk/v1/passizy.js"></script>
 */

export interface StudentProfile {
  id: string;
  name: string;
  institution: string;
  department: string;
  level: string;
  avatarUrl?: string;
}

export interface InitOptions {
  onThemeChange?: (theme: "light" | "dark") => void;
  onPause?: () => void;
  onResume?: () => void;
}

export interface LaunchContext {
  appId: string;
  sessionId: string;
  token?: string;
  launchToken?: string;
  theme: "light" | "dark";
  student: StudentProfile;
  safeArea?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  isExpanded?: boolean;
}

export interface PassizySDK {
  auth: {
    token: string;
    getToken(): string;
  };
  user: {
    get(): Promise<StudentProfile>;
  };
  navigation: {
    setTitle(title: string): void;
    close(): void;
    backButton: {
      show(): void;
      hide(): void;
      onClick(cb: () => void): () => void;
    };
  };
  viewport: {
    expand(): void;
    getSafeArea(): {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  };
  lifecycle: {
    onPause(cb: () => void): () => void;
    onResume(cb: () => void): () => void;
  };
  haptics: {
    impact(style?: "light" | "medium" | "heavy"): void;
    selection(): void;
    notification(type: "success" | "warning" | "error"): void;
  };
  theme: {
    get(): "light" | "dark";
    onChange(cb: (theme: "light" | "dark") => void): () => void;
  };
  isEmbedded(): boolean;
  init(options?: InitOptions): Promise<LaunchContext>;
  on(event: string, handler: (payload: any) => void): () => void;
  off(event: string, handler: (payload: any) => void): void;
}

declare global {
  interface Window {
    Passizy?: PassizySDK;
  }
}
