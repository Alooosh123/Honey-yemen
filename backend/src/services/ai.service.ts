export interface AIPredictionResult {
  analysisStatus: 'NOT_EVALUATED';
  classification: string;
  honeyTypeNameAr: string;
  confidence: null;
  qualityScore: null;
  isPure: null;
  notes: string;
}

/**
 * Honest result gate.
 *
 * The current installed device measures RGB, UV sensor output and IR object
 * temperature. These readings are not a validated reference method for honey
 * authenticity or for direct measurement of sugars, moisture or HMF.
 * Until a calibrated reference dataset and a validated model are supplied,
 * the system must not manufacture a pass/fail result or a confidence score.
 */
export class AIService {
  async predict(_sensorData: unknown): Promise<AIPredictionResult> {
    return {
      analysisStatus: 'NOT_EVALUATED',
      classification: 'NOT_EVALUATED',
      honeyTypeNameAr: 'لم يتم تصنيف العينة مخبرياً',
      confidence: null,
      qualityScore: null,
      isPure: null,
      notes:
        'تم جمع القراءات الحسية الأولية فقط. لا يمكن إثبات أصالة العسل أو تحديد نسب السكريات والرطوبة وHMF بهذه الحساسات وحدها. يلزم تحليل مرجعي ومعايرة وبيانات تحقق قبل إصدار حكم.',
    };
  }
}
