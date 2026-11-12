/**
 * Authenticity classification is intentionally disabled.
 *
 * The previous implementation created an untrained TensorFlow model and then
 * ignored its prediction, returning hard-coded 100% confidence. That behavior
 * could create unsafe and scientifically unsupported honey certificates.
 *
 * Re-enable classification only after a documented, versioned model has been
 * trained and independently validated against reference-laboratory samples.
 */
export class AIService {
  async predict(): Promise<never> {
    throw new Error(
      'Honey authenticity classification is disabled: no validated model and reference-laboratory dataset are configured.',
    );
  }
}
