export interface Document {
  id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  template_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  raw_text?: string;
  extracted_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  error_message?: string;
}

export interface Template {
  id: string;
  name: string;
  type: string;
  fields: Array<{ name: string; description: string; required: boolean }>;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  items: Document[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface CreateTemplatePayload {
  name: string;
  type: string;
  fields: Array<{ name: string; description: string; required: boolean }>;
}
