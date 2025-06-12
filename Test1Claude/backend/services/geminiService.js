import axios from 'axios';
import fs from 'fs/promises';
import { debugLog } from '../utils/logger.js';

export class GeminiService {
  constructor() {
    this.apiBaseUrl = 'https://n8n.tools.intelligenceindustrielle.com/webhook';
    this.bearerToken = process.env.API_BEARER_TOKEN || 'jOI$3jd^bwMN#L';
  }

  /**
   * Upload un fichier et obtenir son URI
   * @param {string} filePath - Chemin du fichier
   * @param {string} mimeType - Type MIME du fichier
   * @returns {Promise<string>} - URI du fichier uploadé
   */
  async uploadFile(filePath, mimeType) {
    try {
      debugLog('🔵 [GeminiService] Starting file upload process:', { filePath, mimeType });
      const fileStats = await fs.stat(filePath);
      const fileSize = fileStats.size;

      // Étape 1: Obtenir l'URL signée
      debugLog('🔵 [GeminiService] Requesting signed URL from Gemini API');
      const uploadResponse = await axios.post(
        `${this.apiBaseUrl}/Gemini/Upload`,
        {
          fileSize,
          mimeType
        },
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      debugLog('🔵 [GeminiService] Received upload URL response:', uploadResponse.data);

      const uploadUrl = uploadResponse.data.results?.[0]?.upload_url;

      if (!uploadUrl) {
        throw new Error('Failed to get upload URL');
      }

      // Étape 2: Uploader le fichier avec les headers spécifiques
      debugLog('🔵 [GeminiService] Uploading file to signed URL');
      const fileData = await fs.readFile(filePath);
      const uploadResult = await axios.put(uploadUrl, fileData, {
        headers: {
          'Content-Length': fileSize.toString(),
          'X-Goog-Upload-Offset': '0',
          'X-Goog-Upload-Command': 'upload, finalize',
          'Content-Type': mimeType
        }
      });

      debugLog('🔵 [GeminiService] File upload completed successfully');
      debugLog('🔵 [GeminiService] Upload response:', uploadResult.data);

      // Extraire l'URI de la réponse de l'upload
      const fileUri = uploadResult.data?.file?.uri;

      if (!fileUri) {
        console.error('🔴 [GeminiService] Upload response structure:', JSON.stringify(uploadResult.data, null, 2));
        throw new Error('Failed to get file URI from upload response');
      }

      debugLog('🔵 [GeminiService] Successfully extracted file URI:', fileUri);
      return fileUri;
    } catch (error) {
      console.error('🔴 [GeminiService] File upload error:', error);
      if (error.response) {
        console.error('🔴 [GeminiService] Error response data:', error.response.data);
        console.error('🔴 [GeminiService] Error response status:', error.response.status);
      }
      throw error;
    }
  }

  /**
   * Analyser un fichier uploadé avec un prompt
   * @param {string} uri - URI du fichier uploadé
   * @param {string} prompt - Prompt pour l'analyse (déjà formaté côté frontend)
   * @returns {Promise<Object>} - Résultat de l'analyse
   */
  async analyzeFile(uri, prompt) {
    try {
      debugLog('🔵 [GeminiService] Starting file analysis:', { uri, prompt });
      const response = await axios.post(
        `${this.apiBaseUrl}/Gemini/Analyze`,
        {
          prompt: prompt,
          uri: uri
        },
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      debugLog('🔵 [GeminiService] Analysis completed successfully');
      return response.data.results?.[0] || response.data;
    } catch (error) {
      console.error('🔴 [GeminiService] File analysis error:', error);
      if (error.response) {
        console.error('🔴 [GeminiService] Error response data:', error.response.data);
        console.error('🔴 [GeminiService] Error response status:', error.response.status);
      }
      throw error;
    }
  }
}
