import type { Sex } from "../auth/auth-context";

const MEN_CLASSES_KG = [59, 66, 74, 83, 93, 105, 120];
const WOMEN_CLASSES_KG = [47, 52, 57, 63, 69, 76, 84];

// Mirrors the backend's IPF-style bodyweight classes (WeightClassCalculator.cs).
export function calculateWeightClass(
  sex: Sex | null | undefined,
  bodyWeightKg: number | null,
): string | null {
  if (!sex || !bodyWeightKg || bodyWeightKg <= 0) {
    return null;
  }

  const classes = sex === "female" ? WOMEN_CLASSES_KG : MEN_CLASSES_KG;

  for (const classMax of classes) {
    if (bodyWeightKg <= classMax) {
      return `-${classMax}kg`;
    }
  }

  return `${classes[classes.length - 1]}kg+`;
}
