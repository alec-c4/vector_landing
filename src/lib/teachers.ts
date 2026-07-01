import type { Teacher } from '../types/content';

/** По одному спикеру на слайд (мобильная карусель). */
export function buildMobileSpeakerSlides(teachers: Teacher[]): Teacher[][] {
  return teachers.map((teacher) => [teacher]);
}

/** По два спикера на слайд (десктоп). */
export function buildDesktopSpeakerSlides(teachers: Teacher[]): Teacher[][] {
  return teachers.map((_, i) => [
    teachers[i % teachers.length],
    teachers[(i + 1) % teachers.length],
  ]);
}

/** @deprecated Use buildDesktopSpeakerSlides */
export function buildTeacherSlides(teachers: Teacher[]): Teacher[][] {
  return buildDesktopSpeakerSlides(teachers);
}
