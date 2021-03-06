export interface GenerateOptions {
  maxWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  lineHeight?: number;
  textAlign?: 'left' | 'right' | 'center' | 'justify' | 'initial' | 'inherit';
  margin?: number;
  bgColor?: string;
  textColor?: string;
  customHeight?: number;
  debug?: boolean;
  debugFilename?: string;
}

export interface FontOptions {
  family: string;
  weight?: string;
  style?: string;
}

export function generate(
  text: string,
  options?: GenerateOptions,
  images: string[],
): Promise<string>;

export function generateSync(
  text: string,
  options?: GenerateOptions,
  images: string[],
): string;

export function registerFont(fontPath: string, fontOptions: FontOptions): void;
